const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: 'User registered', user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ 
      message: 'Login successful',
      token, 
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo route to create a test user
router.get('/demo-create-user', async (req, res) => {
  try {
    const demoEmail = 'demo@example.com';
    const demoPassword = 'demo1234';
    const existing = await User.findOne({ email: demoEmail });
    if (existing) return res.json({ message: 'Demo user already exists', email: demoEmail, password: demoPassword });
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    const user = await User.create({ name: 'Demo User', email: demoEmail, password: hashedPassword });
    res.json({ message: 'Demo user created', email: demoEmail, password: demoPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
