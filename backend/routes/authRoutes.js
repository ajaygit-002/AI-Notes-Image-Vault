const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // for security we can send the same message even if user doesn't exist
      return res.status(400).json({ message: 'No account with that email exists.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // normally you would email the link to the user; for demo respond with the link
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    res.json({ message: 'Password reset link generated', resetLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// utility for looking up valid token
async function findUserByResetToken(token) {
  return User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
}

// Reset password using token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await findUserByResetToken(token);
    if (!user) return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`Password updated for user ${user.email}`);
    // respond with a bit of data so client can verify change
    res.json({ message: 'Password has been updated.', user: { id: user._id, email: user.email } });
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
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await findUserByResetToken(token);
    if (!user) return res.status(400).json({ message: 'invalid or expired' });
    res.json({ message: 'valid' });
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
