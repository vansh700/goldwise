// server.js (updated with full CRUD operations + JWT auth)
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "goldwise_secret_key_2024"; // Set JWT_SECRET env var in production!

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jewelryDB";
mongoose.connect(MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB connection error:", err));

// ─── Metal Sub-Schema ────────────────────────────────────────────────────────
const metalSchema = new mongoose.Schema({
  karat:  String,
  type:   String,
  weight: Number
}, { _id: false });

// ─── Product Schema ──────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true },
  type:        { type: String, default: '' },
  category:    { type: String, default: '' },
  images:      [String],
  metal:       metalSchema,
  weight:      Number,
  clarity:     String,
  description: String,
  brand:       String,
  collection:  String,
  productCode: { type: String, unique: true, sparse: true },
  updatedAt:   Date
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// ─── Product Routes ───────────────────────────────────────────────────────────

// GET all products (optionally filter by ?category=gold&type=rings)
app.get("/api/products", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.type)     filter.type     = req.query.type;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
});

// GET single product by id
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
});

// POST create product (admin only — protected by admin password gate in frontend)
app.post("/api/products", async (req, res) => {
  try {
    if (req.body.productCode === "") {
      delete req.body.productCode;
    }
    const product = new Product(req.body);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /api/products error:", err);
    res.status(400).json({ message: "Error creating product", error: err.message });
  }
});

// PUT update product (admin only — protected by admin password gate in frontend)
app.put("/api/products/:id", async (req, res) => {
  try {
    if (req.body.productCode === "") {
      delete req.body.productCode;
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    console.error("PUT /api/products error:", err);
    res.status(400).json({ message: "Error updating product", error: err.message });
  }
});

// DELETE product (admin only — protected by admin password gate in frontend)
app.delete("/api/products/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting product", error: err.message });
  }
});

// Purchase Schema
const purchaseSchema = new mongoose.Schema({
  saleDate: { type: Date, required: true },
  customerName: { type: String, required: true },
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalCost: Number,
  totalPrice: Number,
  paymentMethod: { type: String, required: true },
  profitLoss: Number
}, { timestamps: true });

const Purchase = mongoose.model("Purchase", purchaseSchema);

// ─── User Schema ────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:    { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// ─── Auth Middleware ─────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, fullName, email, phone, password } = req.body;
    if (!username || !fullName || !email || !phone || !password)
      return res.status(400).json({ message: "All fields are required." });

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? "Email" : "Username";
      return res.status(409).json({ message: `${field} is already registered.` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({ username, fullName, email, phone, passwordHash });
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, fullName: user.fullName, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email OR username
    if (!identifier || !password)
      return res.status(400).json({ message: "Email/username and password are required." });

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }]
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: user._id, username: user.username, fullName: user.fullName, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Get current user profile (protected)
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// API Routes
app.get("/api/purchases", async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ saleDate: -1 });
    res.json(purchases);
  } catch (error) {
    console.error("GET /api/purchases error:", error);
    res.status(500).json({ message: "Error fetching purchases", error: error.message });
  }
});

app.post("/api/purchases", async (req, res) => {
  try {
    const { saleDate, customerName, item, quantity, unitCost, unitPrice, paymentMethod } = req.body;
    
    const totalCost = unitCost * quantity;
    const totalPrice = unitPrice * quantity;
    const profitLoss = totalPrice - totalCost;

    const newPurchase = new Purchase({
      saleDate,
      customerName,
      item,
      quantity,
      unitCost,
      unitPrice,
      totalCost,
      totalPrice,
      paymentMethod,
      profitLoss
    });

    const savedPurchase = await newPurchase.save();
    res.status(201).json(savedPurchase);
  } catch (error) {
    res.status(400).json({ message: "Error creating purchase", error: error.message });
  }
});

app.put("/api/purchases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { saleDate, customerName, item, quantity, unitCost, unitPrice, paymentMethod } = req.body;

    const totalCost = unitCost * quantity;
    const totalPrice = unitPrice * quantity;
    const profitLoss = totalPrice - totalCost;

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      {
        saleDate,
        customerName,
        item,
        quantity,
        unitCost,
        unitPrice,
        totalCost,
        totalPrice,
        paymentMethod,
        profitLoss
      },
      { new: true }
    );

    if (!updatedPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.json(updatedPurchase);
  } catch (error) {
    res.status(400).json({ message: "Error updating purchase", error: error.message });
  }
});

app.delete("/api/purchases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPurchase = await Purchase.findByIdAndDelete(id);

    if (!deletedPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting purchase", error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});