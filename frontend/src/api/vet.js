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

export async function findPetsForCare(ownerEmail) {
  const { data } = await api.get('/vet/available-pets', { params: { ownerEmail } });
  return data.pets;
}

export async function takePetIntoCare(id, ownerEmail) {
  await api.post(`/vet/pets/${id}/access`, { owner_email: ownerEmail });
}

export async function listCareCandidates(search = '', page = 0) {
  const { data } = await api.get('/vet/available-pets', { params: { search, page } });
  return data;
}

export async function endPetCare(id) {
  await api.delete(`/vet/pets/${id}/access`);
}
