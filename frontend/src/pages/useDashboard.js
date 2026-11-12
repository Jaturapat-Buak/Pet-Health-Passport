import { useEffect, useState } from 'react';

export function useDashboard(load) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus('loading');
    load().then((result) => { if (active) { setData(result); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [load, version]);
  return { data, status, retry: () => setVersion((value) => value + 1) };
}
