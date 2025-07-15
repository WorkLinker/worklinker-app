import { createClient } from '@supabase/supabase-js';

// 환경변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 🔍 **디버깅: 환경변수 값 출력**
console.log('🔍 SUPABASE 환경변수 검사:');
console.log('URL:', supabaseUrl);
console.log('URL 길이:', supabaseUrl?.length);
console.log('ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined');
console.log('ANON_KEY 길이:', supabaseAnonKey?.length);

// 환경변수가 없거나 잘못된 경우 경고
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 누락');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 누락');
}

// URL 유효성 검사
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Supabase URL이 올바르지 않습니다:', supabaseUrl);
}

// URL이 실제 Supabase 도메인인지 확인
if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Supabase URL 형식이 잘못되었습니다. xxx.supabase.co 형식이어야 합니다:', supabaseUrl);
}

// Supabase 클라이언트 생성 (환경변수가 있을 때만)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    console.log('🔄 Supabase 클라이언트 생성 시도...');
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
    console.log('✅ Supabase 클라이언트 초기화 완료');
    
    // 🔍 **연결 테스트**
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.storage.listBuckets().then((result: any) => {
      if (result.error) {
        console.error('❌ Supabase 연결 테스트 실패:', result.error.message);
      } else {
        console.log('✅ Supabase 연결 테스트 성공');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).catch((err: any) => {
      console.error('❌ Supabase 연결 테스트 오류:', err);
    });
    
  } catch (error) {
    console.error('❌ Supabase 클라이언트 초기화 실패:', error);
  }
} else {
  console.warn('⚠️ Supabase 환경변수 누락으로 클라이언트를 생성할 수 없습니다');
  // 더미 객체 생성 (오류 방지)
  supabase = {
    storage: {
      listBuckets: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        list: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        remove: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        createSignedUrl: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
      })
    }
  };
}

export { supabase };
export default supabase; 