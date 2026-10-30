import { mkdirSync } from 'node:fs';
import multer from 'multer';
import { uploadDirectory } from '../../config/paths.js';
mkdirSync(uploadDirectory, {
  recursive: true,
});
export const vehicleUpload = multer({
  dest: uploadDirectory,
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 1,
  },
});
