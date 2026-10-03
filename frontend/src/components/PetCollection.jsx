import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPets } from '../api/pets.js';
import { PetAvatar } from './PetAvatar.jsx';

export function PetCollection({ limit }) {
  const [pets, setPets] = useState([]);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setPets(await listPets());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status === 'loading') return <p className="muted" role="status">Loading pets...</p>;
  if (status === 'error') return (
    <div className="inline-error" role="alert">
      <p>Could not load your pets.</p>
      <button type="button" className="secondary-button" onClick={load}>Try again</button>
    </div>
  );
  if (!pets.length) return (
    <div className="empty-state">
      <h3>No pets yet</h3>
      <p>Add your first pet to start their health passport.</p>
      <Link className="primary-link" to="/pets/new">Add pet</Link>
    </div>
  );

  return (
    <>
      <p className="collection-count">{pets.length} {pets.length === 1 ? 'pet' : 'pets'}</p>
      <div className="pet-grid">
        {pets.slice(0, limit).map((pet) => (
          <Link className="pet-card" to={`/pets/${pet.id}`} key={pet.id}>
            <PetAvatar pet={pet} />
            <span className="pet-card-details">
              <strong>{pet.name}</strong>
              <span>{[pet.species, pet.breed].filter(Boolean).join(' / ')}</span>
            </span>
            <span className="card-arrow" aria-hidden="true">&rarr;</span>
          </Link>
        ))}
      </div>
      {limit && pets.length > limit && <Link className="more-link" to="/pets">View all pets</Link>}
    </>
  );
}

