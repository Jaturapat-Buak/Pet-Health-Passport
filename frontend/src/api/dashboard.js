import { api } from './client.js';

export async function getOwnerDashboard() {
  const { data } = await api.get('/dashboard/owner');
  return data;
}

export async function getAdminDashboard() {
  const { data } = await api.get('/dashboard/admin');
  return data;
}
