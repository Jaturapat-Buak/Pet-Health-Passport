import { useEffect, useState } from 'react';
import { grantPetVet, listPetVets, revokePetVet } from '../api/vet.js';
import { useAuth } from '../auth/AuthContext.jsx';

export function VetAccess({ petId }) {
  const { user } = useAuth();
  const canManage = user.role === 'admin';
  const [vets, setVets] = useState([]);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() =>  {
    let active = true;
    listPetVets(petId).then((items) =>  {
      if (active) { setVets(items); setStatus('ready'); }
    }).catch(() =>  { if (active) setStatus('error'); });
    return () =>  { active = false; };
  }, [petId]);

  async function refresh() {
    setVets(await listPetVets(petId));
  }

  async function grant(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await grantPetVet(petId, email.trim());
      await refresh();
      setEmail('');
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'ไม่สามารถอนุญาตให้สัตวแพทย์ดูแลได้');
    } finally { setBusy(false); }
  }

  async function revoke(vetId) {
    setBusy(true);
    setError('');
    try {
      await revokePetVet(petId, vetId);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'ไม่สามารถถอนสิทธิ์การดูแลได้');
    } finally { setBusy(false); }
  }

  return <section className="details-section" aria-labelledby="vet-access-title">
    <h2 id="vet-access-title">Veterinarian Access</h2>
    {status === 'loading' && <p className="muted" role="status">กำลังโหลดสิทธิ์การดูแล...</p>}
    {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดสิทธิ์การดูแลของสัตวแพทย์ได้</p>}
    {status === 'ready' && <>
      <div className="care-status-row">
        <span className={`care-status ${vets.length ? 'care-status-active' : ''}`}>{vets.length ? 'มีสัตวแพทย์ดูแลแล้ว' : 'ยังไม่มีสัตวแพทย์ดูแล'}</span>
        {!canManage && <button className="text-button" type="button" disabled={busy} onClick={async () => {
          setBusy(true); setError('');
          try { await refresh(); } catch { setError('ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่'); } finally { setBusy(false); }
        }}>{busy ? 'กำลังอัปเดต...' : 'รีเฟรชสถานะ'}</button>}
      </div>
      {!canManage && <p className="muted">สัตวแพทย์เป็นผู้รับเข้าดูแลหรือยุติการดูแล คุณสามารถตรวจสอบสถานะและรายชื่อได้ที่นี่</p>}
      {canManage && <form className="vet-access-form" onSubmit={grant}>
        <label>อีเมลสัตวแพทย์<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={255} placeholder="vet@example.com" /></label>
        <button className="primary-button" type="submit" disabled={busy}>อนุญาตให้ดูแล</button>
      </form>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {vets.length > 0 &&
        <ul className="vet-access-list">{vets.map((vet) =>  <li key={vet.id}>
          <span><strong>{vet.name}</strong><small>{vet.email}</small></span>
          {canManage ? <button className="text-button danger-text" type="button" disabled={busy} onClick={() => revoke(vet.id)}>ยุติการดูแล</button> : <span className="care-status care-status-active">กำลังดูแล</span>}
        </li>)}</ul>}
    </>}
  </section>;
}
