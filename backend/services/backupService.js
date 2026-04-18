const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/store.db');
const BACKUP_DIR = path.join(__dirname, '../', process.env.BACKUP_DIR || 'database/backups');

/**
 * Creates a timestamped backup of the current SQLite database
 * @returns {Promise<string>} Path to the created backup
 */
const createBackup = async () => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    fs.copyFile(DB_PATH, backupPath, (err) => {
      if (err) {
        console.error('[BACKUP] Error creating backup:', err);
        return reject(err);
      }
      console.log(`[BACKUP] Successfully created backup: ${backupName}`);
      resolve(backupPath);
    });
  });
};

/**
 * Deletes backups older than a certain number of days
 * @param {number} daysToKeep 
 */
const pruneBackups = (daysToKeep = 7) => {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const msToKeep = daysToKeep * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtimeMs > msToKeep) {
      fs.unlinkSync(filePath);
      console.log(`[BACKUP] Pruned old backup: ${file}`);
    }
  });
};

/**
 * Returns the most recent backup file path
 */
const getLatestBackup = () => {
  if (!fs.existsSync(BACKUP_DIR)) return null;

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .sort((a, b) => {
      return fs.statSync(path.join(BACKUP_DIR, b)).mtimeMs - 
             fs.statSync(path.join(BACKUP_DIR, a)).mtimeMs;
    });

  return files.length > 0 ? path.join(BACKUP_DIR, files[0]) : null;
};

module.exports = {
  createBackup,
  pruneBackups,
  getLatestBackup
};
