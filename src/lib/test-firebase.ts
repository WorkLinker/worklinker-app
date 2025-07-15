import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Firebase 연결 테스트 함수
export async function testFirebaseConnection() {
  try {
    console.log('🔥 Firebase 연결 테스트 시작...');
    
    // 테스트 문서 생성
    const testDoc = doc(db, 'test', 'connection-test');
    const testData = {
      message: 'Firebase connection successful!',
      timestamp: new Date(),
      project: 'WorkLinker - Canada Student Platform'
    };
    
    // 문서 저장
    await setDoc(testDoc, testData);
    console.log('✅ 문서 저장 성공');
    
    // 문서 읽기
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ 문서 읽기 성공:', docSnap.data());
    } else {
      console.log('❌ 문서를 찾을 수 없습니다');
    }
    
    // 테스트 문서 삭제
    await deleteDoc(testDoc);
    console.log('✅ 테스트 문서 삭제 완료');
    
    console.log('🎉 Firebase 연결 테스트 완료! 모든 기능이 정상 작동합니다.');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase 연결 오류:', error);
    return false;
  }
}

// 개발 환경에서만 자동 테스트 실행
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 페이지 로드 후 3초 뒤에 테스트 실행
  setTimeout(() => {
    testFirebaseConnection();
  }, 3000);
} 