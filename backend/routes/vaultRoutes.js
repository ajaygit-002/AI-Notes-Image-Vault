
const express = require('express');
const multer = require('multer');
const path = require('path');


const VaultItem = require('../models/VaultItem');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {

    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const router = express.Router();

// POST /api/vault/upload - password protected only
router.post('/upload', upload.single('image'), async (req, res) => {
  const { password } = req.body;
  if (password !== '1234') {
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, () => {});
    }
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // create a DB record so frontend can list available images
  let newItem;
  try {
    newItem = await VaultItem.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      // uploadedBy left undefined when no auth
    });
  } catch (err) {
    console.error('Vault record error', err);
    // continue even if record fails
  }

  res.json({ message: 'File uploaded successfully', file: req.file.filename, item: newItem });
});

// GET /api/vault - return list of all uploads (no auth)
router.get('/', async (req, res) => {
  try {
    const items = await VaultItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch vault items' });
  }
});

// GET /api/vault/:id - single item details
router.get('/:id', async (req, res) => {
  try {
    const item = await VaultItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch vault item' });
  }
});

module.exports = router;