const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');

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

// Forgot password - send reset token link
// route: POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // user not found; return 404 so frontend can display appropriate message
      return res.status(404).json({ message: 'Email not registered' });
    }

    // generate plain token and hash it before saving
    const token = crypto.randomBytes(20).toString('hex');
    const hashed = await bcrypt.hash(token, 10);
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetLink = `http://localhost:5173/reset-password/${token}`;
    // in a real app you would send the link by email; here we return it for testing
    res.json({ message: 'Password reset link generated', resetLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// utility for looking up valid token using bcrypt compare
async function findUserByResetToken(token) {
  // find all users whose reset token hasn't expired
  const candidates = await User.find({
    resetPasswordExpires: { $gt: Date.now() }
  });
  for (const user of candidates) {
    if (user.resetPasswordToken) {
      const match = await bcrypt.compare(token, user.resetPasswordToken);
      if (match) return user;
    }
  }
  return null;
}

// Reset password using token
// route: POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await findUserByResetToken(token);
    if (!user)
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
  (optional) You could also expose a /change-password route for authenticated users,
  requiring the current password. It would look similar but verify req.body.oldPassword
  against bcrypt.compare before updating user.password and saving.
*/

// verify token validity without changing password
// always respond 200 so client doesn't see a network error
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await findUserByResetToken(token);
    res.json({ valid: !!user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// return profile info for authenticated user
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
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
