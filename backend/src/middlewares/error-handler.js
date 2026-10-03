import multer from 'multer';

export function errorHandler(error, _request, response, _next) {
  if (error instanceof multer.MulterError) {
    return response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      .json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 10 MB' : 'Invalid upload' });
  }
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
}
