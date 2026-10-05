import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deletePet, getPet } from '../../api/pets.js';
import { AppShell } from '../../components/AppShell.jsx';
import { HealthRecords } from '../../components/HealthRecords.jsx';
import { PetAvatar } from '../../components/PetAvatar.jsx';
import { VetAccess } from '../../components/VetAccess.jsx';

function show(value, suffix = '') {
  return value == null || value === '' ? 'Not recorded' : `${value}${suffix}`;
}

export function PetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [status, setStatus] = useState('loading');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const cancelButton = useRef(null);

  useEffect(() => {
    setStatus('loading');
    setPet(null);
    setConfirmDelete(false);
    getPet(id)
      .then((result) => { setPet(result); setStatus('ready'); })
      .catch((error) => setStatus(error.response?.status === 404 ? 'missing' : 'error'));
  }, [id]);

  useEffect(() => {
    if (!confirmDelete) return;
    const previousFocus = document.activeElement;
    cancelButton.current?.focus();
    return () => previousFocus?.focus();
  }, [confirmDelete]);

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !deleting) {
      setConfirmDelete(false);
    }
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

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deletePet(id);
      navigate('/pets', { replace: true });
    } catch (error) {
      setDeleteError(error.response?.data?.error ?? 'Could not delete this pet. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <Link className="back-link" to="/pets">&larr; Back to pets</Link>
      {status === 'loading' && <p className="muted" role="status">Loading pet...</p>}
      {status === 'missing' && <p className="inline-error" role="alert">Pet not found.</p>}
      {status === 'error' && <p className="inline-error" role="alert">Could not load this pet.</p>}
      {status === 'ready' && (
        <>
          <div className="pet-profile-heading">
            <PetAvatar pet={pet} className="large-avatar" />
            <div className="pet-profile-title">
              <p className="eyebrow">Pet profile</p>
              <h1>{pet.name}</h1>
              <p>{[pet.species, pet.breed].filter(Boolean).join(' / ')}</p>
            </div>
            <div className="pet-profile-actions">
              <Link className="secondary-link" to={`/appointments/new?petId=${id}`}>Schedule visit</Link>
              <Link className="secondary-link" to={`/pets/${id}/edit`}>Edit profile</Link>
            </div>
          </div>

          <section className="details-section" aria-labelledby="details-title">
            <h2 id="details-title">Details</h2>
            <dl className="details-grid">
              <div><dt>Species</dt><dd>{show(pet.species)}</dd></div>
              <div><dt>Breed</dt><dd>{show(pet.breed)}</dd></div>
              <div><dt>Gender</dt><dd>{show(pet.gender)}</dd></div>
              <div><dt>Birth date</dt><dd>{show(pet.birth_date?.slice(0, 10))}</dd></div>
              <div><dt>Color</dt><dd>{show(pet.color)}</dd></div>
              <div><dt>Weight</dt><dd>{show(pet.weight, ' kg')}</dd></div>
              <div><dt>Microchip ID</dt><dd>{show(pet.microchip_id)}</dd></div>
            </dl>
          </section>

          <section className="details-section" aria-labelledby="notes-title">
            <h2 id="notes-title">Medical notes</h2>
            <p className="notes-text">{show(pet.medical_notes)}</p>
          </section>

          <HealthRecords petId={id} />
          <VetAccess petId={id} />

          <section className="danger-section" aria-labelledby="remove-title">
            <h2 id="remove-title">Remove pet</h2>
            <button className="danger-button" type="button" onClick={() => setConfirmDelete(true)}>Delete profile</button>
          </section>
        </>
      )}

      {confirmDelete && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" onKeyDown={handleDialogKeyDown}>
            <h2 id="delete-title">Delete {pet.name}?</h2>
            <p id="delete-description">This also removes every health record attached to this pet. This action cannot be undone.</p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="modal-actions">
              <button className="secondary-button" type="button" ref={cancelButton} onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
              <button className="danger-button filled" type="button" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete pet'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
