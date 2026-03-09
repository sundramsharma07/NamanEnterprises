const ExcelJS = require("exceljs");
const path = require("path");
const db = require("../database/db");

async function exportOrdersToExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Orders");

  worksheet.columns = [
    { header: "Order ID", key: "order_id", width: 20 },
    { header: "Customer ID", key: "customer_id", width: 15 },
    { header: "Total Amount", key: "total_amount", width: 15 },
    { header: "Payment Type", key: "payment_type", width: 15 },
    { header: "Paid Amount", key: "paid_amount", width: 15 },
    { header: "Remaining Amount", key: "remaining_amount", width: 18 },
    { header: "Created At", key: "created_at", width: 22 }
  ];

  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM orders", [], async (err, rows) => {
      if (err) {
        return reject(err);
      }

      rows.forEach((row) => {
        worksheet.addRow(row);
      });

      const filePath = path.join(__dirname, "../exports/orders.xlsx");
      await workbook.xlsx.writeFile(filePath);
      resolve(filePath);
    });
  });
}

module.exports = exportOrdersToExcel;