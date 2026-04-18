require("dotenv").config({ path: __dirname + '/.env' });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// connect database
const db = require("./database/db");
require("./utils/backupScheduler");

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use("/api", limiter);

// request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// routes
const customersRoute = require("./routes/customers");
const ordersRoute = require("./routes/orders");
const productsRoute = require("./routes/products");

const apiAuth = require("./middleware/apiAuth");
const { getLatestBackup } = require("./services/backupService");


// Dedicated Dashboard Pulse Route (Priority)
app.get("/api/activity-pulse", apiAuth, (req, res) => {
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
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json(rows);
  });
});

app.use("/api/customers", apiAuth, customersRoute);
app.use("/api/orders", apiAuth, ordersRoute);
app.use("/api/products", apiAuth, productsRoute);

// Manual Backup Download (Admin Only)
app.get("/api/admin/backup/download", apiAuth, (req, res) => {
  const latest = getLatestBackup();
  if (!latest) return res.status(404).json({ success: false, message: "No backups available" });
  res.download(latest);
});

// test route
app.get("/", (req, res) => {
  res.send("Store API Running");
});

// server port
const PORT = process.env.PORT || 5000;

// start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});