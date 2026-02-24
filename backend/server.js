
require("dotenv").config();
console.log("MONGO_URI from .env:", process.env.MONGO_URI); 

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/login";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// User Schema & Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const UserModel = mongoose.model("User", userSchema);

// Routes
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
app.use(authRoutes);
app.use('/api/notes', noteRoutes);
app.get("/", (req, res) => {
  res.send("AI Notes & Image Vault Backend Running 🚀");
});
// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is healthy" });
});

// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});