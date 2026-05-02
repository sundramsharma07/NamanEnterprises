const db = require("./database/db");

async function resetData() {
  try {
    // In PostgreSQL, TRUNCATE with CASCADE is efficient for clearing tables with foreign key relations
    await db.query("TRUNCATE payments, order_items, orders, customers, due_history, stock_movements, customer_notes RESTART IDENTITY CASCADE");
    console.log("All data cleared successfully (payments, order_items, orders, customers, etc.)");
    console.log("Reset completed");
    process.exit(0);
  } catch (err) {
    console.error("Error resetting data:", err.message);
    process.exit(1);
  }
}

resetData();