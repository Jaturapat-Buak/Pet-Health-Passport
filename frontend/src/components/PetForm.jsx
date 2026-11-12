import { useEffect, useRef, useState } from 'react';
import { usePetPhoto } from './usePetPhoto.js';

function dateValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

export function PetForm({ pet, owners, onSave, submitLabel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInput = useRef(null);
  const existingPhoto = usePetPhoto(pet?.image_url);
  const shownPhoto = preview || (!removePhoto ? existingPhoto : null);

  useEffect(() =>  {
    if (!photo) { setPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPhotoError('กรุณาเลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB');
      event.target.value = '';
      return;
    }
    setPhotoError(''); setPhoto(file); setRemovePhoto(false);
  }

  function clearPhoto() {
    setPhoto(null); setRemovePhoto(true); setPhotoError('');
    if (fileInput.current) fileInput.current.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    form.delete('photo');
    if (photo) form.set('photo', photo);
    form.set('remove_image', String(removePhoto));

    try {
      await onSave(form);
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'ไม่สามารถบันทึกสัตว์เลี้ยงได้ กรุณาลองใหม่อีกครั้ง');
      setSaving(false);
    }
  }

  return (
    <form className="pet-form" onSubmit={handleSubmit}>
      <div className="form-section-heading">
        <h2>Basic Details</h2>
      </div>
      <div className="form-grid">
        {owners && <label className="full-width">เจ้าของสัตว์เลี้ยง
          <select name="owner_id" defaultValue={pet?.owner_id ?? ''} required>
            <option value="">เลือกเจ้าของสัตว์เลี้ยง</option>
            {pet?.owner_id && !owners.some((owner) => owner.id === pet.owner_id) && <option value={pet.owner_id}>เจ้าของปัจจุบัน ({pet.owner_id})</option>}
            {owners.map((owner) =>  <option key={owner.id} value={owner.id}>{owner.name} · {owner.email}</option>)}
          </select>
        </label>}
        <label>ชื่อ <input name="name" defaultValue={pet?.name ?? ''} maxLength="120" required /></label>
        <label>ประเภทสัตว์ <input name="species" defaultValue={pet?.species ?? ''} maxLength="80" required /></label>
        <label>สายพันธุ์ <input name="breed" defaultValue={pet?.breed ?? ''} maxLength="120" /></label>
        <label>เพศ
          <select name="gender" defaultValue={pet?.gender ?? ''}>
            <option value="">ไม่ระบุ</option>
            <option value="Male">เพศผู้</option>
            <option value="Female">เพศเมีย</option>
            <option value="Other">อื่น ๆ</option>
          </select>
        </label>
        <label>วันเกิด <input name="birth_date" type="date" defaultValue={dateValue(pet?.birth_date)} max={new Date().toISOString().slice(0, 10)} /></label>
        <label>สี <input name="color" defaultValue={pet?.color ?? ''} maxLength="80" /></label>
        <label>น้ำหนัก (กก.) <input name="weight" type="number" min="0.01" max="9999.99" step="0.01" defaultValue={pet?.weight ?? ''} /></label>
        <label>หมายเลขไมโครชิป <input name="microchip_id" defaultValue={pet?.microchip_id ?? ''} maxLength="120" /></label>
      </div>

      <div className="form-section-heading second-section">
        <h2>Profile</h2>
      </div>
      <div className="form-grid">
        <div className="full-width pet-photo-field">
          <label htmlFor="pet-photo">รูปสัตว์เลี้ยง</label>
          <div className="pet-photo-upload">
            <div className="pet-photo-preview">{shownPhoto ? <img src={shownPhoto} alt="ตัวอย่างรูปสัตว์เลี้ยง" onError={() =>  { if (photo) setPhotoError('ไม่สามารถอ่านรูปนี้ได้ กรุณาเลือกไฟล์รูปภาพใหม่'); }} /> :
              <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="8" cy="9" r="1.5" /><path d="m3 17 5-5 4 4 3-3 6 6" /></svg>}</div>
            <div className="pet-photo-options">
              <p>เลือกรูปสำหรับโปรไฟล์สัตว์เลี้ยง</p>
              <label htmlFor="pet-photo" className="photo-choose-button">เลือกรูปภาพ</label>
              <input className="visually-hidden" id="pet-photo" type="file" accept="image/jpeg,image/png,image/webp" ref={fileInput} onChange={choosePhoto} disabled={saving} aria-describedby="pet-photo-help" />
              <small id="pet-photo-help">รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 5 MB</small>
              <span className="pet-photo-filename">{photo ? photo.name : 'ยังไม่ได้เลือกรูปภาพใหม่'}</span>
              {(photo || (!removePhoto && pet?.image_url)) && <button className="text-button danger-text" type="button" disabled={saving} onClick={clearPhoto}>นำรูปออก</button>}
            </div>
          </div>
          {photoError && <p className="form-error" role="alert">{photoError}</p>}
        </div>
        <label className="full-width">หมายเหตุสุขภาพ <textarea name="medical_notes" defaultValue={pet?.medical_notes ?? ''} maxLength="5000" rows="5" /></label>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button form-submit" type="submit" disabled={saving || Boolean(photoError)}>
        {saving ? 'กำลังบันทึก...' : submitLabel}
      </button>
    </form>
  );
}

