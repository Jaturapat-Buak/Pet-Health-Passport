import { thaiValue } from '../i18n.js';
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

  useEffect(() =>  {
    listSharedPets().then((items) =>  { setPets(items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <AppShell>
      <div className="dashboard-heading">
        <h1>Veterinarian Dashboard</h1>
      </div>
      <div className="vet-overview">
        <section className="profile-card" aria-labelledby="profile-title">
          <h2 id="profile-title">Personal Information</h2>
          <div className="profile-card-content">
            <span className="profile-avatar" aria-hidden="true">{Array.from(user.name)[0]}</span>
            <div><strong>{user.name}</strong><p>{user.email}</p><span>สัตวแพทย์</span></div>
          </div>
        </section>
        <section className="overview-card" aria-labelledby="overview-title">
          <h2 id="overview-title">Pets in Your Care</h2>
          <strong className="overview-number">{status === 'ready' ? pets.length : '—'}</strong>
          <p>สัตว์เลี้ยงที่คุณรับไว้ในความดูแล</p>
          <Link className="secondary-link" to="/vet/pets">ดูสัตว์เลี้ยงทั้งหมด</Link>
        </section>
      </div>
      <section className="dashboard-pets" aria-labelledby="shared-pets-title">
        <div className="section-heading-row"><h2 id="shared-pets-title">Pets in Your Care</h2><Link to="/vet/pets">ดูทั้งหมด</Link></div>
        {status === 'loading' && <p className="muted" role="status">กำลังโหลดข้อมูลสัตว์เลี้ยง...</p>}
        {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้</p>}
        {status === 'ready' && (pets.length === 0 ? <p className="muted">ยังไม่มีสัตว์เลี้ยงในความดูแล</p> :
          <div className="pet-grid">{pets.slice(0, 3).map((pet) =>  <Link className="pet-card" key={pet.id} to={`/vet/pets/${pet.id}`}>
            <PetAvatar pet={pet} />
            <span className="pet-card-details"><strong>{pet.name}</strong><span>{thaiValue(pet.species)} / {pet.owner_name}</span></span>
            <span className="card-arrow" aria-hidden="true">&rarr;</span>
          </Link>)}</div>)}
      </section>
    </AppShell>
  );
}
