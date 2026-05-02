const express = require("express");
const router = express.Router();
const db = require("../database/db");

console.log("Customers route loaded");

// GET ALL CUSTOMERS
router.get("/", async (req, res) => {
  try {
    const sql = "SELECT * FROM customers";
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// SEARCH CUSTOMER BY PHONE
router.get("/phone/:phone", async (req, res) => {
  try {
    const sql = "SELECT * FROM customers WHERE phone = $1";
    const result = await db.query(sql, [req.params.phone]);
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json(row);
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// GET CUSTOMER BY ID (Full Profile including ledger, notes, etc.)
const customerController = require("../controllers/customerController");
router.get("/:id", customerController.getCustomerById);

// ADD CUSTOMER
router.post("/", async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    const sql = "INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3) RETURNING id";
    const result = await db.query(sql, [name, phone, address]);
    res.json({ success: true, message: "Customer added", customerId: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ success: false, message: "Customer already exists or invalid data" });
  }
});

// UPDATE CUSTOMER
router.put("/:id", async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    const sql = "UPDATE customers SET name = $1, phone = $2, address = $3 WHERE id = $4";
    const result = await db.query(sql, [name, phone, address, req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, message: "Customer updated" });
  } catch (err) {
    res.status(400).json({ success: false, message: "Update failed" });
  }
});

// DELETE CUSTOMER WITH STOCK RESTORE
router.delete("/:id", async (req, res) => {
  const customerId = req.params.id;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const customerResult = await client.query("SELECT * FROM customers WHERE id = $1", [customerId]);
    const customer = customerResult.rows[0];

    if (!customer) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const ordersResult = await client.query("SELECT order_id FROM orders WHERE customer_id = $1", [customerId]);
    const orders = ordersResult.rows;

    for (const order of orders) {
      const itemsResult = await client.query("SELECT * FROM order_items WHERE order_id = $1", [order.order_id]);
      const items = itemsResult.rows;

      for (const item of items) {
        const productResult = await client.query("SELECT stock, name FROM products WHERE id = $1", [item.product_id]);
        const product = productResult.rows[0];

        if (product) {
          const oldStock = Number(product.stock || 0);
          const restoreQty = Number(item.quantity || 0);
          const newStock = oldStock + restoreQty;

          await client.query("UPDATE products SET stock = $1 WHERE id = $2", [newStock, item.product_id]);
          await client.query(
            "INSERT INTO stock_movements (product_id, movement_type, quantity, old_stock, new_stock, note, ref_order_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [item.product_id, "RETURN", restoreQty, oldStock, newStock, "Stock restored due to customer deletion", order.order_id]
          );
        }
      }
    }

    // Cascade delete handles order_items and payments if configured, but let's be explicit if needed.
    // In our schema, we have ON DELETE CASCADE for orders -> order_items, payments.
    // And customers -> orders.
    // So deleting customer should be enough.
    const deleteResult = await client.query("DELETE FROM customers WHERE id = $1", [customerId]);
    
    if (deleteResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Customer not found during delete" });
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Customer deleted and stock restored successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  } finally {
    client.release();
  }
});

// DUE ROUTING AND CONTROLLERS
const notesController = require("../controllers/notesController");

router.post("/:id/due", customerController.validateDue, customerController.addDue);
router.post("/:id/pay-due", customerController.validateDue, customerController.payDue);

router.get("/:id/notes", notesController.getCustomerNotes);
router.post("/:id/notes", notesController.validateNote, notesController.addNote);

router.delete("/notes/:note_id", notesController.deleteNote);

module.exports = router;