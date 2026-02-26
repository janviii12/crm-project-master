import { MongoClient } from 'mongodb';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
const BACKUP_DIR = path.join(__dirname, 'backup');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('Created backup directory:', BACKUP_DIR);
}

// Generate timestamp for backup filename
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

// Create backup using mongodump
const createBackup = async () => {
  const timestamp = getTimestamp();
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  console.log('Starting database backup...');
  console.log('Backup path:', backupPath);

  const command = `mongodump --uri="${DB_URI}" --out="${backupPath}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed:', error);
        reject(error);
        return;
      }

      if (stderr) {
        console.log('Backup stderr:', stderr);
      }

      console.log('Backup stdout:', stdout);
      console.log('Database backup completed successfully!');
      console.log('Backup location:', backupPath);

      // List backup contents
      fs.readdir(backupPath, (err, files) => {
        if (!err) {
          console.log('Backup contents:', files);
        }
      });

      resolve(backupPath);
    });
  });
};

// Test database connection
const testConnection = async () => {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('Database connection successful');

    // List collections
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(col => col.name));

    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  } finally {
    await client.close();
  }
};

// Main execution
const main = async () => {
  console.log('CRM Database Backup Script');
  console.log('==========================');

  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('Cannot proceed with backup due to connection failure');
    process.exit(1);
  }

  try {
    const backupPath = await createBackup();
    console.log('Backup completed successfully at:', backupPath);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createBackup, testConnection };
