import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-700',
    intake_review: 'bg-cyan-100 text-cyan-700',
    clinical_review: 'bg-purple-100 text-purple-700',
    decision_pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-700',
    action_required: 'bg-orange-100 text-orange-700',
    appeal_submitted: 'bg-indigo-100 text-indigo-700',
    withdrawn: 'bg-gray-100 text-gray-500',
    expiring: 'bg-orange-100 text-orange-600',
    verified: 'bg-green-100 text-green-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    intake_review: 'Intake Review',
    clinical_review: 'Clinical Review',
    decision_pending: 'Decision Pending',
    approved: 'Approved',
    denied: 'Denied',
    action_required: 'Action Required',
    appeal_submitted: 'Appeal',
    withdrawn: 'Withdrawn',
  };
  return map[status] || status;
}

export function getAIScoreColor(score: number | null): string {
  if (!score) return 'text-gray-400';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-500';
}

export function getAIScoreBg(score: number | null): string {
  if (!score) return 'bg-gray-200';
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
