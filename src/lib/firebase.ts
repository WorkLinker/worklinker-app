import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBzy34Qfj6ESjm5cvHazgktCad1DHu71uo",
  authDomain: "client-web-d9c86.firebaseapp.com",
  projectId: "client-web-d9c86",
  storageBucket: "client-web-d9c86.appspot.com",
  messagingSenderId: "1036185501709",
  appId: "1:1036185501709:web:711bdf1a5473b73fffd544"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 