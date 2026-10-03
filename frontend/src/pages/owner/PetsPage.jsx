import { Link } from 'react-router-dom';
import { AppShell } from '../../components/AppShell.jsx';
import { PetCollection } from '../../components/PetCollection.jsx';

export function PetsPage() {
  return (
    <AppShell>
      <div className="page-heading with-action">
        <div>
          <p className="eyebrow">Your companions</p>
          <h1>Pets</h1>
        </div>
        <Link className="primary-link" to="/pets/new">Add pet</Link>
      </div>
      <PetCollection />
    </AppShell>
  );
}

