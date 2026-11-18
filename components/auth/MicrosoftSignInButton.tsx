'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  PublicClientApplication,
  type Configuration,
  type AuthenticationResult,
} from '@azure/msal-browser';

type Props = {
  clientId: string;
  tenantId?: string;
  onCredential: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function MicrosoftSignInButton({
  clientId,
  tenantId = 'common',
  onCredential,
  onError,
  disabled,
}: Props) {
  const [busy, setBusy] = useState(false);
  const pcaRef = useRef<PublicClientApplication | null>(null);
  const initRef = useRef<Promise<PublicClientApplication> | null>(null);

  useEffect(() => {
    pcaRef.current = null;
    initRef.current = null;
  }, [clientId, tenantId]);

  const getMsal = useCallback(async () => {
    if (pcaRef.current) return pcaRef.current;
    if (!initRef.current) {
      const config: Configuration = {
        auth: {
          clientId,
          authority: `https://login.microsoftonline.com/${tenantId}`,
          redirectUri: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
        cache: {
          cacheLocation: 'sessionStorage',
        },
      };
      initRef.current = (async () => {
        const pca = new PublicClientApplication(config);
        await pca.initialize();
        pcaRef.current = pca;
        return pca;
      })();
    }
    return initRef.current;
  }, [clientId, tenantId]);

  const handleClick = useCallback(async () => {
    if (!clientId || disabled || busy) return;
    setBusy(true);
    try {
      const pca = await getMsal();
      const result: AuthenticationResult = await pca.loginPopup({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      });
      const idToken = result.idToken;
      if (!idToken) {
        onError?.('Microsoft did not return a sign-in token.');
        return;
      }
      await onCredential(idToken);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Microsoft sign-in failed.';
      if (!/user_cancelled|user cancelled|popup_window_error/i.test(message)) {
        onError?.(message);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, clientId, disabled, getMsal, onCredential, onError]);

  if (!clientId) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      className="w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-[10px] border border-[#E6E8EE] bg-white text-sm font-semibold text-[#0F172A] hover:bg-[#F6F7F9] transition-colors disabled:opacity-60 disabled:pointer-events-none"
      aria-label="Continue with Microsoft"
    >
      <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden>
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
      </svg>
      {busy ? 'Signing in…' : 'Continue with Microsoft'}
    </button>
  );
}
