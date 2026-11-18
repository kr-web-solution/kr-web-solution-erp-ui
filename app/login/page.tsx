'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('inactive') || err?.message?.toLowerCase().includes('deactivated')) {
        setError('This account has been deactivated. Please contact your founder administrator.');
      } else {
        setError(err?.message || 'Invalid email or password. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Top: Logo Tile */}
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
            <span className="font-bold text-lg text-white block tracking-tight">
              KR Workspace
            </span>
            <span className="text-xs text-[#94A3B8] font-medium tracking-wider uppercase block">
              Internal ERP · CRM
            </span>
          </div>
        </div>

        {/* Center: Value Proposition */}
        <div className="relative z-10 space-y-8 my-auto py-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-heading">
            Run KR Web Solution from one workspace
          </h2>

          <div className="space-y-4 text-sm text-[#94A3B8]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E32B2B]/20 text-[#E32B2B] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-white/90 font-medium">Projects &amp; milestone deliverables</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#FADC59]/20 text-[#FADC59] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-white/90 font-medium">GST invoices and automated payment reminders</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E32B2B]/20 text-[#E32B2B] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-white/90 font-medium">Leads pipeline and verified client accounts</span>
            </div>
          </div>
        </div>

        {/* Bottom: Legal Footer */}
        <div className="relative z-10 text-xs text-[#64748B]">
          © {new Date().getFullYear()} KR Web Solution • Salem HQ, Tamil Nadu
        </div>
      </div>

      {/* Right: Clean Auth Form (white) */}
      <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#12141C] p-1 flex items-center justify-center">
              <img
                src="/brand/krws-mark.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
                }}
              />
            </div>
            <div>
              <span className="font-bold text-sm text-[#0F172A] block">KR Workspace</span>
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">
                Internal CRM &amp; ERP
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-[28px] leading-[36px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
              Welcome back
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Sign in to your KR Workspace account
            </p>
          </div>

          {/* Error Banner (crimson tint) */}
          {error && (
            <div className="p-3.5 bg-[#FDECEC] border border-[#B91C1C]/25 rounded-[10px] flex items-start gap-2.5 text-xs text-[#B91C1C] animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Email Address <span className="text-[#E32B2B]">*</span>
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
                  className="w-full h-11 pl-9 pr-3.5 bg-white border border-[#E6E8EE] rounded-[10px] text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E32B2B] focus-visible:border-[#E32B2B]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Password <span className="text-[#E32B2B]">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#E32B2B] hover:text-[#C81F26] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-9 pr-10 bg-white border border-[#E6E8EE] rounded-[10px] text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E32B2B] focus-visible:border-[#E32B2B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-2 font-bold shadow-sm"
            >
              Sign In
            </Button>
          </form>

          {/* Security note */}
          <div className="pt-4 border-t border-[#E6E8EE] text-center text-xs text-[#94A3B8] flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Encrypted session with secure httpOnly cookie</span>
          </div>
        </div>
      </div>
    </div>
  );
}
