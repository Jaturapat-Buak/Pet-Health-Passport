import { thaiValue, formatThaiDate } from '../../i18n.js';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deletePet, getPet } from '../../api/pets.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { AppShell } from '../../components/AppShell.jsx';
import { HealthRecords } from '../../components/HealthRecords.jsx';
import { PetAvatar } from '../../components/PetAvatar.jsx';
import { VetAccess } from '../../components/VetAccess.jsx';

function show(value, suffix = '') {
  return value == null || value === '' ? 'ยังไม่ระบุ' : `${thaiValue(value)}${suffix}`;
}

export function PetDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [status, setStatus] = useState('loading');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const cancelButton = useRef(null);

  useEffect(() =>  {
    setStatus('loading');
    setPet(null);
    setConfirmDelete(false);
    getPet(id)
      .then((result) =>  { setPet(result); setStatus('ready'); })
      .catch((error) => setStatus(error.response?.status === 404 ? 'missing' : 'error'));
  }, [id]);

  useEffect(() =>  {
    if (!confirmDelete) return;
    const previousFocus = document.activeElement;
    cancelButton.current?.focus();
    return () => previousFocus?.focus();
  }, [confirmDelete]);

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !deleting) {
      setConfirmDelete(false);
    }
    if (event.key !== 'Tab') return;
    const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')];
    const current = buttons.indexOf(document.activeElement);
    if (event.shiftKey && current === 0) {
      event.preventDefault();
      buttons.at(-1)?.focus();
    } else if (!event.shiftKey && current === buttons.length - 1) {
      event.preventDefault();
      buttons[0]?.focus();
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deletePet(id);
      navigate('/pets', { replace: true });
    } catch (error) {
      setDeleteError(error.response?.data?.error ?? 'ไม่สามารถลบสัตว์เลี้ยงได้ กรุณาลองใหม่อีกครั้ง');
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <Link className="back-link" to="/pets">&larr; กลับไปยังสัตว์เลี้ยง</Link>
      {status === 'loading' && <p className="muted" role="status">กำลังโหลดข้อมูลสัตว์เลี้ยง...</p>}
      {status === 'missing' && <p className="inline-error" role="alert">ไม่พบสัตว์เลี้ยง</p>}
      {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้</p>}
      {status === 'ready' && (
        <>
          <div className="pet-profile-heading">
            <PetAvatar pet={pet} className="large-avatar" />
            <div className="pet-profile-title">
              <p className="eyebrow">Pet Profile</p>
              <h1>{pet.name}</h1>
              <p>{[thaiValue(pet.species), pet.breed].filter(Boolean).join(' / ')}</p>
            </div>
            <div className="pet-profile-actions">
              {user.role === 'admin' && <Link className="secondary-link" to={`/appointments/new?petId=${id}`}>สร้างนัดหมาย</Link>}
              <Link className="secondary-link" to={`/pets/${id}/edit`}>แก้ไขข้อมูล</Link>
            </div>
          </div>

          <section className="details-section" aria-labelledby="details-title">
            <h2 id="details-title">Details</h2>
            <dl className="details-grid">
              <div><dt>ประเภทสัตว์</dt><dd>{show(pet.species)}</dd></div>
              <div><dt>สายพันธุ์</dt><dd>{show(pet.breed)}</dd></div>
              <div><dt>เพศ</dt><dd>{show(pet.gender)}</dd></div>
              <div><dt>วันเกิด</dt><dd>{formatThaiDate(pet.birth_date)}</dd></div>
              <div><dt>สี</dt><dd>{show(pet.color)}</dd></div>
              <div><dt>น้ำหนัก</dt><dd>{show(pet.weight, ' กก.')}</dd></div>
              <div><dt>หมายเลขไมโครชิป</dt><dd>{show(pet.microchip_id)}</dd></div>
            </dl>
          </section>

          <section className="details-section" aria-labelledby="notes-title">
            <h2 id="notes-title">Medical Notes</h2>
            <p className="notes-text">{show(pet.medical_notes)}</p>
          </section>

          <HealthRecords petId={id} />
          <VetAccess petId={id} />

          <section className="danger-section" aria-labelledby="remove-title">
            <h2 id="remove-title">Remove Pet</h2>
            <button className="danger-button" type="button" onClick={() => setConfirmDelete(true)}>ลบข้อมูลสัตว์เลี้ยง</button>
          </section>
        </>
      )}

      {confirmDelete && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" onKeyDown={handleDialogKeyDown}>
            <h2 id="delete-title">ลบ {pet.name}?</h2>
            <p id="delete-description">ประวัติสุขภาพทั้งหมดของสัตว์เลี้ยงนี้จะถูกลบด้วย และไม่สามารถกู้คืนได้</p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="modal-actions">
              <button className="secondary-button" type="button" ref={cancelButton} onClick={() => setConfirmDelete(false)} disabled={deleting}>ยกเลิก</button>
              <button className="danger-button filled" type="button" onClick={handleDelete} disabled={deleting}>{deleting ? 'กำลังลบ...' : 'ลบสัตว์เลี้ยง'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
