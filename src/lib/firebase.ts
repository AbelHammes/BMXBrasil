import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bmx-brasil.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bmx-brasil',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bmx-brasil.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '71463139463',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// Initialize Firebase safely
const app = isFirebaseConfigured
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
