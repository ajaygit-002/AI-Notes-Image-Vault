const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.VaultItem || mongoose.model('VaultItem', vaultItemSchema);