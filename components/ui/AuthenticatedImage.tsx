'use client';

import { useEffect, useState } from 'react';
import { getAuthToken, getApiBaseUrl } from '@/lib/api/client';

type Props = {
  /** Absolute URL or path beginning with /api/... */
  src: string;
  alt: string;
  className?: string;
};

/**
 * Loads a protected image via authenticated fetch (cookie + Bearer).
 * Plain <img src> cannot attach Authorization and often omits cross-origin cookies.
 */
export function AuthenticatedImage({ src, alt, className }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      setFailed(false);
      setBlobUrl(null);
      const url = src.startsWith('http') ? src : `${getApiBaseUrl()}${src}`;
      try {
        const headers = new Headers();
        const token = getAuthToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        const res = await fetch(url, { headers, credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [src]);

  if (failed) {
    return (
      <div
        className={className}
        role="img"
        aria-label={alt}
        title="QR image unavailable"
      />
    );
  }
  if (!blobUrl) {
    return <div className={className} aria-busy="true" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={blobUrl} alt={alt} className={className} />;
}
