import { api } from './client.js';

export async function listSharedPets() {
  const { data } = await api.get('/vet/pets');
  return data.pets;
}

export async function getSharedPet(id) {
  const { data } = await api.get(`/vet/pets/${id}`);
  return data.pet;
}

export async function listPetVets(id) {
  const { data } = await api.get(`/pets/${id}/vets`);
  return data.vets;
}

export async function grantPetVet(id, email) {
  await api.post(`/pets/${id}/vets`, { email });
}

export async function revokePetVet(id, vetId) {
  await api.delete(`/pets/${id}/vets/${vetId}`);
}
