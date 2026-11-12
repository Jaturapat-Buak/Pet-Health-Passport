import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listCareCandidates, takePetIntoCare } from '../api/vet.js';
import { thaiValue } from '../i18n.js';

export function CareManagement({ onChange }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('loading');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading'); setError('');
    listCareCandidates(search, page).then((data) => {
      if (active) { setResults(data.pets); setHasMore(data.has_more); setStatus('ready'); }
    }).catch((e) => {
      if (active) { setError(e.response?.data?.error ?? 'ไม่สามารถโหลดรายการสัตว์เลี้ยงได้'); setStatus('error'); }
    });
    return () => { active = false; };
  }, [search, page, reload]);

  async function take(pet, schedule = false) {
    setBusyId(pet.id); setError(''); setNotice('');
    try {
      await takePetIntoCare(pet.id);
      setResults((items) => items.map((item) => item.id === pet.id ? { ...item, in_care: true } : item));
      if (schedule) { navigate(`/appointments/new?petId=${pet.id}`); return; }
      setNotice(`รับ ${pet.name} เข้าดูแลแล้ว สามารถสร้างนัดหมายได้ทันที`);
      await onChange();
    } catch (e) { setError(e.response?.data?.error ?? 'ไม่สามารถรับสัตว์เลี้ยงเข้าดูแลได้'); }
    finally { setBusyId(null); }
  }

  function submitSearch(event) {
    event.preventDefault(); setSearch(query.trim()); setPage(0); setNotice(''); setReload((value) => value + 1);
  }

  return <section className="dashboard-section">
    <h2>Pet Directory &amp; Appointments</h2>
    <p className="muted">เลือกสัตว์เลี้ยงจากรายการเพื่อรับเข้าดูแลหรือสร้างนัดหมาย</p>
    <form className="vet-access-form" onSubmit={submitSearch}>
      <label>ค้นหาสัตว์เลี้ยง<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} maxLength="120" disabled={Boolean(busyId)} placeholder="ชื่อสัตว์เลี้ยง ชื่อเจ้าของ หรือประเภทสัตว์" /></label>
      <button className="primary-button" disabled={Boolean(busyId) || status === 'loading'}>ค้นหา</button>
    </form>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    {status === 'loading' && <p className="muted" role="status">กำลังโหลดรายการสัตว์เลี้ยง...</p>}
    {status === 'error' && <button className="secondary-button" onClick={() => setReload((value) => value + 1)}>ลองใหม่</button>}
    {status === 'ready' && <>
      {results.length ? <div className="admin-table-wrap"><table className="admin-table care-directory-table">
        <thead><tr><th>สัตว์เลี้ยง</th><th>เจ้าของ</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
        <tbody>{results.map((pet) => <tr key={pet.id}>
          <td><strong>{pet.name}</strong><small className="directory-species">{thaiValue(pet.species)}{pet.breed ? ` · ${pet.breed}` : ''}</small></td>
          <td>{pet.owner_name}</td>
          <td><span className={`care-status ${pet.in_care ? 'care-status-active' : ''}`}>{pet.in_care ? 'อยู่ในความดูแล' : 'ยังไม่ได้รับเข้าดูแล'}</span></td>
          <td><div className="directory-actions">{pet.in_care ? <>
            <Link className="primary-link" to={`/appointments/new?petId=${pet.id}`}>สร้างนัดหมาย</Link>
            <Link className="secondary-link" to={`/vet/pets/${pet.id}`}>ดูประวัติ</Link>
          </> : <>
            <button className="primary-button" disabled={Boolean(busyId)} onClick={() => take(pet, true)}>{busyId === pet.id ? 'กำลังดำเนินการ...' : 'รับดูแลและนัดหมาย'}</button>
            <button className="secondary-button" disabled={Boolean(busyId)} onClick={() => take(pet)}>รับเข้าดูแล</button>
          </>}</div></td>
        </tr>)}</tbody>
      </table></div> : <p className="muted">ไม่พบสัตว์เลี้ยงในรายการนี้</p>}
      <div className="directory-pagination"><button className="secondary-button" disabled={page === 0 || Boolean(busyId)} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</button>
        <span>หน้า {page + 1}</span><button className="secondary-button" disabled={!hasMore || Boolean(busyId)} onClick={() => setPage((value) => value + 1)}>ถัดไป</button></div>
    </>}
  </section>;
}
