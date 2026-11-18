'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import {
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Shield,
  Layers,
  CalendarCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Requirements checks
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Strength score
  const passedCount = [hasMinLength, hasNumber, hasUppercase, password.length >= 12].filter(Boolean).length;
  const strengthLevel =
    passedCount <= 1 ? 'Weak' : passedCount <= 3 ? 'Medium' : 'Strong';
  const strengthColor =
    passedCount <= 1
      ? 'bg-rose-500'
      : passedCount <= 3
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  useEffect(() => {
    if (!isDone) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.replace('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isDone, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing or invalid reset token. Please request a new link.');
      return;
    }

    if (!hasMinLength || !hasNumber || !hasUppercase) {
      setError('Please ensure your password meets all required criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token, new_password: password });
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] mb-8 transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to sign in</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
          Set new password
        </h1>
        <p className="text-sm text-[#64748B] mt-2">
          Create a strong, unique password to secure your workspace account.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-[#FDECEC] border border-rose-200 rounded-[10px] flex items-start gap-2.5 text-xs text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {isDone ? (
        <div className="p-6 bg-[#E8F7EE] border border-emerald-200 rounded-[16px] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A] font-heading">
            Password reset complete!
          </h2>
          <p className="text-xs text-[#64748B]">
            Your password was updated successfully. Redirecting you to sign in in{' '}
            <strong className="text-emerald-700">{countdown}</strong> second{countdown === 1 ? '' : 's'}...
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Sign in now
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-[#E6E8EE] rounded-[10px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#E32B2B] focus:border-[#E32B2B] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B]">Strength</span>
                  <span className="font-semibold text-[#0F172A]">{strengthLevel}</span>
                </div>
                <div className="h-1.5 w-full bg-[#E6E8EE] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strengthColor} transition-all duration-300`}
                    style={{ width: `${(passedCount / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-[#E6E8EE] rounded-[10px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#E32B2B] focus:border-[#E32B2B] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-[10px] space-y-2 text-xs">
            <div className="font-semibold text-[#0F172A] mb-1">Password requirements:</div>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  hasMinLength
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {hasMinLength ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
              </div>
              <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-[#64748B]'}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  hasNumber
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {hasNumber ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
              </div>
              <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-[#64748B]'}>
                At least one number (0-9)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  hasUppercase
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {hasUppercase ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
              </div>
              <span className={hasUppercase ? 'text-emerald-700 font-medium' : 'text-[#64748B]'}>
                At least one uppercase letter (A-Z)
              </span>
            </div>
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 pt-1 border-t border-[#E6E8EE]">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    passwordsMatch
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {passwordsMatch ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '×'}
                </div>
                <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-rose-600'}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full h-11 text-sm font-semibold shadow-sm"
          >
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex bg-white select-none">
      {/* Left: Dark Brand Panel (ink-900, hidden below md) */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-[#12141C] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden border-r border-[#272B38]">
        {/* Background Geometric Diamond Chevrons Motif */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="300,50 550,300 300,550 50,300"
              stroke="#E32B2B"
              strokeWidth="16"
            />
            <polygon
              points="300,120 480,300 300,480 120,300"
              stroke="#FADC59"
              strokeWidth="12"
            />
            <polygon
              points="300,190 410,300 300,410 190,300"
              stroke="#E32B2B"
              strokeWidth="8"
            />
          </svg>
        </div>

        {/* Top: Logo with White Rounded Tile */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-white p-1.5 shadow-md flex items-center justify-center">
            <Image
              src="/brand/krws-mark.png"
              alt="KR Web Solution"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-bold text-base tracking-wide flex items-center gap-1.5 font-heading">
              KR WORKSPACE
              <span className="w-1.5 h-1.5 rounded-full bg-[#FADC59]" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold">
              Enterprise CRM · ERP
            </div>
          </div>
        </div>

        {/* Center: Brand Value Points */}
        <div className="relative z-10 space-y-8 my-auto py-12">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#272B38] text-[#FADC59] mb-4">
              Security Notice
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight font-heading">
              Secure access to company intelligence.
            </h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#1D202B] border border-[#272B38] flex items-center justify-center text-[#FADC59] shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Zero Trust Authentication
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
                  Cryptographically verified JWT sessions with secure httpOnly cookie delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#1D202B] border border-[#272B38] flex items-center justify-center text-[#E32B2B] shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Automated Security Alerts
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
                  Real-time notifications sent to company founder on account credential changes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Location & Copyright */}
        <div className="relative z-10 pt-6 border-t border-[#272B38] flex items-center justify-between text-xs text-[#94A3B8]">
          <span>KR Web Solution · Salem HQ</span>
          <span className="text-[11px]">v2.0 Branded Edition</span>
        </div>
      </div>

      {/* Right: Reset Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <Suspense fallback={<div className="text-xs text-muted">Loading secure form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
