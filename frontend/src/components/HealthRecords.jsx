import { thaiValue, formatThaiDate } from '../i18n.js';
import { useEffect, useRef, useState } from 'react';
import {
  createHealthRecord, deleteHealthRecord, downloadHealthDocument,
  listHealthRecords, updateHealthRecord
} from '../api/healthRecords.js';

const fields = {
  vaccinations: [
    ['vaccine_name', 'วัคซีน', 'text', true, 160], ['date_received', 'วันที่ได้รับวัคซีน', 'date', true],
    ['next_due_date', 'กำหนดครั้งถัดไป', 'date'], ['clinic_name', 'คลินิก', 'text', false, 160],
    ['vet_name', 'สัตวแพทย์', 'text', false, 160], ['notes', 'หมายเหตุ', 'textarea', false, 5000],
    ['document_url', 'ลิงก์ใบรับรอง', 'url', false, 2048]
  ],
  'medical-records': [
    ['visit_date', 'วันที่เข้ารับการรักษา', 'date', true], ['clinic_name', 'คลินิก', 'text', false, 160],
    ['vet_name', 'สัตวแพทย์', 'text', false, 160], ['symptoms', 'อาการ', 'textarea', false, 5000],
    ['diagnosis', 'การวินิจฉัย', 'textarea', false, 5000], ['treatment', 'การรักษา', 'textarea', false, 5000],
    ['medication', 'ยา', 'textarea', false, 5000], ['follow_up_date', 'วันที่นัดติดตามอาการ', 'date'],
    ['notes', 'หมายเหตุ', 'textarea', false, 5000]
  ],
  allergies: [
    ['allergy_type', 'ประเภท', 'text', true, 100], ['allergen_name', 'สารก่อภูมิแพ้', 'text', true, 160],
    ['reaction', 'อาการแพ้', 'textarea', false, 5000],
    ['severity', 'ความรุนแรง', 'select', false, null, ['low', 'medium', 'high', 'critical']],
    ['notes', 'หมายเหตุ', 'textarea', false, 5000]
  ],
  medications: [
    ['medication_name', 'ยา', 'text', true, 160], ['dosage', 'ขนาดยา', 'text', false, 120],
    ['frequency', 'ความถี่ในการใช้ยา', 'text', false, 120], ['start_date', 'วันที่เริ่มใช้ยา', 'date'],
    ['end_date', 'วันที่สิ้นสุด', 'date'], ['instruction', 'วิธีใช้', 'textarea', false, 5000],
    ['prescribed_by', 'ผู้สั่งยา', 'text', false, 160],
    ['status', 'สถานะ', 'select', false, null, ['active', 'completed', 'cancelled']]
  ],
  weights: [
    ['weight', 'น้ำหนัก (กก.)', 'number', true], ['record_date', 'วันที่บันทึก', 'date', true],
    ['notes', 'หมายเหตุ', 'textarea', false, 5000]
  ],
  documents: [
    ['title', 'ชื่อเอกสาร', 'text', true, 200],
    ['document_type', 'ประเภท', 'select', true, null, [
      'vaccination_certificate', 'medical_certificate', 'lab_result', 'prescription', 'insurance', 'other'
    ]],
    ['file', 'ไฟล์ PDF, PNG หรือ JPEG ขนาดไม่เกิน 10 MB', 'file', true]
  ]
};

const titles = {
  vaccinations: 'Vaccinations', 'medical-records': 'Medical Visits', allergies: 'Allergies',
  medications: 'Medications', weights: 'Weight History', documents: 'Documents'
};
const singular = {
  vaccinations: 'Vaccination', 'medical-records': 'Medical Visit', allergies: 'Allergy',
  medications: 'Medication', weights: 'Weight', documents: 'Documents'
};
const primary = {
  vaccinations: 'vaccine_name', 'medical-records': 'visit_date', allergies: 'allergen_name',
  medications: 'medication_name', weights: 'weight', documents: 'title'
};
const dates = new Set(['date_received', 'next_due_date', 'visit_date', 'follow_up_date', 'start_date', 'end_date', 'record_date']);
const label = thaiValue;

function RecordForm({ type, record, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const values = type === 'documents' ? data : Object.fromEntries(data.entries());
    try {
      await onSave(values);
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'ไม่สามารถบันทึกประวัติได้ กรุณาลองใหม่อีกครั้ง');
      setSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={submit}>
      <h3>{record ? 'Edit Record' : `Add ${singular[type]}`}</h3>
      <div className="form-grid">
        {fields[type].map(([name, text, kind, required, max, options]) =>  {
          const value = record?.[name] == null ? '' : dates.has(name) ? String(record[name]).slice(0, 10) : record[name];
          return (
            <label key={name} className={kind === 'textarea' || kind === 'file' ? 'full-width' : ''}>
              {text}
              {kind === 'textarea' ? <textarea name={name} defaultValue={value} maxLength={max} rows="3" /> :
                kind === 'select' ? <select name={name} defaultValue={value || options[0]}>
                  {options.map((option) =>  <option key={option} value={option}>{label(option)}</option>)}
                </select> :
                  <><input name={name} type={kind} defaultValue={kind === 'file' ? undefined : value}
                    className={kind === 'file' ? 'visually-hidden' : undefined}
                    onChange={kind === 'file' ? (event) => setFileName(event.target.files?.[0]?.name ?? '') : undefined}
                    required={required} maxLength={max} accept={kind === 'file' ? '.pdf,.png,.jpg,.jpeg' : undefined}
                    min={kind === 'number' ? '0.01' : undefined} max={kind === 'number' ? '9999.99' : undefined}
                    step={kind === 'number' ? '0.01' : undefined} />
                    {kind === 'file' && <span className="document-file-choice"><span>เลือกไฟล์เอกสาร</span><small>{fileName || 'ยังไม่ได้เลือกไฟล์'}</small></span>}</>}
            </label>
          );
        })}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="record-actions">
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกประวัติ'}</button>
        <button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>ยกเลิก</button>
      </div>
    </form>
  );
}

