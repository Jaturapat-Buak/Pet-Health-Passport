import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createPet, getPet, updatePet } from '../../api/pets.js';
import { AppShell } from '../../components/AppShell.jsx';
import { PetForm } from '../../components/PetForm.jsx';

export function PetFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [status, setStatus] = useState(editing ? 'loading' : 'ready');

  useEffect(() => {
    if (!editing) return;
    setStatus('loading');
    setPet(null);
    getPet(id)
      .then((result) => { setPet(result); setStatus('ready'); })
      .catch((error) => setStatus(error.response?.status === 404 ? 'missing' : 'error'));
  }, [editing, id]);

  async function handleSave(details) {
    const saved = editing ? await updatePet(id, details) : await createPet(details);
    navigate(`/pets/${saved.id}`, { replace: true });
  }

  return (
    <AppShell>
      <Link className="back-link" to={editing ? `/pets/${id}` : '/pets'}>&larr; {editing ? 'Back to profile' : 'Back to pets'}</Link>
      <div className="page-heading">
        <p className="eyebrow">Pet profile</p>
        <h1>{editing ? 'Edit pet' : 'Add pet'}</h1>
      </div>
      {status === 'loading' && <p className="muted" role="status">Loading pet...</p>}
      {status === 'missing' && <p className="inline-error" role="alert">Pet not found.</p>}
      {status === 'error' && <p className="inline-error" role="alert">Could not load this pet.</p>}
      {status === 'ready' && <PetForm pet={pet} onSave={handleSave} submitLabel={editing ? 'Save changes' : 'Create pet'} />}
    </AppShell>
  );
}
