
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api/customers"
  : "https://goldwise-customer-backend.onrender.com/api/customers";

// Get DOM Elements
const customerNameInput = document.getElementById("customer-name");
const customerGenderInput = document.getElementById("customer-gender");
const customerPhoneInput = document.getElementById("customer-phone");
const purchaseItemInput = document.getElementById("purchase-item");
const purchaseDateInput = document.getElementById("purchase-date");
const itemPriceInput = document.getElementById("item-price");
const addCustomerBtn = document.getElementById("add-customer-btn");
const customerTableBody = document.querySelector("#customer-table tbody");
const searchInput = document.getElementById("search");

// Load initial customers
window.addEventListener("DOMContentLoaded", loadCustomers);

// Add Customer Record
addCustomerBtn.addEventListener("click", async () => {
  const customerData = {
    name: customerNameInput.value.trim(),
    gender: customerGenderInput.value,
    phone: customerPhoneInput.value.trim(),
    item: purchaseItemInput.value.trim(),
    date: purchaseDateInput.value,
    price: parseFloat(itemPriceInput.value)
  };

  if (!customerData.name || !customerData.phone || 
      !customerData.item || !customerData.date || 
      isNaN(customerData.price)) {
    alert("Please fill in all fields with valid data.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(customerData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    // Clear inputs
    customerNameInput.value = "";
    customerGenderInput.value = "Male";
    customerPhoneInput.value = "";
    purchaseItemInput.value = "";
    purchaseDateInput.value = "";
    itemPriceInput.value = "";

    // Refresh customer list
    await loadCustomers();
  } catch (error) {
    alert(`Error: ${error.message}`);
    console.error("Add customer error:", error);
  }
});

// Search Functionality
searchInput.addEventListener("input", async () => {
  try {
    const searchTerm = searchInput.value.trim();
    const response = await fetch(`${API_URL}/search?term=${encodeURIComponent(searchTerm)}`);
    const customers = await response.json();
    updateTable(customers);
  } catch (error) {
    console.error("Search error:", error);
  }
});

// Load customers from backend
async function loadCustomers() {
  try {
    const response = await fetch(API_URL);
    const customers = await response.json();
    updateTable(customers);
  } catch (error) {
    console.error("Error loading customers:", error);
  }
}

// Update table with customers
function updateTable(customers) {
  customerTableBody.innerHTML = "";
  customers.forEach(customer => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${customer.name}</td>
      <td>${customer.gender}</td>
      <td>${customer.phone}</td>
      <td>${customer.item}</td>
      <td>${new Date(customer.date).toLocaleDateString()}</td>
      <td>₹${customer.price.toFixed(2)}</td>
    `;
    customerTableBody.appendChild(row);
  });
}
