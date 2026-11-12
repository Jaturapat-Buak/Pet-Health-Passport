import { api } from './client.js';

export async function listHealthRecords(petId, type, vet = false) {
  const { data } = await api.get(`${vet ? '/vet' : ''}/pets/${petId}/${type}`);
  return data.records;
}

export async function createHealthRecord(petId, type, details, vet = false) {
  const { data } = await api.post(`${vet ? '/vet' : ''}/pets/${petId}/${type}`, details);
  return data.record;
}

export async function updateHealthRecord(type, id, details) {
  const { data } = await api.put(`/${type}/${id}`, details);
  return data.record;
}

export async function deleteHealthRecord(type, id) {
  await api.delete(`/${type}/${id}`);
}

export async function downloadHealthDocument(id, vet = false) {
  const { data } = await api.get(`${vet ? '/vet' : ''}/documents/${id}/file`, { responseType: 'blob' });
  return data;
}
