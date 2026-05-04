import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyADcBSbK2tKunat47fSrdVVsgqoUBRmXps',
  authDomain: 'rain-f568d.firebaseapp.com',
  projectId: 'rain-f568d',
  storageBucket: 'rain-f568d.firebasestorage.app',
  messagingSenderId: '269805662183',
  appId: '1:269805662183:web:79a271e42824a4ac029742',
  measurementId: 'G-HFW9QJKG79',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ─── Anonymous sign-in (Phase 1 — transitional) ────────────────────────────
// Firestore security rules require `request.auth != null` so the app must
// have a signed-in identity before doing any reads/writes. This signs the
// browser session in anonymously. Phase 4 will replace this with a real
// per-user Firebase Auth flow.
export const ensureAuthReady = () =>
  new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
    signInAnonymously(auth).catch((err) => {
      unsub();
      reject(err);
    });
  });

