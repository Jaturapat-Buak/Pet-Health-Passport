import { useState } from 'react';
import { usePetPhoto } from './usePetPhoto.js';

export function PetAvatar({ pet, className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const imageUrl = usePetPhoto(pet.image_url);
  const showImage = imageUrl && failedUrl !== imageUrl;

  return (
    <div className={`pet-avatar ${className}`} aria-hidden="true">
      {showImage ? (
        <img src={imageUrl} alt="" onError={() => setFailedUrl(imageUrl)} />
      ) : (
        <span>{pet.name?.slice(0, 1).toUpperCase() || 'P'}</span>
      )}
    </div>
  );
}

