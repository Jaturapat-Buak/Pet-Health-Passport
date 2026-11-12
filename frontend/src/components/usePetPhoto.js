import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function usePetPhoto(url) {
  const [photo, setPhoto] = useState(null);
  const uploaded = url?.startsWith('/api/pet-photos/');
  useEffect(() => {
    if (!uploaded) return;
    let active = true;
    let objectUrl;
    const controller = new AbortController();
    api.get(url.slice(4), { responseType: 'blob', signal: controller.signal })
      .then(({ data }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(data);
        setPhoto({ source: url, url: objectUrl });
      }).catch(() => {});
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, uploaded]);
  return uploaded ? photo?.source === url ? photo.url : null : url;
}
