import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSharedPet } from '../../api/vet.js';
import { AppShell } from '../../components/AppShell.jsx';
import { HealthRecords } from '../../components/HealthRecords.jsx';
import { PetAvatar } from '../../components/PetAvatar.jsx';

const show = (value, suffix = '') => value == null || value === '' ? 'Not recorded' : `${value}${suffix}`;

export function SharedPetDetailPage() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    setStatus('loading');
    getSharedPet(id).then((result) => { setPet(result); setStatus('ready'); })
      .catch((error) => setStatus(error.response?.status === 404 ? 'missing' : 'error'));
  }, [id]);

  return <AppShell>
    <Link className="back-link" to="/vet/pets">&larr; Back to shared pets</Link>
    {status === 'loading' && <p className="muted" role="status">Loading pet...</p>}
    {status === 'missing' && <p className="inline-error" role="alert">Pet not found or access removed.</p>}
    {status === 'error' && <p className="inline-error" role="alert">Could not load this pet.</p>}
    {status === 'ready' && <>
      <div className="pet-profile-heading">
        <PetAvatar pet={pet} className="large-avatar" />
        <div className="pet-profile-title"><p className="eyebrow">Shared health passport</p><h1>{pet.name}</h1><p>{[pet.species, pet.breed].filter(Boolean).join(' / ')} &middot; Owner: {pet.owner_name}</p></div>
      </div>
      <section className="details-section" aria-labelledby="details-title">
        <h2 id="details-title">Details</h2>
        <dl className="details-grid">
          <div><dt>Species</dt><dd>{show(pet.species)}</dd></div>
          <div><dt>Breed</dt><dd>{show(pet.breed)}</dd></div>
          <div><dt>Gender</dt><dd>{show(pet.gender)}</dd></div>
          <div><dt>Birth date</dt><dd>{show(pet.birth_date?.slice(0, 10))}</dd></div>
          <div><dt>Weight</dt><dd>{show(pet.weight, ' kg')}</dd></div>
          <div><dt>Microchip ID</dt><dd>{show(pet.microchip_id)}</dd></div>
        </dl>
      </section>
      <section className="details-section" aria-labelledby="notes-title"><h2 id="notes-title">Medical notes</h2><p className="notes-text">{show(pet.medical_notes)}</p></section>
      <HealthRecords petId={id} vet />
    </>}
  </AppShell>;
}
