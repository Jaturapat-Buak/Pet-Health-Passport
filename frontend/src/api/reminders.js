import { api } from './client.js';

export async function listReminders() {
  const { data } = await api.get('/reminders');
  return data.reminders;
}

export async function markReminderRead(id) {
  const { data } = await api.patch(`/reminders/${id}/read`);
  return data.reminder;
}

export async function getEmailNotificationPreference() {
  const { data } = await api.get('/reminders/preferences');
  return data.email_notifications_enabled;
}

export async function setEmailNotificationPreference(enabled) {
  const { data } = await api.put('/reminders/preferences', { email_notifications_enabled: enabled });
  return data.email_notifications_enabled;
}