export function HealthRecords({ petId, vet = false }) {
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

  useEffect(() =>  {
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

  useEffect(() =>  {
    let active = true;
    setStatus('loading');
    setRecords([]);
    setError('');
    setShowForm(false);
    setEditing(null);
    setPendingDelete(null);
    listHealthRecords(petId, type, vet)
      .then((items) =>  { if (active) { setRecords(items); setStatus('ready'); } })
      .catch(() =>  { if (active) setStatus('error'); });
    return () =>  { active = false; };
  }, [petId, type, reload, vet]);

  async function refresh() {
    const items = await listHealthRecords(petId, type, vet);
    setRecords(items);
  }

  async function save(values) {
    if (editing) await updateHealthRecord(type, editing.id, values);
    else await createHealthRecord(petId, type, values, vet);
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
      setError(requestError.response?.data?.error ?? 'ไม่สามารถลบประวัติได้');
    } finally {
      setBusy(false);
    }
  }

  async function download(record) {
    setError('');
    try {
      const blob = await downloadHealthDocument(record.id, vet);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = { 'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg' }[blob.type] ?? '';
      link.download = record.title.toLowerCase().endsWith(extension) ? record.title : `${record.title}${extension}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('ไม่สามารถดาวน์โหลดเอกสารได้');
    }
  }

  return (
    <section className="details-section health-section" aria-labelledby="health-title">
      <div className="section-heading-row">
        <h2 id="health-title">Health Records</h2>
        {status === 'ready' && !showForm && (!vet || type === 'medical-records') && <button className="primary-button" type="button" onClick={() =>  { setEditing(null); setShowForm(true); }}>เพิ่มประวัติ</button>}
      </div>
      <div className="record-tabs" role="tablist" aria-label="ประเภทประวัติสุขภาพ">
        {Object.entries(titles).map(([key, text]) => (
          <button key={key} type="button" role="tab" aria-selected={type === key}
            aria-controls="health-record-panel" tabIndex={type === key ? 0 : -1}
            disabled={showForm || busy} className={type === key ? 'active' : ''}
            onKeyDown={handleTabKeyDown} onClick={() => setType(key)}>{text}</button>
        ))}
      </div>
      <div id="health-record-panel" role="tabpanel" aria-label={titles[type]}>
      {status === 'loading' && <p className="muted" role="status">กำลังโหลดประวัติ...</p>}
      {status === 'error' && <div className="inline-error" role="alert">ไม่สามารถโหลดประวัติได้ <button className="text-button" type="button" onClick={() => setReload((value) => value + 1)}>ลองใหม่</button></div>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {showForm && <RecordForm key={`${type}-${editing?.id ?? 'new'}`} type={type} record={editing}
        onSave={save} onCancel={() =>  { setShowForm(false); setEditing(null); }} />}
      {status === 'ready' && !showForm && (records.length === 0 ?
        <p className="muted record-empty">ยังไม่มีประวัติในหมวดนี้</p> :
        <div className="record-list">
          {records.map((record) => (
            <article className="record-item" key={record.id}>
              <div className="record-heading">
                <h3>{type === 'weights' ? `${record.weight} กก.` : dates.has(primary[type]) ? formatThaiDate(record[primary[type]]) : record[primary[type]]}</h3>
                <div className="record-item-actions">
                  {type === 'documents' ? <button className="text-button" type="button" onClick={() => download(record)}>ดาวน์โหลด</button> :
                    !vet && <button className="text-button" type="button" onClick={() =>  { setEditing(record); setShowForm(true); }}>แก้ไข</button>}
                  {!vet && <button className="text-button danger-text" type="button" onClick={() => setPendingDelete(record)}>ลบ</button>}
                </div>
              </div>
              <dl className="record-details">
                {fields[type].filter(([name]) => name !== primary[type] && name !== 'file' && record[name] != null && record[name] !== '').map(([name, text]) => (
                  <div key={name}><dt>{text}</dt><dd>{dates.has(name) ? formatThaiDate(record[name]) : name === 'document_url' ?
                    <a href={record[name]} target="_blank" rel="noreferrer">เปิดใบรับรอง</a> :
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
          <h2 id="record-delete-title">ต้องการลบประวัตินี้หรือไม่?</h2>
          <p id="record-delete-description">เมื่อลบแล้วจะไม่สามารถกู้คืนได้</p>
          <div className="modal-actions">
            <button className="secondary-button" type="button" ref={cancelDeleteButton} onClick={() => setPendingDelete(null)} disabled={busy}>ยกเลิก</button>
            <button className="danger-button filled" type="button" onClick={remove} disabled={busy}>{busy ? 'กำลังลบ...' : 'ลบประวัติ'}</button>
          </div>
        </div>
      </div>}
    </section>
  );
}
