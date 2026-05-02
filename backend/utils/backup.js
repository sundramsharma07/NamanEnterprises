const fs = require("fs");
const path = require("path");

/**
 * Neon PostgreSQL handles backups automatically.
 * This local backup service is deprecated but kept for compatibility.
 */
function createBackup() {
  console.log("[BACKUP] Neon PostgreSQL handles backups automatically in the cloud. Local SQLite backup skipped.");
}

module.exports = createBackup;