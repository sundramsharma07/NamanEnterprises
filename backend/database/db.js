const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.SQLITE_PATH
  ? path.join(__dirname, '../', process.env.SQLITE_PATH)
  : path.join(__dirname, "store.db");

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

    // NEW TABLE FOR NOTES
    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    // NEW TABLE FOR DUE HISTORY
    db.run(`
      CREATE TABLE IF NOT EXISTS due_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- GIVEN_DUE, PAID_DUE
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        reason TEXT,
        related_order_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (related_order_id) REFERENCES orders(order_id) ON DELETE SET NULL
      )
    `);

    // NEW TABLE FOR STOCK HISTORY
    db.run(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL, -- IN, OUT, SALE, RETURN, ADJUSTMENT
        quantity REAL NOT NULL,
        old_stock REAL NOT NULL,
        new_stock REAL NOT NULL,
        note TEXT,
        ref_order_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (ref_order_id) REFERENCES orders(order_id) ON DELETE SET NULL
      )
    `);

    const checkAndAddColumn = (tableName, columnName, columnType) => {
      db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
        if (err) {
          console.log(`Failed to inspect ${tableName} table:`, err.message);
          return;
        }
        const columnNames = columns.map((col) => col.name);
        if (!columnNames.includes(columnName)) {
          db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`, (alterErr) => {
            if (alterErr) {
              console.log(`Failed to add ${columnName} to ${tableName}:`, alterErr.message);
            } else {
              console.log(`${columnName} column added to ${tableName} table`);
            }
          });
        }
      });
    };

    // Migrations for existing tables
    checkAndAddColumn("products", "stock", "REAL NOT NULL DEFAULT 0");
    checkAndAddColumn("products", "min_stock", "REAL NOT NULL DEFAULT 0");
    
    checkAndAddColumn("order_items", "product_id", "INTEGER");
    checkAndAddColumn("order_items", "product_name", "TEXT");
    checkAndAddColumn("order_items", "category", "TEXT");
    checkAndAddColumn("order_items", "variant", "TEXT");
    checkAndAddColumn("order_items", "unit", "TEXT");
    checkAndAddColumn("order_items", "quantity", "REAL");
    checkAndAddColumn("order_items", "price", "REAL");
    checkAndAddColumn("order_items", "line_total", "REAL");

    checkAndAddColumn("payments", "payment_method", "TEXT");
    checkAndAddColumn("payments", "payment_type", "TEXT");
    checkAndAddColumn("payments", "notes", "TEXT");
    
    checkAndAddColumn("customers", "total_due", "REAL DEFAULT 0");
  }
});

module.exports = db;