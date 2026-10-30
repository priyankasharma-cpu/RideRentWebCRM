import { fail } from '../../utils/ApiError.js';
import { readFileSync, unlinkSync } from 'node:fs';
export function uploadVehicleImage(db, request) {
  if (!request.file) fail(400, 'Choose a JPEG, PNG or WebP image.');
  const bytes = readFileSync(request.file.path);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
    png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!jpeg && !png && !webp) {
    unlinkSync(request.file.path);
    fail(400, 'Only valid JPEG, PNG or WebP images are accepted.');
  }
  return {
    url: '/images/uploads/' + request.file.filename,
  };
}
