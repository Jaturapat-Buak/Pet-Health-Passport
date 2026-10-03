import { api } from './client.js';

export async function listPets() {
  const { data } = await api.get('/pets');
  return data.pets;
}

export async function getPet(id) {
  const { data } = await api.get(`/pets/${id}`);
  return data.pet;
}

export async function createPet(details) {
  const { data } = await api.post('/pets', details);
  return data.pet;
}

export async function updatePet(id, details) {
  const { data } = await api.put(`/pets/${id}`, details);
  return data.pet;
}

export async function deletePet(id) {
  await api.delete(`/pets/${id}`);
}

