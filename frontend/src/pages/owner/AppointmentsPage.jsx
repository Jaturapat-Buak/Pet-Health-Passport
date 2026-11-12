import { thaiValue } from '../../i18n.js';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteAppointment, listAppointments, updateAppointmentStatus } from '../../api/appointments.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { AppShell } from '../../components/AppShell.jsx';

const formatDate = (value) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export function AppointmentsPage() {
  const { user } = useAuth();
  const canManage = ['vet', 'admin'].includes(user.role);
  const [view, setView] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const cancelButton = useRef(null);

  useEffect(() =>  {
    let active = true;
    setStatus('loading');
    setError('');
    listAppointments(view)
      .then((items) =>  { if (active) { setAppointments(items); setStatus('ready'); } })
      .catch(() =>  { if (active) setStatus('error'); });
    return () =>  { active = false; };
  }, [view]);

  useEffect(() =>  {
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
      setError(requestError.response?.data?.error ?? 'ไม่สามารถเปลี่ยนสถานะนัดหมายได้');
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
      setError(requestError.response?.data?.error ?? 'ไม่สามารถลบนัดหมายได้');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <div className="page-heading with-action">
        <div><p className="eyebrow">Care Schedule</p><h1>Appointments</h1></div>
        {canManage && <Link className="primary-link" to="/appointments/new">สร้างนัดหมาย</Link>}
      </div>
      {user.role === 'vet' && <p className="muted">ต้องการนัดสัตว์เลี้ยงตัวใหม่? <Link to="/vet/pets">เลือกรายการสัตว์เลี้ยงและสร้างนัดหมาย</Link></p>}
      {!canManage && <p className="muted">นัดหมายจะจัดการโดยสัตวแพทย์ คุณสามารถดูรายละเอียดได้ที่นี่</p>}
      <div className="view-switch" role="group" aria-label="รายการนัดหมาย">
        <button type="button" aria-pressed={view === 'upcoming'} onClick={() => setView('upcoming')}>กำลังจะมาถึง</button>
        <button type="button" aria-pressed={view === 'all'} onClick={() => setView('all')}>นัดหมายทั้งหมด</button>
      </div>
      {status === 'loading' && <p className="muted" role="status">กำลังโหลดนัดหมาย...</p>}
      {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดนัดหมายได้</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {status === 'ready' && (appointments.length === 0 ?
        <div className="empty-state"><h2>{view === 'upcoming' ? 'ยังไม่มีนัดหมายที่กำลังจะมาถึง' : 'ยังไม่มีนัดหมาย'}</h2>
          <p>นัดหมายของสัตว์เลี้ยงจะแสดงที่นี่</p>
          {canManage && <Link className="primary-link" to="/appointments/new">สร้างนัดหมาย</Link>}
        </div> :
        <div className="appointment-list">
          {appointments.map((appointment) => (
            <article className="appointment-item" key={appointment.id}>
              <div className="appointment-date"><strong>{formatDate(appointment.appointment_date)}</strong>
                <span className={`status-label status-${appointment.status}`}>{thaiValue(appointment.status)}</span></div>
              <div className="appointment-main">
                <h2>{appointment.purpose}</h2>
                <p><Link to={user.role === 'vet' ? `/vet/pets/${appointment.pet_id}` : `/pets/${appointment.pet_id}`}>{appointment.pet_name}</Link>{appointment.clinic_name ? ` · ${appointment.clinic_name}` : ''}</p>
                {appointment.notes && <p className="appointment-notes">{appointment.notes}</p>}
              </div>
              {canManage && <div className="appointment-controls">
                <label>สถานะ
                  <select aria-label={`สถานะนัดหมาย ${appointment.purpose}`} value={appointment.status}
                    disabled={busyId === appointment.id} onChange={(event) => changeStatus(appointment, event.target.value)}>
                    <option value="upcoming">กำลังจะมาถึง</option><option value="completed">เสร็จสิ้น</option><option value="cancelled">ยกเลิกแล้ว</option>
                  </select>
                </label>
                <div className="appointment-actions">
                  <Link to={`/appointments/${appointment.id}/edit`}>แก้ไข</Link>
                  <button className="text-button danger-text" type="button" onClick={() => setPendingDelete(appointment)}>ลบ</button>
                </div>
              </div>}
            </article>
          ))}
        </div>
      )}
      {pendingDelete && <div className="modal-backdrop" role="presentation">
        <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="appointment-delete-title" aria-describedby="appointment-delete-description" onKeyDown={handleDialogKeyDown}>
          <h2 id="appointment-delete-title">ต้องการลบนัดหมายนี้หรือไม่?</h2>
          <p id="appointment-delete-description">นัดหมาย {pendingDelete.purpose} ของ {pendingDelete.pet_name} จะถูกลบ</p>
          <div className="modal-actions">
            <button className="secondary-button" type="button" ref={cancelButton} onClick={() => setPendingDelete(null)} disabled={Boolean(busyId)}>ยกเลิก</button>
            <button className="danger-button filled" type="button" onClick={remove} disabled={Boolean(busyId)}>{busyId ? 'กำลังลบ...' : 'ลบนัดหมาย'}</button>
          </div>
        </div>
      </div>}
    </AppShell>
  );
}
