const Note = require('../models/Note');

// Create Note
exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.create({
      user: req.user._id,
      title,
      content
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Notes (Only Logged In User)
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Note
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (note && note.user.toString() === req.user._id.toString()) {
      note.title = req.body.title || note.title;
      note.content = req.body.content || note.content;
      const updated = await note.save();
      res.json(updated);
    } else {
      res.status(401).json({ message: 'Not authorized' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Note
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (note && note.user.toString() === req.user._id.toString()) {
      await note.deleteOne();
      res.json({ message: 'Note deleted' });
    } else {
      res.status(401).json({ message: 'Not authorized' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};