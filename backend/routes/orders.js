const express = require("express");
const router = express.Router();
const db = require("../database/db");

// GET ACTIVITY LOGS FOR DASHBOARD PULSE
router.get("/activity-logs", async (req, res) => {
  try {
    const sql = `
      SELECT 
        h.*, 
        c.name AS customer_name,
        o.order_id
      FROM due_history h
      JOIN customers c ON h.customer_id = c.id
      LEFT JOIN orders o ON h.related_order_id = o.order_id
      ORDER BY h.created_at DESC
      LIMIT 20
    `;
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch activity logs", error: err.message });
  }
});

// GET ALL ORDERS
router.get("/", async (req, res) => {
  try {
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
    const result = await db.query(sql);
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders", error: err.message });
  }
});

// GET CUSTOMERS WITH DUE AMOUNT
router.get("/due/customers", async (req, res) => {
  try {
    const sql = `
      WITH LatestOrders AS (
        SELECT 
          customer_id, 
          order_id, 
          total_amount, 
          paid_amount, 
          remaining_amount,
          created_at,
          ROW_NUMBER() OVER(PARTITION BY customer_id ORDER BY created_at DESC) as rn
        FROM orders
        WHERE remaining_amount > 0
      )
      SELECT 
        c.id,
        c.name,
        c.phone,
        SUM(o.total_amount) AS total_purchase,
        SUM(o.paid_amount) AS total_deposited,
        SUM(o.remaining_amount) AS total_due,
        MIN(o.created_at) AS oldest_due_date,
        lo.order_id as latest_order_id,
        lo.total_amount as latest_order_total,
        lo.paid_amount as latest_order_paid,
        lo.remaining_amount as latest_order_remaining,
        lo.created_at as latest_order_date
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      LEFT JOIN LatestOrders lo ON c.id = lo.customer_id AND lo.rn = 1
      WHERE o.remaining_amount > 0
      GROUP BY c.id, c.name, c.phone, lo.order_id, lo.total_amount, lo.paid_amount, lo.remaining_amount, lo.created_at
      ORDER BY total_due DESC
    `;
    const result = await db.query(sql);
    res.json({ success: true, customers: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch due customers", error: err.message });
  }
});

// GET SINGLE ORDER
router.get("/:order_id", async (req, res) => {
  const orderId = req.params.order_id;
  try {
    const orderSql = `
      SELECT 
        o.*,
        c.name AS customer_name,
        c.phone AS customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_id = $1
    `;
    const orderResult = await db.query(orderSql, [orderId]);
    const order = orderResult.rows[0];

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const itemsSql = "SELECT * FROM order_items WHERE order_id = $1";
    const paymentsSql = "SELECT * FROM payments WHERE order_id = $1";

    const [itemsResult, paymentsResult] = await Promise.all([
      db.query(itemsSql, [orderId]),
      db.query(paymentsSql, [orderId])
    ]);

    res.json({
      success: true,
      order,
      items: itemsResult.rows,
      payments: paymentsResult.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
});

// CREATE ORDER WITH STOCK DEDUCTION
router.post("/", async (req, res) => {
  const { customer_id, items, paid_amount, payment_method } = req.body;

  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid order data" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const customerResult = await client.query("SELECT * FROM customers WHERE id = $1", [customer_id]);
    const customer = customerResult.rows[0];

    if (!customer) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const productIds = [...new Set(items.map(item => item.product_id))];
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(",");
    const productsResult = await client.query(`SELECT * FROM products WHERE id IN (${placeholders}) AND is_active = 1`, productIds);
    const products = productsResult.rows;

    const productMap = {};
    products.forEach((p) => { productMap[p.id] = p; });

    let total_amount = 0;
    const preparedItems = [];

    for (const item of items) {
      const product = productMap[item.product_id];
      const quantity = Number(item.quantity);

      if (!product || quantity <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: `Invalid product or quantity for ID: ${item.product_id}` });
      }

      const currentStock = Number(product.stock || 0);
      if (currentStock < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${quantity}` });
      }

      const price = Number(product.price);
      const line_total = price * quantity;
      total_amount += line_total;

      preparedItems.push({
        ...item,
        product_name: product.name,
        category: product.category,
        variant: product.variant,
        unit: product.unit,
        price,
        line_total,
        old_stock: currentStock,
        new_stock: currentStock - quantity
      });
    }

    const paid = Number(paid_amount || 0);
    if (paid < 0 || paid > total_amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Invalid paid amount" });
    }

    const remaining_amount = total_amount - paid;
    const payment_type = remaining_amount === 0 ? "paid" : "partial";
    const method = payment_method || "Cash";
    const order_id = "ORD-" + Date.now();

    await client.query(
      `INSERT INTO orders (order_id, customer_id, total_amount, payment_type, paid_amount, remaining_amount, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [order_id, customer_id, total_amount, payment_type, paid, remaining_amount, method]
    );

    for (const item of preparedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, category, variant, unit, quantity, price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [order_id, item.product_id, item.product_name, item.category, item.variant, item.unit, item.quantity, item.price, item.line_total]
      );

      const stockUpdate = await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1",
        [item.quantity, item.product_id]
      );

      if (stockUpdate.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product_name} (concurrent update)` });
      }

      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, old_stock, new_stock, note, ref_order_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [item.product_id, "SALE", item.quantity, item.old_stock, item.new_stock, "Stock reduced on sale", order_id]
      );
    }

    // 1. Record the full purchase as a due added
    const balanceAfterPurchase = Number(customer.total_due || 0) + total_amount;
    await client.query(
      "INSERT INTO due_history (customer_id, type, amount, balance_after, reason, related_order_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [customer_id, "GIVEN_DUE", total_amount, balanceAfterPurchase, `Purchased items (Order ${order_id})`, order_id]
    );

    // 2. If there's an initial payment, record it as a payment received
    const finalBalance = balanceAfterPurchase - paid;
    if (paid > 0) {
      await client.query(
        "INSERT INTO due_history (customer_id, type, amount, balance_after, reason, related_order_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [customer_id, "PAID_DUE", paid, finalBalance, `Initial payment for Order ${order_id}`, order_id]
      );
    }

    // Update the customer's cached total_due
    await client.query("UPDATE customers SET total_due = $1 WHERE id = $2", [finalBalance, customer_id]);

    if (paid > 0) {
      await client.query("INSERT INTO payments (order_id, amount, payment_method) VALUES ($1, $2, $3)", [order_id, paid, method]);
    }

    await client.query("COMMIT");
    res.json({
      success: true,
      message: "Order created successfully",
      order_id,
      total_amount,
      paid_amount: paid,
      remaining_amount
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Failed to create order", error: err.message });
  } finally {
    client.release();
  }
});

// RECEIVE PAYMENT FOR EXISTING ORDER
router.post("/:order_id/pay", async (req, res) => {
  const orderId = req.params.order_id;
  const { amount, payment_method } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid payment amount" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      "SELECT o.*, c.id as cust_id, c.total_due FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.order_id = $1",
      [orderId]
    );
    const order = orderResult.rows[0];

    if (!order) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const newPaid = Number(order.paid_amount) + Number(amount);
    const remaining = Number(order.total_amount) - newPaid;

    if (remaining < 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Payment exceeds remaining amount" });
    }

    const paymentType = remaining === 0 ? "paid" : "partial";
    const newCustomerDue = Number(order.total_due || 0) - Number(amount);
    const method = payment_method || "Cash";

    await client.query("INSERT INTO payments (order_id, amount, payment_method) VALUES ($1, $2, $3)", [orderId, amount, method]);
    await client.query(
      "UPDATE orders SET paid_amount = $1, remaining_amount = $2, payment_type = $3 WHERE order_id = $4",
      [newPaid, remaining, paymentType, orderId]
    );
    await client.query("UPDATE customers SET total_due = $1 WHERE id = $2", [newCustomerDue, order.cust_id]);
    await client.query(
      "INSERT INTO due_history (customer_id, type, amount, balance_after, reason, related_order_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [order.cust_id, "PAID_DUE", amount, newCustomerDue, `Payment received for Order ${orderId}`, orderId]
    );

    await client.query("COMMIT");
    res.json({
      success: true,
      message: "Payment received successfully",
      paid_amount: newPaid,
      remaining_amount: remaining
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Transaction failed", error: err.message });
  } finally {
    client.release();
  }
});

// RESET STORE DATA (ADMIN)
router.delete("/reset/all", async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM stock_movements");
    await client.query("DELETE FROM payments");
    await client.query("DELETE FROM order_items");
    await client.query("DELETE FROM orders");
    await client.query("DELETE FROM customers");
    await client.query("COMMIT");
    res.json({ success: true, message: "All store data cleared" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Failed to reset data", error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;