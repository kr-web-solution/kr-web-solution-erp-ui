'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { authApi } from '@/lib/api/client';
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) {
    return <LoadingAnimation fullPage label="Loading profile…" />;
  }

  // Password requirements
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const passedCount = [hasMinLength, hasNumber, hasUppercase, newPassword.length >= 12].filter(Boolean).length;
  const strengthLevel =
    passedCount <= 1 ? 'Weak' : passedCount <= 3 ? 'Medium' : 'Strong';
  const strengthColor =
    passedCount <= 1 ? 'bg-rose-500' : passedCount <= 3 ? 'bg-amber-500' : 'bg-emerald-500';

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsUpdatingProfile(true);
    try {
      await authApi.updateMe({ full_name: fullName.trim() });
      await refreshUser();
      toast.success('Profile name updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile name');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!hasMinLength || !hasNumber || !hasUppercase) {
      setPasswordError('Password does not satisfy security requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authApi.updateMe({
        password: newPassword,
        current_password: currentPassword || undefined,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#E6E8EE] pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
            My Account &amp; Security
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Manage your personal credentials, workspace identification, and security preferences.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          className="text-[#B91C1C] hover:bg-rose-50 h-9 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span>Sign Out</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Account Info Card */}
      <SectionCard
        title="Account Profile"
        subtitle="Identity and workspace permissions"
        icon={<UserIcon className="w-4 h-4" />}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.full_name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A]">{user.full_name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFF1F0] text-[#E32B2B] border border-rose-200">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4 pt-4 border-t border-[#E6E8EE]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </FormField>

              <FormField label="Email Address" hint="Contact founder to change email">
                <Input value={user.email} disabled />
              </FormField>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdatingProfile}
                disabled={fullName.trim() === user.full_name}
              >
                Save Name
              </Button>
            </div>
          </form>
        </div>
      </SectionCard>

      {/* Change Password Card */}
      <SectionCard
        title="Change Password"
        subtitle="Ensure account is protected by a strong, unique password"
        icon={<Key className="w-4 h-4" />}
      >
        {passwordError && (
          <div className="mb-4 p-3.5 bg-[#FDECEC] border border-rose-200 rounded-[10px] flex items-center gap-2 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <FormField label="New Password" required>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1.5">
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
          </FormField>

          <FormField label="Confirm New Password" required>
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormField>

          {/* Requirements Checklist */}
          <div className="p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-[10px] space-y-2 text-xs">
            <div className="font-semibold text-[#0F172A]">Password requirements:</div>
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
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingPassword}
              disabled={!hasMinLength || !hasNumber || !hasUppercase || !passwordsMatch}
            >
              Update Password
            </Button>
          </div>
        </form>
      </SectionCard>
      </div>
    </div>
  );
}
