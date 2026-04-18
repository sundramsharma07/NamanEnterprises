const db = require("../database/db");
const { body, validationResult } = require("express-validator");

exports.validateNote = [
  body("content").trim().notEmpty().withMessage("Note content is required"),
];

exports.getCustomerNotes = (req, res) => {
  const customerId = req.params.id;
  const sql = "SELECT * FROM notes WHERE customer_id = ? ORDER BY created_at DESC";
  db.all(sql, [customerId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, notes: rows });
  });
};

exports.addNote = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const customerId = req.params.id;
  const { content } = req.body;

  const sql = "INSERT INTO notes (customer_id, content) VALUES (?, ?)";
  db.run(sql, [customerId, content], function(err) {
    if (err) return res.status(500).json({ success: false, message: "Failed to add note", error: err.message });
    res.json({ success: true, message: "Note added", noteId: this.lastID });
  });
};

exports.deleteNote = (req, res) => {
  const noteId = req.params.note_id;
  const sql = "DELETE FROM notes WHERE id = ?";
  db.run(sql, [noteId], function(err) {
    if (err) return res.status(500).json({ success: false, message: "Failed to delete note" });
    if (this.changes === 0) return res.status(404).json({ success: false, message: "Note not found" });
    res.json({ success: true, message: "Note deleted" });
  });
};
