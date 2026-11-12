import { api } from './client.js';

export async function listAppointments(view = 'all') {
  const { data } = await api.get('/appointments', { params: { view } });
  return data.appointments;
}

export async function getAppointment(id) {
  const { data } = await api.get(`/appointments/${id}`);
  return data.appointment;
}

export async function createAppointment(details) {
  const { data } = await api.post('/appointments', details);
  return data.appointment;
}

export async function updateAppointment(id, details) {
  const { data } = await api.put(`/appointments/${id}`, details);
  return data.appointment;
}

export async function updateAppointmentStatus(id, status) {
  const { data } = await api.patch(`/appointments/${id}/status`, { status });
  return data.appointment;
}

export async function deleteAppointment(id) {
  await api.delete(`/appointments/${id}`);
}
