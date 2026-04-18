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

// GET CUSTOMER BY ID (Full Profile including ledger, notes, etc.)
const customerController = require("../controllers/customerController");
router.get("/:id", customerController.getCustomerById);

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

// DELETE CUSTOMER WITH STOCK RESTORE
router.delete("/:id", (req, res) => {
  const customerId = req.params.id;

  db.get(
    "SELECT * FROM customers WHERE id = ?",
    [customerId],
    (customerErr, customer) => {
      if (customerErr) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: customerErr.message
        });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found"
        });
      }

      db.all(
        "SELECT order_id FROM orders WHERE customer_id = ?",
        [customerId],
        (ordersErr, orders) => {
          if (ordersErr) {
            return res.status(500).json({
              success: false,
              message: "Failed to fetch customer orders",
              error: ordersErr.message
            });
          }

          db.serialize(() => {
            let responseSent = false;

            const rollbackWithError = (message, errObj = null, statusCode = 500) => {
              db.run("ROLLBACK", () => {
                if (!responseSent) {
                  responseSent = true;
                  return res.status(statusCode).json({
                    success: false,
                    message,
                    error: errObj ? errObj.message : undefined
                  });
                }
              });
            };

            db.run("BEGIN TRANSACTION", (beginErr) => {
              if (beginErr) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to start transaction",
                  error: beginErr.message
                });
              }

              const restoreStockForOrders = (orderIndex) => {
                if (orderIndex >= orders.length) {
                  return deleteCustomerData();
                }

                const orderId = orders[orderIndex].order_id;

                db.all(
                  "SELECT * FROM order_items WHERE order_id = ?",
                  [orderId],
                  (itemsErr, items) => {
                    if (itemsErr) {
                      return rollbackWithError("Failed to fetch order items", itemsErr);
                    }

                    const processItems = (itemIndex) => {
                      if (itemIndex >= items.length) {
                        return restoreStockForOrders(orderIndex + 1);
                      }

                      const item = items[itemIndex];

                      db.get(
                        "SELECT stock, name FROM products WHERE id = ?",
                        [item.product_id],
                        (productErr, product) => {
                          if (productErr) {
                            return rollbackWithError("Failed to fetch product stock", productErr);
                          }

                          if (!product) {
                            return rollbackWithError(
                              `Product not found for stock restore: ${item.product_id}`,
                              null,
                              400
                            );
                          }

                          const oldStock = Number(product.stock || 0);
                          const restoreQty = Number(item.quantity || 0);
                          const newStock = oldStock + restoreQty;

                          db.run(
                            `UPDATE products SET stock = ? WHERE id = ?`,
                            [newStock, item.product_id],
                            function (updateErr) {
                              if (updateErr) {
                                return rollbackWithError("Failed to restore stock", updateErr);
                              }

                              db.run(
                                `INSERT INTO stock_movements
                                 (product_id, movement_type, quantity, old_stock, new_stock, note, ref_order_id)
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [
                                  item.product_id,
                                  "RETURN",
                                  restoreQty,
                                  oldStock,
                                  newStock,
                                  "Stock restored due to customer deletion",
                                  orderId
                                ],
                                (movementErr) => {
                                  if (movementErr) {
                                    return rollbackWithError(
                                      "Failed to record stock movement",
                                      movementErr
                                    );
                                  }

                                  processItems(itemIndex + 1);
                                }
                              );
                            }
                          );
                        }
                      );
                    };

                    processItems(0);
                  }
                );
              };

              const deleteCustomerData = () => {
                db.run(
                  "DELETE FROM payments WHERE order_id IN (SELECT order_id FROM orders WHERE customer_id = ?)",
                  [customerId],
                  (paymentsErr) => {
                    if (paymentsErr) {
                      return rollbackWithError("Failed to delete payments", paymentsErr);
                    }

                    db.run(
                      "DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE customer_id = ?)",
                      [customerId],
                      (itemsDeleteErr) => {
                        if (itemsDeleteErr) {
                          return rollbackWithError("Failed to delete order items", itemsDeleteErr);
                        }

                        db.run(
                          "DELETE FROM orders WHERE customer_id = ?",
                          [customerId],
                          (ordersDeleteErr) => {
                            if (ordersDeleteErr) {
                              return rollbackWithError("Failed to delete orders", ordersDeleteErr);
                            }

                            db.run(
                              "DELETE FROM customers WHERE id = ?",
                              [customerId],
                              function (customerDeleteErr) {
                                if (customerDeleteErr) {
                                  return rollbackWithError(
                                    "Failed to delete customer",
                                    customerDeleteErr
                                  );
                                }

                                if (this.changes === 0) {
                                  return rollbackWithError(
                                    "Customer not found during delete",
                                    null,
                                    404
                                  );
                                }

                                db.run("COMMIT", (commitErr) => {
                                  if (commitErr) {
                                    return rollbackWithError(
                                      "Failed to commit customer deletion",
                                      commitErr
                                    );
                                  }

                                  if (!responseSent) {
                                    responseSent = true;
                                    return res.json({
                                      success: true,
                                      message: "Customer deleted and stock restored successfully"
                                    });
                                  }
                                });
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              };

              restoreStockForOrders(0);
            });
          });
        }
      );
    }
  );
});

// DUE ROUTING AND CONTROLLERS
const notesController = require("../controllers/notesController");

router.post("/:id/due", customerController.validateDue, customerController.addDue);
router.post("/:id/pay-due", customerController.validateDue, customerController.payDue);

router.get("/:id/notes", notesController.getCustomerNotes);
router.post("/:id/notes", notesController.validateNote, notesController.addNote);

router.delete("/notes/:note_id", notesController.deleteNote);

module.exports = router;