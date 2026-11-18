'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormPageSkeleton } from '@/components/ui/Skeleton';

function SetPasswordForm() {
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

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passedCount = [hasMinLength, hasNumber, hasUppercase, password.length >= 12].filter(Boolean).length;

  useEffect(() => {
    if (!isDone) return;
    if (countdown <= 0) {
      router.replace('/login');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isDone, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Invite link is missing or invalid.');
      return;
    }
    if (!hasMinLength || !hasNumber || !hasUppercase || !passwordsMatch) {
      setError('Please ensure your password meets all required criteria.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.setPassword({ token, new_password: password });
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to set password. Link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-[#B91C1C] mx-auto" />
          <h1 className="text-xl font-bold text-[#0F172A]">Invalid invite link</h1>
          <p className="text-sm text-[#64748B]">Ask your administrator to send a new invite.</p>
          <Link href="/login" className="text-sm font-semibold text-[#E32B2B] hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] font-heading tracking-tight">
            Set your password
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Activate your KR Workspace invite with a strong password.
          </p>
        </div>

        {isDone ? (
          <div className="p-4 rounded-[10px] border border-emerald-200 bg-emerald-50 text-sm text-emerald-800 flex gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              Password set successfully. Redirecting to sign in in {countdown}…
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-[#FDECEC] border border-[#B91C1C]/25 rounded-[10px] flex gap-2 text-xs text-[#B91C1C]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                New password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-9 pr-10 border border-[#E6E8EE] rounded-[10px] text-sm"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-9 pr-10 border border-[#E6E8EE] rounded-[10px] text-sm"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs">
              {[
                [hasMinLength, 'At least 8 characters'],
                [hasNumber, 'Contains a number'],
                [hasUppercase, 'Contains an uppercase letter'],
                [passwordsMatch, 'Passwords match'],
              ].map(([ok, label]) => (
                <li key={String(label)} className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {ok ? <Check className="w-2.5 h-2.5" /> : '·'}
                  </span>
                  <span className={ok ? 'text-emerald-700' : 'text-[#64748B]'}>{label as string}</span>
                </li>
              ))}
            </ul>

            <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
              Activate account
            </Button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
          Strength: {passedCount <= 1 ? 'Weak' : passedCount <= 3 ? 'Medium' : 'Strong'}
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <SetPasswordForm />
    </Suspense>
  );
}
