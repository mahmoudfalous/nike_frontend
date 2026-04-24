(() => {
  const store = window.NikeStore;
  const grid = document.querySelector('[data-orders-grid]');

  if (!store || !grid) return;
  store.renderAuthNav('[data-site-auth]');

  function orderHTML(order) {
    const id = order.id ?? order.order_id ?? order.pk;
    const items = order.items || order.order_items || [];
    const status = order.status || 'pending';
    const total = order.total ?? order.order_total ?? order.amount ?? 0;
    const isAdmin = store.isAdmin();

    return `
      <article class="order-card">
        <div class="order-card-head">
          <div>
            <span class="order-number">Order #${id}</span>
            <h3>${status}</h3>
          </div>
          <span class="order-total">${store.currency(total)}</span>
        </div>
        <div class="order-items">
          ${items.length ? items.map((item) => `<div class="order-item-row"><span>${item.name || item.product_name || 'Item'}</span><span>x${item.quantity || 1}</span></div>`).join('') : '<p>No line items provided by the API.</p>'}
        </div>
        ${isAdmin ? `
          <form class="order-status-form" data-order-status-form data-order-id="${id}">
            <label>Status</label>
            <select name="status">
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button class="btn-primary auth-submit" type="submit">Update Status</button>
          </form>
        ` : ''}
      </article>
    `;
  }

  async function loadOrders() {
    grid.innerHTML = '<div class="empty-state">Loading orders...</div>';
    const orders = await store.getOrders();
    grid.innerHTML = Array.isArray(orders) && orders.length
      ? orders.map(orderHTML).join('')
      : '<div class="empty-state">No orders found.</div>';

    grid.querySelectorAll('[data-order-status-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const orderId = form.dataset.orderId;
        const status = form.elements.status.value;
        try {
          await store.updateOrderStatus(orderId, status);
          store.showToast('Order status updated');
        } catch (error) {
          store.showToast(error.message || 'Could not update order');
        }
      });
    });
  }

  loadOrders().catch((error) => {
    grid.innerHTML = `<div class="empty-state">${error.message || 'Could not load orders.'}</div>`;
  });
})();

