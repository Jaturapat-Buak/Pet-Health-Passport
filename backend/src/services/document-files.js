import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

function documentPath(id) {
  return path.join(uploadsDir, id);
}

export async function saveDocumentFile(id, buffer) {
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(documentPath(id), buffer);
}

export async function readDocumentFile(id) {
  return readFile(documentPath(id));
}

export async function removeDocumentFile(id) {
  await unlink(documentPath(id)).catch((error) => {
    if (error.code !== 'ENOENT') console.error('Could not remove uploaded file', error);
  });
}
