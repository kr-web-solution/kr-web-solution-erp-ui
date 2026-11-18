'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api/client';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.forgotPassword(email);
    } catch {
      // Intentionally uniform: avoid exposing whether the account exists
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white select-none">
      {/* Left: Dark Brand Panel (ink-900) */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-[#12141C] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden border-r border-[#272B38]">
        {/* Diamond motif */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 600 600" fill="none">
            <polygon points="300,50 550,300 300,550 50,300" stroke="#E32B2B" strokeWidth="16" />
            <polygon points="300,120 480,300 300,480 120,300" stroke="#FADC59" strokeWidth="12" />
          </svg>
        </div>

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
            <img
              src="/brand/krws-mark.png"
              alt="KR Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
              }}
            />
          </div>
          <div>
            <span className="font-bold text-lg text-white block">KR Workspace</span>
            <span className="text-xs text-[#94A3B8] font-medium tracking-wider uppercase block">
              Internal ERP · CRM
            </span>
          </div>
        </div>

        {/* Center: Info */}
        <div className="relative z-10 space-y-4 my-auto py-12">
          <h2 className="text-3xl font-extrabold text-white font-heading">
            Password Recovery
          </h2>
          <p className="text-sm text-[#94A3B8] leading-relaxed max-w-sm">
            Enter your account email to receive a single-use 15-minute secure reset token.
          </p>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-[#64748B]">
          © {new Date().getFullYear()} KR Web Solution • Salem HQ
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to sign in</span>
          </Link>

          <div>
            <h1 className="text-[28px] leading-[36px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
              Forgot password?
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Enter your email address to receive password reset instructions.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-[#FDECEC] border border-[#B91C1C]/25 rounded-[10px] flex items-start gap-2.5 text-xs text-[#B91C1C]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="space-y-5 p-6 bg-[#E8F7EE]/60 border border-[#16A34A]/25 rounded-2xl animate-in fade-in">
              <div className="w-10 h-10 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  If that email exists, a link is on its way
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  We have dispatched a secure password reset link to your email address. The link expires in 15 minutes.
                </p>
              </div>

              <div className="pt-2">
                <Link href="/login" className="block">
                  <Button variant="secondary" size="md" className="w-full">
                    Return to sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Registered Email Address <span className="text-[#E32B2B]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@krwebsolution.com"
                    className="w-full h-11 pl-9 pr-3.5 bg-white border border-[#E6E8EE] rounded-[10px] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E32B2B] focus-visible:border-[#E32B2B]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full font-bold shadow-sm"
              >
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
