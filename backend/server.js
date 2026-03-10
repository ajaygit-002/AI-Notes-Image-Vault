
/*
  server.js
  Main Express server entry for the AI Notes & Image Vault app.
  - Loads environment, connects to MongoDB, mounts API routes,
    and serves the uploads static folder.
  - No runtime behavior is changed by this comment.
*/
require("dotenv").config();
if (process.env.DEBUG) {
  console.log("MONGO_URI from .env:", process.env.MONGO_URI);
  console.log("GEMINI_API_KEY from .env:", process.env.GEMINI_API_KEY ? "✓ SET" : "✗ MISSING");
  console.log("GEMINI_API_URL from .env:", process.env.GEMINI_API_URL ? "✓ SET" : "✗ MISSING");
} 

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting Config
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { message: "Too many requests, please try again later." }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter limit for auth and AI
  message: { message: "Too many requests to this endpoint, please try again later." }
});

// Simple request logger for API routes to aid debugging
app.use('/api', (req, res, next) => {
  try {
    const auth = req.headers.authorization ? 'yes' : 'no';
    console.log(`[API] ${new Date().toISOString()} ${req.method} ${req.originalUrl} auth:${auth}`);
  } catch (e) {
    // ignore logging errors
  }
  next();
});

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
const vaultRoutes = require('./routes/vaultRoutes');
const suggestCorrections = require('./routes/suggestCorrections');
const aiRoutes = require('./routes/aiRoutes');
// mount routes
app.use('/api/auth', strictLimiter, authRoutes);
app.use('/api/notes', apiLimiter, noteRoutes);
app.use('/api/vault', apiLimiter, vaultRoutes);
app.use('/api/notes', strictLimiter, suggestCorrections);
app.use('/api/ai', strictLimiter, aiRoutes);
// If an /api/* route is not handled above, return JSON 404 instead of falling through to any frontend
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// JSON error handler — ensures unexpected errors return JSON (not HTML)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});
// expose uploaded files for manual inspection if needed
app.use('/uploads', express.static('uploads'));

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