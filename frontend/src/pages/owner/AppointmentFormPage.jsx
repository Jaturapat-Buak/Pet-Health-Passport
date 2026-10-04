import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createAppointment, getAppointment, updateAppointment } from '../../api/appointments.js';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [status, setStatus] = useState('loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([listPets(), id ? getAppointment(id) : Promise.resolve(null)])
      .then(([petList, result]) => {
        if (active) { setPets(petList); setAppointment(result); setStatus('ready'); }
      })
      .catch((requestError) => { if (active) setStatus(requestError.response?.status === 404 ? 'missing' : 'error'); });
    return () => { active = false; };
  }, [id]);

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
      setError(requestError.response?.data?.error ?? 'Could not save this appointment.');
      setSaving(false);
    }
  }

  const presetPetId = searchParams.get('petId');
  const selectedPet = appointment?.pet_id ?? (pets.some((pet) => pet.id === presetPetId) ? presetPetId : pets[0]?.id);

  return (
    <AppShell>
      <Link className="back-link" to="/appointments">&larr; Back to appointments</Link>
      <div className="page-heading"><p className="eyebrow">Care schedule</p><h1>{id ? 'Edit appointment' : 'New appointment'}</h1></div>
      {status === 'loading' && <p className="muted" role="status">Loading...</p>}
      {status === 'missing' && <p className="inline-error" role="alert">Appointment not found.</p>}
      {status === 'error' && <p className="inline-error" role="alert">Could not load this appointment.</p>}
      {status === 'ready' && (pets.length === 0 ?
        <div className="empty-state"><h2>Add a pet first</h2><p>Appointments need a pet profile.</p>
          <Link className="primary-link" to="/pets/new">Add pet</Link></div> :
        <form className="appointment-form" onSubmit={submit}>
          <div className="form-grid">
            <label>Pet
              <select name="pet_id" defaultValue={selectedPet} required>
                {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
              </select>
            </label>
            <label>Date and time
              <input name="appointment_date" type="datetime-local" defaultValue={localDateTime(appointment?.appointment_date)} required />
            </label>
            <label className="full-width">Purpose
              <input name="purpose" defaultValue={appointment?.purpose ?? ''} maxLength="5000" required />
            </label>
            <label className="full-width">Clinic
              <input name="clinic_name" defaultValue={appointment?.clinic_name ?? ''} maxLength="160" />
            </label>
            <label className="full-width">Notes
              <textarea name="notes" defaultValue={appointment?.notes ?? ''} maxLength="5000" rows="4" />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="record-actions">
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save appointment'}</button>
            <Link className="secondary-link" to="/appointments">Cancel</Link>
          </div>
        </form>
      )}
    </AppShell>
  );
}
