const db = require("../database/db");
const { body, validationResult } = require("express-validator");

exports.validateCustomer = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("phone").trim().notEmpty().withMessage("Phone is required").isLength({ min: 10, max: 15 }).withMessage("Invalid phone number"),
  body("address").optional().trim(),
];

exports.validateDue = [
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
  body("reason").optional().trim()
];

exports.getAllCustomers = async (req, res) => {
  try {
    const sql = "SELECT * FROM customers ORDER BY name ASC";
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  const customerId = req.params.id;
  try {
    const customerResult = await db.query("SELECT * FROM customers WHERE id = $1", [customerId]);
    const customer = customerResult.rows[0];
    
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    // Fetch related data in parallel
    const [ordersResult, orderItemsResult, duesResult, notesResult] = await Promise.all([
      db.query("SELECT * FROM orders WHERE customer_id = $1 ORDER BY id DESC", [customerId]),
      db.query("SELECT oi.*, o.order_id as o_ref FROM order_items oi JOIN orders o ON oi.order_id = o.order_id WHERE o.customer_id = $1", [customerId]),
      db.query(`
        SELECT h.*, o.total_amount as order_total, o.paid_amount as order_initial_paid 
        FROM due_history h 
        LEFT JOIN orders o ON h.related_order_id = o.order_id 
        WHERE h.customer_id = $1 
        ORDER BY h.id DESC
      `, [customerId]),
      db.query("SELECT * FROM notes WHERE customer_id = $1 ORDER BY id DESC", [customerId])
    ]);

    const orders = ordersResult.rows || [];
    const orderItems = orderItemsResult.rows || [];
    const dues = duesResult.rows || [];
    const notes = notesResult.rows || [];

    // Calculate Payment Method Statistics
    const paymentStats = { Cash: 0, Online: 0, Cheque: 0 };
    orders.forEach(o => {
      const method = o.payment_method || "Cash";
      if (paymentStats.hasOwnProperty(method)) paymentStats[method]++;
    });

    // Calculate Trust Score (0-100)
    let trustScore = 70; // Base score
    const totalPurchased = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalPaid = orders.reduce((sum, o) => sum + Number(o.paid_amount), 0);
    const outstanding = Number(customer.total_due || 0);

    if (totalPurchased > 0) {
      const payRatio = totalPaid / totalPurchased;
      trustScore = (payRatio * 60) + 20; // 20-80 based on pay ratio
      
      // Penalty for high outstanding relative to purchases
      if (outstanding > (totalPurchased * 0.4)) trustScore -= 25;
      
      // Bonus for volume/loyalty
      if (orders.length > 5) trustScore += 10;
    }

    // Determine Credit Eligibility
    const isReliable = trustScore >= 60 && outstanding < (totalPurchased * 0.5);

    // Reconstruct orders with their items
    const enrichedOrders = (orders || []).map(o => {
      return {
        ...o,
        items: (orderItems || []).filter(item => item.o_ref === o.order_id)
      };
    });

    res.json({
      success: true,
      customer: {
        ...customer,
        trust_score: Math.min(100, Math.max(0, Math.round(trustScore))),
        is_reliable: isReliable,
        payment_stats: paymentStats
      },
      orders: enrichedOrders,
      due_history: dues || [],
      notes: notes || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

exports.createCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, phone, address } = req.body;

  try {
    const sql = "INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3) RETURNING id";
    const result = await db.query(sql, [name, phone, address]);
    res.json({ success: true, message: "Customer added", customerId: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ success: false, message: "Customer phone might already exist", error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, phone, address } = req.body;
  try {
    const sql = "UPDATE customers SET name = $1, phone = $2, address = $3 WHERE id = $4";
    const result = await db.query(sql, [name, phone, address, req.params.id]);
    
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Customer not found" });
    
    res.json({ success: true, message: "Customer updated" });
  } catch (err) {
    res.status(400).json({ success: false, message: "Update failed", error: err.message });
  }
};

exports.addDue = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const customerId = req.params.id;
  const { amount, reason } = req.body;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const customerResult = await client.query("SELECT total_due FROM customers WHERE id = $1", [customerId]);
    const customer = customerResult.rows[0];

    if (!customer) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const newBalance = Number(customer.total_due || 0) + Number(amount);

    await client.query("UPDATE customers SET total_due = $1 WHERE id = $2", [newBalance, customerId]);
    await client.query(
      "INSERT INTO due_history (customer_id, type, amount, balance_after, reason) VALUES ($1, $2, $3, $4, $5)",
      [customerId, "GIVEN_DUE", amount, newBalance, reason || "Manual Due Added"]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Due added successfully", newBalance });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Transaction failed", error: err.message });
  } finally {
    client.release();
  }
};

exports.payDue = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const customerId = req.params.id;
  const { amount, reason } = req.body;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const customerResult = await client.query("SELECT total_due FROM customers WHERE id = $1", [customerId]);
    const customer = customerResult.rows[0];

    if (!customer) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (Number(customer.total_due || 0) < Number(amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Payment amount exceeds total due balance" });
    }

    const newBalance = Number(customer.total_due || 0) - Number(amount);

    await client.query("UPDATE customers SET total_due = $1 WHERE id = $2", [newBalance, customerId]);
    await client.query(
      "INSERT INTO due_history (customer_id, type, amount, balance_after, reason) VALUES ($1, $2, $3, $4, $5)",
      [customerId, "PAID_DUE", amount, newBalance, reason || "Due Payment Received"]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Payment recorded successfully", newBalance });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Transaction failed", error: err.message });
  } finally {
    client.release();
  }
};

exports.deleteCustomer = async (req, res) => {
  const customerId = req.params.id;
  try {
    const result = await db.query("DELETE FROM customers WHERE id = $1", [customerId]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, message: "Customer deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
};

