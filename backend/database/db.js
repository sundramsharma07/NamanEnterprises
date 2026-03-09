const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "store.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log("Database connection error:", err);
  } else {
    console.log("SQLite Connected");

    db.run("PRAGMA foreign_keys = ON");
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA synchronous = FULL");

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT UNIQUE,
        phone TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT UNIQUE,
        address TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        variant TEXT,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        is_active INTEGER DEFAULT 1
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE,
        customer_id INTEGER,
        total_amount REAL,
        payment_type TEXT,
        paid_amount REAL,
        remaining_amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT,
        product_id INTEGER,
        product_name TEXT,
        category TEXT,
        variant TEXT,
        unit TEXT,
        quantity REAL,
        price REAL,
        line_total REAL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT,
        amount REAL,
        paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
      )
    `);

    db.all(`PRAGMA table_info(order_items)`, [], (tableErr, columns) => {
      if (tableErr) {
        console.log("Failed to inspect order_items table:", tableErr.message);
        return;
      }

      const columnNames = columns.map((col) => col.name);

      const addColumnIfMissing = (columnName, columnType) => {
        if (!columnNames.includes(columnName)) {
          db.run(
            `ALTER TABLE order_items ADD COLUMN ${columnName} ${columnType}`,
            (alterErr) => {
              if (alterErr) {
                console.log(`Failed to add ${columnName}:`, alterErr.message);
              } else {
                console.log(`${columnName} column added to order_items table`);
              }
            }
          );
        } else {
          console.log(`${columnName} column already exists in order_items table`);
        }
      };

      addColumnIfMissing("product_id", "INTEGER");
      addColumnIfMissing("product_name", "TEXT");
      addColumnIfMissing("category", "TEXT");
      addColumnIfMissing("variant", "TEXT");
      addColumnIfMissing("unit", "TEXT");
      addColumnIfMissing("quantity", "REAL");
      addColumnIfMissing("price", "REAL");
      addColumnIfMissing("line_total", "REAL");
    });
  }
});

module.exports = db;