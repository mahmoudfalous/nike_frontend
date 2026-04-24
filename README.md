# Nike E-Commerce Frontend

A complete vanilla JavaScript e-commerce storefront with authentication, product catalog, cart, and order management—all wired to the Nike E-Commerce REST API.

## Quick Start

Serve the folder with any static server:

```bash
python3 -m http.server 8123
# or: npx http-server
# or: php -S localhost:8000
```

Then open `http://localhost:8123/file.html` in your browser.

If your backend API is running on a different host/port, update `API_BASE` in **site.js**:

```javascript
const API_BASE = 'http://localhost:8000/api';  // Change this
```

---

## Pages & Routes

### 🏠 Storefront
- **file.html** — Main homepage with hero slider, products, cart sidebar, navigation

### 🔐 Authentication
- **login.html** — Log in with email/password
  - Endpoint: `POST /api/auth/login/`
  - Optional email pre-fill: `login.html?email=user@example.com`
  - Stores tokens in localStorage, redirects to homepage on success

- **register.html** — Create a new account
  - Endpoint: `POST /api/auth/register/`
  - Fields: `email`, `full_name`, `phone`, `address`, `password`, `password_confirm`
  - Redirects to login on success

- **Logout** — Click the logout button in top nav (when logged in)

### 🛍️ Catalog
- **category.html?slug={slug}** — Browse products by category
  - Slugs: `all`, `men`, `women`, `kids`, `sports`, `sale`
  - Endpoint: `GET /api/products/` — Fetches and filters products
  - Quick-add buttons for each product

- **product.html?id={id}** — Single product detail page
  - Endpoint: `GET /api/products/{id}/` — Fetch details
  - Add to cart: `POST /api/cart/`
  - Buy now: Creates order directly
  - Related products section
  - **Admin panel:** Update product details or delete

### 📦 Orders
- **orders.html** — View your order history
  - Endpoint: `GET /api/orders/` — List orders
  - **Admin panel:** Update order status (PATCH `/api/orders/{id}/update_status/`)

---

## Wired API Endpoints

### Authentication
- `POST /api/auth/register/` — Create account
- `POST /api/auth/login/` — Log in (returns access_token, refresh_token, user)
- `POST /api/token/refresh/` — Refresh access token (auto on 401)
- `GET /api/auth/me/` — Get current user profile

### Products
- `GET /api/products/` — List all products (public)
- `GET /api/products/{id}/` — Get single product (public)
- `POST /api/products/` — Create product (admin)
- `PATCH /api/products/{id}/` — Update product (admin)
- `DELETE /api/products/{id}/` — Delete product (admin)

### Cart
- `GET /api/cart/` — List cart items
- `POST /api/cart/` — Add item: `{ "product": id, "quantity": qty }`
- `PATCH /api/cart/{id}/` — Update quantity: `{ "quantity": qty }`
- `DELETE /api/cart/{id}/` — Remove item
- `GET /api/cart/cart_total/` — Get cart total
- `POST /api/cart/clear_cart/` — Clear all items

### Orders
- `GET /api/orders/` — List user orders
- `GET /api/orders/{id}/` — Get order details
- `POST /api/orders/create_order/` — Create order from cart
- `PATCH /api/orders/{id}/update_status/` — Update status (admin): `{ "status": "shipped" }`

---

## Shared Helpers (site.js)

Global `window.NikeStore` provides all API & utilities:

**Auth:** `getAccessToken()`, `getRefreshToken()`, `getUser()`, `isLoggedIn()`, `isAdmin(user)`, `logout()`

**Products:** `getProducts()`, `getProduct(id)`, `createProduct()`, `updateProduct()`, `deleteProduct()`

**Cart:** `getCart()`, `getCartTotal()`, `addToCart()`, `updateCartItem()`, `removeCartItem()`, `clearCart()`, `quickAddToCart()`

**Orders:** `createOrder()`, `getOrders()`, `getOrder()`, `updateOrderStatus()`

**Utils:** `slugify()`, `currency()`, `renderStars()`, `productCardHTML()`, `showToast()`, `renderAuthNav()`

---

## Fallback Support

If the backend is unavailable, the frontend uses 8 local Nike/Adidas/etc. products. Cart uses localStorage (won't sync without backend).

---

## Token Storage

- `localStorage.access_token` — JWT for API calls
- `localStorage.refresh_token` — Token to refresh access (auto-refreshed on 401)
- `localStorage.auth_user` — User profile JSON

---

## File Structure

```
project/
├── file.html           # Homepage
├── login.html          # Login
├── register.html       # Registration
├── product.html        # Product detail
├── category.html       # Category listing
├── orders.html         # Order history
├── file.css            # All styles (responsive)
├── main.js             # Homepage logic
├── auth.js             # Auth form handlers
├── site.js             # Shared API helpers (global NikeStore)
├── product.js          # Product page logic
├── category.js         # Category page logic
├── orders.js           # Orders page logic
└── README.md           # This file
```

---

## Configuration

**API base URL** — Edit `site.js`:
```javascript
const API_BASE = 'http://localhost:8000/api';  // Change this
```

**Auth page URLs** — Edit `site.js` in the `renderAuthNav` calls.

---

## Error Handling

- Network errors → toast notifications
- Form validation → field-specific error messages
- API errors → extracted from backend, shown in toast
- Missing data → sensible defaults or fallback

---

## Notes

- Fully responsive (mobile, tablet, desktop)
- Automatic token refresh on 401
- Fallback to local data if API is down
- Admin features visible only to staff users
- All timestamps and prices formatted for display


# nike_frontend
