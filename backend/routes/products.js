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

// GET LOW STOCK PRODUCTS
router.get("/low-stock", (req, res) => {
  db.all(
    `SELECT * 
     FROM products
     WHERE is_active = 1 AND stock <= min_stock
     ORDER BY stock ASC, category, name, variant`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch low stock products",
          error: err.message
        });
      }

      res.json({
        success: true,
        products: rows
      });
    }
  );
});

// GET STOCK HISTORY FOR A PRODUCT
router.get("/:id/stock-history", (req, res) => {
  db.all(
    `SELECT *
     FROM stock_movements
     WHERE product_id = ?
     ORDER BY id DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch stock history",
          error: err.message
        });
      }

      res.json({
        success: true,
        history: rows
      });
    }
  );
});

// ADD PRODUCT
router.post("/", (req, res) => {
  const { category, name, variant, unit, price, stock, min_stock } = req.body;

  const openingStock = Number(stock || 0);
  const minStock = Number(min_stock || 0);

  if (!category || !name || !unit || price === undefined || price === null) {
    return res.status(400).json({
      success: false,
      message: "category, name, unit and price are required"
    });
  }

  if (isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid price is required"
    });
  }

  if (isNaN(openingStock) || openingStock < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid stock is required"
    });
  }

  if (isNaN(minStock) || minStock < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid min_stock is required"
    });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run(
      `INSERT INTO products (category, name, variant, unit, price, stock, min_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category, name, variant || null, unit, Number(price), openingStock, minStock],
      function (err) {
        if (err) {
          return db.run("ROLLBACK", () => {
            return res.status(500).json({
              success: false,
              message: "Failed to add product",
              error: err.message
            });
          });
        }

        const productId = this.lastID;

        if (openingStock > 0) {
          db.run(
            `INSERT INTO stock_movements
             (product_id, movement_type, quantity, old_stock, new_stock, note)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              productId,
              "IN",
              openingStock,
              0,
              openingStock,
              "Opening stock added while creating product"
            ],
            (movementErr) => {
              if (movementErr) {
                return db.run("ROLLBACK", () => {
                  return res.status(500).json({
                    success: false,
                    message: "Product added but failed to save stock history",
                    error: movementErr.message
                  });
                });
              }

              db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  return db.run("ROLLBACK", () => {
                    return res.status(500).json({
                      success: false,
                      message: "Failed to commit product creation",
                      error: commitErr.message
                    });
                  });
                }

                res.json({
                  success: true,
                  message: "Product added successfully",
                  product_id: productId
                });
              });
            }
          );
        } else {
          db.run("COMMIT", (commitErr) => {
            if (commitErr) {
              return db.run("ROLLBACK", () => {
                return res.status(500).json({
                  success: false,
                  message: "Failed to commit product creation",
                  error: commitErr.message
                });
              });
            }

            res.json({
              success: true,
              message: "Product added successfully",
              product_id: productId
            });
          });
        }
      }
    );
  });
});

// UPDATE PRODUCT
router.put("/:id", (req, res) => {
  const { category, name, variant, unit, price, is_active, min_stock } = req.body;

  const minStock = Number(min_stock ?? 0);

  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid price is required"
    });
  }

  if (isNaN(minStock) || minStock < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid min_stock is required"
    });
  }

  db.run(
    `UPDATE products
     SET category = ?, name = ?, variant = ?, unit = ?, price = ?, is_active = ?, min_stock = ?
     WHERE id = ?`,
    [
      category,
      name,
      variant || null,
      unit,
      Number(price),
      is_active ?? 1,
      minStock,
      req.params.id
    ],
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

// MANUAL STOCK UPDATE
router.put("/:id/stock", (req, res) => {
  const productId = req.params.id;
  const { type, quantity, note } = req.body;

  const qty = Number(quantity);

  if (!type || !["IN", "OUT", "ADJUSTMENT"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "type must be IN, OUT, or ADJUSTMENT"
    });
  }

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid quantity is required"
    });
  }

  db.get(
    `SELECT * FROM products WHERE id = ? AND is_active = 1`,
    [productId],
    (err, product) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch product",
          error: err.message
        });
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found or inactive"
        });
      }

      const oldStock = Number(product.stock || 0);
      let newStock = oldStock;

      if (type === "IN") {
        newStock = oldStock + qty;
      } else if (type === "OUT") {
        if (oldStock < qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock. Available: ${oldStock}, Requested: ${qty}`
          });
        }
        newStock = oldStock - qty;
      } else if (type === "ADJUSTMENT") {
        newStock = qty;
      }

      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(
          `UPDATE products SET stock = ? WHERE id = ?`,
          [newStock, productId],
          function (updateErr) {
            if (updateErr) {
              return db.run("ROLLBACK", () => {
                return res.status(500).json({
                  success: false,
                  message: "Failed to update stock",
                  error: updateErr.message
                });
              });
            }

            let movementQty = qty;

            if (type === "ADJUSTMENT") {
              movementQty = Math.abs(newStock - oldStock);
            }

            db.run(
              `INSERT INTO stock_movements
               (product_id, movement_type, quantity, old_stock, new_stock, note)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                productId,
                type,
                movementQty,
                oldStock,
                newStock,
                note || "Manual stock update"
              ],
              (movementErr) => {
                if (movementErr) {
                  return db.run("ROLLBACK", () => {
                    return res.status(500).json({
                      success: false,
                      message: "Stock updated but failed to save movement",
                      error: movementErr.message
                    });
                  });
                }

                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    return db.run("ROLLBACK", () => {
                      return res.status(500).json({
                        success: false,
                        message: "Failed to commit stock update",
                        error: commitErr.message
                      });
                    });
                  }

                  res.json({
                    success: true,
                    message: "Stock updated successfully",
                    product_id: Number(productId),
                    old_stock: oldStock,
                    new_stock: newStock
                  });
                });
              }
            );
          }
        );
      });
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