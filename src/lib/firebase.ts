import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'm-health-jxug7',
  appId: '1:284239863057:web:efb385e0aeb95c2f2480b0',
  storageBucket: 'm-health-jxug7.firebasestorage.app',
  apiKey: 'AIzaSyBOg1Bfwx_Gjbx7DO4i54KjAJKKq-dZ5lg',
  authDomain: 'm-health-jxug7.firebaseapp.com',
  messagingSenderId: '284239863057',
  measurementId: 'G-XXXXXXXXXX'
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore with offline persistence.
// Using memoryLocalCache to avoid persistence conflicts in some environments.
const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});


export { app, auth, db };
