const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

function createBackup() {
  const dbPath =
    process.env.SQLITE_PATH ||
    path.join(__dirname, "../database/store.db");

  const backupDir =
    process.env.BACKUP_DIR ||
    path.join(__dirname, "../backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
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

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`VACUUM INTO '${backupPath}'`, (err) => {
      if (err) {
        console.error("Backup failed:", err.message);
      } else {
        console.log("Backup created:", backupPath);
      }
      db.close();
    });
  });
}

module.exports = createBackup;