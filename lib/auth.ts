export interface User {
  user_id: string;
  email: string;
  role: string;
  full_name: string;
  org_id: string | null;
  org_name?: string;
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('oneclick_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function storeAuth(token: string, user: User) {
  localStorage.setItem('oneclick_token', token);
  localStorage.setItem('oneclick_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('oneclick_token');
  localStorage.removeItem('oneclick_user');
}

export function isProvider(user: User | null) {
  return user?.role === 'provider';
}

export function isPayerRole(user: User | null) {
  return ['payer_intake', 'payer_clinical', 'payer_decision'].includes(user?.role || '');
}
