import { randomBytes } from 'node:crypto';
import { parseFrontendOrigins } from '../common/config/browser-origin';

export function selectFrontendOrigin(configured: string, requested?: unknown) {
  const allowed = parseFrontendOrigins(configured);
  if (requested === undefined) return allowed[0];
  if (typeof requested !== 'string' || !allowed.includes(requested)) {
    throw new Error('Invalid sign-in destination');
  }
  return requested;
}

export function createGoogleState(origin: string) {
  const nonce = randomBytes(32).toString('hex');
  return `${nonce}.${Buffer.from(origin).toString('base64url')}`;
}

export function originFromGoogleState(configured: string, state: unknown) {
  if (
    typeof state !== 'string' ||
    !/^[a-f0-9]{64}\.[A-Za-z0-9_-]+$/.test(state)
  ) {
    throw new Error('Invalid Google sign-in state');
  }
  const origin = Buffer.from(state.split('.')[1], 'base64url').toString('utf8');
  return selectFrontendOrigin(configured, origin);
}
