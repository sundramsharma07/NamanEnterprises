const cron = require("node-cron");
const createBackup = require("./backup");

// Runs every day at 9:00 PM
cron.schedule("0 21 * * *", async () => {
  console.log("Running automatic database backup...");
  try {
    await createBackup();
  } catch (err) {
    console.error("Backup error:", err.message);
  }
}, {
  timezone: "Asia/Kolkata"
});

console.log("Automatic backup scheduler started (9 PM daily)");