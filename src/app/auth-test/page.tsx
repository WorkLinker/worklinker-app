'use client';

import { useState, useEffect } from 'react';
import { supabaseAuthService } from '@/lib/supabase-auth-service';
import type { User } from '@supabase/supabase-js';

export default function AuthTestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // 디버깅용 - 상태 확인
  console.log('Current state:', { loading, email, password, canSubmit: !loading && email && password });

  useEffect(() => {
    // 현재 사용자 확인
    const checkUser = async () => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        setUser(currentUser);
        setMessage(currentUser ? `로그인됨: ${currentUser.email}` : '로그인되지 않음');
      } catch (error) {
        setMessage(`오류: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Auth 상태 변화 구독
    const { data: { subscription } } = supabaseAuthService.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      setMessage(currentUser ? `로그인됨: ${currentUser.email}` : '로그인되지 않음');
      console.log('Auth 상태 변화:', event, currentUser?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('회원가입 중...');
      
      await supabaseAuthService.signUpWithEmail(email, password, {
        display_name: email.split('@')[0]
      });
      
      setMessage('회원가입 성공! 이메일을 확인해주세요.');
      setEmail('');
      setPassword('');
    } catch (error) {
      setMessage(`회원가입 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('로그인 중...');
      
      await supabaseAuthService.signInWithEmail(email, password);
      setMessage('로그인 성공!');
      setEmail('');
      setPassword('');
    } catch (error) {
      setMessage(`로그인 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setMessage('로그아웃 중...');
      
      await supabaseAuthService.signOut();
      setMessage('로그아웃 성공!');
    } catch (error) {
      setMessage(`로그아웃 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-xl">Supabase Auth 연결 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold text-center mb-8">🔐 Supabase Auth 테스트</h1>
      
      {/* 현재 상태 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">현재 상태:</h2>
        <p className="text-sm">{message}</p>
        {user && (
          <div className="mt-2 text-xs text-gray-600">
            <p>ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Verified: {user.email_confirmed_at ? '✅' : '❌'}</p>
          </div>
        )}
      </div>

      {/* 로그인된 경우 */}
      {user ? (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-600">
              ✅ 로그인 상태
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? '처리 중...' : '로그아웃'}
          </button>
        </div>
      ) : (
        /* 로그인되지 않은 경우 */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="최소 6자"
            />
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '로그인'}
            </button>
            
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </div>
        </div>
      )}
      
      {/* 안내 */}
      <div className="mt-8 text-xs text-gray-500 text-center">
        <p>이 페이지는 Supabase Auth 테스트용입니다.</p>
        <p>관리자 계정: nbhighschooljobs@gmail.com</p>
      </div>
    </div>
  );
} 