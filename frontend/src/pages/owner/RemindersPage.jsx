import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReminders, markReminderRead } from '../../api/reminders.js';
import { AppShell } from '../../components/AppShell.jsx';

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
const formatDateTime = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listReminders()
      .then((items) => { if (active) { setReminders(items); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, []);

  async function markRead(id) {
    setBusyId(id);
    setError('');
    try {
      await markReminderRead(id);
      setReminders((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item));
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Could not mark this reminder as read.');
    } finally {
      setBusyId(null);
    }
  }

  const unread = reminders.filter((reminder) => !reminder.is_read).length;

  return (
    <AppShell>
      <div className="page-heading"><p className="eyebrow">Coming up</p><h1>Reminders</h1></div>
      {status === 'loading' && <p className="muted" role="status">Loading reminders...</p>}
      {status === 'error' && <p className="inline-error" role="alert">Could not load reminders.</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {status === 'ready' && <>
        <p className="muted">{unread} unread · Events in the next 30 days</p>
        {reminders.length === 0 ?
          <div className="empty-state"><h2>Nothing due soon</h2><p>Upcoming care dates will appear here.</p></div> :
          <div className="reminder-list">
            {reminders.map((reminder) => (
              <article className={`reminder-item ${reminder.is_read ? 'read' : ''}`} key={reminder.id}>
                <div className="reminder-date">{reminder.event_at ? formatDateTime(reminder.event_at) : formatDate(reminder.reminder_date)}</div>
                <div className="reminder-main"><h2>{reminder.title}</h2><p>{reminder.message}</p>
                  <Link to={reminder.target_url}>{reminder.type === 'appointment' ? 'View appointment' : `View ${reminder.pet_name}`}</Link>
                </div>
                {!reminder.is_read && <button className="secondary-button" type="button" disabled={busyId === reminder.id}
                  onClick={() => markRead(reminder.id)}>{busyId === reminder.id ? 'Saving...' : 'Mark read'}</button>}
              </article>
            ))}
          </div>}
      </>}
    </AppShell>
  );
}
