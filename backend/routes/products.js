const express = require("express");
const router = express.Router();
const db = require("../database/db");

console.log("Products route loaded");

// GET ALL ACTIVE PRODUCTS
router.get("/", (req, res) => {
  db.all(
    "SELECT * FROM products WHERE is_active = 1 ORDER BY category, name, variant",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch products",
          error: err.message
        });
      }

      res.json(rows);
    }
  );
});

// ADD PRODUCT
router.post("/", (req, res) => {
  const { category, name, variant, unit, price } = req.body;

  db.run(
    `INSERT INTO products (category, name, variant, unit, price)
     VALUES (?, ?, ?, ?, ?)`,
    [category, name, variant || null, unit, price],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to add product",
          error: err.message
        });
      }

      res.json({
        success: true,
        message: "Product added successfully",
        product_id: this.lastID
      });
    }
  );
});

// UPDATE PRODUCT
router.put("/:id", (req, res) => {
  const { category, name, variant, unit, price, is_active } = req.body;

  db.run(
    `UPDATE products
     SET category = ?, name = ?, variant = ?, unit = ?, price = ?, is_active = ?
     WHERE id = ?`,
    [category, name, variant || null, unit, price, is_active ?? 1, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update product",
          error: err.message
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      res.json({
        success: true,
        message: "Product updated successfully"
      });
    }
  );
});

// UPDATE ONLY PRODUCT PRICE
router.put("/:id/price", (req, res) => {
  console.log("Price route hit:", req.params.id, req.body);

  const { price } = req.body;

  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid price is required"
    });
  }

  db.run(
    `UPDATE products SET price = ? WHERE id = ? AND is_active = 1`,
    [Number(price), req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update price",
          error: err.message
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found or inactive"
        });
      }

      db.get(
        `SELECT * FROM products WHERE id = ?`,
        [req.params.id],
        (err, row) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Price updated but failed to fetch updated product",
              error: err.message
            });
          }

          res.json({
            success: true,
            message: "Price updated successfully",
            product: row
          });
        }
      );
    }
  );
});

// DEACTIVATE PRODUCT
router.delete("/:id", (req, res) => {
  db.run(
    `UPDATE products SET is_active = 0 WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete product",
          error: err.message
        });
      }

      res.json({
        success: true,
        message: "Product deactivated successfully"
      });
    }
  );
});

module.exports = router;