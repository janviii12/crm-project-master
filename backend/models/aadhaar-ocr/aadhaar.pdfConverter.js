import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

export const convertPdfToImages = async (pdfPath) => {
  const outputDir = path.join(path.dirname(pdfPath), 'pdf-images');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    // Using pdftoppm (poppler) to convert PDF to PNG
    const outputPattern = path.join(outputDir, 'page');
    const args = [pdfPath, outputPattern, '-png', '-rx', '300', '-ry', '300'];
    const pdftoppm = spawn('pdftoppm', args);

    pdftoppm.on('close', () => {
      const images = fs.readdirSync(outputDir)
        .filter(f => f.endsWith('.png'))
        .map(f => path.join(outputDir, f));
      resolve(images);
    });

    pdftoppm.on('error', (err) => {
      reject(err);
    });
  });
};
