import { auth } from './firebase';
// import { supabaseAuthService } from './supabase-auth-service';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendEmailVerification,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';

// 로그인 상태 영구 유지 설정
const initializePersistence = async () => {
  if (!auth) {
    console.log('Firebase not configured, using Supabase auth');
    return;
  }
  
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Firebase Auth persistence 설정 완료 - 로그인 상태 유지');
  } catch (error) {
    console.error('❌ Firebase Auth persistence 설정 오류:', error);
  }
};

// 앱 시작 시 persistence 설정
initializePersistence();

// 🔐 인증 서비스
export const authService = {
  // 이메일/비밀번호 회원가입
  async signUpWithEmail(email: string, password: string, displayName: string) {
    try {
      console.log('📝 이메일 회원가입 시작...', email);
      
      // 회원가입 전 persistence 확인
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 사용자 프로필 업데이트
      await updateProfile(user, {
        displayName: displayName
      });
      
      console.log('✅ 회원가입 성공 (로그인 상태 유지됨):', user.uid);
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      };
    } catch (error: unknown) {
      console.error('❌ 회원가입 오류:', error);
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage = '이미 사용 중인 이메일 주소입니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '비밀번호가 너무 약합니다. (최소 6자)';
          break;
        case 'auth/invalid-email':
          errorMessage = '올바르지 않은 이메일 주소입니다.';
          break;
      }
      
      throw new Error(errorMessage);
    }
  },

  // 이메일/비밀번호 로그인
  async signInWithEmail(email: string, password: string) {
    try {
      console.log('🔑 이메일 로그인 시작...', email);
      
      // 로그인 전 persistence 확인
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ 로그인 성공 (상태 유지됨):', user.uid);
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      };
    } catch (error: unknown) {
      console.error('❌ 로그인 오류:', error);
      
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          errorMessage = '등록되지 않은 이메일 주소입니다.';
          break;
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '올바르지 않은 이메일 주소입니다.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.';
          break;
      }
      
      throw new Error(errorMessage);
    }
  },

  // 구글 로그인
  async signInWithGoogle() {
    try {
      console.log('🔍 구글 로그인 시작...');
      
      // 로그인 전 persistence 확인
      await setPersistence(auth, browserLocalPersistence);
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log('✅ 구글 로그인 성공 (상태 유지됨):', user.uid);
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }
      };
    } catch (error: unknown) {
      console.error('❌ 구글 로그인 오류:', error);
      
      let errorMessage = '구글 로그인 중 오류가 발생했습니다.';
      
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMessage = '로그인이 취소되었습니다.';
      }
      
      throw new Error(errorMessage);
    }
  },

  // 로그아웃
  async signOut() {
    try {
      console.log('👋 로그아웃 시작...');
      
      await signOut(auth);
      
      console.log('✅ 로그아웃 성공');
      return { success: true };
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
      throw new Error('로그아웃 중 오류가 발생했습니다.');
    }
  },

  // 현재 사용자 가져오기
  getCurrentUser(): User | null {
    if (!auth) {
      console.log('Using Supabase auth instead of Firebase');
      return null;
    }
    return auth.currentUser;
  },

  // 인증 상태 변화 감지
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // 로그인 상태 확인 (페이지 로드 시 사용)
  async checkAuthState(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          console.log('✅ 기존 로그인 상태 확인됨:', user.email);
        } else {
          console.log('❌ 로그인 상태 없음');
        }
        resolve(user);
      });
    });
  },

  // 로그인 상태 지속성 확인
  isLoggedIn(): boolean {
    const user = auth.currentUser;
    if (user) {
      console.log('👤 현재 로그인 사용자:', user.email);
      return true;
    }
    return false;
  },

  // 이메일 인증 발송
  async sendEmailVerification() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      await sendEmailVerification(user, {
        url: window.location.origin, // 인증 후 돌아올 URL
        handleCodeInApp: true
      });

      console.log('✅ 이메일 인증 발송 성공:', user.email);
      return { success: true, message: '인증 이메일이 발송되었습니다.' };
    } catch (error: unknown) {
      console.error('❌ 이메일 인증 발송 오류:', error);
      throw new Error('이메일 인증 발송 중 오류가 발생했습니다.');
    }
  },

  // 비밀번호 재설정 이메일 발송
  async sendPasswordResetEmail(email: string) {
    try {
      console.log('📧 비밀번호 재설정 이메일 발송...', email);
      
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin // 재설정 후 돌아올 URL
      });

      console.log('✅ 비밀번호 재설정 이메일 발송 성공');
      return { 
        success: true, 
        message: '비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.' 
      };
    } catch (error: unknown) {
      console.error('❌ 비밀번호 재설정 이메일 발송 오류:', error);
      
      let errorMessage = '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.';
      
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          errorMessage = '등록되지 않은 이메일 주소입니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '올바르지 않은 이메일 주소입니다.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
          break;
      }
      
      throw new Error(errorMessage);
    }
  },

  // 비밀번호 변경
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('🔒 비밀번호 변경 시작...');
      
      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // 새 비밀번호로 업데이트
      await updatePassword(user, newPassword);

      console.log('✅ 비밀번호 변경 성공');
      return { 
        success: true, 
        message: '비밀번호가 성공적으로 변경되었습니다.' 
      };
    } catch (error: unknown) {
      console.error('❌ 비밀번호 변경 오류:', error);
      
      let errorMessage = '비밀번호 변경 중 오류가 발생했습니다.';
      
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/wrong-password':
          errorMessage = '현재 비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '새 비밀번호가 너무 약합니다. (최소 6자)';
          break;
        case 'auth/requires-recent-login':
          errorMessage = '보안을 위해 다시 로그인 후 시도해주세요.';
          break;
      }
      
      throw new Error(errorMessage);
    }
  },

  // 이메일 인증 상태 확인
  isEmailVerified(): boolean {
    const user = auth.currentUser;
    return user ? user.emailVerified : false;
  },

  // 현재 사용자의 이메일 인증 상태 새로고침
  async reloadUser() {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        console.log('✅ 사용자 정보 새로고침 완료');
        return { success: true, emailVerified: user.emailVerified };
      }
      return { success: false, emailVerified: false };
    } catch (error: unknown) {
      console.error('❌ 사용자 정보 새로고침 오류:', error);
      throw new Error('사용자 정보를 새로고침하는 중 오류가 발생했습니다.');
    }
  },

  // 관리자 계정 생성 (개발/테스트용)
  async createAdminAccounts() {
    try {
      const adminAccounts = [
        { email: 'admin@example.com', password: 'admin123456', name: '시스템 관리자' },
        { email: 'manager@jobsprout.ca', password: 'manager123456', name: '매니저' },
        { email: 'admin@jobsprout.ca', password: 'jobsprout123456', name: 'JobSprout 관리자' }
      ];

      const results = [];
      for (const account of adminAccounts) {
        try {
          // 로그아웃 상태에서 계정 생성
          await this.signOut();
          
          const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
          
          // 사용자 프로필 업데이트
          await updateProfile(userCredential.user, {
            displayName: account.name
          });

          results.push({ 
            success: true, 
            email: account.email, 
            password: account.password,
            name: account.name 
          });
          
          console.log(`✅ 관리자 계정 생성 성공: ${account.email}`);
        } catch (error: unknown) {
          const firebaseError = error as { code?: string; message?: string };
          if (firebaseError.code === 'auth/email-already-in-use') {
            results.push({ 
              success: true, 
              email: account.email, 
              password: account.password,
              name: account.name,
              note: '이미 존재하는 계정' 
            });
            console.log(`ℹ️ 이미 존재하는 관리자 계정: ${account.email}`);
          } else {
            results.push({ 
              success: false, 
              email: account.email, 
              error: firebaseError.message || '계정 생성 중 오류가 발생했습니다.' 
            });
            console.error(`❌ 관리자 계정 생성 실패: ${account.email}`, error);
          }
        }
      }

      return { success: true, accounts: results };
    } catch (error: unknown) {
      console.error('❌ 관리자 계정 생성 오류:', error);
      throw error;
    }
  }
}; 