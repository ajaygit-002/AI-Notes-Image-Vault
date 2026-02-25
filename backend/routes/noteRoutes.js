const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  getStats
} = require('../controllers/noteController');

const router = express.Router();

router.route('/')
  .post(protect, createNote)
  .get(protect, getNotes);

router.route('/stats')
  .get(protect, getStats);

router.route('/:id')
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router;