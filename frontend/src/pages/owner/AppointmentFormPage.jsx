import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createAppointment, getAppointment, updateAppointment } from '../../api/appointments.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { listSharedPets } from '../../api/vet.js';
import { listPets } from '../../api/pets.js';
import { AppShell } from '../../components/AppShell.jsx';

function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AppointmentFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [status, setStatus] = useState('loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() =>  {
    let active = true;
    Promise.all([user.role === 'vet' ? listSharedPets() : listPets(), id ? getAppointment(id) : Promise.resolve(null)])
      .then(([petList, result]) =>  {
        if (active) { setPets(petList); setAppointment(result); setStatus('ready'); }
      })
      .catch((requestError) =>  { if (active) setStatus(requestError.response?.status === 404 ? 'missing' : 'error'); });
    return () =>  { active = false; };
  }, [id, user.role]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const details = { ...values, appointment_date: new Date(values.appointment_date).toISOString() };
      if (id) await updateAppointment(id, details);
      else await createAppointment(details);
      navigate('/appointments');
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'ไม่สามารถบันทึกนัดหมายได้');
      setSaving(false);
    }
  }

  const presetPetId = searchParams.get('petId');
  const selectedPet = appointment?.pet_id ?? (pets.some((pet) => pet.id === presetPetId) ? presetPetId : pets[0]?.id);

  return (
    <AppShell>
      <Link className="back-link" to="/appointments">&larr; กลับไปยังนัดหมาย</Link>
      <div className="page-heading"><p className="eyebrow">Care Schedule</p><h1>{id ? 'Edit Appointment' : 'New Appointment'}</h1></div>
      {user.role === 'vet' && <p className="muted">เลือกสัตว์เลี้ยงในความดูแลจากช่องด้านล่าง หรือ <Link to="/vet/pets">เลือกรับสัตว์เลี้ยงตัวใหม่เข้าดูแล</Link></p>}
      {status === 'loading' && <p className="muted" role="status">กำลังโหลด...</p>}
      {status === 'missing' && <p className="inline-error" role="alert">ไม่พบนัดหมาย</p>}
      {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดนัดหมายนี้ได้</p>}
      {status === 'ready' && (pets.length === 0 ?
        <div className="empty-state"><h2>ยังไม่มีสัตว์เลี้ยงที่สามารถนัดหมายได้</h2><p>สัตวแพทย์ต้องรับสัตว์เลี้ยงเข้าดูแลก่อนสร้างนัดหมาย</p>
          {user.role === 'admin' && <Link className="primary-link" to="/pets/new">เพิ่มสัตว์เลี้ยง</Link>}</div> :
        <form className="appointment-form" onSubmit={submit}>
          <div className="form-grid">
            <label>สัตว์เลี้ยง
              <select name="pet_id" defaultValue={selectedPet} required>
                {pets.map((pet) =>  <option key={pet.id} value={pet.id}>{pet.name}{pet.owner_name ? ` · ${pet.owner_name}` : ''}</option>)}
              </select>
            </label>
            <label>วันที่และเวลา
              <input name="appointment_date" type="datetime-local" defaultValue={localDateTime(appointment?.appointment_date)} required />
            </label>
            <label className="full-width">จุดประสงค์การนัดหมาย
              <input name="purpose" defaultValue={appointment?.purpose ?? ''} maxLength="5000" required />
            </label>
            <label className="full-width">คลินิก
              <input name="clinic_name" defaultValue={appointment?.clinic_name ?? ''} maxLength="160" />
            </label>
            <label className="full-width">หมายเหตุ
              <textarea name="notes" defaultValue={appointment?.notes ?? ''} maxLength="5000" rows="4" />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="record-actions">
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกนัดหมาย'}</button>
            <Link className="secondary-link" to="/appointments">ยกเลิก</Link>
          </div>
        </form>
      )}
    </AppShell>
  );
}
