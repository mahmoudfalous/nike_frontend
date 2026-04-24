(() => {
  const store = window.NikeStore;

  // Selectors
  const shell = document.querySelector('[data-product-shell]');
  const relatedGrid = document.querySelector('[data-related-grid]');
  const adminPanel = document.querySelector('[data-admin-panel]');
  const updateForm = document.querySelector('[data-admin-update-form]');
  const deleteBtn = document.querySelector('[data-delete-product]');
  const breadcrumb = document.querySelector('[data-breadcrumb-current]');
  const cartBtn = document.getElementById('cartBtn');
  const cartCount = document.getElementById('cartCount');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartClose = document.getElementById('cartClose');
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');

  // GUARD: If the core shell doesn't exist, stop immediately to prevent null errors
  if (!shell) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || '1';
  let currentProduct = null;

  if (store) {
    store.renderAuthNav('[data-site-auth]');
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

  function renderProduct(product) {
    // 1. Update Breadcrumb safely
    if (breadcrumb) {
      breadcrumb.textContent = product.name;
    }

    // 2. Map SQL schema fields to variables
    // Note: Your SQL uses image_url and category_id
    const imageUrl = product.image_url || product.img || '';
    const price = product.price || 0;
    const stock = product.stock ?? 0;

    shell.innerHTML = `
      <div class="product-media">
        <div class="product-detail-image">
          <img src="${imageUrl}" alt="${product.name}">
        </div>
      </div>
      <div class="product-info">
        <div class="product-detail-meta">
          <span>ID: ${product.id}</span>
        </div>
        <h1>${product.name}</h1>
        <div class="product-price">
          <span class="price-current">${store ? store.currency(price) : '$' + price}</span>
        </div>
        <p class="product-description">${product.description || 'Premium Nike footwear.'}</p>
        <div class="product-detail-actions">
          <button class="btn-primary" data-add-to-cart>Add to Cart</button>
        </div>
        <div class="product-metadata">
          <div><strong>Stock Availability</strong><span>${stock > 0 ? `${stock} units` : 'Out of stock'}</span></div>
        </div>
      </div>
    `;

    // Event Listeners for buttons inside shell
    shell.querySelector('[data-add-to-cart]')?.addEventListener('click', async () => {
      try {
        await store.addToCart(product.id, 1);
        store.showToast(`${product.name} added to cart`);
        renderCart();
      } catch (error) {
        if (error?.code !== 'AUTH_REQUIRED') {
          store.showToast(error.message || 'Could not add to cart');
        }
      }
    });

    // 3. Admin Panel Logic (Matching your PATCH /api/products/{id}/ endpoint)
    const user = store?.getUser();
    if (adminPanel && store?.isAdmin(user)) {
      adminPanel.hidden = false;
      if (updateForm) {
        updateForm.elements.name.value = product.name || '';
        updateForm.elements.price.value = product.price || '';
        updateForm.elements.stock.value = product.stock || '';
        updateForm.elements.description.value = product.description || '';
      }
    }
  }

  async function init() {
    try {
      shell.innerHTML = '<div class="empty-state">Loading product...</div>';

      // Fetching from your GET /api/products/{id}/ endpoint
      const product = await store.getProduct(id);
      currentProduct = product;

      if (!product) {
        shell.innerHTML = '<div class="empty-state">Product not found.</div>';
        return;
      }

      renderProduct(product);
      renderCart();

      // Load related products from the same category
      if (relatedGrid) {
        const related = await store.getProducts(`?category=${product.category_id}`);
        const filtered = related.filter(p => p.id !== product.id).slice(0, 4);

        relatedGrid.innerHTML = filtered.length
          ? filtered.map(item => store.productCardHTML(item)).join('')
          : '<p>No related items.</p>';
      }
    } catch (error) {
      shell.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`;
    }
  }

  // Handle Updates
  updateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: updateForm.elements.name.value,
      price: parseFloat(updateForm.elements.price.value),
      stock: parseInt(updateForm.elements.stock.value),
      description: updateForm.elements.description.value
    };

    try {
      await store.updateProduct(id, payload); // Hits PATCH /api/products/{id}/
      store.showToast('Updated successfully');
      location.reload();
    } catch (err) {
      alert('Update failed');
    }
  });

  // Handle Delete
  deleteBtn?.addEventListener('click', async () => {
    if (!confirm('Are you sure?')) return;
    try {
      await store.deleteProduct(id); // Hits DELETE /api/products/{id}/
      window.location.href = 'category.html?slug=all';
    } catch (err) {
      alert('Delete failed');
    }
  });

  cartBtn?.addEventListener('click', () => {
    openCart();
    renderCart();
  });
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  cartCheckoutBtn?.addEventListener('click', async () => {
    try {
      await store.createOrder();
      store.showToast('Order created from cart');
      renderCart();
      window.location.href = 'orders.html';
    } catch (error) {
      if (error?.code !== 'AUTH_REQUIRED') {
        store.showToast(error.message || 'Could not create order');
      }
    }
  });

  window.addEventListener('nike:cart-updated', renderCart);

  init();
})();