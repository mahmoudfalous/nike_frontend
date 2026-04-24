(() => {
  const store = window.NikeStore;
  const shell = document.querySelector('[data-product-shell]');
  const relatedGrid = document.querySelector('[data-related-grid]');
  const adminPanel = document.querySelector('[data-admin-panel]');
  const updateForm = document.querySelector('[data-admin-update-form]');
  const deleteBtn = document.querySelector('[data-delete-product]');
  const breadcrumb = document.querySelector('[data-breadcrumb-current]');

  if (!store || !shell) return;
  store.renderAuthNav('[data-site-auth]');

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || '1';
  let currentProduct = null;

  function renderProduct(product) {
    const category = store.slugify(product.category || product.brand || 'featured');
    breadcrumb.textContent = product.name;
    shell.innerHTML = `
      <div class="product-media">
        <div class="product-detail-image">
          ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
          <img src="${product.img || product.image || ''}" alt="${product.name}">
        </div>
      </div>
      <div class="product-info">
        <div class="product-detail-meta">
          <a href="category.html?slug=${encodeURIComponent(category)}">${product.brand || 'Nike Store'}</a>
          <span>SKU ${product.id ?? id}</span>
        </div>
        <h1>${product.name}</h1>
        <div class="stars">${store.renderStars(product.rating || 5)}</div>
        <div class="product-price">
          <span class="price-current">${store.currency(product.price)}</span>
          ${product.oldPrice ? `<span class="price-old">${store.currency(product.oldPrice)}</span>` : ''}
        </div>
        <p class="product-description">${product.description || 'Premium footwear from the Nike E-Commerce API.'}</p>
        <div class="product-detail-actions">
          <button class="btn-primary" data-add-to-cart>Add to Cart</button>
          <button class="btn-primary btn-outline-dark" data-buy-now>Buy Now</button>
        </div>
        <div class="product-metadata">
          <div><strong>Category</strong><span>${product.category || product.brand || 'Featured'}</span></div>
          <div><strong>Availability</strong><span>${product.stock ? `${product.stock} in stock` : 'In stock'}</span></div>
          <div><strong>Endpoint</strong><span>GET /api/products/${product.id ?? id}/</span></div>
        </div>
      </div>
    `;

    shell.querySelector('[data-add-to-cart]')?.addEventListener('click', async () => {
      try {
        await store.addToCart(product.id ?? id, 1);
        store.showToast(`${product.name} added to cart`);
      } catch (error) {
        store.showToast(error.message || 'Could not add product');
      }
    });

    shell.querySelector('[data-buy-now]')?.addEventListener('click', async () => {
      try {
        await store.addToCart(product.id ?? id, 1);
        await store.createOrder();
        store.showToast('Order created from cart');
        window.location.href = 'orders.html';
      } catch (error) {
        store.showToast(error.message || 'Could not create order');
      }
    });

    const user = store.getUser();
    if (store.isAdmin(user)) {
      adminPanel.hidden = false;
      updateForm.elements.name.value = product.name || '';
      updateForm.elements.price.value = product.price ?? '';
      updateForm.elements.stock.value = product.stock ?? '';
      updateForm.elements.description.value = product.description || '';
    }
  }

  async function renderRelated(product) {
    const items = await store.getProducts();
    const category = store.productCategory(product);
    const related = items
      .filter((item) => String(item.id ?? item.product_id) !== String(product.id ?? id))
      .filter((item) => store.productCategory(item) === category || item.brand === product.brand)
      .slice(0, 4);

    relatedGrid.innerHTML = related.length
      ? related.map((item) => store.productCardHTML(item, { actionLabel: 'Add', showCategory: true })).join('')
      : `<div class="empty-state"><p>No related products found.</p></div>`;
  }

  async function init() {
    shell.innerHTML = '<div class="empty-state">Loading product...</div>';
    const product = await store.getProduct(id);
    currentProduct = product;
    if (!product) {
      shell.innerHTML = '<div class="empty-state">Product not found.</div>';
      relatedGrid.innerHTML = '';
      return;
    }
    renderProduct(product);
    await renderRelated(product);
  }

  if (updateForm) {
    updateForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!currentProduct) return;
      const payload = {
        name: updateForm.elements.name.value.trim(),
        price: Number(updateForm.elements.price.value),
        stock: Number(updateForm.elements.stock.value),
        description: updateForm.elements.description.value.trim()
      };
      try {
        await store.updateProduct(currentProduct.id ?? id, payload);
        store.showToast('Product updated');
      } catch (error) {
        store.showToast(error.message || 'Could not update product');
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!currentProduct) return;
      if (!window.confirm('Delete this product?')) return;
      try {
        await store.deleteProduct(currentProduct.id ?? id);
        store.showToast('Product deleted');
        window.location.href = 'category.html?slug=all';
      } catch (error) {
        store.showToast(error.message || 'Could not delete product');
      }
    });
  }

  init().catch((error) => {
    shell.innerHTML = `<div class="empty-state">${error.message || 'Could not load product.'}</div>`;
  });
})();

