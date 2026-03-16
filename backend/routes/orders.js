const express = require("express");
const router = express.Router();
const db = require("../database/db");


// GET ALL ORDERS
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      o.id,
      o.order_id,
      o.customer_id,
      c.name AS customer_name,
      c.phone AS customer_phone,
      o.total_amount,
      o.payment_type,
      o.paid_amount,
      o.remaining_amount,
      o.created_at
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: err.message
      });
    }

    res.json({
      success: true,
      orders: rows
    });
  });
});


// GET CUSTOMERS WITH DUE AMOUNT
router.get("/due/customers", (req, res) => {
  const sql = `
    SELECT 
      c.id,
      c.name,
      c.phone,
      SUM(o.remaining_amount) AS total_due
    FROM customers c
    JOIN orders o ON c.id = o.customer_id
    WHERE o.remaining_amount > 0
    GROUP BY c.id
    ORDER BY total_due DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch due customers",
        error: err.message
      });
    }

    res.json({
      success: true,
      customers: rows
    });
  });
});


// GET SINGLE ORDER
router.get("/:order_id", (req, res) => {
  const orderId = req.params.order_id;

  const orderSql = `
    SELECT 
      o.*,
      c.name AS customer_name,
      c.phone AS customer_phone
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.order_id = ?
  `;

  db.get(orderSql, [orderId], (err, order) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const itemsSql = `
      SELECT *
      FROM order_items
      WHERE order_id = ?
    `;

    db.all(itemsSql, [orderId], (itemsErr, items) => {
      if (itemsErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch order items",
          error: itemsErr.message
        });
      }

      const paymentsSql = `
        SELECT *
        FROM payments
        WHERE order_id = ?
      `;

      db.all(paymentsSql, [orderId], (payErr, payments) => {
        if (payErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to fetch payments",
            error: payErr.message
          });
        }

        res.json({
          success: true,
          order,
          items,
          payments
        });
      });
    });
  });
});


// CREATE ORDER WITH STOCK DEDUCTION
router.post("/", (req, res) => {
  const { customer_id, items, paid_amount } = req.body;

  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order data"
    });
  }

  db.get(
    "SELECT * FROM customers WHERE id = ?",
    [customer_id],
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

      const productIds = [...new Set(items.map(item => item.product_id))];

      if (productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid products found in order"
        });
      }

      const placeholders = productIds.map(() => "?").join(",");

      db.all(
        `SELECT * FROM products WHERE id IN (${placeholders}) AND is_active = 1`,
        productIds,
        (productErr, products) => {
          if (productErr) {
            return res.status(500).json({
              success: false,
              message: "Failed to fetch products",
              error: productErr.message
            });
          }

          const productMap = {};
          products.forEach((p) => {
            productMap[p.id] = p;
          });

          let total_amount = 0;
          const preparedItems = [];

          for (const item of items) {
            const product = productMap[item.product_id];
            const quantity = Number(item.quantity);

            if (!product || quantity <= 0) {
              return res.status(400).json({
                success: false,
                message: "Invalid product or quantity"
              });
            }

            const currentStock = Number(product.stock || 0);

            if (currentStock < quantity) {
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${quantity}`
              });
            }

            const price = Number(product.price);
            const line_total = price * quantity;
            total_amount += line_total;

            preparedItems.push({
              product_id: product.id,
              product_name: product.name,
              category: product.category,
              variant: product.variant,
              unit: product.unit,
              quantity,
              price,
              line_total,
              old_stock: currentStock,
              new_stock: currentStock - quantity
            });
          }

          const paid = Number(paid_amount || 0);

          if (paid < 0 || paid > total_amount) {
            return res.status(400).json({
              success: false,
              message: "Invalid paid amount"
            });
          }

          const remaining_amount = total_amount - paid;
          const payment_type = remaining_amount === 0 ? "paid" : "partial";
          const order_id = "ORD-" + Date.now();

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

              db.run(
                `INSERT INTO orders 
                 (order_id, customer_id, total_amount, payment_type, paid_amount, remaining_amount)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  order_id,
                  customer_id,
                  total_amount,
                  payment_type,
                  paid,
                  remaining_amount
                ],
                function (orderErr) {
                  if (orderErr) {
                    return rollbackWithError("Failed to create order", orderErr);
                  }

                  const insertOrderItemAndUpdateStock = (index) => {
                    if (index >= preparedItems.length) {
                      if (paid > 0) {
                        db.run(
                          `INSERT INTO payments (order_id, amount) VALUES (?, ?)`,
                          [order_id, paid],
                          (paymentErr) => {
                            if (paymentErr) {
                              return rollbackWithError("Failed to save payment", paymentErr);
                            }

                            db.run("COMMIT", (commitErr) => {
                              if (commitErr) {
                                return rollbackWithError("Failed to commit order", commitErr);
                              }

                              if (!responseSent) {
                                responseSent = true;
                                return res.json({
                                  success: true,
                                  message: "Order created successfully",
                                  order_id,
                                  total_amount,
                                  paid_amount: paid,
                                  remaining_amount
                                });
                              }
                            });
                          }
                        );
                      } else {
                        db.run("COMMIT", (commitErr) => {
                          if (commitErr) {
                            return rollbackWithError("Failed to commit order", commitErr);
                          }

                          if (!responseSent) {
                            responseSent = true;
                            return res.json({
                              success: true,
                              message: "Order created successfully",
                              order_id,
                              total_amount,
                              paid_amount: paid,
                              remaining_amount
                            });
                          }
                        });
                      }

                      return;
                    }

                    const item = preparedItems[index];

                    db.run(
                      `INSERT INTO order_items
                       (order_id, product_id, product_name, category, variant, unit, quantity, price, line_total)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        order_id,
                        item.product_id,
                        item.product_name,
                        item.category,
                        item.variant,
                        item.unit,
                        item.quantity,
                        item.price,
                        item.line_total
                      ],
                      function (itemErr) {
                        if (itemErr) {
                          return rollbackWithError("Failed to save order items", itemErr);
                        }

                        db.run(
                          `UPDATE products
                           SET stock = stock - ?
                           WHERE id = ? AND stock >= ?`,
                          [item.quantity, item.product_id, item.quantity],
                          function (stockErr) {
                            if (stockErr) {
                              return rollbackWithError("Failed to update stock", stockErr);
                            }

                            if (this.changes === 0) {
                              return rollbackWithError(
                                `Insufficient stock for ${item.product_name}`,
                                null,
                                400
                              );
                            }

                            db.run(
                              `INSERT INTO stock_movements
                               (product_id, movement_type, quantity, old_stock, new_stock, note, ref_order_id)
                               VALUES (?, ?, ?, ?, ?, ?, ?)`,
                              [
                                item.product_id,
                                "SALE",
                                item.quantity,
                                item.old_stock,
                                item.new_stock,
                                "Stock reduced on sale",
                                order_id
                              ],
                              (movementErr) => {
                                if (movementErr) {
                                  return rollbackWithError("Failed to record stock movement", movementErr);
                                }

                                insertOrderItemAndUpdateStock(index + 1);
                              }
                            );
                          }
                        );
                      }
                    );
                  };

                  insertOrderItemAndUpdateStock(0);
                }
              );
            });
          });
        }
      );
    }
  );
});


