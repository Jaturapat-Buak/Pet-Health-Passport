import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { AppShell } from '../components/AppShell.jsx';

const roleNames = { owner: 'เจ้าของสัตว์เลี้ยง', vet: 'สัตวแพทย์', admin: 'ผู้ดูแลระบบ' };

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() =>  {
    api.get('/admin/users').then(({ data }) =>  { setUsers(data.users); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const details = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data } = editing.id ? await api.put(`/admin/users/${editing.id}`, details) : await api.post('/admin/users', details);
      setUsers((items) => editing.id ? items.map((item) => item.id === editing.id ? data.user : item) : [...items, data.user]);
      setEditing(null); setNotice('บันทึกข้อมูลผู้ใช้แล้ว สิทธิ์ใหม่จะมีผลกับการเรียก API ครั้งถัดไป');
    } catch (e) { setError(e.response?.data?.error ?? 'ไม่สามารถบันทึกข้อมูลได้'); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError('');
    try {
      await api.delete(`/admin/users/${removing.id}`);
      setUsers((items) => items.filter((item) => item.id !== removing.id));
      setRemoving(null); setNotice('ลบผู้ใช้แล้ว');
    } catch (e) { setError(e.response?.data?.error ?? 'ไม่สามารถลบผู้ใช้ได้'); }
    finally { setBusy(false); }
  }

  const filtered = users.filter((item) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(query.toLowerCase()));
  return <AppShell>
    <div className="page-heading with-action"><h1>Users & Roles</h1>
      <button className="primary-button" onClick={() =>  { setEditing({ role: 'owner' }); setError(''); }}>เพิ่มผู้ใช้</button></div>
    <p className="muted">เจ้าของจัดการประวัติของตัวเอง · หมอจัดการนัดหมายในความดูแล · ผู้ดูแลจัดการข้อมูลทั้งระบบ</p>
    {notice && <p role="status" className="admin-notice">{notice}</p>}
    {status === 'loading' && <p role="status">กำลังโหลดผู้ใช้...</p>}
    {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดผู้ใช้ได้ กรุณารีเฟรชหน้า</p>}
    {status === 'ready' && <section className="dashboard-section">
      <label className="admin-search">ค้นหาผู้ใช้<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ชื่อ อีเมล หรือบทบาท" /></label>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ชื่อ</th><th>อีเมล</th><th>บทบาท</th><th>จัดการ</th></tr></thead>
        <tbody>{filtered.map((item) =>  <tr key={item.id}><td>{item.name}{item.id === user.id && <small> (คุณ)</small>}</td><td>{item.email}</td>
          <td><span className={`role-badge role-${item.role}`}>{roleNames[item.role]}</span></td>
          <td><div className="admin-row-actions"><button className="secondary-button" onClick={() =>  { setEditing(item); setError(''); }}>แก้ไข / บทบาท</button>
            {item.id !== user.id && <button className="danger-button" onClick={() =>  { setRemoving(item); setError(''); }}>ลบ</button>}</div></td></tr>)}</tbody></table></div>
      {!filtered.length && <p className="muted">ไม่พบผู้ใช้</p>}
    </section>}
    {editing && <section className="dashboard-section" key={editing.id ?? 'new'}>
      <h2>{editing.id ? `Edit User: ${editing.name}` : 'Add User'}</h2>
      <form onSubmit={save}><div className="form-grid">
        <label>ชื่อ<input name="name" defaultValue={editing.name ?? ''} maxLength="120" required /></label>
        <label>อีเมล<input name="email" type="email" defaultValue={editing.email ?? ''} maxLength="255" required /></label>
        <label>โทรศัพท์<input name="phone" defaultValue={editing.phone ?? ''} maxLength="30" /></label>
        <label>บทบาท<select name="role" defaultValue={editing.role} disabled={editing.id === user.id}>
          {Object.entries(roleNames).map(([value, label]) =>  <option key={value} value={value}>{label}</option>)}</select>
          {editing.id === user.id && <input type="hidden" name="role" value="admin" />}</label>
        {!editing.id && <label>รหัสผ่าน<input name="password" type="password" autoComplete="new-password" minLength="8" required /></label>}
      </div>{error && <p className="form-error" role="alert">{error}</p>}
        <div className="record-actions"><button className="primary-button" disabled={busy}>บันทึก</button><button type="button" className="secondary-button" disabled={busy} onClick={() => setEditing(null)}>ยกเลิก</button></div>
      </form></section>}
    {removing && <section className="dashboard-section" aria-label="ยืนยันการลบผู้ใช้"><h2>ลบผู้ใช้ {removing.name}?</h2>
      <p>สัตว์เลี้ยง ประวัติ เอกสาร และนัดหมายของผู้ใช้นี้จะถูกลบด้วย และไม่สามารถกู้คืนได้</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="record-actions"><button className="danger-button filled" disabled={busy} onClick={remove}>ยืนยันลบผู้ใช้</button>
        <button className="secondary-button" disabled={busy} onClick={() => setRemoving(null)}>ยกเลิก</button></div></section>}
  </AppShell>;
}
