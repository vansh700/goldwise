/**
 * admin.js — GoldWise Admin Panel
 * All product CRUD now goes through the backend API, not localStorage.
 */

const PRODUCTS_API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5500/api/products"
  : "https://goldwise-jewelry-backend.onrender.com/api/products";

document.addEventListener('DOMContentLoaded', () => {
  let editingProductId = null;

  // Load and render all products
  loadProducts();

  // ── Form submission (Add / Edit) ─────────────────────────────────────────
  document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
      name:        document.getElementById('name').value.trim(),
      price:       parseFloat(document.getElementById('price').value),
      type:        document.getElementById('type').value,
      category:    document.getElementById('category').value,
      images:      [document.getElementById('image').value.trim()],
      metal: {
        karat:  document.getElementById('karatage').value,
        type:   document.getElementById('metalType').value,
        weight: parseFloat(document.getElementById('grossWeight').value) || 0
      },
      weight:      parseFloat(document.getElementById('weight').value) || 0,
      clarity:     document.getElementById('clarity').value,
      description: document.getElementById('description').value,
      brand:       document.getElementById('brand').value,
      collection:  document.getElementById('collection').value,
      productCode: document.getElementById('productCode').value,
      updatedAt:   new Date().toISOString()
    };

    const token = localStorage.getItem('gw_token');
    if (!token) {
      alert('You must be logged in as admin.');
      return;
    }

    try {
      let res;
      if (editingProductId) {
        // Update existing product
        res = await fetch(`${PRODUCTS_API}/${editingProductId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
        res = await fetch(PRODUCTS_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Server error');
      }

      alert(editingProductId ? 'Product updated successfully!' : 'Product added successfully!');
      editingProductId = null;
      e.target.reset();
      loadProducts();
    } catch (err) {
      console.error('Save product error:', err);
      alert('Error saving product: ' + err.message);
    }
  });

  // ── Load all products from API and render ────────────────────────────────
  async function loadProducts() {
    try {
      const res = await fetch(PRODUCTS_API);
      const products = await res.json();
      renderProductTable(products);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }

  // ── Render table ─────────────────────────────────────────────────────────
  function renderProductTable(products) {
    const tbody = document.getElementById('productTable');
    if (!tbody) return;

    tbody.innerHTML = products.map(product => `
      <tr>
        <td>${product.name}</td>
        <td>₹${product.price?.toFixed(2)}</td>
        <td><img src="${product.images?.[0] || ''}" alt="${product.name}" style="max-width:100px;"></td>
        <td>
          <button class="edit-btn" data-id="${product._id}">Edit</button>
          <button class="delete-btn" data-id="${product._id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const id = e.target.dataset.id;
        const token = localStorage.getItem('gw_token');
        try {
          const res = await fetch(`${PRODUCTS_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Delete failed');
          loadProducts();
        } catch (err) {
          alert('Error deleting product: ' + err.message);
        }
      });
    });

    // Edit handlers
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const res = await fetch(`${PRODUCTS_API}/${id}`);
        const product = await res.json();
        populateFormForEdit(product);
      });
    });
  }

  // ── Pre-fill form for editing ────────────────────────────────────────────
  function populateFormForEdit(product) {
    editingProductId = product._id;
    document.getElementById('name').value        = product.name || '';
    document.getElementById('price').value       = product.price || '';
    document.getElementById('image').value       = product.images?.[0] || '';
    document.getElementById('category').value    = product.category || '';
    document.getElementById('type').value        = product.type || '';
    document.getElementById('weight').value      = product.weight || '';
    document.getElementById('grossWeight').value = product.metal?.weight || '';
    document.getElementById('metalType').value   = product.metal?.type || '';
    document.getElementById('productCode').value = product.productCode || '';
    document.getElementById('description').value = product.description || '';
    document.getElementById('brand').value       = product.brand || '';
    document.getElementById('collection').value  = product.collection || '';
    document.getElementById('karatage').value    = product.metal?.karat || '';
    document.getElementById('clarity').value     = product.clarity || '';
    // Scroll to form
    document.getElementById('productForm')?.scrollIntoView({ behavior: 'smooth' });
  }
});
