// JS/Product.js — Fetches products from the backend API (not localStorage)

const PRODUCTS_API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5500/api/products"
  : "https://goldwise-jewelry-backend.onrender.com/api/products";

// ── Remove the placeholder static card ──────────────────────────────────────
const existingProduct = document.getElementById("product");
if (existingProduct) existingProduct.remove();

// ── Fetch products from API, then render & filter ────────────────────────────
async function loadAndRender() {
  const container = document.getElementById('product-card-id');
  if (!container) return;

  container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Loading products...</p>';

  try {
    const res = await fetch(PRODUCTS_API);
    if (!res.ok) throw new Error('Server error');
    const products = await res.json();

    container.innerHTML = '';
    if (products.length === 0) {
      container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">No products found.</p>';
      return;
    }

    products.forEach((product, index) => renderProduct(product, index, container));
    applyPageFilter(); // apply URL filter after products are rendered
  } catch (err) {
    console.error('Error loading products:', err);
    container.innerHTML = '<p style="text-align:center;padding:2rem;color:red;">Could not load products. Please try again later.</p>';
  }
}

// ── Build each product card ──────────────────────────────────────────────────
function renderProduct(product, index, container) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.category = (product.category || '').toLowerCase();
  card.dataset.type     = (product.type || '').toLowerCase();

  card.innerHTML = `
    <div class="product-image">
      <img src="${product.images?.[0] || 'Assets/Image/Img_1.jpg'}" alt="${product.name}" class="product-image">
    </div>
    <div class="product-details">
      <h2 class="product-name">${product.name}</h2>
      <p class="product-price">${formatPrice(product.price)}</p>
      <div class="product-actions">
        <button id="viewId-${index}" class="view-button">View Product</button>
        <button id="cartId-${index}" class="add-to-cart">
          <i class="fa fa-shopping-cart"></i>
        </button>
      </div>
    </div>
  `;

  // View button → single product page
  card.querySelector(`#viewId-${index}`).addEventListener('click', () => {
    window.location.href = `singleProduct.html?id=${product._id}`;
  });

  // Add to cart
  card.querySelector(`#cartId-${index}`).addEventListener('click', () => {
    const user = JSON.parse(localStorage.getItem('gw_user'));
    if (!user) return window.location.href = 'login.html';

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item._id === product._id);
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  });

  container.appendChild(card);
}

// ── Show/hide cards based on category filter ─────────────────────────────────
function filterProducts() {
  const category = (document.getElementById('categoryFilter')?.value || 'all').toLowerCase();
  const type     = (document.getElementById('typeFilter')?.value    || 'all').toLowerCase();

  document.querySelectorAll('.product-card').forEach(card => {
    const matchCategory = category === 'all' || card.dataset.category === category;
    const matchType     = type     === 'all' || card.dataset.type     === type;
    card.style.display  = (matchCategory && matchType) ? 'block' : 'none';
  });
}

// ── Map URL param → dropdown → apply filter ──────────────────────────────────
function applyPageFilter() {
  const raw = new URLSearchParams(window.location.search).get('page') || 'all';
  const map = {
    allProduct:      'all',
    goldProduct:     'gold',
    platinumProduct: 'platinum',
    diamondProduct:  'diamond',
    earRings:        'earrings',
    ring:            'rings',
    bangle:          'bangles'
  };
  const page = (map[raw] || raw).toLowerCase();

  const catEl = document.getElementById('categoryFilter');
  if (!catEl) return;

  const valid = Array.from(catEl.options).some(o => o.value === page);
  catEl.value = valid ? page : 'all';

  filterProducts();
}

// ── Price formatter ──────────────────────────────────────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadAndRender();

  document.getElementById('categoryFilter')
    ?.addEventListener('change', filterProducts);
});
