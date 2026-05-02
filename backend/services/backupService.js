const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../', process.env.BACKUP_DIR || 'database/backups');

/**
 * Neon PostgreSQL handles backups automatically.
 * This local backup service is deprecated but kept for compatibility.
 */
const createBackup = async () => {
  console.log('[BACKUP] Neon PostgreSQL handles backups automatically in the cloud. Local SQLite backup skipped.');
  return null;
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
    .filter(f => f.endsWith('.db') || f.endsWith('.sql'))
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

