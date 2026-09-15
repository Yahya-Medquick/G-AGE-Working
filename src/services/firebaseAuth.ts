export { getOrCreateDeviceId } from "../utils/deviceFingerprint";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from "firebase/auth";

let app: any = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!apiKey || !authDomain || !projectId) {
      throw new Error('Firebase configuration error: Missing required environment variables.');
    }

    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  }
  return auth;
}

export async function signInWithGoogle(): Promise<{
  idToken: string;
  email: string;
  name: string;
  avatar: string;
  googleId: string;
}> {
  const authInstance = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  const result = await signInWithPopup(authInstance, provider);
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    email: result.user.email || '',
    name: result.user.displayName || '',
    avatar: result.user.photoURL || '',
    googleId: result.user.uid,
  };
}
