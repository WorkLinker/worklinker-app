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
    return false;
  }
  
  try {
    // Firebase가 정상적으로 초기화되었는지 확인
    if (typeof window !== 'undefined' && auth.app) {
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase Auth persistence setup complete - login state maintained');
      return true;
    }
  } catch (error) {
    console.warn('Firebase Auth persistence setup error:', error);
    // 에러가 발생해도 앱이 정상 작동하도록 함
  }
  return false;
};

// 앱 시작 시 persistence 설정 (클라이언트 사이드에서만)
// let persistenceInitialized = false; // 사용하지 않음
if (typeof window !== 'undefined') {
  initializePersistence().then((success) => {
    // persistenceInitialized = success; // 사용하지 않음
    console.log('Firebase persistence initialized:', success);
  });
}

// 🔐 인증 서비스
export const authService = {
  // 이메일/비밀번호 회원가입
  async signUpWithEmail(email: string, password: string, displayName: string) {
    if (!auth) {
      throw new Error('Firebase authentication is not properly configured. Please check your environment variables.');
    }

    try {
      console.log('📝 Starting email signup...', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile
      await updateProfile(user, {
        displayName: displayName
      });
      
      console.log('✅ Signup successful (login state maintained):', user.uid);
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      };
    } catch (error: unknown) {
      console.error('❌ Signup error:', error);
      
      let errorMessage = 'An error occurred during signup.';
      
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. (minimum 6 characters)';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/api-key-not-valid':
          errorMessage = 'Firebase configuration error. Please check your settings.';
          break;
      }
      
      throw new Error(errorMessage);
    }
  },

  // 이메일/비밀번호 로그인
  async signInWithEmail(email: string, password: string) {
    if (!auth) {
      throw new Error('Firebase authentication is not properly configured. Please check your environment variables.');
    }

    try {
      console.log('🔑 Starting email login...', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Login successful (state maintained):', user.uid);
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      };
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'An error occurred during login.';
      
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        case 'auth/api-key-not-valid':
          errorMessage = 'Firebase configuration error. Please check your settings.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid login credentials. Please check your email and password.';
          break;
      }
      
      throw new Error(errorMessage);
    }
  },

  // 구글 로그인
  async signInWithGoogle() {
    if (!auth) {
      throw new Error('Firebase authentication is not properly configured. Please check your environment variables.');
    }

    try {
      console.log('🔍 Starting Google login...');
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log('✅ Google login successful (state maintained):', user.uid);
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
      console.error('❌ Google login error:', error);
      
      let errorMessage = 'An error occurred during Google login.';
      
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login was cancelled.';
      } else if (firebaseError.code === 'auth/api-key-not-valid') {
        errorMessage = 'Firebase configuration error. Please check your settings.';
      }
      
      throw new Error(errorMessage);
    }
  },

  // 로그아웃
  async signOut() {
    if (!auth) {
      console.log('Firebase not configured, using Supabase auth');
      return { success: true };
    }

    try {
      await signOut(auth);
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw new Error('An error occurred during logout.');
    }
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser() {
    if (!auth) {
      console.log('Firebase not configured');
      return null;
    }
    return auth.currentUser;
  },

  // 인증 상태 변화 감지
  onAuthStateChange(callback: (user: User | null) => void) {
    if (!auth) {
      console.log('Firebase not configured, calling callback with null');
      callback(null);
      return () => {}; // 빈 unsubscribe 함수 반환
    }
    
    return onAuthStateChanged(auth, callback);
  },

  // 로그인 상태 확인 (페이지 로드 시 사용)
  async checkAuthState(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          console.log('✅ Existing login state confirmed:', user.email);
        } else {
          console.log('❌ No login state found');
        }
        resolve(user);
      });
    });
  },

  // 로그인 상태 지속성 확인
  isLoggedIn(): boolean {
    const user = auth.currentUser;
    if (user) {
      console.log('👤 Current logged in user:', user.email);
      return true;
    }
    return false;
  },

  // 이메일 인증 발송
  async sendEmailVerification() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Login is required.');
      }

      await sendEmailVerification(user, {
        url: window.location.origin, // URL to return to after verification
        handleCodeInApp: true
      });

      console.log('✅ Email verification sent successfully:', user.email);
      return { success: true, message: 'Verification email has been sent.' };
    } catch (error: unknown) {
      console.error('❌ Email verification sending error:', error);
      throw new Error('An error occurred while sending email verification.');
    }
  },

  // 비밀번호 재설정 이메일 발송
  async sendPasswordResetEmail(email: string) {
    try {
      console.log('📧 Sending password reset email...', email);
      
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin // URL to return to after reset
      });

      console.log('✅ Password reset email sent successfully');
      return { 
        success: true, 
        message: 'Password reset email has been sent. Please check your email.' 
      };
    } catch (error: unknown) {
      console.error('❌ Password reset email sending error:', error);
      
      let errorMessage = 'An error occurred while sending password reset email.';
      
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 'auth/api-key-not-valid':
          errorMessage = 'Firebase configuration error. Please check your settings.';
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

  // 🔒 보안상 관리자 계정 생성 기능을 제거
  async createAdminAccounts() {
    console.log('⚠️ Admin accounts should be created manually in Firebase Console for security');
    console.log('📧 Recommended admin emails: admin@example.com, manager@jobsprout.ca, admin@jobsprout.ca');
    return { 
      success: false, 
      message: 'For security reasons, please create admin accounts manually in Firebase Console'
    };
  }
}; 