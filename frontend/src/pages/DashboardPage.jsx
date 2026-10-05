import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSharedPets } from '../api/vet.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { AppShell } from '../components/AppShell.jsx';
import { PetAvatar } from '../components/PetAvatar.jsx';

export function DashboardPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    listSharedPets().then((items) => { setPets(items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <AppShell>
      <div className="dashboard-heading">
        <p className="eyebrow">Veterinarian</p>
        <h1>Welcome, {user.name}</h1>
      </div>
      <section className="dashboard-pets" aria-labelledby="shared-pets-title">
        <div className="section-heading-row"><h2 id="shared-pets-title">Shared pets</h2><Link to="/vet/pets">View all</Link></div>
        {status === 'loading' && <p className="muted" role="status">Loading shared pets...</p>}
        {status === 'error' && <p className="inline-error" role="alert">Could not load shared pets.</p>}
        {status === 'ready' && (pets.length === 0 ? <p className="muted">No pets shared yet.</p> :
          <div className="pet-grid">{pets.slice(0, 3).map((pet) => <Link className="pet-card" key={pet.id} to={`/vet/pets/${pet.id}`}>
            <PetAvatar pet={pet} />
            <span className="pet-card-details"><strong>{pet.name}</strong><span>{pet.species} / {pet.owner_name}</span></span>
            <span className="card-arrow" aria-hidden="true">&rarr;</span>
          </Link>)}</div>)}
      </section>
        <section className="account-section" aria-labelledby="account-title">
          <h2 id="account-title">Account</h2>
          <dl className="account-details">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Role</dt><dd>Veterinarian</dd></div>
          </dl>
        </section>
    </AppShell>
  );
}
