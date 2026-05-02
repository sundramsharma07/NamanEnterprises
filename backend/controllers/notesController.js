const db = require("../database/db");
const { body, validationResult } = require("express-validator");

exports.validateNote = [
  body("content").trim().notEmpty().withMessage("Note content is required"),
];

exports.getCustomerNotes = async (req, res) => {
  const customerId = req.params.id;
  try {
    const sql = "SELECT * FROM notes WHERE customer_id = $1 ORDER BY created_at DESC";
    const result = await db.query(sql, [customerId]);
    res.json({ success: true, notes: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

exports.addNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const customerId = req.params.id;
  const { content } = req.body;

  try {
    const sql = "INSERT INTO notes (customer_id, content) VALUES ($1, $2) RETURNING id";
    const result = await db.query(sql, [customerId, content]);
    res.json({ success: true, message: "Note added", noteId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add note", error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  const noteId = req.params.note_id;
  try {
    const sql = "DELETE FROM notes WHERE id = $1";
    const result = await db.query(sql, [noteId]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Note not found" });
    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete note", error: err.message });
  }
};

