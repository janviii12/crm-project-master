const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const AadhaarTemp = require('./aadhaar.model');

const TEMP_FILE_DIR = path.join(process.cwd(), 'tmp/aadhaar');
const TEMP_IMG_DIR = path.join(process.cwd(), 'tmp/aadhaar-img');
const EXPIRY_MINUTES = 10;

/* ================= HELPERS ================= */

function deleteFileSafe(filePath) {
  if (!filePath) return;

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('File delete error:', filePath, err.message);
    }
  }
}

function cleanupImagesByPrefix(prefix) {
  if (!fs.existsSync(TEMP_IMG_DIR)) return;

  fs.readdirSync(TEMP_IMG_DIR).forEach(file => {
    if (file.startsWith(prefix)) {
      deleteFileSafe(path.join(TEMP_IMG_DIR, file));
    }
  });
}

/* ================ MAIN CLEANUP ================ */

async function cleanupExpiredAadhaar() {
  const expiryTime = new Date(
    Date.now() - EXPIRY_MINUTES * 60 * 1000
  );

  const expired = await AadhaarTemp.find({
    createdAt: { $lt: expiryTime }
  });

  for (const record of expired) {
    // Delete original uploaded file
    deleteFileSafe(record.filePath);

    // Delete generated images (if any)
    if (record.filePath) {
      const prefix = path.basename(record.filePath).split('.')[0];
      cleanupImagesByPrefix(prefix);
    }

    // Remove DB record
    await AadhaarTemp.deleteOne({ _id: record._id });

    console.log(
      '🗑 Aadhaar temp data deleted:',
      record._id.toString()
    );
  }
}

/* ================ CRON JOB =================== */

// Runs every 1 minute
cron.schedule('* * * * *', async () => {
  try {
    await cleanupExpiredAadhaar();
  } catch (err) {
    console.error('Cleanup job failed:', err.message);
  }
});

/* ================ STARTUP CLEAN ================= */

// On server restart, clean old files
(async function initialCleanup() {
  try {
    await cleanupExpiredAadhaar();
    console.log('✅ Aadhaar cleanup worker started');
  } catch (err) {
    console.error('Initial cleanup failed:', err.message);
  }
})();
