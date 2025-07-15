/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export type { User, Session, AuthError };

// Supabase Auth 서비스
export const supabaseAuthService = {
  // 현재 사용자 가져오기
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // 현재 세션 가져오기
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // 이메일/비밀번호로 로그인
  async signInWithEmail(email: string, password: string) {
    try {
      console.log('Supabase email login attempt:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login failed:', error.message);
        throw error;
      }

      console.log('Login successful:', data.user?.email);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // 이메일/비밀번호로 회원가입
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async signUpWithEmail(email: string, password: string, metadata?: any) {
    try {
      console.log('Supabase signup attempt:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        console.error('Signup failed:', error.message);
        throw error;
      }

      console.log('Signup successful:', data.user?.email);
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('Signup error:', error.message);
      throw error;
    }
  },

  // Google OAuth 로그인
  async signInWithGoogle() {
    try {
      console.log('Google OAuth login attempt...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google login failed:', error.message);
        throw error;
      }

      console.log('Google login redirect started');
      return { success: true };
    } catch (error: any) {
      console.error('Google login error:', error.message);
      throw error;
    }
  },

  // 로그아웃
  async signOut() {
    try {
      console.log('Logout attempt...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout failed:', error.message);
        throw error;
      }

      console.log('Logout successful');
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error.message);
      throw error;
    }
  },

  // 비밀번호 재설정
  async resetPassword(email: string) {
    try {
      console.log('Password reset request:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Password reset failed:', error.message);
        throw error;
      }

      console.log('Password reset email sent');
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error.message);
      throw error;
    }
  },

  // 인증 상태 변화 구독
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      console.log('Auth state change:', event, session?.user?.email);
      callback(event, session);
    });
  },

  // 관리자 권한 확인
  isAdmin(user: User | null): boolean {
    if (!user) return false;
    
    // 관리자 이메일 목록 (환경 변수에서 가져오거나 하드코딩)
    const adminEmails = [
      'nbhighschooljobs@gmail.com',
      process.env.ADMIN_EMAIL
    ].filter(Boolean);
    
    return adminEmails.includes(user.email || '');
  },

  // 사용자 메타데이터 업데이트
  async updateUserMetadata(metadata: any) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      });

      if (error) {
        console.error('User metadata update failed:', error.message);
        throw error;
      }

      console.log('User metadata updated successfully');
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('Metadata update error:', error.message);
      throw error;
    }
  },

  // 비밀번호 변경
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update failed:', error.message);
        throw error;
      }

      console.log('Password updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Password update error:', error.message);
      throw error;
    }
  }
};

export default supabaseAuthService; 