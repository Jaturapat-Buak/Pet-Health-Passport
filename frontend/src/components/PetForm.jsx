import { useState } from 'react';

function dateValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

export function PetForm({ pet, onSave, submitLabel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const details = Object.fromEntries(form.entries());

    try {
      await onSave(details);
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Could not save this pet. Please try again.');
      setSaving(false);
    }
  }

  return (
    <form className="pet-form" onSubmit={handleSubmit}>
      <div className="form-section-heading">
        <h2>Basic details</h2>
      </div>
      <div className="form-grid">
        <label>Name <input name="name" defaultValue={pet?.name ?? ''} maxLength="120" required /></label>
        <label>Species <input name="species" defaultValue={pet?.species ?? ''} maxLength="80" required /></label>
        <label>Breed <input name="breed" defaultValue={pet?.breed ?? ''} maxLength="120" /></label>
        <label>Gender
          <select name="gender" defaultValue={pet?.gender ?? ''}>
            <option value="">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Birth date <input name="birth_date" type="date" defaultValue={dateValue(pet?.birth_date)} max={new Date().toISOString().slice(0, 10)} /></label>
        <label>Color <input name="color" defaultValue={pet?.color ?? ''} maxLength="80" /></label>
        <label>Weight (kg) <input name="weight" type="number" min="0.01" max="9999.99" step="0.01" defaultValue={pet?.weight ?? ''} /></label>
        <label>Microchip ID <input name="microchip_id" defaultValue={pet?.microchip_id ?? ''} maxLength="120" /></label>
      </div>

      <div className="form-section-heading second-section">
        <h2>Profile</h2>
      </div>
      <div className="form-grid">
        <label className="full-width">Photo URL <input name="image_url" type="url" defaultValue={pet?.image_url ?? ''} maxLength="2048" placeholder="https://example.com/pet.jpg" /></label>
        <label className="full-width">Medical notes <textarea name="medical_notes" defaultValue={pet?.medical_notes ?? ''} maxLength="5000" rows="5" /></label>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button form-submit" type="submit" disabled={saving}>
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

