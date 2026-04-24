(() => {
  const store = window.NikeStore;
  if (!store) return;

  const productsGrid = document.getElementById('productsGrid');
  const latestGrid = document.getElementById('latestGrid');
  const cartBtn = document.getElementById('cartBtn');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartClose = document.getElementById('cartClose');
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');
  const slidesEl = document.getElementById('slides');
  const dotsEl = document.querySelectorAll('.dot');

  store.renderAuthNav('[data-site-auth]');

  const localCart = [];
  let currentProducts = [];
  let current = 0;
  const totalSlides = 3;

  function normalizeProduct(product) {
    return {
      ...product,
      id: product.id ?? product.product_id ?? product.pk,
      img: product.img || product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      rating: product.rating ?? 5,
      category: product.category || product.collection || product.brand || 'featured'
    };
  }

  function productCardHTML(product) {
    return store.productCardHTML(product, { actionLabel: 'Add to Cart', showCategory: true });
  }

  function renderCatalog(products) {
    const featured = products.slice(0, 4).map(normalizeProduct);
    const latest = products.slice(4, 8).map(normalizeProduct);
    productsGrid.innerHTML = featured.map(productCardHTML).join('') || '<div class="empty-state">No featured products.</div>';
    latestGrid.innerHTML = latest.map(productCardHTML).join('') || '<div class="empty-state">No latest products.</div>';
    currentProducts = products.map(normalizeProduct);
  }

  function openCart() { cartOverlay.classList.add('open'); cartSidebar.classList.add('open'); }
  function closeCart() { cartOverlay.classList.remove('open'); cartSidebar.classList.remove('open'); }

  function renderLocalCart() {
    const count = localCart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = String(count);

    if (localCart.length === 0) {
      cartItems.innerHTML = `<div class="cart-empty"><div class="icon">🛒</div><p>Your cart is empty</p></div>`;
      cartFooter.style.display = 'none';
      return;
    }

    cartItems.innerHTML = localCart.map((item) => `
      <div class="cart-item">
        <div class="cart-item-img"><img src="${item.img}" alt="${item.name}"></div>
        <div class="cart-item-info">
          <div class="cart-item-brand">${item.brand || ''}</div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${store.currency(item.price * item.qty)} ${item.qty > 1 ? `<small style="color:var(--gray-text);font-size:11px;">×${item.qty}</small>` : ''}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${JSON.stringify(item.id)})">✕</button>
      </div>
    `).join('');
    cartTotal.textContent = store.currency(localCart.reduce((sum, item) => sum + item.price * item.qty, 0));
    cartFooter.style.display = 'block';
  }

  async function syncCart() {
    try {
      const data = await store.getCart();
      if (Array.isArray(data) && data.length) {
        cartCount.textContent = String(data.reduce((sum, item) => sum + Number(item.quantity || item.qty || 1), 0));
        cartItems.innerHTML = data.map((item) => {
          const product = item.product || item.product_detail || item;
          const qty = Number(item.quantity || item.qty || 1);
          const price = Number(item.price ?? product.price ?? 0);
          const itemId = item.id ?? item.pk ?? product.id;
          return `
            <div class="cart-item">
              <div class="cart-item-img"><img src="${product.img || product.image || product.thumbnail || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'}" alt="${product.name || 'Cart item'}"></div>
              <div class="cart-item-info">
                <div class="cart-item-brand">${product.brand || ''}</div>
                <div class="cart-item-name">${product.name || 'Cart item'}</div>
                <div class="cart-item-price">${store.currency(price * qty)} ${qty > 1 ? `<small style="color:var(--gray-text);font-size:11px;">×${qty}</small>` : ''}</div>
              </div>
              <button class="cart-item-remove" onclick="removeFromCart(${JSON.stringify(itemId)})">✕</button>
            </div>
          `;
        }).join('');
        const totalData = await store.getCartTotal();
        const total = Number(totalData?.total ?? totalData?.amount ?? totalData ?? 0);
        cartTotal.textContent = store.currency(total);
        cartFooter.style.display = 'block';
        return;
      }
    } catch (_) {
      // fall back to local cart below
    }
    renderLocalCart();
  }

  async function addToCart(id) {
    const product = currentProducts.find((item) => String(item.id) === String(id)) || store.fallbackProducts.find((item) => String(item.id) === String(id));
    if (!product) return;

    try {
      await store.addToCart(id, 1);
      store.showToast(`${product.name} added to cart`);
      await syncCart();
    } catch (_) {
      const existing = localCart.find((item) => String(item.id) === String(id));
      if (existing) existing.qty += 1;
      else localCart.push({ ...product, qty: 1 });
      renderLocalCart();
      store.showToast(`${product.name} added to cart`);
    }
  }

  async function removeFromCart(id) {
    try {
      await store.removeCartItem(id);
      await syncCart();
      store.showToast('Item removed');
    } catch (_) {
      const index = localCart.findIndex((item) => String(item.id) === String(id));
      if (index >= 0) localCart.splice(index, 1);
      renderLocalCart();
    }
  }

  async function clearLocalCart() {
    try {
      await store.clearCart();
      await syncCart();
      store.showToast('Cart cleared');
    } catch (_) {
      localCart.length = 0;
      renderLocalCart();
    }
  }

  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;

  function goTo(n) {
    current = (n + totalSlides) % totalSlides;
    slidesEl.style.transform = `translateX(-${current * 100}%)`;
    dotsEl.forEach((dot, index) => dot.classList.toggle('active', index === current));
  }

  async function initCatalog() {
    const products = await store.getProducts();
    renderCatalog(products);
  }

  cartBtn?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  document.getElementById('prevBtn')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('nextBtn')?.addEventListener('click', () => goTo(current + 1));
  dotsEl.forEach((dot) => dot.addEventListener('click', () => goTo(Number(dot.dataset.index))));

  if (slidesEl?.parentElement) {
    let autoSlide = window.setInterval(() => goTo(current + 1), 5000);
    slidesEl.parentElement.addEventListener('mouseenter', () => window.clearInterval(autoSlide));
    slidesEl.parentElement.addEventListener('mouseleave', () => {
      autoSlide = window.setInterval(() => goTo(current + 1), 5000);
    });
  }

  document.querySelector('.discount-form button')?.addEventListener('click', () => {
    const input = document.querySelector('.discount-form input');
    if (input && input.value.includes('@')) {
      store.showToast(`🎉 Coupon sent to ${input.value}`);
      input.value = '';
    } else if (input) {
      input.style.borderColor = 'var(--red)';
      window.setTimeout(() => (input.style.borderColor = 'var(--black)'), 2000);
    }
  });

  initCatalog().catch(() => renderCatalog(store.fallbackProducts));
  syncCart();

  const checkoutBtn = document.querySelector('.btn-checkout');
  checkoutBtn?.addEventListener('click', async () => {
    try {
      await store.createOrder();
      store.showToast('Order created');
      await syncCart();
      window.location.href = 'orders.html';
    } catch (error) {
      store.showToast(error.message || 'Could not proceed to checkout');
    }
  });

  document.getElementById('cartFooter')?.insertAdjacentHTML('beforeend', '<button class="btn-checkout" type="button" id="clearCartBtn" style="margin-top:10px;background:var(--black);">Clear Cart</button>');
  document.getElementById('clearCartBtn')?.addEventListener('click', clearLocalCart);
})();
