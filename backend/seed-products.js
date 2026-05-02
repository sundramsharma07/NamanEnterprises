const db = require("./database/db");

const products = [

  // Cement
  { category: "Cement", name: "Bangur", variant: "Per Bag", unit: "bag", price: 0 },
  { category: "Cement", name: "Jung Rodhak", variant: "Per Bag", unit: "bag", price: 0 },
  { category: "Cement", name: "Dalmia", variant: "Per Bag", unit: "bag", price: 0 },
  { category: "Cement", name: "Concreto", variant: "Per Bag", unit: "bag", price: 0 },
  { category: "Cement", name: "JSW", variant: "Per Bag", unit: "bag", price: 0 },
  { category: "Cement", name: "JSW HD", variant: "Per Bag", unit: "bag", price: 0 },

  // Rod
  { category: "Rod", name: "Magadh", variant: "6mm", unit: "piece", price: 0 },
  { category: "Rod", name: "Magadh", variant: "8mm", unit: "piece", price: 0 },
  { category: "Rod", name: "Magadh", variant: "10mm", unit: "piece", price: 0 },
  { category: "Rod", name: "Magadh", variant: "12mm", unit: "piece", price: 0 },
  { category: "Rod", name: "Magadh", variant: "16mm", unit: "piece", price: 0 },

  // Other Materials
  { category: "Sand", name: "Sand", variant: "Per Trailer", unit: "trailer", price: 0 },
  { category: "Stone Chips", name: "Stone Chips", variant: "Per Trailer", unit: "trailer", price: 0 },
  { category: "Chemical", name: "Chemical", variant: "Per Ltr", unit: "ltr", price: 0 },
  { category: "Blocks", name: "Blocks", variant: "Per Packet (100 pcs)", unit: "packet", price: 0 }

];

async function seed() {
  try {
    await db.query("DELETE FROM products");
    console.log("Old products cleared");

    for (const p of products) {
      await db.query(
        "INSERT INTO products (category, name, variant, unit, price, is_active) VALUES ($1, $2, $3, $4, $5, 1)",
        [p.category, p.name, p.variant, p.unit, p.price]
      );
    }

    console.log("Products inserted successfully");
    console.log("Total products:", products.length);
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed products:", err.message);
    process.exit(1);
  }
}

seed();