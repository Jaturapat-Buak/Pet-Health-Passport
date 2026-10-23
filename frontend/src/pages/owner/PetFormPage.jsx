import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createPet, getPet, updatePet } from '../../api/pets.js';
import { AppShell } from '../../components/AppShell.jsx';
import { PetForm } from '../../components/PetForm.jsx';
import { api } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';

export function PetFormPage() {
  const { user } = useAuth();
  const [owners, setOwners] = useState([]);
  const [ownersStatus, setOwnersStatus] = useState('loading');
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [status, setStatus] = useState(editing ? 'loading' : 'ready');

  useEffect(() =>  {
    if (user.role !== 'admin') return;
    api.get('/admin/users').then(({ data }) =>  {
      setOwners(data.users.filter((item) => item.role === 'owner')); setOwnersStatus('ready');
    }).catch(() => setOwnersStatus('error'));
  }, [user.role]);

  useEffect(() =>  {
    if (!editing) return;
    setStatus('loading');
    setPet(null);
    getPet(id)
      .then((result) =>  { setPet(result); setStatus('ready'); })
      .catch((error) => setStatus(error.response?.status === 404 ? 'missing' : 'error'));
  }, [editing, id]);

  async function handleSave(details) {
    const saved = editing ? await updatePet(id, details) : await createPet(details);
    navigate(`/pets/${saved.id}`, { replace: true });
  }

  return (
    <AppShell>
      <Link className="back-link" to={editing ? `/pets/${id}` : '/pets'}>&larr; {editing ? 'กลับไปยังข้อมูลสัตว์เลี้ยง' : 'กลับไปยังสัตว์เลี้ยง'}</Link>
      <div className="page-heading">
        <p className="eyebrow">Pet Profile</p>
        <h1>{editing ? 'Edit Pet' : 'Add Pet'}</h1>
      </div>
      {status === 'loading' && <p className="muted" role="status">กำลังโหลดข้อมูลสัตว์เลี้ยง...</p>}
      {status === 'missing' && <p className="inline-error" role="alert">ไม่พบสัตว์เลี้ยง</p>}
      {status === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้</p>}
      {user.role === 'admin' && ownersStatus === 'error' && <p className="inline-error" role="alert">ไม่สามารถโหลดรายชื่อเจ้าของได้</p>}
      {status === 'ready' && (user.role !== 'admin' || ownersStatus === 'ready') && <PetForm pet={pet} owners={user.role === 'admin' ? owners : undefined} onSave={handleSave} submitLabel={editing ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกสัตว์เลี้ยง'} />}
    </AppShell>
  );
}
