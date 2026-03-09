const cron = require("node-cron");
const createBackup = require("./backup");

// Runs every day at 9:00 PM
cron.schedule("0 21 * * *", () => {
  console.log("Running automatic database backup...");
  createBackup();
});

console.log("Automatic backup scheduler started (9 PM daily)");