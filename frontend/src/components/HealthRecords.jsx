import { useEffect, useRef, useState } from 'react';
import {
  createHealthRecord, deleteHealthRecord, downloadHealthDocument,
  listHealthRecords, updateHealthRecord
} from '../api/healthRecords.js';

const fields = {
  vaccinations: [
    ['vaccine_name', 'Vaccine', 'text', true, 160], ['date_received', 'Date received', 'date', true],
    ['next_due_date', 'Next due', 'date'], ['clinic_name', 'Clinic', 'text', false, 160],
    ['vet_name', 'Veterinarian', 'text', false, 160], ['notes', 'Notes', 'textarea', false, 5000],
    ['document_url', 'Certificate URL', 'url', false, 2048]
  ],
  'medical-records': [
    ['visit_date', 'Visit date', 'date', true], ['clinic_name', 'Clinic', 'text', false, 160],
    ['vet_name', 'Veterinarian', 'text', false, 160], ['symptoms', 'Symptoms', 'textarea', false, 5000],
    ['diagnosis', 'Diagnosis', 'textarea', false, 5000], ['treatment', 'Treatment', 'textarea', false, 5000],
    ['medication', 'Medication', 'textarea', false, 5000], ['follow_up_date', 'Follow-up', 'date'],
    ['notes', 'Notes', 'textarea', false, 5000]
  ],
  allergies: [
    ['allergy_type', 'Type', 'text', true, 100], ['allergen_name', 'Allergen', 'text', true, 160],
    ['reaction', 'Reaction', 'textarea', false, 5000],
    ['severity', 'Severity', 'select', false, null, ['low', 'medium', 'high', 'critical']],
    ['notes', 'Notes', 'textarea', false, 5000]
  ],
  medications: [
    ['medication_name', 'Medication', 'text', true, 160], ['dosage', 'Dosage', 'text', false, 120],
    ['frequency', 'Frequency', 'text', false, 120], ['start_date', 'Start date', 'date'],
    ['end_date', 'End date', 'date'], ['instruction', 'Instructions', 'textarea', false, 5000],
    ['prescribed_by', 'Prescribed by', 'text', false, 160],
    ['status', 'Status', 'select', false, null, ['active', 'completed', 'cancelled']]
  ],
  weights: [
    ['weight', 'Weight (kg)', 'number', true], ['record_date', 'Recorded on', 'date', true],
    ['notes', 'Notes', 'textarea', false, 5000]
  ],
  documents: [
    ['title', 'Title', 'text', true, 200],
    ['document_type', 'Type', 'select', true, null, [
      'vaccination_certificate', 'medical_certificate', 'lab_result', 'prescription', 'insurance', 'other'
    ]],
    ['file', 'File (PDF, PNG or JPEG, max 10 MB)', 'file', true]
  ]
};

