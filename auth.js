(() => {
  const API_BASE = 'http://localhost:8000/api';
  const HOME_URL = 'file.html';
  const LOGIN_URL = 'login.html';
  const ACCESS_TOKEN_KEY = 'access_token';
  const REFRESH_TOKEN_KEY = 'refresh_token';
  const USER_KEY = 'auth_user';

  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const trim = (value) => (typeof value === 'string' ? value.trim() : '');

  function getSubmitLabel(button) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.textContent.trim();
    }
    return button.dataset.originalLabel;
  }

  function setBusy(form, busy) {
    const button = form.querySelector('[type="submit"]');
    if (!button) return;
    if (busy) {
      getSubmitLabel(button);
      button.disabled = true;
      button.textContent = 'Please wait...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalLabel || button.textContent;
    }
  }

  function setFormMessage(form, message, type = 'error') {
    const el = form.querySelector('[data-auth-message]');
    if (!el) return;
    if (!message) {
      el.textContent = '';
      el.classList.remove('is-visible', 'is-error', 'is-success');
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = message;
    el.classList.add('is-visible');
    el.classList.toggle('is-error', type === 'error');
    el.classList.toggle('is-success', type === 'success');
  }

  function clearFieldState(form) {
    form.querySelectorAll('.is-invalid').forEach((node) => node.classList.remove('is-invalid'));
    form.querySelectorAll('[data-error-for]').forEach((node) => {
      node.textContent = '';
    });
    setFormMessage(form, '');
  }

  function setFieldError(form, fieldName, message) {
    const input = form.querySelector(`[name="${fieldName}"]`);
    const error = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (input) input.classList.add('is-invalid');
    if (error) error.textContent = message;
  }

  function firstString(value) {
    if (!value) return '';
    if (Array.isArray(value)) return firstString(value[0]);
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return firstString(Object.values(value)[0]);
    return String(value);
  }

  function extractApiMessage(payload, fallback) {
    if (!payload) return fallback;
    if (typeof payload === 'string') return payload;

    const priorityKeys = [
      'detail',
      'message',
      'error',
      'non_field_errors',
      'errors',
      'email',
      'password',
      'password_confirm',
      'full_name',
      'phone',
      'address',
      'username'
    ];

    for (const key of priorityKeys) {
      if (payload[key]) {
        const msg = firstString(payload[key]);
        if (msg) return msg;
      }
    }

    const nested = firstString(payload);
    return nested || fallback;
  }

  function getValues(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function validateLogin(values) {
    const errors = {};
    if (!trim(values.email)) errors.email = 'Email is required.';
    else if (!isEmail(trim(values.email))) errors.email = 'Enter a valid email address.';
    if (!trim(values.password)) errors.password = 'Password is required.';
    return errors;
  }

  function validateRegister(values) {
    const errors = {};
    if (!trim(values.full_name)) errors.full_name = 'Full name is required.';
    if (!trim(values.email)) errors.email = 'Email is required.';
    else if (!isEmail(trim(values.email))) errors.email = 'Enter a valid email address.';
    if (!trim(values.phone)) errors.phone = 'Phone number is required.';
    if (!trim(values.address)) errors.address = 'Address is required.';
    if (!trim(values.password)) errors.password = 'Password is required.';
    else if (trim(values.password).length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!trim(values.password_confirm)) errors.password_confirm = 'Please confirm your password.';
    else if (trim(values.password) !== trim(values.password_confirm)) errors.password_confirm = 'Passwords do not match.';
    return errors;
  }

  function saveAuthResponse(data, email) {
    const access = data?.access || data?.access_token || data?.token || data?.jwt || data?.tokens?.access || data?.tokens?.access_token || '';
    const refresh = data?.refresh || data?.refresh_token || data?.tokens?.refresh || data?.tokens?.refresh_token || '';

    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);

    const user = data?.user || data?.profile || (email ? { email } : null);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { access, refresh };
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toastMsg');
    if (!toast || !messageEl) return;
    messageEl.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toast._hideTimer);
    toast._hideTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
  }

  async function handleSubmit(form) {
    const type = form.dataset.authForm;
    const values = getValues(form);

    clearFieldState(form);
    const errors = type === 'register' ? validateRegister(values) : validateLogin(values);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, message]) => setFieldError(form, field, message));
      const firstError = Object.values(errors)[0];
      setFormMessage(form, firstError, 'error');
      showToast(firstError);
      return;
    }

    const endpoint = type === 'register' ? `${API_BASE}/auth/register/` : `${API_BASE}/auth/login/`;
    const payload =
      type === 'register'
        ? {
            email: trim(values.email),
            full_name: trim(values.full_name),
            password: trim(values.password),
            password_confirm: trim(values.password_confirm),
            phone: trim(values.phone),
            address: trim(values.address)
          }
        : {
            email: trim(values.email),
            password: trim(values.password)
          };

    setBusy(form, true);
    setFormMessage(form, '');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }

      if (!response.ok) {
        const apiMessage = extractApiMessage(data, 'Unable to complete the request.');
        Object.entries(data || {}).forEach(([field, value]) => {
          if (form.querySelector(`[name="${field}"]`)) {
            setFieldError(form, field, firstString(value));
          }
        });
        setFormMessage(form, apiMessage, 'error');
        showToast(apiMessage);
        return;
      }

      const authState = saveAuthResponse(data, payload.email);
      const successMessage =
        type === 'register'
          ? extractApiMessage(data, 'Account created successfully.')
          : extractApiMessage(data, 'Logged in successfully.') || 'Logged in successfully.';

      setFormMessage(form, successMessage, 'success');
      showToast(successMessage);

      window.setTimeout(() => {
        if (type === 'login' || authState.access) {
          window.location.href = HOME_URL;
        } else {
          const redirectEmail = encodeURIComponent(payload.email || '');
          window.location.href = `${LOGIN_URL}${redirectEmail ? `?email=${redirectEmail}` : ''}`;
        }
      }, 900);
    } catch (error) {
      const message = error?.message || 'Network error. Please try again.';
      setFormMessage(form, message, 'error');
      showToast(message);
    } finally {
      setBusy(form, false);
    }
  }

  function prefillLoginEmail(form) {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (!email) return;
    const input = form.querySelector('[name="email"]');
    if (input && !input.value) input.value = email;
  }

  document.querySelectorAll('[data-auth-form]').forEach((form) => {
    if (form.dataset.authForm === 'login') prefillLoginEmail(form);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      handleSubmit(form);
    });
  });
})();

