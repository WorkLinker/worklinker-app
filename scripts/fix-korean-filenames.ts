import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function fixKoreanFilenames() {
  console.log('🔧 Starting Korean filename cleanup...');
  
  try {
    // 사이트 설정에서 design 문서 조회
    const settingsQuery = query(collection(db, 'siteSettings'), where('__name__', '==', 'design'));
    const settingsSnapshot = await getDocs(settingsQuery);
    
    if (settingsSnapshot.empty) {
      console.log('✅ No design settings found - creating new English settings');
      return;
    }
    
    const designDoc = settingsSnapshot.docs[0];
    const currentData = designDoc.data();
    
    console.log('📋 Current design settings:', currentData);
    
    // 영어 파일명으로 수정된 설정
    const fixedSettings = {
      ...currentData,
      images: {
        ...currentData.images,
        heroSlides: {
          slide1: '/images/main-home-1.png',
          slide2: '/images/main-home-2.jpg',
          slide3: '/images/main-home-3.png'
        },
        featureCards: {
          student: '/images/student-opportunities.png',
          reference: '/images/reference-support.png',
          company: '/images/company-recruitment.png',
          events: '/images/education-events.png'
        }
      },
      updatedAt: new Date(),
      fixedKoreanFilenames: true
    };
    
    // Firebase에 업데이트
    const docRef = doc(db, 'siteSettings', designDoc.id);
    await updateDoc(docRef, fixedSettings);
    
    console.log('✅ Korean filenames successfully fixed!');
    console.log('📋 New settings:', fixedSettings);
    
  } catch (error) {
    console.error('❌ Error fixing Korean filenames:', error);
    throw error;
  }
}

// 스크립트 실행
fixKoreanFilenames()
  .then(() => {
    console.log('🎉 Korean filename cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Korean filename cleanup failed:', error);
    process.exit(1);
  }); 