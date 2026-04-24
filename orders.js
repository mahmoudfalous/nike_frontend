(() => {
  const store = window.NikeStore;
  const grid = document.querySelector('[data-orders-grid]');

  if (!store || !grid) return;
  store.renderAuthNav('[data-site-auth]');

  function orderHTML(order) {
    const id = order.id;
    // Handle nested items (adjust keys if your API uses 'order_items')
    const items = order.items || order.order_items || [];
    const status = order.status || 'pending';
    const total = order.total_price || order.total || 0;
    const isAdmin = store.isAdmin();

    return `
      <article class="order-card">
        <div class="order-card-head">
          <div>
            <span class="order-number">Order #${id}</span>
            <div class="order-status-pill status-${status.toLowerCase()}">${status}</div>
          </div>
          <span class="order-total">${store.currency(total)}</span>
        </div>
        
        <div class="order-items">
          ${items.length
      ? items.map(item => `
                <div class="order-item-row">
                  <span>${item.product_name || item.name || 'Nike Item'}</span>
                  <span>x${item.quantity}</span>
                </div>`).join('')
      : '<p class="no-items">No items found for this order.</p>'}
        </div>

        ${isAdmin ? `
          <form class="order-status-form" data-order-status-form data-order-id="${id}">
            <div class="admin-action-group">
              <select name="status">
                <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" ${status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="shipped" ${status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="delivered" ${status === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
              <button class="btn-primary" type="submit">Update</button>
            </div>
          </form>
        ` : ''}
      </article>
    `;
  }

  async function loadOrders() {
    try {
      grid.innerHTML = '<div class="empty-state">Loading your history...</div>';

      // 1. Use the store's built-in getOrders helper (already handles tokens/results)
      const orders = await store.getOrders();

      if (!Array.isArray(orders) || orders.length === 0) {
        grid.innerHTML = '<div class="empty-state">No orders found.</div>';
        return;
      }

      grid.innerHTML = orders.map(orderHTML).join('');

      // 2. Attach Event Listeners to forms
      grid.querySelectorAll('[data-order-status-form]').forEach((form) => {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const orderId = form.dataset.orderId;
          const newStatus = form.elements.status.value;

          try {
            // Use the status helper defined in site.js
            await store.updateOrderStatus(orderId, newStatus);
            store.showToast('Order status updated');
            loadOrders();
          } catch (error) {
            store.showToast(error.message || 'Could not update status');
          }
        });
      });

    } catch (error) {
      grid.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`;
    }
  }

  loadOrders();
})();