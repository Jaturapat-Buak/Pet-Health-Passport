import { api } from './client.js';

export async function listReminders() {
  const { data } = await api.get('/reminders');
  return data.reminders;
}

export async function markReminderRead(id) {
  const { data } = await api.patch(`/reminders/${id}/read`);
  return data.reminder;
}
