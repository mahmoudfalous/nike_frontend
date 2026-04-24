(() => {
  const store = window.NikeStore;
  const grid = document.querySelector('[data-category-grid]');
  const chips = document.querySelector('[data-category-chips]');
  const titleEl = document.querySelector('[data-category-title]');
  const descEl = document.querySelector('[data-category-description]');
  const countEl = document.querySelector('[data-category-count]');

  if (!store || !grid) return;
  store.renderAuthNav('[data-site-auth]');

  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('slug') || 'all').toLowerCase();
  const availableSlugs = ['all', 'men', 'women', 'kids', 'sports', 'sale'];

  function renderChips(activeSlug) {
    chips.innerHTML = availableSlugs.map((item) => `
      <a class="chip ${item === activeSlug ? 'active' : ''}" href="category.html?slug=${encodeURIComponent(item)}">${store.getCategoryMeta(item).title}</a>
    `).join('');
  }

  function matchesCategory(product, currentSlug) {
    if (currentSlug === 'all') return true;
    const productSlug = store.productCategory(product);
    if (currentSlug === 'sale') return Boolean(product.tag && String(product.tag).toLowerCase().includes('sale')) || Number(product.oldPrice) > Number(product.price);
    return productSlug.includes(currentSlug);
  }

  async function init() {
    const meta = store.getCategoryMeta(slug);
    titleEl.textContent = meta.heading;
    descEl.textContent = meta.description;
    renderChips(slug);

    grid.innerHTML = '<div class="empty-state">Loading products...</div>';
    const products = await store.getProducts();
    const filtered = products.filter((product) => matchesCategory(product, slug));
    countEl.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
    grid.innerHTML = filtered.length
      ? filtered.map((product) => store.productCardHTML(product, { actionLabel: 'Quick add', showCategory: true })).join('')
      : '<div class="empty-state">No products found in this category.</div>';
  }

  init().catch((error) => {
    grid.innerHTML = `<div class="empty-state">${error.message || 'Could not load category.'}</div>`;
  });
})();

