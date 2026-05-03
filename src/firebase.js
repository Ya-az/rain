import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
