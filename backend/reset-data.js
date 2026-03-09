const db = require("./database/db");

db.serialize(() => {
  db.run("PRAGMA foreign_keys = OFF");

  db.run("DELETE FROM payments", (err) => {
    if (err) console.log("Error deleting payments:", err.message);
    else console.log("Payments cleared");
  });

  db.run("DELETE FROM order_items", (err) => {
    if (err) console.log("Error deleting order_items:", err.message);
    else console.log("Order items cleared");
  });

  db.run("DELETE FROM orders", (err) => {
    if (err) console.log("Error deleting orders:", err.message);
    else console.log("Orders cleared");
  });

  db.run("DELETE FROM customers", (err) => {
    if (err) console.log("Error deleting customers:", err.message);
    else console.log("Customers cleared");
  });

  db.run("PRAGMA foreign_keys = ON");

  console.log("Reset completed");
});

setTimeout(() => process.exit(), 1000);