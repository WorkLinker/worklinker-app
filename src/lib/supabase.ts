import { createClient } from '@supabase/supabase-js';

// Environment variables check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug: Environment variables output
console.log('SUPABASE environment variables check:');
console.log('URL:', supabaseUrl);
console.log('URL length:', supabaseUrl?.length);
console.log('ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined');
console.log('ANON_KEY length:', supabaseAnonKey?.length);

// Environment variables validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables not configured!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

// URL validation
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL:', supabaseUrl);
}

// Check if URL is actual Supabase domain
if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format. Should be xxx.supabase.co:', supabaseUrl);
}

// Supabase 클라이언트 생성 (환경변수가 있을 때만)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    console.log('Creating Supabase client...');
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
    console.log('Supabase client initialization complete');
    
    // Connection test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.storage.listBuckets().then((result: any) => {
      if (result.error) {
        console.error('Supabase connection test failed:', result.error.message);
      } else {
        console.log('Supabase connection test successful');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).catch((err: any) => {
      console.error('Supabase connection test error:', err);
    });
    
  } catch (error) {
    console.error('Supabase client initialization failed:', error);
  }
} else {
  console.warn('Cannot create Supabase client due to missing environment variables');
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