const express = require("express");
const router = express.Router();
const db = require("../database/db");

console.log("Products route loaded");

// GET ALL ACTIVE PRODUCTS
router.get("/", async (req, res) => {
  try {
    const sql = "SELECT * FROM products WHERE is_active = 1 ORDER BY category, name, variant";
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch products", error: err.message });
  }
});

// GET LOW STOCK PRODUCTS
router.get("/low-stock", async (req, res) => {
  try {
    const sql = `
      SELECT * 
      FROM products
      WHERE is_active = 1 AND stock <= min_stock
      ORDER BY stock ASC, category, name, variant
    `;
    const result = await db.query(sql);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch low stock products", error: err.message });
  }
});

// GET STOCK HISTORY FOR A PRODUCT
router.get("/:id/stock-history", async (req, res) => {
  try {
    const sql = "SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY id DESC";
    const result = await db.query(sql, [req.params.id]);
    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch stock history", error: err.message });
  }
});

// ADD PRODUCT
router.post("/", async (req, res) => {
  const { category, name, variant, unit, price, stock, min_stock } = req.body;

  const openingStock = Number(stock || 0);
  const minStock = Number(min_stock || 0);

  if (!category || !name || !unit || price === undefined || price === null) {
    return res.status(400).json({ success: false, message: "category, name, unit and price are required" });
  }

  if (isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ success: false, message: "Valid price is required" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const sql = `
      INSERT INTO products (category, name, variant, unit, price, stock, min_stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `;
    const result = await client.query(sql, [category, name, variant || null, unit, Number(price), openingStock, minStock]);
    const productId = result.rows[0].id;

    if (openingStock > 0) {
      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, old_stock, new_stock, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [productId, "IN", openingStock, 0, openingStock, "Opening stock added while creating product"]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Product added successfully", product_id: productId });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Failed to add product", error: err.message });
  } finally {
    client.release();
  }
});

// UPDATE PRODUCT
router.put("/:id", async (req, res) => {
  const { category, name, variant, unit, price, is_active, min_stock } = req.body;
  const minStock = Number(min_stock ?? 0);

  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ success: false, message: "Valid price is required" });
  }

  try {
    const sql = `
      UPDATE products
      SET category = $1, name = $2, variant = $3, unit = $4, price = $5, is_active = $6, min_stock = $7
      WHERE id = $8
    `;
    const result = await db.query(sql, [category, name, variant || null, unit, Number(price), is_active ?? 1, minStock, req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update product", error: err.message });
  }
});

// UPDATE ONLY PRODUCT PRICE
router.put("/:id/price", async (req, res) => {
  const { price } = req.body;

  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    return res.status(400).json({ success: false, message: "Valid price is required" });
  }

  try {
    const sql = "UPDATE products SET price = $1 WHERE id = $2 AND is_active = 1";
    const result = await db.query(sql, [Number(price), req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found or inactive" });
    }

    const updatedProduct = await db.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Price updated successfully", product: updatedProduct.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update price", error: err.message });
  }
});

// MANUAL STOCK UPDATE
router.put("/:id/stock", async (req, res) => {
  const productId = req.params.id;
  const { type, quantity, note } = req.body;
  const qty = Number(quantity);

  if (!type || !["IN", "OUT", "ADJUSTMENT"].includes(type)) {
    return res.status(400).json({ success: false, message: "type must be IN, OUT, or ADJUSTMENT" });
  }

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: "Valid quantity is required" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const productResult = await client.query("SELECT * FROM products WHERE id = $1 AND is_active = 1", [productId]);
    const product = productResult.rows[0];

    if (!product) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Product not found or inactive" });
    }

    const oldStock = Number(product.stock || 0);
    let newStock = oldStock;

    if (type === "IN") {
      newStock = oldStock + qty;
    } else if (type === "OUT") {
      if (oldStock < qty) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${oldStock}, Requested: ${qty}` });
      }
      newStock = oldStock - qty;
    } else if (type === "ADJUSTMENT") {
      newStock = qty;
    }

    await client.query("UPDATE products SET stock = $1 WHERE id = $2", [newStock, productId]);

    let movementQty = qty;
    if (type === "ADJUSTMENT") {
      movementQty = Math.abs(newStock - oldStock);
    }

    await client.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, old_stock, new_stock, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [productId, type, movementQty, oldStock, newStock, note || "Manual stock update"]
    );

    await client.query("COMMIT");
    res.json({
      success: true,
      message: "Stock updated successfully",
      product_id: Number(productId),
      old_stock: oldStock,
      new_stock: newStock
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Failed to update stock", error: err.message });
  } finally {
    client.release();
  }
});

// DEACTIVATE PRODUCT
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query("UPDATE products SET is_active = 0 WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Product deactivated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete product", error: err.message });
  }
});

module.exports = router;