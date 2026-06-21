
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/goldwise";
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  item: { type: String, required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true }
});

const Customer = mongoose.model("Customer", customerSchema);

// Routes
// Create a new customer
app.post("/api/customers", async (req, res) => {
  try {
    const { name, gender, phone, item, date, price } = req.body;
    
    // Validate required fields
    if (!name || !phone || !item || !date || !price) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newCustomer = new Customer({
      name,
      gender,
      phone,
      item,
      date: new Date(date),
      price: Number(price)
    });

    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all customers
app.get("/api/customers", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ date: -1 });
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Search customers
app.get("/api/customers/search", async (req, res) => {
  try {
    const searchTerm = req.query.term;
    const customers = await Customer.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
        { item: { $regex: searchTerm, $options: "i" } }
      ]
    });
    res.json(customers);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

