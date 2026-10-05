import { useEffect, useState } from 'react';
import { grantPetVet, listPetVets, revokePetVet } from '../api/vet.js';

export function VetAccess({ petId }) {
  const [vets, setVets] = useState([]);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    listPetVets(petId).then((items) => {
      if (active) { setVets(items); setStatus('ready'); }
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
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
      setError(requestError.response?.data?.error ?? 'Could not share this pet.');
    } finally { setBusy(false); }
  }

  async function revoke(vetId) {
    setBusy(true);
    setError('');
    try {
      await revokePetVet(petId, vetId);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Could not remove access.');
    } finally { setBusy(false); }
  }

  return <section className="details-section" aria-labelledby="vet-access-title">
    <h2 id="vet-access-title">Veterinarian access</h2>
    {status === 'loading' && <p className="muted" role="status">Loading access...</p>}
    {status === 'error' && <p className="inline-error" role="alert">Could not load veterinarian access.</p>}
    {status === 'ready' && <>
      <form className="vet-access-form" onSubmit={grant}>
        <label>Veterinarian email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={255} placeholder="vet@example.com" /></label>
        <button className="primary-button" type="submit" disabled={busy}>Share access</button>
      </form>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {vets.length === 0 ? <p className="muted">No veterinarians have access.</p> :
        <ul className="vet-access-list">{vets.map((vet) => <li key={vet.id}>
          <span><strong>{vet.name}</strong><small>{vet.email}</small></span>
          <button className="text-button danger-text" type="button" disabled={busy} onClick={() => revoke(vet.id)}>Remove access</button>
        </li>)}</ul>}
    </>}
  </section>;
}
