const express = require("express");
const router = express.Router();
const db = require("../database/db");

console.log("Customers route loaded");

// GET ALL CUSTOMERS
router.get("/", (req, res) => {
  const sql = "SELECT * FROM customers";

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    res.json(rows);
  });
});

// GET CUSTOMER BY ID
router.get("/:id", (req, res) => {
  const sql = "SELECT * FROM customers WHERE id = ?";

  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json(row);
  });
});

// SEARCH CUSTOMER BY PHONE
router.get("/phone/:phone", (req, res) => {
  const sql = "SELECT * FROM customers WHERE phone = ?";

  db.get(sql, [req.params.phone], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json(row);
  });
});

// ADD CUSTOMER
router.post("/", (req, res) => {
  const { name, phone, address } = req.body;

  const sql = `
    INSERT INTO customers (name, phone, address)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [name, phone, address], function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: "Customer already exists or invalid data"
      });
    }

    res.json({
      success: true,
      message: "Customer added",
      customerId: this.lastID
    });
  });
});

// UPDATE CUSTOMER
router.put("/:id", (req, res) => {
  const { name, phone, address } = req.body;

  const sql = `
    UPDATE customers
    SET name = ?, phone = ?, address = ?
    WHERE id = ?
  `;

  db.run(sql, [name, phone, address, req.params.id], function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: "Update failed"
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      message: "Customer updated"
    });
  });
});

// DELETE CUSTOMER
router.delete("/:id", (req, res) => {
  const sql = "DELETE FROM customers WHERE id = ?";

  db.run(sql, [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Delete failed"
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      message: "Customer deleted"
    });
  });
});

module.exports = router;