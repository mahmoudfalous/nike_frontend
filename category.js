(() => {
  const store = window.NikeStore;
  const grid = document.querySelector('[data-category-grid]');
  const chips = document.querySelector('[data-category-chips]');
  const titleEl = document.querySelector('[data-category-title]');
  const descEl = document.querySelector('[data-category-description]');
  const countEl = document.querySelector('[data-category-count]');

  // Use the absolute base URL to prevent 404s caused by relative paths
  const API_BASE = 'http://localhost:8000';

  if (!store || !grid) return;
  store.renderAuthNav('[data-site-auth]');

  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('slug') || 'all').toLowerCase();

  const availableSlugs = ['all', 'men', 'women', 'kids', 'sports', 'sale'];

  function renderChips(activeSlug) {
    if (!chips) return;
    chips.innerHTML = availableSlugs.map((item) => `
      <a class="chip ${item === activeSlug ? 'active' : ''}" 
         href="category.html?slug=${encodeURIComponent(item)}">
         ${item.charAt(0).toUpperCase() + item.slice(1)}
      </a>
    `).join('');
  }

  async function init() {
    renderChips(slug);
    grid.innerHTML = '<div class="empty-state">Loading products...</div>';

    try {
      // 1. Build the endpoint correctly with trailing slashes
      let url = `${API_BASE}/api/products/`;

      if (slug !== 'all') {
        // Match your specific filter endpoint: /api/products/?category__slug=men
        url = `${API_BASE}/api/products/?category__slug=${slug}`;
      }

      // 2. Fetch with Headers
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // 3. Error Handling for non-JSON responses (404/500 HTML pages)
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} for ${url}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, the server didn't return JSON! Check your URL/Slash.");
      }

      const data = await response.json();

      // 4. Handle Django Rest Framework pagination results
      const products = data.results || data;

      // 5. Update UI Metadata
      if (slug === 'all') {
        titleEl.textContent = "All Products";
        descEl.textContent = "Browse our full collection.";
      } else if (products.length > 0) {
        // Use category_name from the first product in the list
        const catName = products[0].category_name || slug.charAt(0).toUpperCase() + slug.slice(1);
        titleEl.textContent = catName;
        descEl.textContent = `Premium selection of ${catName} shoes.`;
      } else {
        titleEl.textContent = slug.toUpperCase();
        descEl.textContent = "No products found in this category.";
      }

      // 6. Update Item Count
      countEl.textContent = `${products.length} item${products.length === 1 ? '' : 's'}`;

      // 7. Render Product Cards
      if (products.length > 0) {
        grid.innerHTML = products.map((product) =>
          store.productCardHTML(product, {
            actionLabel: 'Quick add',
            showCategory: true
          })
        ).join('');
      } else {
        grid.innerHTML = '<div class="empty-state">No products found in this category.</div>';
      }

    } catch (error) {
      console.error("API Error:", error);
      grid.innerHTML = `
        <div class="empty-state">
          <p>Failed to load products.</p>
          <small>${error.message}</small>
        </div>`;
    }
  }

  init();
})();