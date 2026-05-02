require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Pool } = require("pg");

let connectionString = process.env.DATABASE_URL || "";
if (connectionString.includes("sslmode=require") && !connectionString.includes("uselibpqcompat=1")) {
  connectionString += connectionString.includes("?") ? "&uselibpqcompat=1" : "?uselibpqcompat=1";
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  // Add some basic pool configuration for stability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

if (!process.env.DATABASE_URL) {
  console.error("CRITICAL: DATABASE_URL is not defined in environment variables!");
}

const initializeDatabase = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log("Successfully connected to Neon PostgreSQL");

    // Table creation logic
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT UNIQUE,
        phone TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT,
        phone TEXT UNIQUE,
        address TEXT,
        total_due NUMERIC(15,2) DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        variant TEXT,
        unit TEXT NOT NULL,
        price NUMERIC(15,2) NOT NULL,
        is_active INTEGER DEFAULT 1,
        stock NUMERIC(15,2) NOT NULL DEFAULT 0,
        min_stock NUMERIC(15,2) NOT NULL DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id TEXT UNIQUE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        total_amount NUMERIC(15,2),
        payment_type TEXT,
        payment_method TEXT DEFAULT 'Cash',
        paid_amount NUMERIC(15,2),
        remaining_amount NUMERIC(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure payment_method column exists in orders table
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
          ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Cash';
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT REFERENCES orders(order_id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name TEXT,
        category TEXT,
        variant TEXT,
        unit TEXT,
        quantity NUMERIC(15,2),
        price NUMERIC(15,2),
        line_total NUMERIC(15,2)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id TEXT REFERENCES orders(order_id) ON DELETE CASCADE,
        amount NUMERIC(15,2),
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method TEXT,
        payment_type TEXT,
        notes TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS due_history (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        balance_after NUMERIC(15,2) NOT NULL,
        reason TEXT,
        related_order_id TEXT REFERENCES orders(order_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        movement_type TEXT NOT NULL,
        quantity NUMERIC(15,2) NOT NULL,
        old_stock NUMERIC(15,2) NOT NULL,
        new_stock NUMERIC(15,2) NOT NULL,
        note TEXT,
        ref_order_id TEXT REFERENCES orders(order_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database tables verified/initialized successfully");
  } catch (err) {
    console.error("Database initialization error:", err.message);
    // Don't throw the error, just log it. The app might still work for other routes or retry later.
  } finally {
    if (client) client.release();
  }
};

// Initialize on load
initializeDatabase();

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  pool
};
