import { thaiValue } from '../../i18n.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSharedPets, endPetCare } from '../../api/vet.js';
import { AppShell } from '../../components/AppShell.jsx';
import { PetAvatar } from '../../components/PetAvatar.jsx';
import { CareManagement } from '../../components/CareManagement.jsx';

export function SharedPetsPage() {
  const [pets, setPets] = useState([]);
  const [status, setStatus] = useState('loading');
  const [pendingEnd, setPendingEnd] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  async function refresh() {
    setPets(await listSharedPets()); setStatus('ready');
  }

  async function endCare() {
    setBusy(true); setError('');
    try {
      await endPetCare(pendingEnd.id);
      setPets((items) => items.filter((item) => item.id !== pendingEnd.id));
      setPendingEnd(null); setRevision((value) => value + 1);
    } catch (e) { setError(e.response?.data?.error ?? 'ไม่สามารถยุติการดูแลได้'); }
    finally { setBusy(false); }
  }

  useEffect(() =>  {
    listSharedPets().then((items) =>  { setPets(items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  return <AppShell>
    <div className="page-heading"><p className="eyebrow">Veterinarian</p><h1>Pets in Your Care</h1></div>
    <CareManagement key={revision} onChange={refresh} />
    {status === 'loading' && <p className="muted" role="status">กำลังโหลดข้อมูลสัตว์เลี้ยง...</p>}
    {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้</p>}
    {status === 'ready' && (pets.length === 0 ?
      <div className="empty-state"><h3>ยังไม่มีสัตว์เลี้ยงในความดูแล</h3><p>เลือกสัตว์เลี้ยงจากรายการด้านบนเพื่อรับเข้าดูแลและสร้างนัดหมาย</p></div> :
      <div className="pet-grid">{pets.map((pet) => <div className="care-pet-card" key={pet.id}><Link className="pet-card" to={`/vet/pets/${pet.id}`}>
        <PetAvatar pet={pet} />
        <span className="pet-card-details"><strong>{pet.name}</strong><span>{thaiValue(pet.species)}{pet.breed ? ` / ${pet.breed}` : ''}</span><span>เจ้าของ: {pet.owner_name}</span></span>
        <span className="card-arrow" aria-hidden="true">&rarr;</span>
      </Link><button className="text-button danger-text" onClick={() => { setPendingEnd(pet); setError(''); }}>ยุติการดูแล</button></div>)}</div>)}
    {pendingEnd && <section className="dashboard-section care-end-confirm" aria-label="ยืนยันยุติการดูแล">
      <h2>End Care</h2><p>ยืนยันยุติการดูแล {pendingEnd.name} หรือไม่? คุณจะไม่สามารถเข้าถึงประวัติ เอกสาร และนัดหมายของสัตว์เลี้ยงนี้จนกว่าจะรับเข้าดูแลอีกครั้ง</p>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="record-actions"><button className="danger-button" disabled={busy} onClick={endCare}>ยืนยันยุติการดูแล</button>
        <button className="secondary-button" disabled={busy} onClick={() => setPendingEnd(null)}>ยกเลิก</button></div>
    </section>}
  </AppShell>;
}
