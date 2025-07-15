// Firebase Auth 사용자 목록 내보내기 스크립트
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import * as admin from 'firebase-admin';
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

// Firebase Admin 초기화 (서비스 계정 키 없이 시도)
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
} catch (error) {
  console.log('⚠️ Firebase Admin 초기화 실패. 클라이언트 SDK만 사용합니다.');
}

// 사용자 목록 조회 (Admin SDK 사용 시도)
async function exportFirebaseUsers() {
  console.log('🔍 Firebase Auth 사용자 목록 조회 시작...\n');
  
  try {
    // Admin SDK로 사용자 목록 조회 시도
    const auth = admin.auth();
    const listUsersResult = await auth.listUsers();
    
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      disabled: user.disabled,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
        lastRefreshTime: user.metadata.lastRefreshTime
      },
      customClaims: user.customClaims,
      providerData: user.providerData
    }));
    
    console.log(`✅ Firebase Auth 사용자 ${users.length}명 발견`);
    
    // 백업 파일로 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const fileName = `firebase-auth-backup-${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);
    
    const backup = {
      exportTime: new Date().toISOString(),
      userCount: users.length,
      users: users
    };
    
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf8');
    
    console.log(`📁 저장 위치: ${filePath}\n`);
    
    // 사용자 정보 요약 출력
    console.log('👥 사용자 목록:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email || '이메일 없음'} (${user.uid})`);
      console.log(`     생성: ${user.metadata.creationTime}`);
      console.log(`     마지막 로그인: ${user.metadata.lastSignInTime || '없음'}`);
      console.log('');
    });
    
    return { success: true, users, filePath };
    
  } catch (error: any) {
    console.error('❌ Firebase Auth 사용자 조회 실패:', error);
    
    if (error.code === 'app/no-options') {
      console.log('\n💡 해결 방법:');
      console.log('1. Firebase 프로젝트 설정에서 서비스 계정 키 다운로드');
      console.log('2. GOOGLE_APPLICATION_CREDENTIALS 환경 변수 설정');
      console.log('3. 또는 Firebase Console에서 수동으로 사용자 목록 확인');
    }
    
    return { success: false, error };
  }
}

// 대안: Firebase Console에서 수동 확인 안내
function showManualInstructions() {
  console.log('\n📱 Firebase Console에서 수동 확인하는 방법:');
  console.log('1. https://console.firebase.google.com 접속');
  console.log('2. 프로젝트 선택');
  console.log('3. 왼쪽 메뉴에서 "Authentication" 클릭');
  console.log('4. "Users" 탭에서 등록된 사용자 목록 확인');
  console.log('5. 사용자가 있다면 Supabase로 이전 필요');
  console.log('6. 사용자가 없다면 새로 시작 가능\n');
}

// 스크립트 실행
if (require.main === module) {
  exportFirebaseUsers()
    .then((result) => {
      if (result.success) {
        console.log(`✅ Auth 백업 완료: ${result.users?.length}명`);
      } else {
        console.log('⚠️ Auth 백업 실패, 수동 확인 필요');
        showManualInstructions();
      }
    })
    .catch((error) => {
      console.error('❌ 오류:', error);
      showManualInstructions();
    });
}

export { exportFirebaseUsers }; 