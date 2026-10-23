import { thaiValue } from '../i18n.js';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPets } from '../api/pets.js';
import { PetAvatar } from './PetAvatar.jsx';

export function PetCollection({ limit }) {
  const [pets, setPets] = useState([]);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () =>  {
    setStatus('loading');
    try {
      setPets(await listPets());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() =>  { load(); }, [load]);

  if (status === 'loading') return <p className="muted" role="status">กำลังโหลดสัตว์เลี้ยง...</p>;
  if (status === 'error') return (
    <div className="inline-error" role="alert">
      <p>ไม่สามารถโหลดรายการสัตว์เลี้ยงได้</p>
      <button type="button" className="secondary-button" onClick={load}>ลองใหม่</button>
    </div>
  );
  if (!pets.length) return (
    <div className="empty-state">
      <h3>ยังไม่มีสัตว์เลี้ยง</h3>
      <p>เพิ่มสัตว์เลี้ยงตัวแรกเพื่อเริ่มบันทึกสมุดสุขภาพ</p>
      <Link className="primary-link" to="/pets/new">เพิ่มสัตว์เลี้ยง</Link>
    </div>
  );

  return (
    <>
      <p className="collection-count">{pets.length} ตัว</p>
      <div className="pet-grid">
        {pets.slice(0, limit).map((pet) => (
          <Link className="pet-card" to={`/pets/${pet.id}`} key={pet.id}>
            <PetAvatar pet={pet} />
            <span className="pet-card-details">
              <strong>{pet.name}</strong>
              <span>{[thaiValue(pet.species), pet.breed].filter(Boolean).join(' / ')}</span>
            </span>
            <span className="card-arrow" aria-hidden="true">&rarr;</span>
          </Link>
        ))}
      </div>
      {limit && pets.length > limit && <Link className="more-link" to="/pets">ดูสัตว์เลี้ยงทั้งหมด</Link>}
    </>
  );
}

