import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteAppointment, listAppointments, updateAppointmentStatus } from '../../api/appointments.js';
import { AppShell } from '../../components/AppShell.jsx';

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export function AppointmentsPage() {
  const [view, setView] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const cancelButton = useRef(null);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError('');
    listAppointments(view)
      .then((items) => { if (active) { setAppointments(items); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [view]);

  useEffect(() => {
    if (!pendingDelete) return;
    const previousFocus = document.activeElement;
    cancelButton.current?.focus();
    return () => previousFocus?.focus();
  }, [pendingDelete]);

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !busyId) setPendingDelete(null);
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

  async function changeStatus(appointment, nextStatus) {
    setBusyId(appointment.id);
    setError('');
    try {
      const updated = await updateAppointmentStatus(appointment.id, nextStatus);
      setAppointments((items) => view === 'upcoming' && nextStatus !== 'upcoming' ?
        items.filter((item) => item.id !== appointment.id) :
        items.map((item) => item.id === appointment.id ? { ...item, status: updated.status } : item));
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Could not update appointment status.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    setBusyId(pendingDelete.id);
    setError('');
    try {
      await deleteAppointment(pendingDelete.id);
      setAppointments((items) => items.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Could not delete this appointment.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <div className="page-heading with-action">
        <div><p className="eyebrow">Care schedule</p><h1>Appointments</h1></div>
        <Link className="primary-link" to="/appointments/new">New appointment</Link>
      </div>
      <div className="view-switch" role="group" aria-label="Appointment view">
        <button type="button" aria-pressed={view === 'upcoming'} onClick={() => setView('upcoming')}>Upcoming</button>
        <button type="button" aria-pressed={view === 'all'} onClick={() => setView('all')}>All appointments</button>
      </div>
      {status === 'loading' && <p className="muted" role="status">Loading appointments...</p>}
      {status === 'error' && <p className="inline-error" role="alert">Could not load appointments.</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {status === 'ready' && (appointments.length === 0 ?
        <div className="empty-state"><h2>No {view === 'upcoming' ? 'upcoming' : ''} appointments</h2>
          <p>Appointments for your pets will appear here.</p>
          <Link className="primary-link" to="/appointments/new">New appointment</Link>
        </div> :
        <div className="appointment-list">
          {appointments.map((appointment) => (
            <article className="appointment-item" key={appointment.id}>
              <div className="appointment-date"><strong>{formatDate(appointment.appointment_date)}</strong>
                <span className={`status-label status-${appointment.status}`}>{appointment.status}</span></div>
              <div className="appointment-main">
                <h2>{appointment.purpose}</h2>
                <p><Link to={`/pets/${appointment.pet_id}`}>{appointment.pet_name}</Link>{appointment.clinic_name ? ` · ${appointment.clinic_name}` : ''}</p>
                {appointment.notes && <p className="appointment-notes">{appointment.notes}</p>}
              </div>
              <div className="appointment-controls">
                <label>Status
                  <select aria-label={`Status for ${appointment.purpose}`} value={appointment.status}
                    disabled={busyId === appointment.id} onChange={(event) => changeStatus(appointment, event.target.value)}>
                    <option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <div className="appointment-actions">
                  <Link to={`/appointments/${appointment.id}/edit`}>Edit</Link>
                  <button className="text-button danger-text" type="button" onClick={() => setPendingDelete(appointment)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {pendingDelete && <div className="modal-backdrop" role="presentation">
        <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="appointment-delete-title" aria-describedby="appointment-delete-description" onKeyDown={handleDialogKeyDown}>
          <h2 id="appointment-delete-title">Delete this appointment?</h2>
          <p id="appointment-delete-description">{pendingDelete.purpose} for {pendingDelete.pet_name} will be removed.</p>
          <div className="modal-actions">
            <button className="secondary-button" type="button" ref={cancelButton} onClick={() => setPendingDelete(null)} disabled={Boolean(busyId)}>Cancel</button>
            <button className="danger-button filled" type="button" onClick={remove} disabled={Boolean(busyId)}>{busyId ? 'Deleting...' : 'Delete appointment'}</button>
          </div>
        </div>
      </div>}
    </AppShell>
  );
}