const titles = {
  vaccinations: 'Vaccinations', 'medical-records': 'Medical visits', allergies: 'Allergies',
  medications: 'Medications', weights: 'Weight history', documents: 'Documents'
};
const singular = {
  vaccinations: 'vaccination', 'medical-records': 'medical visit', allergies: 'allergy',
  medications: 'medication', weights: 'weight', documents: 'document'
};
const primary = {
  vaccinations: 'vaccine_name', 'medical-records': 'visit_date', allergies: 'allergen_name',
  medications: 'medication_name', weights: 'weight', documents: 'title'
};
const dates = new Set(['date_received', 'next_due_date', 'visit_date', 'follow_up_date', 'start_date', 'end_date', 'record_date']);
const label = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function RecordForm({ type, record, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const values = type === 'documents' ? data : Object.fromEntries(data.entries());
    try {
      await onSave(values);
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Could not save this record. Please try again.');
      setSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={submit}>
      <h3>{record ? 'Edit record' : `Add ${singular[type]}`}</h3>
      <div className="form-grid">
        {fields[type].map(([name, text, kind, required, max, options]) => {
          const value = record?.[name] == null ? '' : dates.has(name) ? String(record[name]).slice(0, 10) : record[name];
          return (
            <label key={name} className={kind === 'textarea' || kind === 'file' ? 'full-width' : ''}>
              {text}
              {kind === 'textarea' ? <textarea name={name} defaultValue={value} maxLength={max} rows="3" /> :
                kind === 'select' ? <select name={name} defaultValue={value || options[0]}>
                  {options.map((option) => <option key={option} value={option}>{label(option)}</option>)}
                </select> :
                  <input name={name} type={kind} defaultValue={kind === 'file' ? undefined : value}
                    required={required} maxLength={max} accept={kind === 'file' ? '.pdf,.png,.jpg,.jpeg' : undefined}
                    min={kind === 'number' ? '0.01' : undefined} max={kind === 'number' ? '9999.99' : undefined}
                    step={kind === 'number' ? '0.01' : undefined} />}
            </label>
          );
        })}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="record-actions">
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save record'}</button>
        <button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

export function HealthRecords({ petId }) {
  const [type, setType] = useState('vaccinations');
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('loading');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const cancelDeleteButton = useRef(null);

  useEffect(() => {
    if (!pendingDelete) return;
    const previousFocus = document.activeElement;
    cancelDeleteButton.current?.focus();
    return () => previousFocus?.focus();
  }, [pendingDelete]);

  function handleTabKeyDown(event) {
    const keys = Object.keys(titles);
    const current = keys.indexOf(type);
    const next = event.key === 'ArrowRight' ? (current + 1) % keys.length :
      event.key === 'ArrowLeft' ? (current - 1 + keys.length) % keys.length :
        event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : -1;
    if (next === -1) return;
    event.preventDefault();
    setType(keys[next]);
    event.currentTarget.parentElement.children[next].focus();
  }

  function handleDeleteDialogKeyDown(event) {
    if (event.key === 'Escape' && !busy) setPendingDelete(null);
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

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setRecords([]);
    setError('');
    setShowForm(false);
    setEditing(null);
    setPendingDelete(null);
    listHealthRecords(petId, type)
      .then((items) => { if (active) { setRecords(items); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [petId, type, reload]);

  async function refresh() {
    const items = await listHealthRecords(petId, type);
    setRecords(items);
  }

  async function save(values) {
    if (editing) await updateHealthRecord(type, editing.id, values);
    else await createHealthRecord(petId, type, values);
    await refresh();
    setShowForm(false);
    setEditing(null);
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      await deleteHealthRecord(type, pendingDelete.id);
      await refresh();
      setPendingDelete(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Could not delete this record.');
    } finally {
      setBusy(false);
    }
  }

  async function download(record) {
    setError('');
    try {
      const blob = await downloadHealthDocument(record.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = { 'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg' }[blob.type] ?? '';
      link.download = record.title.toLowerCase().endsWith(extension) ? record.title : `${record.title}${extension}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Could not download this document.');
    }
  }

  return (
    <section className="details-section health-section" aria-labelledby="health-title">
      <div className="section-heading-row">
        <h2 id="health-title">Health records</h2>
        {status === 'ready' && !showForm && <button className="primary-button" type="button" onClick={() => { setEditing(null); setShowForm(true); }}>Add record</button>}
      </div>
      <div className="record-tabs" role="tablist" aria-label="Health record type">
        {Object.entries(titles).map(([key, text]) => (
          <button key={key} type="button" role="tab" aria-selected={type === key}
            aria-controls="health-record-panel" tabIndex={type === key ? 0 : -1}
            disabled={showForm || busy} className={type === key ? 'active' : ''}
            onKeyDown={handleTabKeyDown} onClick={() => setType(key)}>{text}</button>
        ))}
      </div>
      <div id="health-record-panel" role="tabpanel" aria-label={titles[type]}>
      {status === 'loading' && <p className="muted" role="status">Loading records...</p>}
      {status === 'error' && <div className="inline-error" role="alert">Could not load records. <button className="text-button" type="button" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {showForm && <RecordForm key={`${type}-${editing?.id ?? 'new'}`} type={type} record={editing}
        onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      {status === 'ready' && !showForm && (records.length === 0 ?
        <p className="muted record-empty">No {titles[type].toLowerCase()} recorded yet.</p> :
        <div className="record-list">
          {records.map((record) => (
            <article className="record-item" key={record.id}>
              <div className="record-heading">
                <h3>{type === 'weights' ? `${record.weight} kg` : dates.has(primary[type]) ? String(record[primary[type]]).slice(0, 10) : record[primary[type]]}</h3>
                <div className="record-item-actions">
                  {type === 'documents' ? <button className="text-button" type="button" onClick={() => download(record)}>Download</button> :
                    <button className="text-button" type="button" onClick={() => { setEditing(record); setShowForm(true); }}>Edit</button>}
                  <button className="text-button danger-text" type="button" onClick={() => setPendingDelete(record)}>Delete</button>
                </div>
              </div>
              <dl className="record-details">
                {fields[type].filter(([name]) => name !== primary[type] && name !== 'file' && record[name] != null && record[name] !== '').map(([name, text]) => (
                  <div key={name}><dt>{text}</dt><dd>{dates.has(name) ? String(record[name]).slice(0, 10) : name === 'document_url' ?
                    <a href={record[name]} target="_blank" rel="noreferrer">Open certificate</a> :
                      ['severity', 'status', 'document_type'].includes(name) ? label(String(record[name])) : String(record[name])}</dd></div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}
      </div>
      {pendingDelete && <div className="modal-backdrop" role="presentation">
        <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="record-delete-title" aria-describedby="record-delete-description" onKeyDown={handleDeleteDialogKeyDown}>
          <h2 id="record-delete-title">Delete this record?</h2>
          <p id="record-delete-description">This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="secondary-button" type="button" ref={cancelDeleteButton} onClick={() => setPendingDelete(null)} disabled={busy}>Cancel</button>
            <button className="danger-button filled" type="button" onClick={remove} disabled={busy}>{busy ? 'Deleting...' : 'Delete record'}</button>
          </div>
        </div>
      </div>}
    </section>
  );
}
