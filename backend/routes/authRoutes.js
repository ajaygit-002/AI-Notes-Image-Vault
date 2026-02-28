
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');

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


router.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email not registered' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password has been reset. Please log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


async function findUserByResetToken(token) {
  
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


router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await findUserByResetToken(token);
    res.json({ valid: !!user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


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
