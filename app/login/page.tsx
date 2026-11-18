'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { authApi } from '@/lib/api/client';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { MicrosoftSignInButton } from '@/components/auth/MicrosoftSignInButton';

type OAuthConfig = {
  googleClientId: string;
  microsoftClientId: string;
  microsoftTenantId: string;
};

type AuthPhase = 'idle' | 'submitting' | 'redirecting';

function oauthHint(cfg: OAuthConfig | null) {
  const google = Boolean(cfg?.googleClientId);
  const microsoft = Boolean(cfg?.microsoftClientId);
  if (google && microsoft) return 'Continue with Google, Microsoft, or email';
  if (google) return 'Continue with Google or email';
  if (microsoft) return 'Continue with Microsoft or email';
  return 'Use the email and password from your invite';
}

const fieldClass =
  'w-full h-12 pl-11 pr-4 rounded-xl bg-white border border-[#E6E8EE] text-[15px] text-[#0F172A] placeholder:text-[#94A3B8] transition-[border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E32B2B]/35 focus-visible:border-[#E32B2B] autofill:shadow-[inset_0_0_0_1000px_white]';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithMicrosoft, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<AuthPhase>('idle');
  const [oauth, setOauth] = useState<OAuthConfig | null>(null);

  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/onboarding/profile');
    router.prefetch('/staff/me');
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await authApi.oauthProviders();
        if (cancelled) return;
        setOauth({
          googleClientId: (cfg.google_client_id || '').trim(),
          microsoftClientId: (cfg.microsoft_client_id || '').trim(),
          microsoftTenantId: (cfg.microsoft_tenant_id || 'common').trim() || 'common',
        });
      } catch {
        if (!cancelled) {
          setOauth({ googleClientId: '', microsoftClientId: '', microsoftTenantId: 'common' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // If session already exists (or login just set user), show redirect shell instead of stuck spinner
  useEffect(() => {
    if (!isLoading && user) {
      setPhase('redirecting');
    }
  }, [isLoading, user]);

  const googleEnabled = Boolean(oauth?.googleClientId);
  const microsoftEnabled = Boolean(oauth?.microsoftClientId);
  const oauthEnabled = googleEnabled || microsoftEnabled;
  const busy = phase !== 'idle';

  const mapAuthError = (err: any) => {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('inactive') || msg.includes('deactivated')) {
      return 'This account has been deactivated. Please contact your administrator.';
    }
    if (msg.includes('set your password') || msg.includes('invite link')) {
      return 'Please set your password using the invite link sent to your email.';
    }
    if (msg.includes('no kr workspace account') || msg.includes('invite you first')) {
      return 'No KR Workspace account for this email. Ask an admin to invite you first.';
    }
    if (msg.includes('google')) {
      return err?.message || 'Google sign-in failed. Try again or use email and password.';
    }
    if (msg.includes('microsoft')) {
      return err?.message || 'Microsoft sign-in failed. Try again or use email and password.';
    }
    if (msg.includes('incorrect email') || msg.includes('incorrect password')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    return err?.message || 'Sign-in failed. Please try again.';
  };

  const runAuth = async (action: () => Promise<unknown>) => {
    setError(null);
    setPhase('submitting');
    try {
      await action();
      setPhase('redirecting');
    } catch (err: any) {
      setPhase('idle');
      setError(mapAuthError(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAuth(() => login({ email, password }));
  };

  const handleGoogle = async (idToken: string) => {
    await runAuth(() => loginWithGoogle(idToken));
  };

  const handleMicrosoft = async (idToken: string) => {
    await runAuth(() => loginWithMicrosoft(idToken));
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0B0D14] text-white select-none">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 login-bg-breathe"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 18% 40%, rgba(227,43,43,0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 15%, rgba(250,220,89,0.12), transparent 50%), linear-gradient(160deg, #0B0D14 0%, #151821 45%, #1A1020 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 30% 50%, black, transparent)',
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-[-8%] top-[8%] hidden h-[70vmin] w-[70vmin] opacity-90 lg:block login-diamond-drift"
      >
        <svg viewBox="0 0 600 600" className="!h-full !w-full !max-w-none" fill="none" preserveAspectRatio="xMidYMid meet">
          <polygon points="300,40 560,300 300,560 40,300" stroke="#E32B2B" strokeWidth="14" className="opacity-45" />
          <polygon points="300,110 490,300 300,490 110,300" stroke="#FADC59" strokeWidth="10" className="opacity-40" />
          <polygon points="300,180 420,300 300,420 180,300" stroke="#E32B2B" strokeWidth="7" className="opacity-55" />
        </svg>
      </div>

      <div
        className={`relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-2 transition-opacity duration-300 ease-out ${
          phase === 'redirecting' ? 'opacity-40 pointer-events-none' : 'opacity-100'
        }`}
      >
        <section className="relative flex flex-col justify-between px-6 pb-4 pt-8 sm:px-10 lg:px-14 lg:py-14">
          <div className="login-fade-up">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-[0_8px_24px_rgba(227,43,43,0.25)]">
                <img
                  src="/brand/krws-mark.png"
                  alt=""
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/nav-logo/krws-mark-light.png';
                  }}
                />
              </div>
              <div className="pr-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FADC59]/90">
                  KR Web Solution
                </p>
                <p className="text-xs text-white/55">Salem HQ · Tamil Nadu</p>
              </div>
            </div>
          </div>

          <div className="my-8 max-w-xl login-fade-up login-fade-up-delay lg:my-0">
            <h1 className="font-heading !text-[clamp(2.25rem,4.5vw,3.6rem)] font-extrabold !leading-[1.05] tracking-[-0.04em] !text-white">
              KR Workspace
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
              The internal ERP &amp; CRM for projects, invoices, and client work — invite-only access.
            </p>
            <div className="mt-8 h-1 w-16 rounded-full bg-gradient-to-r from-[#E32B2B] to-[#FADC59] login-accent-pulse" />
          </div>

          <p className="hidden text-xs text-white/35 lg:block">
            © {new Date().getFullYear()} KR Web Solution
          </p>
        </section>

        <section className="flex items-center justify-center px-5 pb-10 pt-2 sm:px-8 lg:px-10 lg:py-14">
          <div className="w-full max-w-[420px] login-fade-up login-fade-up-delay-2">
            <div className="rounded-3xl border border-white/12 bg-[#F7F8FA] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-9 transition-transform duration-300 ease-out will-change-transform">
              <div className="mb-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E32B2B]">
                  Sign in
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold tracking-[-0.03em] text-[#0F172A] sm:text-[1.7rem]">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-sm text-[#64748B]">{oauthHint(oauth)}</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#B91C1C]/20 bg-[#FDECEC] p-3.5 text-xs font-medium text-[#B91C1C] animate-[login-fade-up_0.35s_ease-out]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {oauthEnabled && (
                <div className="mb-6 space-y-3">
                  {googleEnabled && oauth && (
                    <GoogleSignInButton
                      clientId={oauth.googleClientId}
                      onCredential={handleGoogle}
                      onError={(msg) => {
                        setError(msg);
                        setPhase('idle');
                      }}
                      disabled={busy}
                    />
                  )}
                  {microsoftEnabled && oauth && (
                    <MicrosoftSignInButton
                      clientId={oauth.microsoftClientId}
                      tenantId={oauth.microsoftTenantId}
                      onCredential={handleMicrosoft}
                      onError={(msg) => {
                        setError(msg);
                        setPhase('idle');
                      }}
                      disabled={busy}
                    />
                  )}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#E6E8EE]" />
                    </div>
                    <div className="relative flex justify-center text-[11px]">
                      <span className="bg-[#F7F8FA] px-3 font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
                        or email
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                    Email <span className="text-[#E32B2B]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      autoFocus={!oauthEnabled}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@krwebsolution.com"
                      disabled={busy}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-xs font-semibold text-[#0F172A]">
                      Password <span className="text-[#E32B2B]">*</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="shrink-0 text-xs font-semibold text-[#E32B2B] transition-colors hover:text-[#C81F26] hover:underline"
                      tabIndex={busy ? -1 : 0}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={busy}
                      className={`${fieldClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={busy}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-[#94A3B8] transition-colors hover:text-[#0F172A] disabled:opacity-50"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={phase === 'submitting'}
                  disabled={busy}
                  className="mt-2 h-12 w-full rounded-xl text-[15px] font-bold tracking-wide shadow-[0_10px_28px_rgba(227,43,43,0.28)]"
                >
                  {phase === 'redirecting' ? 'Opening workspace…' : 'Sign in'}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Shield className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>Secure httpOnly session cookie</span>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-white/40 lg:hidden">
              © {new Date().getFullYear()} KR Web Solution
            </p>
          </div>
        </section>
      </div>

      {phase === 'redirecting' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D14]/55 backdrop-blur-[3px] animate-[login-fade-up_0.35s_ease-out]">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#12141C]/90 px-8 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <span className="h-9 w-9 rounded-full border-2 border-white/20 border-t-[#E32B2B] border-r-[#FADC59] animate-spin" />
            <div className="text-center">
              <p className="font-heading text-sm font-bold text-white">Opening KR Workspace</p>
              <p className="mt-1 text-xs text-white/55">Preparing your dashboard…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
