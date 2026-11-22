import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Exclusive Game Master (GM) account email.
 * Must always match the bootstrapped GM check in firestore.rules and requires
 * a verified Firebase Authentication session (emailVerified === true).
 */
export const PRIMARY_GM_EMAIL = 'opiadoalvorada@gmail.com';

/**
 * Synchronous check verifying if a Firebase Auth user is the bootstrapped GM.
 * Never trusts localStorage or unverified email claims.
 */
export function isBootstrappedGmUser(user: User | null | undefined): boolean {
  if (!user || !user.emailVerified || !user.email) {
    return false;
  }
  return user.email.trim().toLowerCase() === PRIMARY_GM_EMAIL;
}

/**
 * Authoritative async check resolving whether the verified Firebase user holds GM powers:
 * 1) Verified primary GM email (bootstrapped in firestore.rules), OR
 * 2) Console-managed marker document at /admins/{uid} (read-only by self, zero client writes).
 */
export async function resolveIsGmAccount(
  user: User | null | undefined
): Promise<boolean> {
  if (!user || !user.emailVerified) {
    return false;
  }

  if (isBootstrappedGmUser(user)) {
    return true;
  }

  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists() && snap.data()?.role === 'gm';
  } catch {
    return false;
  }
}

/**
 * Fast runtime check against the active Firebase Auth session.
 */
export function isCurrentAuthUserBootstrappedGm(): boolean {
  return isBootstrappedGmUser(auth.currentUser);
}
