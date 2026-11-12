import { Link } from 'react-router-dom';
import { AppShell } from '../../components/AppShell.jsx';
import { PetCollection } from '../../components/PetCollection.jsx';

export function PetsPage() {
  return (
    <AppShell>
      <div className="page-heading with-action">
        <div>
          <p className="eyebrow">Your Companions</p>
          <h1>Pets</h1>
        </div>
        <Link className="primary-link" to="/pets/new">เพิ่มสัตว์เลี้ยง</Link>
      </div>
      <PetCollection />
    </AppShell>
  );
}

