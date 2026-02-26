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

// Get All Notes (Only Logged In User) with optional tag filter
exports.getNotes = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.tag) {
      // simple case-insensitive hashtag match in title or content
      const tag = req.query.tag.toLowerCase();
      const regex = new RegExp(`#${tag}\b`, 'i');
      filter.$or = [
        { title: regex },
        { content: regex }
      ];
    }
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get statistics for dashboard
exports.getStats = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id });
    const total = notes.length;

    // calculate one week ago (inclusive)
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 6); // we'll count today + previous 6 days

    // weekly total
    const weeklyNotes = notes.filter(n => n.createdAt >= oneWeekAgo);
    const weekly = weeklyNotes.length;

    // build daily breakdown for the past 7 days
    const labels = [];
    const countsMap = {};
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0,10); // YYYY-MM-DD
      labels.push(dayNames[d.getDay()]);
      countsMap[key] = 0;
    }

    weeklyNotes.forEach(n => {
      const key = n.createdAt.toISOString().slice(0,10);
      if (countsMap[key] !== undefined) countsMap[key]++;
    });

    const values = labels.map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - idx));
      const key = d.toISOString().slice(0,10);
      return countsMap[key] || 0;
    });

    // compute distinct tags by scanning note content/title for hashtags
    const tagSet = new Set();
    const tagRegex = /#(\w+)/g;
    notes.forEach(n => {
      let str = '';
      if (n.title) str += n.title + ' ';
      if (n.content) str += n.content;
      let m;
      while ((m = tagRegex.exec(str)) !== null) {
        tagSet.add(m[1].toLowerCase());
      }
    });
    const tags = tagSet.size;

    res.json({
      total,
      weekly,
      weeklyBreakdown: { labels, values },
      tags,
    });
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