'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { authApi } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { AlertCircle, UserRound } from 'lucide-react';

export default function ProfileOnboardingPage() {
  const { user, refreshUser, isLoading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isStaff = user?.party_type === 'staff';
  const missing = user?.missing_profile_fields || [];

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setPhone(user.phone || '');
    setDesignation(user.designation || '');
    setDepartment(user.department || '');
    if (user.profile_completed) {
      router.replace(user.role === 'worker' ? '/staff/me' : '/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        designation: designation.trim() || undefined,
        department: isStaff ? department.trim() || undefined : undefined,
      });
      await refreshUser();
      if (updated.profile_completed) {
        router.replace(updated.role === 'worker' ? '/staff/me' : '/dashboard');
      } else {
        setError(
          `Still missing: ${(updated.missing_profile_fields || []).join(', ') || 'required fields'}`,
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#64748B]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F6F7F9]">
      <div className="w-full max-w-lg bg-white border border-[#E6E8EE] rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF1F0] text-[#E32B2B] flex items-center justify-center">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] font-heading">Complete your profile</h1>
            <p className="text-sm text-[#64748B] mt-1">
              A few details are required before you can use the workspace.
              {missing.length > 0 ? ` Missing: ${missing.join(', ')}.` : ''}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#FDECEC] border border-rose-200 rounded-[10px] text-xs text-[#B91C1C] flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full name" required>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </FormField>
          <FormField label="Phone" required>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 …"
              required
            />
          </FormField>
          <FormField label="Designation" required>
            <Input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Operations Lead"
              required
            />
          </FormField>
          {isStaff && (
            <FormField label="Department" required>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                required
              />
            </FormField>
          )}
          <Button type="submit" variant="primary" size="lg" isLoading={saving} className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
