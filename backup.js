const fs = require("fs");
const path = require("path");

// Create backups directory if it doesn't exist
const backupDir = path.join(__dirname, "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Create backup with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupDir, `backup-${timestamp}.sqlite`);

// Copy database file
fs.copyFileSync(path.join(__dirname, "database.sqlite"), backupPath);

console.log(`Backup created: ${backupPath}`);
