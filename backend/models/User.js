const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // fields used for password reset flow
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
