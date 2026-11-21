import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

export function buildLoginEmail(idOrEmail: string): string {
  const clean = idOrEmail.trim().toLowerCase();
  if (!clean) return '';
  if (clean.includes('@')) return clean;
  const sanitized = clean.replace(/[^a-z0-9._-]/g, '');
  return sanitized ? `${sanitized}@kas-pengajian.app` : '';
}

export async function createMasterAuthUser(
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  const secondaryAppName = 'SecondaryMasterAuth';
  const existingSecondary = getApps().find((a) => a.name === secondaryAppName);
  const secondaryApp = existingSecondary || initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    if (displayName.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } catch (err) {
    try {
      await signOut(secondaryAuth);
    } catch {
      // ignore cleanup error
    }
    throw err;
  }
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
