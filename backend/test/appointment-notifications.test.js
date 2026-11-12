import test from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/config/database.js';
import { appointmentEmail, processNotification, retryDelayMinutes } from '../src/services/appointment-notifications.js';

const id = 'bd6f86b4-ff04-40ee-a0a7-0d893ef4cf2a';
const appointmentId = 'a0f3b9a7-c266-45c4-bf6d-dd19388208d8';
const ownerId = '8116bcd5-a6e6-4d71-a197-5532327ea338';
const date = '2030-01-02T10:00:00.000Z';

test('appointment email contains the pet and Bangkok appointment time without medical details', () => {
  const email = appointmentEmail({ pet_name: 'Milo', appointment_date: date });
  assert.match(email.subject, /Milo/);
  assert.match(email.text, /Milo/);
  assert.match(email.text, /17:00/);
  assert.doesNotMatch(email.text, /diagnosis|treatment/i);
  assert.equal(retryDelayMinutes(1), 1);
  assert.equal(retryDelayMinutes(5), 16);
});

test('worker sends an eligible appointment once and marks the job sent', async (t) => {
  const original = pool.query;
  const calls = [];
  pool.query = async (sql) => {
    calls.push(sql);
    if (sql.includes('RETURNING appointment_id')) return { rows: [{ appointment_id: appointmentId, appointment_date: date, recipient_user_id: ownerId, attempts: 1 }] };
    if (sql.includes('SELECT a.status')) return { rows: [{ status: 'upcoming', appointment_date: date,
      owner_id: ownerId, pet_name: 'Milo', email: 'owner@example.com', email_notifications_enabled: true }] };
    return { rows: [] };
  };
  t.after(() => { pool.query = original; });
  const sent = [];
  await processNotification(id, date, async (message) => sent.push(message));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'owner@example.com');
  assert.ok(calls.some((sql) => sql.includes("status = 'sent'")));
});

test('worker skips a cancelled appointment and does not send', async (t) => {
  const original = pool.query;
  pool.query = async (sql) => {
    if (sql.includes('RETURNING appointment_id')) return { rows: [{ appointment_id: appointmentId, appointment_date: date, recipient_user_id: ownerId, attempts: 1 }] };
    if (sql.includes('SELECT a.status')) return { rows: [{ status: 'cancelled', appointment_date: date,
      owner_id: ownerId, pet_name: 'Milo', email: 'owner@example.com', email_notifications_enabled: true }] };
    return { rows: [] };
  };
  t.after(() => { pool.query = original; });
  await processNotification(id, date, async () => { throw new Error('Must not send'); });
});

test('worker skips an appointment transferred to a different owner', async (t) => {
  const original = pool.query;
  pool.query = async (sql) => {
    if (sql.includes('RETURNING appointment_id')) return { rows: [{ appointment_id: appointmentId, appointment_date: date, recipient_user_id: ownerId, attempts: 1 }] };
    if (sql.includes('SELECT a.status')) return { rows: [{ status: 'upcoming', appointment_date: date,
      owner_id: 'dc8829ee-03bb-4744-9be0-786554503319', pet_name: 'Milo',
      email: 'new-owner@example.com', email_notifications_enabled: true }] };
    return { rows: [] };
  };
  t.after(() => { pool.query = original; });
  await processNotification(id, date, async () => { throw new Error('Must not send'); });
});

test('worker skips a rescheduled appointment', async (t) => {
  const original = pool.query;
  pool.query = async (sql) => {
    if (sql.includes('RETURNING appointment_id')) return { rows: [{ appointment_id: appointmentId, appointment_date: date, recipient_user_id: ownerId, attempts: 1 }] };
    if (sql.includes('SELECT a.status')) return { rows: [{ status: 'upcoming', appointment_date: '2030-01-03T10:00:00.000Z',
      owner_id: ownerId, pet_name: 'Milo', email: 'owner@example.com', email_notifications_enabled: true }] };
    return { rows: [] };
  };
  t.after(() => { pool.query = original; });
  await processNotification(id, date, async () => { throw new Error('Must not send'); });
});

test('worker retries SMTP failures and stops after five attempts', async (t) => {
  const original = pool.query;
  const updates = [];
  pool.query = async (sql, params) => {
    if (sql.includes('RETURNING appointment_id')) return { rows: [{ appointment_id: appointmentId, appointment_date: date, recipient_user_id: ownerId, attempts: 5 }] };
    if (sql.includes('SELECT a.status')) return { rows: [{ status: 'upcoming', appointment_date: date,
      owner_id: ownerId, pet_name: 'Milo', email: 'owner@example.com', email_notifications_enabled: true }] };
    updates.push(params);
    return { rows: [] };
  };
  t.after(() => { pool.query = original; });
  await processNotification(id, date, async () => { throw new Error('SMTP unavailable'); });
  assert.equal(updates[0][2], 'dead');
});
