import { thaiValue, formatThaiDate } from '../../i18n.js';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSharedPet } from '../../api/vet.js';
import { AppShell } from '../../components/AppShell.jsx';
import { HealthRecords } from '../../components/HealthRecords.jsx';
import { PetAvatar } from '../../components/PetAvatar.jsx';

const show = (value, suffix = '') => value == null || value === '' ? 'ยังไม่ระบุ' : `${thaiValue(value)}${suffix}`;

export function SharedPetDetailPage() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() =>  {
    setStatus('loading');
    getSharedPet(id).then((result) =>  { setPet(result); setStatus('ready'); })
      .catch((error) => setStatus(error.response?.status === 404 ? 'missing' : 'error'));
  }, [id]);

  return <AppShell>
    <Link className="back-link" to="/vet/pets">&larr; กลับไปยังสัตว์เลี้ยงในความดูแล</Link>
    {status === 'loading' && <p className="muted" role="status">กำลังโหลดข้อมูลสัตว์เลี้ยง...</p>}
    {status === 'missing' && <p className="inline-error" role="alert">ไม่พบสัตว์เลี้ยงหรือสิทธิ์การดูแลถูกถอนแล้ว</p>}
    {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้</p>}
    {status === 'ready' && <>
      <div className="pet-profile-heading">
        <PetAvatar pet={pet} className="large-avatar" />
        <div className="pet-profile-title"><p className="eyebrow">Pet Health Passport</p><h1>{pet.name}</h1><p>{[thaiValue(pet.species), pet.breed].filter(Boolean).join(' / ')} &middot; เจ้าของ: {pet.owner_name}</p></div>
        <Link className="primary-link" to={`/appointments/new?petId=${id}`}>สร้างนัดหมาย</Link>
      </div>
      <section className="details-section" aria-labelledby="details-title">
        <h2 id="details-title">Details</h2>
        <dl className="details-grid">
          <div><dt>ประเภทสัตว์</dt><dd>{show(pet.species)}</dd></div>
          <div><dt>สายพันธุ์</dt><dd>{show(pet.breed)}</dd></div>
          <div><dt>เพศ</dt><dd>{show(pet.gender)}</dd></div>
          <div><dt>วันเกิด</dt><dd>{formatThaiDate(pet.birth_date)}</dd></div>
          <div><dt>น้ำหนัก</dt><dd>{show(pet.weight, ' กก.')}</dd></div>
          <div><dt>หมายเลขไมโครชิป</dt><dd>{show(pet.microchip_id)}</dd></div>
        </dl>
      </section>
      <section className="details-section" aria-labelledby="notes-title"><h2 id="notes-title">Medical Notes</h2><p className="notes-text">{show(pet.medical_notes)}</p></section>
      <HealthRecords petId={id} vet />
    </>}
  </AppShell>;
}
