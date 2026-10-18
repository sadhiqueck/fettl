export type PendingOtp = { email: string; sentAt: number };

const KEY = 'fettl:pending-otp';
const MAX_AGE = 24 * 60 * 60 * 1000;

export function readPendingOtp(): PendingOtp | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== 'object' ||
      !('email' in value) ||
      typeof value.email !== 'string' ||
      !('sentAt' in value) ||
      typeof value.sentAt !== 'number' ||
      value.sentAt > Date.now() ||
      Date.now() - value.sentAt > MAX_AGE
    ) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return { email: value.email, sentAt: value.sentAt };
  } catch {
    return null;
  }
}

export function savePendingOtp(value: PendingOtp) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Sign-in still works when browser storage is unavailable.
  }
}

export function clearPendingOtp() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Sign-in still works when browser storage is unavailable.
  }
}
