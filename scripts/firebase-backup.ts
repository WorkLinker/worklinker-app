// Firebase 데이터 백업 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 백업할 컬렉션 목록
const COLLECTIONS = [
  'jobSeekers',
  'jobPostings', 
  'jobApplications',
  'references',
  'events',
  'eventRegistrations',
  'posts',
  'contacts',
  'activityLogs',
  'siteContent',
  'designSettings',
  'volunteerPostings',
  'volunteerApplications'
];

interface BackupData {
  [collectionName: string]: any[];
}

// Firestore Timestamp를 JSON 직렬화 가능한 형태로 변환
function convertTimestamps(obj: any): any {
  if (!obj) return obj;
  
  if (typeof obj === 'object' && obj.toDate && typeof obj.toDate === 'function') {
    // Firestore Timestamp 객체
    return obj.toDate().toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertTimestamps(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

// 단일 컬렉션 백업
async function backupCollection(collectionName: string) {
  try {
    console.log(`📦 ${collectionName} 컬렉션 백업 시작...`);
    
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const convertedData = convertTimestamps(data);
      
      documents.push({
        id: doc.id,
        ...convertedData
      });
    });
    
    console.log(`✅ ${collectionName}: ${documents.length}개 문서 백업 완료`);
    return documents;
  } catch (error) {
    console.error(`❌ ${collectionName} 백업 실패:`, error);
    return [];
  }
}

// 전체 데이터 백업
async function backupAllData() {
  console.log('🚀 Firebase 데이터 백업 시작...\n');
  
  const backupData: BackupData = {};
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // 각 컬렉션 백업
  for (const collectionName of COLLECTIONS) {
    backupData[collectionName] = await backupCollection(collectionName);
  }
  
  // 백업 메타데이터 추가
  const metadata = {
    backupTimestamp: new Date().toISOString(),
    totalCollections: COLLECTIONS.length,
    totalDocuments: Object.values(backupData).reduce((sum, docs) => sum + docs.length, 0),
    collections: COLLECTIONS.map(name => ({
      name,
      documentCount: backupData[name].length
    }))
  };
  
  const finalBackup = {
    metadata,
    data: backupData
  };
  
  // JSON 파일로 저장
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const fileName = `firebase-backup-${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(finalBackup, null, 2), 'utf8');
  
  console.log('\n🎉 백업 완료!');
  console.log(`📁 저장 위치: ${filePath}`);
  console.log(`📊 총 컬렉션: ${metadata.totalCollections}개`);
  console.log(`📄 총 문서: ${metadata.totalDocuments}개`);
  console.log('\n📋 컬렉션별 문서 수:');
  
  metadata.collections.forEach(col => {
    console.log(`  - ${col.name}: ${col.documentCount}개`);
  });
  
  return filePath;
}

// 스크립트 실행
if (require.main === module) {
  backupAllData()
    .then((filePath) => {
      console.log(`\n✅ 백업 성공: ${filePath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 백업 실패:', error);
      process.exit(1);
    });
}

export { backupAllData, backupCollection }; 