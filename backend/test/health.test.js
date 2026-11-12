import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

test('unknown routes return a JSON 404 response', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/missing`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Route not found' });
  } finally {
    server.close();
  }
});

