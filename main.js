(() => {
  const store = window.NikeStore;
  if (!store) return;

  const featuredGrid = document.getElementById('featuredGrid');
  const latestGrid = document.getElementById('latestGrid');
  const cartBtn = document.getElementById('cartBtn');
  const cartCount = document.getElementById('cartCount');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartClose = document.getElementById('cartClose');
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');

  // Initialize Auth UI
  store.renderAuthNav('[data-site-auth]');

  /**
   * Catalog Redesign Logic:
   * Splits products into 'Premium' (Price >= 130) and 'Standard' (Price < 130)
   */
  function renderHomeCatalog(products) {
    if (!products || products.length === 0) return;

    // 1. Filter Premium (Nike elite shoes like Vaporfly, Air Max)
    const premium = products
      .filter(p => parseFloat(p.price) >= 130)
      .slice(0, 4);

    // 2. Filter Standard (Nike classics like AF1, Downshifter)
    const standard = products
      .filter(p => parseFloat(p.price) < 130)
      .slice(0, 4);

    if (featuredGrid) {
      featuredGrid.innerHTML = premium.map(p =>
        store.productCardHTML(p, { showCategory: true, actionLabel: 'Quick Add' })
      ).join('');
    }

    if (latestGrid) {
      latestGrid.innerHTML = standard.map(p =>
        store.productCardHTML(p, { showCategory: true, actionLabel: 'Quick Add' })
      ).join('');
    }
  }

  function normalizeCartItems(payload) {
    return Array.isArray(payload)
      ? payload
      : (payload?.results || payload?.items || payload?.cart_items || payload?.data || []);
  }

  function getCartProduct(item) {
    return item.product || item.product_detail || item;
  }

  function buildProductImageMap(products) {
    const map = new Map();
    (products || []).forEach((product) => {
      const key = String(product?.id ?? product?.pk ?? '');
      if (key) map.set(key, product);
    });
    return map;
  }

  function extractProductId(item, product) {
    if (typeof item.product === 'number' || typeof item.product === 'string') return String(item.product);
    if (typeof item.product_id === 'number' || typeof item.product_id === 'string') return String(item.product_id);
    if (product?.id !== undefined && product?.id !== null) return String(product.id);
    if (product?.pk !== undefined && product?.pk !== null) return String(product.pk);
    return '';
  }

  function getCartLineView(item, productMap) {
    const product = getCartProduct(item);
    const productId = extractProductId(item, product);
    const catalogProduct = productMap?.get(productId);
    const resolvedProduct = (product && typeof product === 'object' ? product : null) || catalogProduct || {};
    const quantity = Number(item.quantity || item.qty || 1);
    const unitPrice = Number(item.product_price ?? item.price ?? resolvedProduct.price ?? 0);
    const lineTotal = Number(item.total ?? (unitPrice * quantity));

    return {
      image: item.product_image || item.image_url || resolvedProduct.image_url || resolvedProduct.img || resolvedProduct.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      name: item.product_name || resolvedProduct.name || `Product #${item.product || item.id || ''}`.trim(),
      brand: resolvedProduct.brand || resolvedProduct.category_name || 'Nike',
      quantity,
      unitPrice,
      lineTotal,
      rowId: item.id ?? item.pk
    };
  }

  function openCart() {
    cartOverlay?.classList.add('open');
    cartSidebar?.classList.add('open');
  }

  function closeCart() {
    cartOverlay?.classList.remove('open');
    cartSidebar?.classList.remove('open');
  }

  async function renderCart() {
    try {
      const items = normalizeCartItems(await store.getCart());
      const missingAnyImage = items.some((item) => {
        const product = getCartProduct(item);
        return !(item.product_image || item.image_url || product?.image_url || product?.img || product?.image);
      });
      const productMap = missingAnyImage
        ? buildProductImageMap(await store.getProducts().catch(() => []))
        : new Map();

      const count = items.reduce((sum, item) => sum + Number(item.quantity || item.qty || 1), 0);
      if (cartCount) cartCount.textContent = String(count);

      if (!cartItems || !cartFooter || !cartTotal) return;
      if (!items.length) {
        cartItems.innerHTML = '<div class="cart-empty"><div class="icon">🛒</div><p>Your cart is empty</p></div>';
        cartFooter.style.display = 'none';
        return;
      }

      cartItems.innerHTML = items.map((item) => {
        const line = getCartLineView(item, productMap);

        return `
          <div class="cart-item">
            <div class="cart-item-img"><img src="${line.image}" alt="${line.name}"></div>
            <div class="cart-item-info">
              <div class="cart-item-brand">${line.brand}</div>
              <div class="cart-item-name">${line.name}</div>
              <div class="cart-item-price">${store.currency(line.lineTotal)} ${line.quantity > 1 ? `<small style="color:var(--gray-text);font-size:11px;">×${line.quantity}</small>` : ''}</div>
            </div>
            <button class="cart-item-remove" data-remove-item="${line.rowId}">✕</button>
          </div>
        `;
      }).join('');

      cartItems.querySelectorAll('[data-remove-item]').forEach((button) => {
        button.addEventListener('click', async () => {
          try {
            await store.removeCartItem(button.dataset.removeItem);
            store.showToast('Item removed');
            renderCart();
          } catch (error) {
            store.showToast(error.message || 'Could not remove item');
          }
        });
      });

      const totalPayload = await store.getCartTotal();
      const fallbackTotal = items.reduce((sum, item) => sum + Number(item.total ?? 0), 0);
      const total = Number(totalPayload?.total ?? totalPayload?.amount ?? fallbackTotal);
      cartTotal.textContent = store.currency(total);
      cartFooter.style.display = 'block';
    } catch (_) {
      if (cartCount) cartCount.textContent = '0';
    }
  }

  // Slider Logic
  let currentSlide = 0;
  const slides = document.getElementById('slides');
  function goToSlide(n) {
    const slideList = document.querySelectorAll('.slide');
    currentSlide = (n + slideList.length) % slideList.length;
    if (slides) slides.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  // Initialize Page
  async function init() {
    try {
      const products = await store.getProducts();
      renderHomeCatalog(products);
      renderCart();
    } catch (err) {
      console.error("Home Init Error:", err);
      // Optional: renderHomeCatalog(store.fallbackProducts);
    }
  }

  // Event Listeners
  document.getElementById('nextBtn')?.addEventListener('click', () => goToSlide(currentSlide + 1));
  document.getElementById('prevBtn')?.addEventListener('click', () => goToSlide(currentSlide - 1));
  cartBtn?.addEventListener('click', () => {
    openCart();
    renderCart();
  });
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  window.addEventListener('nike:cart-updated', renderCart);

  init();
})();