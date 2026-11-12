import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { saveDocumentFile, removeDocumentFile } from './document-files.js';

const prefix = '/api/pet-photos/';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 30 } }).single('photo');

export function photoMime(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && buffer.toString('ascii', 12, 16) === 'IHDR') return 'image/png';
  if (buffer.length >= 12 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
  if (buffer.length >= 20 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export function readPhoto(request, response, next) {
  upload(request, response, (error) => {
    if (error) return response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'รูปภาพต้องมีขนาดไม่เกิน 5 MB' : 'ไม่สามารถอัปโหลดรูปภาพได้' });
    if (request.file && !photoMime(request.file.buffer)) return response.status(400).json({ error: 'กรุณาเลือกไฟล์รูปภาพ JPG, PNG หรือ WebP' });
    next();
  });
}

export async function savePetPhoto(file) {
  const id = randomUUID();
  await saveDocumentFile(id, file.buffer);
  return `${prefix}${id}`;
}

export async function removePetPhoto(url) {
  if (typeof url === 'string' && url.startsWith(prefix) && uuid.test(url.slice(prefix.length)))
    await removeDocumentFile(url.slice(prefix.length));
}
