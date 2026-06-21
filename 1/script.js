// script.js
// DOM Elements
const saleDateInput = document.getElementById("sale-date");
const customerNameInput = document.getElementById("customer-name");
const purchaseItemInput = document.getElementById("purchase-item");
const quantityInput = document.getElementById("quantity");
const costPriceInput = document.getElementById("cost-price");
const sellingPriceInput = document.getElementById("selling-price");
const paymentMethodInput = document.getElementById("payment-method");
const addPurchaseBtn = document.getElementById("add-purchase-btn");
const purchaseTableBody = document.querySelector("#purchase-table tbody");
const exportCsvBtn = document.getElementById("export-csv");
const exportPdfBtn = document.getElementById("export-pdf");

// Purchases array and total profit/loss
let purchases = [];
let totalProfitLoss = 0;

// Base API URL
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5500/api/purchases"
  : "https://goldwise-backend.onrender.com/api/purchases"; // REPLACE with your deployed backend URL

// Fetch purchases from backend
async function fetchPurchases() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch purchases");
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Save purchase to backend
async function savePurchaseToBackend(purchaseData) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchaseData)
    });
    return await response.json();
  } catch (error) {
    console.error("Error saving purchase:", error);
    return null;
  }
}

// Add Purchase Event Listener
addPurchaseBtn.addEventListener("click", async () => {
  const saleDate = saleDateInput.value;
  const customerName = customerNameInput.value.trim();
  const purchaseItem = purchaseItemInput.value.trim();
  const quantity = parseInt(quantityInput.value);
  const costPrice = parseFloat(costPriceInput.value);
  const sellingPrice = parseFloat(sellingPriceInput.value);
  const paymentMethod = paymentMethodInput.value;

  // Validate inputs
  if (!saleDate || !customerName || !purchaseItem || isNaN(quantity) || 
      isNaN(costPrice) || isNaN(sellingPrice)) {
    alert("Please fill in all fields with valid data.");
    return;
  }

  const purchaseData = {
    saleDate: new Date(saleDate).toISOString(),
    customerName,
    item: purchaseItem,
    quantity,
    unitCost: costPrice,
    unitPrice: sellingPrice,
    paymentMethod
  };

  const savedPurchase = await savePurchaseToBackend(purchaseData);
  if (savedPurchase) {
    purchases.push(savedPurchase);
    totalProfitLoss += savedPurchase.profitLoss;
    addPurchaseToTable(savedPurchase);
    updateAnalytics();
  }

  // Clear inputs
  saleDateInput.value = "";
  customerNameInput.value = "";
  purchaseItemInput.value = "";
  quantityInput.value = "1";
  costPriceInput.value = "";
  sellingPriceInput.value = "";
});

// Add Purchase to Table Function
function addPurchaseToTable(purchase) {
  const newRow = document.createElement("tr");
  newRow.dataset.id = purchase._id; // add id for deletion
  newRow.innerHTML = `
    <td>${new Date(purchase.saleDate).toLocaleDateString()}</td>
    <td>${purchase.customerName}</td>
    <td>${purchase.item}</td>
    <td>${purchase.quantity}</td>
    <td>₹${purchase.unitCost.toFixed(2)}</td>
    <td>₹${purchase.unitPrice.toFixed(2)}</td>
    <td>₹${purchase.totalCost.toFixed(2)}</td>
    <td>₹${purchase.totalPrice.toFixed(2)}</td>
    <td>${purchase.paymentMethod.toUpperCase()}</td>
    <td class="${purchase.profitLoss >= 0 ? 'profit' : 'loss'}">
      ₹${purchase.profitLoss.toFixed(2)}
      <button class="delete-btn">×</button>
    </td>
  `;
  purchaseTableBody.appendChild(newRow);
}

// Export CSV
exportCsvBtn.addEventListener('click', () => {
  const csvContent = [
    ['Date', 'Customer', 'Item', 'Qty', 'Unit Cost', 'Unit Price', 'Total Cost', 'Total Price', 'Payment Method', 'Profit/Loss'],
    ...purchases.map(p => [
      new Date(p.saleDate).toLocaleDateString(),
      p.customerName,
      p.item,
      p.quantity,
      p.unitCost.toFixed(2),
      p.unitPrice.toFixed(2),
      p.totalCost.toFixed(2),
      p.totalPrice.toFixed(2),
      p.paymentMethod,
      p.profitLoss.toFixed(2)
    ])
  ].map(e => e.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "purchase-history.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Analytics Calculations
function updateAnalytics() {
  const totalSales = purchases.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalCosts = purchases.reduce((acc, curr) => acc + curr.totalCost, 0);
  const profitMargin = ((totalProfitLoss / totalSales) * 100 || 0).toFixed(1);

  document.getElementById('total-sales').textContent = `₹${totalSales.toFixed(2)}`;
  document.getElementById('total-costs').textContent = `₹${totalCosts.toFixed(2)}`;
  document.getElementById('profit-margin').textContent = `${profitMargin}%`;
  document.getElementById('total-profit-loss').textContent = `₹${totalProfitLoss.toFixed(2)}`;

  if (typeof updateProfitChart === 'function') {
    updateProfitChart();
  }
}

// Fetch purchases from backend on load
window.addEventListener('DOMContentLoaded', async () => {
  purchases = await fetchPurchases();
  totalProfitLoss = purchases.reduce((acc, curr) => acc + curr.profitLoss, 0);
  purchases.forEach(addPurchaseToTable);
  updateAnalytics();
});

// Delete Purchase from backend
purchaseTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const row = e.target.closest("tr");
    const purchaseId = row.dataset.id;

    try {
      const response = await fetch(`${API_URL}/${purchaseId}`, { method: "DELETE" });
      if (response.ok) {
        row.remove();
        const index = purchases.findIndex(p => p._id === purchaseId);
        if (index > -1) {
          totalProfitLoss -= purchases[index].profitLoss;
          purchases.splice(index, 1);
          updateAnalytics();
        }
      }
    } catch (error) {
      console.error("Error deleting purchase:", error);
    }
  }
});

// Example Update Function (for future UI edit modal)
async function updatePurchase(purchaseId, updatedData) {
  try {
    const response = await fetch(`${API_URL}/${purchaseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating purchase:", error);
    return null;
  }
}
