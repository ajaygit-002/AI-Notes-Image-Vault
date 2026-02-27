const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // fields used for password reset flow
  resetPasswordToken: String,
  resetPasswordExpires: Date
},{
  timestamps: true // adds createdAt & updatedAt
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
