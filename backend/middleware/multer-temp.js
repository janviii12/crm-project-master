import multer from 'multer';
import path from 'path';
import fs from 'fs';

const tempDir = path.join(process.cwd(), 'tmp/aadhaar');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    const unique =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /pdf|jpg|jpeg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.test(ext)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

export default upload;
