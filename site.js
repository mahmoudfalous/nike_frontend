(() => {
  const API_BASE = 'http://localhost:8000/api';
  const STORAGE = {
    access: 'access_token',
    refresh: 'refresh_token',
    user: 'auth_user'
  };

  const fallbackProducts = [
    { id: 1, name: "Air Force 1 '07", brand: 'Nike', price: 110, oldPrice: 140, tag: 'New', rating: 5, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', category: 'women', description: 'Premium everyday sneakers with timeless style.' },
    { id: 2, name: 'Stan Smith', brand: 'Adidas', price: 85, oldPrice: 100, tag: 'Sale', rating: 4, img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80', category: 'men', description: 'Classic court-inspired shoes for daily wear.' },
    { id: 3, name: 'Classic Leather', brand: 'Reebok', price: 75, oldPrice: null, tag: null, rating: 4, img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80', category: 'kids', description: 'Lightweight retro styling with reliable comfort.' },
    { id: 4, name: '574 Core', brand: 'New Balance', price: 95, oldPrice: 120, tag: 'Hot', rating: 5, img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80', category: 'men', description: 'Balanced cushioning and versatile street style.' },
    { id: 5, name: 'RS-X Toys', brand: 'Puma', price: 110, oldPrice: 130, tag: 'New', rating: 4, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80', category: 'women', description: 'Bold lifestyle silhouette with plush support.' },
    { id: 6, name: 'Chuck Taylor', brand: 'Converse', price: 65, oldPrice: null, tag: null, rating: 5, img: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=400&q=80', category: 'kids', description: 'Iconic canvas sneaker for all-day comfort.' },
    { id: 7, name: 'Old Skool', brand: 'Vans', price: 70, oldPrice: 85, tag: 'Sale', rating: 4, img: 'https://images.unsplash.com/photo-1556906781-9a412961a28c?w=400&q=80', category: 'women', description: 'Street-ready style with durable construction.' },
    { id: 8, name: 'Ultraboost 22', brand: 'Adidas', price: 180, oldPrice: 210, tag: 'Hot', rating: 5, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', category: 'sports', description: 'High-energy performance runner with responsive cushioning.' }
  ];

  const categoryMeta = {
    men: { title: 'Men', heading: 'Men\'s Shoes', description: 'Performance, lifestyle, and classics curated for every day.' },
    women: { title: 'Women', heading: 'Women\'s Shoes', description: 'Style-forward sneakers, training shoes, and essentials.' },
    kids: { title: 'Kids', heading: 'Kids\' Shoes', description: 'Comfortable, durable options for growing feet.' },
    sports: { title: 'Sports', heading: 'Sports Footwear', description: 'Built for training, running, and match-day performance.' },
    sale: { title: 'Sale', heading: 'Sale', description: 'Best-value deals and discounted favorites.' }
  };

  const readJSON = (value) => {
    try { return JSON.parse(value); } catch { return null; }
  };
  const trim = (value) => (typeof value === 'string' ? value.trim() : '');
  const slugify = (value) => trim(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const currency = (value) => `$${Number(value || 0).toFixed(2)}`;
  const renderStars = (count = 0) => '★'.repeat(Number(count) || 0) + '☆'.repeat(Math.max(0, 5 - (Number(count) || 0)));
  const firstString = (value) => Array.isArray(value) ? firstString(value[0]) : typeof value === 'object' && value ? firstString(Object.values(value)[0]) : (value ? String(value) : '');

  function getToken(key) { return localStorage.getItem(key); }
  function getAccessToken() { return getToken(STORAGE.access); }
  function getRefreshToken() { return getToken(STORAGE.refresh); }
  function getUser() { return readJSON(localStorage.getItem(STORAGE.user)); }
  function isLoggedIn() { return Boolean(getAccessToken()); }
  function isAdmin(user = getUser()) { return Boolean(user && (user.is_staff || user.is_admin || user.role === 'admin')); }
  function logout(redirectTo = 'login.html') {
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
    localStorage.removeItem(STORAGE.user);
    window.location.href = redirectTo;
  }

  function saveAuthResponse(data = {}, email = '') {
    const access = data.access || data.access_token || data.token || data.jwt || data.tokens?.access || data.tokens?.access_token || '';
    const refresh = data.refresh || data.refresh_token || data.tokens?.refresh || data.tokens?.refresh_token || '';
    if (access) localStorage.setItem(STORAGE.access, access);
    if (refresh) localStorage.setItem(STORAGE.refresh, refresh);
    const user = data.user || data.profile || (email ? { email } : null);
    if (user) localStorage.setItem(STORAGE.user, JSON.stringify(user));
    return { access, refresh, user };
  }

  async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return '';
    const response = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) return '';
    const access = data.access || data.access_token || '';
    if (access) localStorage.setItem(STORAGE.access, access);
    return access;
  }

  async function request(path, { method = 'GET', body, headers = {}, auth = true, retry = true } = {}) {
    const requestHeaders = { ...headers };
    if (auth && getAccessToken()) requestHeaders.Authorization = `Bearer ${getAccessToken()}`;
    if (body !== undefined && !requestHeaders['Content-Type']) requestHeaders['Content-Type'] = 'application/json';

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    });

    if (response.status === 401 && auth && retry && getRefreshToken()) {
      const fresh = await refreshAccessToken();
      if (fresh) return request(path, { method, body, headers, auth, retry: false });
    }

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try { data = await response.json(); } catch (_) { data = null; }
    } else {
      try { data = await response.text(); } catch (_) { data = null; }
    }

    if (!response.ok) {
      const error = new Error(firstString(data?.detail || data?.message || data?.error || data?.non_field_errors || data) || `Request failed with ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  const apiGet = (path, options = {}) => request(path, { ...options, method: 'GET' });
  const apiPost = (path, body, options = {}) => request(path, { ...options, method: 'POST', body });
  const apiPatch = (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body });
  const apiDelete = (path, options = {}) => request(path, { ...options, method: 'DELETE' });

  const getProducts = async () => {
    const data = await apiGet('/products/', { auth: false }).catch(() => fallbackProducts);
    return Array.isArray(data) ? data : (data?.results || data?.items || fallbackProducts);
  };
  const getProduct = async (id) => apiGet(`/products/${id}/`, { auth: false }).catch(() => fallbackProducts.find((item) => String(item.id) === String(id)));
  const getCart = async () => {
    const data = await apiGet('/cart/').catch(() => []);
    return Array.isArray(data) ? data : (data?.results || data?.items || data?.cart_items || data?.data || []);
  };
  const getCartTotal = async () => {
    const data = await apiGet('/cart/cart_total/').catch(() => ({ total: 0 }));
    return typeof data === 'object' && data ? data : { total: Number(data) || 0 };
  };
  const addToCart = (product, quantity = 1) => apiPost('/cart/', { product: Number(product), quantity });
  const updateCartItem = (id, quantity) => apiPatch(`/cart/${id}/`, { quantity });
  const removeCartItem = (id) => apiDelete(`/cart/${id}/`);
  const clearCart = () => apiPost('/cart/clear_cart/', {});
  const createOrder = () => apiPost('/orders/create_order/', {});
  const getOrders = async () => {
    const data = await apiGet('/orders/').catch(() => []);
    return Array.isArray(data) ? data : (data?.results || data?.items || data?.orders || data?.data || []);
  };
  const getOrder = (id) => apiGet(`/orders/${id}/`).catch(() => null);
  const updateOrderStatus = (id, status) => apiPatch(`/orders/${id}/update_status/`, { status });
  const createProduct = (payload) => apiPost('/products/', payload);
  const updateProduct = (id, payload) => apiPatch(`/products/${id}/`, payload);
  const deleteProduct = (id) => apiDelete(`/products/${id}/`);
  const getCurrentUser = async () => apiGet('/auth/me/').catch(() => getUser());

  function productCategory(product) {
    return trim(product?.category || product?.collection || product?.type || product?.brand || 'all').toLowerCase();
  }

  function categoryLabel(slug) {
    return categoryMeta[slug]?.title || slug.replace(/-/g, ' ');
  }

  function getCategoryMeta(slug) {
    return categoryMeta[slug] || { title: categoryLabel(slug), heading: `${categoryLabel(slug)} Shoes`, description: 'Browse products in this collection.' };
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

  function emitCartUpdated() {
    window.dispatchEvent(new CustomEvent('nike:cart-updated'));
  }

  function buildNextParam() {
    const current = `${window.location.pathname.split('/').pop() || 'file.html'}${window.location.search || ''}`;
    return encodeURIComponent(current);
  }

  function ensureLoggedInForCartAction() {
    if (isLoggedIn()) return true;
    showToast('Please log in to add items to cart.');
    window.setTimeout(() => {
      window.location.href = `login.html?next=${buildNextParam()}`;
    }, 500);
    return false;
  }

  function productCardHTML(product, { actionLabel = 'Add to Cart', actionHref = '', showCategory = false } = {}) {
    // 1. Prioritize 'id' from your SQL schema
    const id = product.id;
    const href = actionHref || `product.html?id=${encodeURIComponent(id)}`;

    // 2. Use 'category_slug' from your API for filtering
    const categorySlug = product.category_slug || 'all';
    const categoryName = product.category_name || 'Nike';

    // 3. Use 'image_url' from your SQL INSERTs
    const image = product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80';

    return `
    <article class="product-card">
      <a class="product-img-link" href="${href}">
        <div class="product-img">
          ${product.tag ? `<div class="product-tag">${product.tag}</div>` : ''}
          <img src="${image}" alt="${product.name}" loading="lazy">
          
          <div class="product-actions">
            <button type="button" onclick="window.NikeStore.quickAddToCart(${id}, event)">
              ${actionLabel}
            </button>
            <a class="icon-btn" href="${href}" aria-label="View ${product.name}">↗</a>
          </div>
        </div>
      </a>
      
      <div class="stars">${renderStars(product.rating || 5)}</div>
      
      ${showCategory
      ? `<div class="product-brand"><a href="category.html?slug=${encodeURIComponent(categorySlug)}">${categoryName}</a></div>`
      : `<div class="product-brand">${categoryName}</div>`
    }
      
      <div class="product-name">
        <a href="${href}">${product.name}</a>
      </div>
      
      <div class="product-price">
        <span class="price-current">${currency(product.price)}</span>
        ${product.old_price ? `<span class="price-old">${currency(product.old_price)}</span>` : ''}
      </div>
    </article>`;
  }
  async function quickAddToCart(productId, event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      await guardedAddToCart(productId, 1);
      showToast('Added to cart');
      emitCartUpdated();
    } catch (error) {
      if (error?.code === 'AUTH_REQUIRED') return;
      showToast(error.message || 'Could not add item');
    }
  }

  const guardedAddToCart = async (product, quantity = 1) => {
    if (!ensureLoggedInForCartAction()) {
      const error = new Error('Authentication required.');
      error.code = 'AUTH_REQUIRED';
      throw error;
    }
    return addToCart(product, quantity);
  };

  function renderAuthNav(container, { loginUrl = 'login.html', registerUrl = 'register.html', ordersUrl = 'orders.html' } = {}) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;
    const user = getUser();
    if (isLoggedIn()) {
      target.innerHTML = `
        <a href="${ordersUrl}" class="nav-auth-link nav-auth-link-secondary">Orders</a>
        <button type="button" class="nav-auth-link nav-auth-link-primary" data-logout-btn>Logout${user?.full_name ? ` · ${user.full_name.split(' ')[0]}` : ''}</button>
      `;
      target.querySelector('[data-logout-btn]')?.addEventListener('click', () => logout(loginUrl));
    } else {
      target.innerHTML = `
        <a href="${loginUrl}" class="nav-auth-link nav-auth-link-secondary">Log In</a>
        <a href="${registerUrl}" class="nav-auth-link nav-auth-link-primary">Register</a>
      `;
    }
  }

  window.NikeStore = window.NikeStore || {};
  window.NikeStore.API_BASE = API_BASE;
  window.NikeStore.STORAGE = STORAGE;
  window.NikeStore.fallbackProducts = fallbackProducts;
  window.NikeStore.categoryMeta = categoryMeta;
  window.NikeStore.getAccessToken = getAccessToken;
  window.NikeStore.getRefreshToken = getRefreshToken;
  window.NikeStore.getUser = getUser;
  window.NikeStore.getCurrentUser = getCurrentUser;
  window.NikeStore.isLoggedIn = isLoggedIn;
  window.NikeStore.isAdmin = isAdmin;
  window.NikeStore.logout = logout;
  window.NikeStore.saveAuthResponse = saveAuthResponse;
  window.NikeStore.request = request;
  window.NikeStore.apiGet = apiGet;
  window.NikeStore.apiPost = apiPost;
  window.NikeStore.apiPatch = apiPatch;
  window.NikeStore.apiDelete = apiDelete;
  window.NikeStore.getProducts = getProducts;
  window.NikeStore.getProduct = getProduct;
  window.NikeStore.getCart = getCart;
  window.NikeStore.getCartTotal = getCartTotal;
  window.NikeStore.addToCart = guardedAddToCart;
  window.NikeStore.quickAddToCart = quickAddToCart;
  window.NikeStore.updateCartItem = updateCartItem;
  window.NikeStore.removeCartItem = removeCartItem;
  window.NikeStore.clearCart = clearCart;
  window.NikeStore.createOrder = createOrder;
  window.NikeStore.getOrders = getOrders;
  window.NikeStore.getOrder = getOrder;
  window.NikeStore.updateOrderStatus = updateOrderStatus;
  window.NikeStore.createProduct = createProduct;
  window.NikeStore.updateProduct = updateProduct;
  window.NikeStore.deleteProduct = deleteProduct;
  window.NikeStore.productCategory = productCategory;
  window.NikeStore.slugify = slugify;
  window.NikeStore.currency = currency;
  window.NikeStore.renderStars = renderStars;
  window.NikeStore.productCardHTML = productCardHTML;
  window.NikeStore.getCategoryMeta = getCategoryMeta;
  window.NikeStore.showToast = showToast;
  window.NikeStore.renderAuthNav = renderAuthNav;
})();

