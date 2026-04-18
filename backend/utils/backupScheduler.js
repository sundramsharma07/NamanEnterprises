const cron = require("node-cron");
const { createBackup, pruneBackups } = require("../services/backupService");

// Runs every day at 3:00 AM
cron.schedule("0 3 * * *", async () => {
  console.log("[CRON] Starting daily database backup & pruning...");
  try {
    await createBackup();
    pruneBackups(7); // Keep last 7 days
    console.log("[CRON] Daily maintenance completed.");
  } catch (err) {
    console.error("[CRON] Backup failed:", err.message);
  }
}, {
  timezone: "Asia/Kolkata"
});

console.log("[CRON] 3 AM daily backup scheduler active.");