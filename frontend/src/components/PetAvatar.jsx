import { useState } from 'react';

export function PetAvatar({ pet, className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = pet.image_url && failedUrl !== pet.image_url;

  return (
    <div className={`pet-avatar ${className}`} aria-hidden="true">
      {showImage ? (
        <img src={pet.image_url} alt="" onError={() => setFailedUrl(pet.image_url)} />
      ) : (
        <span>{pet.name?.slice(0, 1).toUpperCase() || 'P'}</span>
      )}
    </div>
  );
}

