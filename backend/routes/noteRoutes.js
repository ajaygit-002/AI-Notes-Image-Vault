const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote
} = require('../controllers/noteController');

const router = express.Router();

router.route('/')
  .post(protect, createNote)
  .get(protect, getNotes);

router.route('/:id')
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router;