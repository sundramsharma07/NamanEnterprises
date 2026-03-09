require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// connect database
require("./database/db");
require("./utils/backupScheduler");
// middlewares
app.use(cors());
app.use(express.json());

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

app.use("/api/customers", apiAuth, customersRoute);
app.use("/api/orders", apiAuth, ordersRoute);
app.use("/api/products", apiAuth, productsRoute);

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