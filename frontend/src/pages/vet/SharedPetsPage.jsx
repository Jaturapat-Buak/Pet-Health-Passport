import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSharedPets } from '../../api/vet.js';
import { AppShell } from '../../components/AppShell.jsx';
import { PetAvatar } from '../../components/PetAvatar.jsx';

export function SharedPetsPage() {
  const [pets, setPets] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    listSharedPets().then((items) => { setPets(items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  return <AppShell>
    <div className="page-heading"><p className="eyebrow">Veterinarian</p><h1>Shared pets</h1></div>
    {status === 'loading' && <p className="muted" role="status">Loading shared pets...</p>}
    {status === 'error' && <p className="inline-error" role="alert">Could not load shared pets.</p>}
    {status === 'ready' && (pets.length === 0 ?
      <div className="empty-state"><h3>No pets shared yet</h3><p>Shared pets will appear here when their owners grant access.</p></div> :
      <div className="pet-grid">{pets.map((pet) => <Link className="pet-card" key={pet.id} to={`/vet/pets/${pet.id}`}>
        <PetAvatar pet={pet} />
        <span className="pet-card-details"><strong>{pet.name}</strong><span>{pet.species}{pet.breed ? ` / ${pet.breed}` : ''}</span><span>Owner: {pet.owner_name}</span></span>
        <span className="card-arrow" aria-hidden="true">&rarr;</span>
      </Link>)}</div>)}
  </AppShell>;
}
