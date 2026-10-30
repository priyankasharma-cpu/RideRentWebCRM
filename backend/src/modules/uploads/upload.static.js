import { readFileSync } from 'node:fs';
import express from 'express';
import { uploadDirectory } from '../../config/paths.js';
export const uploadedImages = express.static(uploadDirectory, {
  setHeaders(res, file) {
    const bytes = readFileSync(file);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set(
      'Content-Type',
      bytes[0] === 255 ? 'image/jpeg' : bytes[0] === 137 ? 'image/png' : 'image/webp',
    );
  },
});
