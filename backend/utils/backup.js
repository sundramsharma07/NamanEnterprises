const fs = require("fs");
const path = require("path");

function createBackup() {
  const dbPath = path.join(__dirname, "../database/store.db");
  const backupDir = path.join(__dirname, "../backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const now = new Date();

  const date =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

  const time =
    String(now.getHours()).padStart(2, "0") +
    "-" +
    String(now.getMinutes()).padStart(2, "0") +
    "-" +
    String(now.getSeconds()).padStart(2, "0");

  const backupFile = `store-backup-${date}-${time}.db`;

  const backupPath = path.join(backupDir, backupFile);

  fs.copyFileSync(dbPath, backupPath);

  console.log("Backup created:", backupFile);
}

module.exports = createBackup;