// RECEIVE PAYMENT FOR EXISTING ORDER
router.post("/:order_id/pay", (req, res) => {
  const orderId = req.params.order_id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment amount"
    });
  }

  db.get(
    "SELECT * FROM orders WHERE order_id = ?",
    [orderId],
    (err, order) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      const newPaid = Number(order.paid_amount) + Number(amount);
      const remaining = Number(order.total_amount) - newPaid;

      if (remaining < 0) {
        return res.status(400).json({
          success: false,
          message: "Payment exceeds remaining amount"
        });
      }

      const paymentType = remaining === 0 ? "paid" : "partial";

      db.run(
        "INSERT INTO payments (order_id, amount) VALUES (?, ?)",
        [orderId, amount],
        (payErr) => {
          if (payErr) {
            return res.status(500).json({
              success: false,
              message: "Failed to record payment",
              error: payErr.message
            });
          }

          db.run(
            `UPDATE orders 
             SET paid_amount = ?, remaining_amount = ?, payment_type = ?
             WHERE order_id = ?`,
            [newPaid, remaining, paymentType, orderId],
            function (updateErr) {
              if (updateErr) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to update order",
                  error: updateErr.message
                });
              }

              res.json({
                success: true,
                message: "Payment received successfully",
                paid_amount: newPaid,
                remaining_amount: remaining
              });
            }
          );
        }
      );
    }
  );
});


// RESET STORE DATA (ADMIN)
router.delete("/reset/all", (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM stock_movements");
    db.run("DELETE FROM payments");
    db.run("DELETE FROM order_items");
    db.run("DELETE FROM orders");
    db.run("DELETE FROM customers");

    res.json({
      success: true,
      message: "All store data cleared"
    });
  });
});

module.exports = router;