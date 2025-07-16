import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAt_fnD9VsDvTcxRFNiezYj3dt2hwYqhsU",
  authDomain: "client-web-d9c86.firebaseapp.com",
  projectId: "client-web-d9c86",
  storageBucket: "client-web-d9c86.firebasestorage.app",
  messagingSenderId: "1036185501709",
  appId: "1:1036185501709:web:3b7318d135732a02ffd544",
  measurementId: "G-1GC3BH434X"
};

// Firebase 초기화 (환경변수가 있을 때만)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let storage: any = null;

// Firebase 초기화 (중복 초기화 방지)
if (typeof window !== 'undefined') {
  // 환경변수 디버깅
  console.log('🔍 Firebase Environment Variables Check:');
  console.log('- API_KEY exists:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  console.log('- API_KEY prefix:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10) + '...' : 'none');
  console.log('- PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'none');
  console.log('- AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'none');
  
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn('⚠️ Firebase API key not found in environment variables');
    console.log('Please check your .env.local file contains NEXT_PUBLIC_FIREBASE_API_KEY');
  } else if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.warn('⚠️ Firebase Project ID not found in environment variables');
  } else {
    try {
      // Firebase 앱이 이미 초기화되었는지 확인
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      
      if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        console.log('✅ Firebase initialized successfully');
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      console.log('Please check your Firebase configuration in .env.local');
      // Firebase 초기화 실패 시 null로 설정
      auth = null;
      db = null;
      storage = null;
    }
  }
} else {
  console.log('Running on server side - Firebase will be initialized on client');
}

export { auth, db, storage };
export default app; 