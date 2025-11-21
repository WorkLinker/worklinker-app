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

// Persistent login state settings
const initializePersistence = async () => {
  if (!auth) {
    console.log('Firebase not configured, using Supabase auth');
    return false;
  }
  
  try {
    // Check if Firebase is properly initialized
    if (typeof window !== 'undefined' && auth.app) {
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase Auth persistence setup complete - login state maintained');
      return true;
    }
  } catch (error) {
    console.warn('Firebase Auth persistence setup error:', error);
    // Allow app to work normally even if error occurs
  }
  return false;
};

// Set persistence on app start (client side only)
// let persistenceInitialized = false; // Not used
if (typeof window !== 'undefined') {
  initializePersistence().then((success) => {
    // persistenceInitialized = success; // Not used
    console.log('Firebase persistence initialized:', success);
  });
}

// 🔐 Authentication Services
export const authService = {
  // Email/Password signup
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

  // Email/Password login
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

  // Google login
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

  // Logout
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

  // Get current user information
  getCurrentUser() {
    if (!auth) {
      console.log('Firebase not configured');
      return null;
    }
    return auth.currentUser;
  },

  // Detect authentication state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    if (!auth) {
      console.log('Firebase not configured, calling callback with null');
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }
    
    return onAuthStateChanged(auth, callback);
  },

  // Check auth state (used on page load)
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

  // Check login state persistence
  isLoggedIn(): boolean {
    const user = auth.currentUser;
    if (user) {
      console.log('👤 Current logged in user:', user.email);
      return true;
    }
    return false;
  },

  // Send email verification
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

  // Send password reset email
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

  // Change password
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Login is required.');
      }

      console.log('🔒 Starting password change...');
      
      // Re-authenticate with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update to new password
      await updatePassword(user, newPassword);

      console.log('✅ Password changed successfully');
      return { 
        success: true, 
        message: 'Password has been changed successfully.' 
      };
    } catch (error: unknown) {
      console.error('❌ Password change error:', error);
      
      let errorMessage = 'An error occurred while changing password.';
      
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect.';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak. (minimum 6 characters)';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'For security, please login again and try.';
          break;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Check email verification status
  isEmailVerified(): boolean {
    const user = auth.currentUser;
    return user ? user.emailVerified : false;
  },

  // Refresh current user's email verification status
  async reloadUser() {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        console.log('✅ User information refresh completed');
        return { success: true, emailVerified: user.emailVerified };
      }
      return { success: false, emailVerified: false };
    } catch (error: unknown) {
      console.error('❌ User information refresh error:', error);
      throw new Error('An error occurred while refreshing user information.');
    }
  },

  // 🔒 Admin account creation feature removed for security
  async createAdminAccounts() {
    console.log('⚠️ Admin accounts should be created manually in Firebase Console for security');
    console.log('📧 Recommended admin emails: admin@example.com, manager@jobsprout.ca, admin@jobsprout.ca');
    return { 
      success: false, 
      message: 'For security reasons, please create admin accounts manually in Firebase Console'
    };
  }
}; 