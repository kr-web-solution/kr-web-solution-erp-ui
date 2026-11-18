'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      logo_alignment?: string;
      width?: number;
    }
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

type Props = {
  clientId: string;
  onCredential: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function GoogleSignInButton({ clientId, onCredential, onError, disabled }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const callbackRef = useRef(onCredential);
  const errorRef = useRef(onError);

  useEffect(() => {
    callbackRef.current = onCredential;
    errorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || disabled) return;
    if (!window.google?.accounts?.id) return;

    const el = buttonRef.current;
    el.innerHTML = '';

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          const token = response?.credential;
          if (!token) {
            errorRef.current?.('Google did not return a sign-in token.');
            return;
          }
          try {
            await callbackRef.current(token);
          } catch (err: unknown) {
            const message =
              err && typeof err === 'object' && 'message' in err
                ? String((err as { message: unknown }).message)
                : 'Google sign-in failed.';
            errorRef.current?.(message);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const width = Math.min(el.offsetWidth || 384, 400);
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width,
      });
    } catch {
      errorRef.current?.('Could not initialize Google sign-in.');
    }
  }, [scriptReady, clientId, disabled]);

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => errorRef.current?.('Failed to load Google sign-in.')}
      />
      <div
        ref={buttonRef}
        className={`w-full flex justify-center min-h-[44px] ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        aria-label="Continue with Google"
      />
    </>
  );
}
