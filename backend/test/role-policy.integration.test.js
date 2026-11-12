import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

test('role policy against PostgreSQL: owners, vets, admins and immediate role changes', { skip: !process.env.ROLE_POLICY_DB }, async (t) => {
  assert.match(process.env.ROLE_POLICY_DB, /^codex_role_test_/);
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${process.env.ROLE_POLICY_DB}`;
  process.env.DATABASE_URL = url.href;
  const { app } = await import('../src/app.js');
  const { pool } = await import('../src/config/database.js');
  const { env } = await import('../src/config/env.js');
  const server = app.listen(0);
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); await pool.end(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const passwordHash = await bcrypt.hash('test-password-only', 4);
  const people = {};
  for (const name of ['owner', 'other', 'vet', 'unassigned', 'admin']) {
    const role = name === 'other' ? 'owner' : name === 'unassigned' ? 'vet' : name;
    const { rows } = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, `${name}@test.invalid`, passwordHash, role]);
    people[name] = rows[0];
  }
  const request = async (name, path, method = 'GET', body) => {
    const response = await fetch(base + path, { method, headers: {
      Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: people[name].id })}`,
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' })
    }, body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
    return { status: response.status, data: response.status === 204 ? null : await response.json() };
  };
  const expect = async (name, path, method, body, status) => {
    const result = await request(name, path, method, body);
    assert.equal(result.status, status, `${name} ${method} ${path}: ${JSON.stringify(result.data)}`);
    return result.data;
  };
  const pet = (await expect('owner', '/pets', 'POST', { name: 'Test pet', species: 'Cat', owner_id: people.other.id }, 201)).pet;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=', 'base64');
  const photoForm = (bytes = png, type = 'image/png') => {
    const form = new FormData(); form.set('name', 'Photo pet'); form.set('species', 'Cat');
    form.set('photo', new Blob([bytes], { type }), 'photo.png'); return form;
  };
  const photoResponse = (name, photoUrl) => fetch(`${base}${photoUrl.slice(4)}`, {
    headers: { Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: people[name].id })}` }
  });
  const photoPet = (await expect('owner', '/pets', 'POST', photoForm(), 201)).pet;
  assert.match(photoPet.image_url, /^\/api\/pet-photos\//);
  const image = await photoResponse('owner', photoPet.image_url);
  assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  assert.equal((await photoResponse('other', photoPet.image_url)).status, 404);
  assert.equal((await photoResponse('admin', photoPet.image_url)).status, 200);
  assert.equal((await fetch(`${base}${photoPet.image_url.slice(4)}`)).status, 401);
  await expect('admin', `/pets/${photoPet.id}/vets`, 'POST', { email: people.vet.email }, 201);
  assert.equal((await photoResponse('vet', photoPet.image_url)).status, 200);
  await expect('admin', `/pets/${photoPet.id}/vets/${people.vet.id}`, 'DELETE', null, 204);
  assert.equal((await photoResponse('vet', photoPet.image_url)).status, 404);
  const kept = (await expect('owner', `/pets/${photoPet.id}`, 'PUT', { name: 'Still has photo', species: 'Cat' }, 200)).pet;
  assert.equal(kept.image_url, photoPet.image_url);
  await expect('other', `/pets/${photoPet.id}`, 'PUT', photoForm(), 404);
  await expect('owner', '/pets', 'POST', photoForm(Buffer.from('<svg></svg>'), 'image/png'), 400);
  await expect('owner', '/pets', 'POST', photoForm(Buffer.alloc(5 * 1024 * 1024 + 1)), 413);
  const replacement = (await expect('admin', `/pets/${photoPet.id}`, 'PUT', photoForm(), 200)).pet;
  assert.notEqual(replacement.image_url, photoPet.image_url);
  assert.equal((await photoResponse('owner', photoPet.image_url)).status, 404);
  const { readDocumentFile } = await import('../src/services/document-files.js');
  await assert.rejects(readDocumentFile(photoPet.image_url.split('/').at(-1)), { code: 'ENOENT' });
  const removeForm = new FormData(); removeForm.set('name', 'Removed photo'); removeForm.set('species', 'Cat'); removeForm.set('remove_image', 'true');
  assert.equal((await expect('owner', `/pets/${photoPet.id}`, 'PUT', removeForm, 200)).pet.image_url, null);
  await assert.rejects(readDocumentFile(replacement.image_url.split('/').at(-1)), { code: 'ENOENT' });
  const finalPhoto = (await expect('owner', `/pets/${photoPet.id}`, 'PUT', photoForm(), 200)).pet;
  await expect('owner', `/pets/${photoPet.id}`, 'DELETE', null, 204);
  await assert.rejects(readDocumentFile(finalPhoto.image_url.split('/').at(-1)), { code: 'ENOENT' });
  assert.equal(pet.owner_id, people.owner.id, 'owner cannot select another account');
  await expect('other', `/pets/${pet.id}`, 'PUT', { name: 'No', species: 'Cat' }, 404);
  await expect('owner', `/pets/${pet.id}`, 'PUT', { name: 'Updated', species: 'Cat' }, 200);
  await expect('owner', `/pets/${pet.id}/vets`, 'POST', { email: people.vet.email }, 403);
  await expect('owner', `/pets/${pet.id}/vets/${people.vet.id}`, 'DELETE', null, 403);
  await expect('owner', '/vet/available-pets?ownerEmail=owner%40test.invalid', 'GET', null, 403);
  await expect('owner', `/vet/pets/${pet.id}/access`, 'POST', { owner_email: people.owner.email }, 403);
  await expect('owner', `/vet/pets/${pet.id}/access`, 'DELETE', null, 403);
  await expect('vet', '/vet/available-pets?ownerEmail=invalid', 'GET', null, 400);
  const available = await expect('vet', '/vet/available-pets?ownerEmail=owner%40test.invalid', 'GET', null, 200);
  assert.equal(available.pets.some((item) => item.id === pet.id), true);
  assert.equal(available.pets[0].medical_notes, undefined, 'lookup exposes only basic identification');
  const directory = await expect('vet', '/vet/available-pets', 'GET', null, 200);
  assert.ok(directory.pets.some((item) => item.id === pet.id), 'vets can select pets without knowing owner email');
  await expect('owner', '/vet/available-pets', 'GET', null, 403);
  await expect('vet', '/vet/available-pets?page=-1', 'GET', null, 400);
  const missingSearch = await expect('vet', '/vet/available-pets?search=no-such-pet-9988', 'GET', null, 200);
  assert.equal(missingSearch.pets.length, 0);
  const thaiSearch = await expect('vet', `/vet/available-pets?search=${encodeURIComponent('แมว')}`, 'GET', null, 200);
  assert.ok(thaiSearch.pets.some((item) => item.id === pet.id));
  await pool.query("INSERT INTO pets (owner_id, name, species) SELECT $1, 'zz-directory-' || LPAD(n::text, 2, '0'), 'Dog' FROM generate_series(1, 21) n", [people.other.id]);
  const firstPage = await expect('vet', '/vet/available-pets?search=zz-directory-&page=0', 'GET', null, 200);
  const secondPage = await expect('vet', '/vet/available-pets?search=zz-directory-&page=1', 'GET', null, 200);
  assert.equal(firstPage.pets.length, 20); assert.equal(firstPage.has_more, true);
  assert.equal(secondPage.pets.length, 1); assert.equal(secondPage.has_more, false);
  assert.ok(!firstPage.pets.some((item) => item.id === secondPage.pets[0].id));
  await expect('vet', `/vet/pets/${pet.id}/access`, 'POST', { owner_email: people.other.email }, 409);
  await expect('vet', `/vet/pets/${pet.id}/access`, 'POST', { vet_id: people.unassigned.id }, 201);
  await expect('vet', `/vet/pets/${pet.id}/access`, 'POST', { owner_email: people.owner.email }, 409);
  const ownerStatus = await expect('owner', `/pets/${pet.id}/vets`, 'GET', null, 200);
  assert.equal(ownerStatus.vets[0].id, people.vet.id);
  await expect('vet', `/vet/pets/${pet.id}`, 'GET', null, 200);
  await expect('unassigned', `/vet/pets/${pet.id}/access`, 'DELETE', null, 404);
  await expect('vet', `/vet/pets/${pet.id}/access`, 'DELETE', null, 204);
  await expect('vet', `/vet/pets/${pet.id}`, 'GET', null, 404);
  assert.equal((await expect('owner', `/pets/${pet.id}/vets`, 'GET', null, 200)).vets.length, 0);
  await expect('admin', `/pets/${pet.id}/vets`, 'POST', { email: people.vet.email }, 201);
  const sample = { pet_id: pet.id, appointment_date: '2099-12-15T03:00:00Z', purpose: 'Checkup' };
  await expect('owner', '/appointments', 'POST', sample, 403);
  await expect('unassigned', '/appointments', 'POST', sample, 404);
  await expect('vet', '/appointments', 'POST', { ...sample, appointment_date: '2026-02-30T03:00:00Z' }, 400);
  const appointment = (await expect('vet', '/appointments', 'POST', sample, 201)).appointment;
  assert.equal(appointment.owner_id, people.owner.id, 'vet appointment is stored under the actual owner');
  assert.equal((await expect('owner', '/appointments', 'GET', null, 200)).appointments.length, 1);
  assert.equal((await expect('other', '/appointments', 'GET', null, 200)).appointments.length, 0);
  assert.equal((await expect('unassigned', '/appointments', 'GET', null, 200)).appointments.length, 0);
  await expect('other', `/appointments/${appointment.id}`, 'GET', null, 404);
  for (const [method, suffix, body] of [['PUT', '', sample], ['PATCH', '/status', { status: 'cancelled' }], ['DELETE', '', null]]) {
    await expect('owner', `/appointments/${appointment.id}${suffix}`, method, body, 403);
    await expect('unassigned', `/appointments/${appointment.id}${suffix}`, method, body, 404);
  }
  await expect('vet', `/appointments/${appointment.id}`, 'PUT', { ...sample, purpose: 'Follow-up' }, 200);
  await expect('vet', `/appointments/${appointment.id}/status`, 'PATCH', { status: 'completed' }, 200);
  await expect('admin', `/pets/${pet.id}/vets/${people.vet.id}`, 'DELETE', null, 204);
  await expect('vet', `/appointments/${appointment.id}`, 'GET', null, 404);
  await expect('vet', `/appointments/${appointment.id}`, 'PUT', sample, 404);
  await expect('admin', `/appointments/${appointment.id}`, 'PUT', sample, 200);
  await expect('admin', `/appointments/${appointment.id}/status`, 'PATCH', { status: 'upcoming' }, 200);

  for (const [resource, record] of [
    ['vaccinations', { vaccine_name: 'Test', date_received: '2026-01-01' }],
    ['medical-records', { visit_date: '2026-01-01', diagnosis: 'Test' }],
    ['allergies', { allergy_type: 'Food', allergen_name: 'Test' }],
    ['medications', { medication_name: 'Test' }],
    ['weights', { weight: 4.2, record_date: '2026-01-01' }]
  ]) {
    const created = (await expect('admin', `/pets/${pet.id}/${resource}`, 'POST', record, 201)).record;
    await expect('other', `/${resource}/${created.id}`, 'PUT', record, 404);
    await expect('owner', `/${resource}/${created.id}`, 'PUT', record, 200);
    await expect('admin', `/${resource}/${created.id}`, 'PUT', record, 200);
    await expect('admin', `/${resource}/${created.id}`, 'GET', null, 200);
    await expect('admin', `/${resource}/${created.id}`, 'DELETE', null, 204);
  }
  const form = new FormData();
  form.set('title', 'Test file'); form.set('document_type', 'other');
  form.set('file', new Blob(['%PDF-1.4\ntest'], { type: 'application/pdf' }), 'test.pdf');
  const document = (await expect('admin', `/pets/${pet.id}/documents`, 'POST', form, 201)).record;
  const download = await fetch(`${base}/documents/${document.id}/file`, { headers: { Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: people.admin.id })}` } });
  assert.equal(download.status, 200); assert.ok((await download.text()).startsWith('%PDF-'));
  await expect('admin', `/documents/${document.id}`, 'DELETE', null, 204);
  await expect('owner', '/admin/users', 'GET', null, 403);
  await expect('vet', '/admin/users', 'GET', null, 403);
  const createdUser = (await expect('admin', '/admin/users', 'POST', { name: 'New', email: 'new@test.invalid', role: 'owner', password: 'test-password-only' }, 201)).user;
  await expect('admin', `/admin/users/${createdUser.id}`, 'PUT', { ...createdUser, role: 'superuser' }, 400);
  await expect('admin', `/admin/users/${people.admin.id}`, 'PUT', { ...people.admin, role: 'owner' }, 409);
  await expect('admin', `/admin/users/${people.admin.id}`, 'DELETE', null, 409);
  const changed = await expect('admin', `/admin/users/${people.other.id}`, 'PUT', { ...people.other, role: 'admin' }, 200);
  assert.equal(changed.user.role, 'admin');
  await expect('other', '/admin/users', 'GET', null, 200);
  await expect('admin', `/admin/users/${people.other.id}`, 'PUT', { ...people.other, role: 'owner' }, 200);
  await expect('other', '/admin/users', 'GET', null, 403);
  await expect('admin', `/admin/users/${createdUser.id}`, 'DELETE', null, 204);
  const adminPet = (await expect('admin', '/pets', 'POST', { name: 'Admin created', species: 'Dog', owner_id: people.other.id }, 201)).pet;
  assert.equal(adminPet.owner_id, people.other.id);
  await expect('admin', '/pets', 'POST', { name: 'Bad', species: 'Dog', owner_id: people.vet.id }, 400);
  await expect('admin', `/pets/${pet.id}/vets`, 'POST', { email: people.vet.email }, 201);
  await expect('admin', `/pets/${pet.id}/vets`, 'GET', null, 200);
  await expect('admin', `/pets/${pet.id}`, 'PUT', { name: 'Transferred', species: 'Cat', owner_id: people.other.id }, 200);
  await expect('owner', `/pets/${pet.id}`, 'GET', null, 404);
  await expect('other', `/pets/${pet.id}`, 'GET', null, 200);
  await expect('vet', `/vet/pets/${pet.id}`, 'GET', null, 404);
  const afterTransfer = await expect('other', `/appointments/${appointment.id}`, 'GET', null, 200);
  assert.equal(afterTransfer.appointment.owner_id, people.other.id);
  await expect('admin', `/appointments/${appointment.id}`, 'DELETE', null, 204);
  await expect('admin', `/pets/${pet.id}`, 'DELETE', null, 204);
  await expect('admin', `/pets/${adminPet.id}`, 'DELETE', null, 204);
});
