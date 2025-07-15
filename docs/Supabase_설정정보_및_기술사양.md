# Supabase 설정정보 및 기술사양

## 🔧 Supabase 프로젝트 설정

### 프로젝트 정보
- **프로젝트 URL**: https://bphskpqfvatrjvbwrddf.supabase.co
- **프로젝트 ID**: bphskpqfvatrjvbwrddf
- **Region**: 기본 설정 (us-east-1)

### API Keys
- **anon (public) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (브라우저용)
- **service_role key**: 별도 보관 (서버용, 관리자 권한)

### 환경변수 (.env.local)
```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://bphskpqfvatrjvbwrddf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase 설정 (기존 - 마이그레이션 완료 후 제거 예정)
FIREBASE_PROJECT_ID=client-web-d9c86
```

## 📊 데이터베이스 스키마

### 생성된 테이블 (13개)
1. **job_seekers** - 구직자 정보
2. **job_postings** - 구인공고
3. **events** - 이벤트 정보
4. **posts** - 커뮤니티 게시글
5. **communities** - 커뮤니티 정보
6. **event_registrations** - 이벤트 등록
7. **job_applications** - 구직 지원
8. **contacts** - 연락처 정보
9. **recommendation_letters** - 추천서 (기존 references)
10. **volunteer_postings** - 봉사활동 공고
11. **volunteer_applications** - 봉사활동 지원
12. **site_content** - 사이트 콘텐츠
13. **admin_users** - 관리자 정보

### 중요한 필드명 변환 (Firebase → Supabase)
```
displayName → display_name
createdAt → created_at
updatedAt → updated_at
jobType → job_type
companyName → company_name
contactEmail → contact_email
phoneNumber → phone_number
```

## 🔐 인증 시스템

### Supabase Auth 설정
- **Auth Provider**: Email/Password + Google OAuth
- **이메일 확인**: 활성화됨
- **비밀번호 정책**: 최소 6자

### 관리자 계정
- **이메일**: nbhighschooljobs@gmail.com
- **권한**: 전체 관리자
- **상태**: 새로 생성 필요 (기존 Firebase에서 이전 불가)

### 인증 서비스 함수들
```typescript
// src/lib/supabase-auth-service.ts
- getCurrentUser()
- getCurrentSession()
- signInWithEmail(email, password)
- signUpWithEmail(email, password, metadata)
- signInWithGoogle()
- signOut()
- resetPassword(email)
- onAuthStateChange(callback)
- isAdmin(user)
- updateUserMetadata(metadata)
- updatePassword(newPassword)
```

## 📁 파일 구조

### 새로 생성된 파일들
```
src/
├── lib/
│   ├── supabase.ts                    # Supabase 클라이언트
│   ├── supabase-auth-service.ts       # 인증 서비스
│   └── firebase.ts                    # 기존 Firebase (유지)
├── app/
│   └── auth-test/
│       └── page.tsx                   # 인증 테스트 페이지
docs/
├── supabase_migration_schema.sql      # 데이터베이스 스키마
├── Firebase_to_Supabase_마이그레이션_현재상황.md
└── Supabase_설정정보_및_기술사양.md
```

### 수정된 파일들
```
src/
├── components/
│   └── Navigation.tsx                 # Firebase → Supabase 변경
└── types/
    └── index.ts                       # 타입 정의 (확장 필요)
```

## 🔄 남은 마이그레이션 작업들

### 1단계: 인증 테스트 완료
- [ ] Bootstrap 오류 해결
- [ ] /auth-test 페이지에서 회원가입/로그인 테스트
- [ ] 관리자 계정 생성 (nbhighschooljobs@gmail.com)

### 2단계: 컴포넌트 업데이트
아래 파일들을 Firebase → Supabase로 변경 필요:

#### 페이지 컴포넌트들
```
src/app/
├── admin/page.tsx                     # 관리자 페이지
├── job-listings/[id]/page.tsx         # 구인공고 상세
├── job-listings/[id]/apply/page.tsx   # 지원하기
├── job-listings/[id]/applicants/page.tsx # 지원자 목록
├── job-postings/page.tsx              # 구인공고 작성
├── job-seekers/page.tsx               # 구직자 목록
├── student-profiles/page.tsx          # 학생 프로필
├── events/page.tsx                    # 이벤트 목록
├── community/page.tsx                 # 커뮤니티
├── community/[id]/page.tsx            # 커뮤니티 상세
├── volunteer-listings/[id]/page.tsx   # 봉사활동 상세
├── volunteer-postings/page.tsx        # 봉사활동 작성
├── references/page.tsx                # 추천서
├── contact/page.tsx                   # 연락처
└── my-page/page.tsx                   # 마이페이지
```

#### 변경 패턴
```typescript
// 기존 Firebase
import { auth, firestore } from '@/lib/firebase';
import { User } from 'firebase/auth';

// 새로운 Supabase
import { supabaseAuthService, User } from '@/lib/supabase-auth-service';
import { supabase } from '@/lib/supabase';
```

### 3단계: 데이터 서비스 함수들
```
src/lib/
├── firebase-services.ts              # → supabase-services.ts로 변경
├── auth-service.ts                    # → 삭제 (supabase-auth-service.ts로 대체)
└── utils.ts                           # 유틸리티 함수들 (유지)
```

### 4단계: 파일 스토리지 마이그레이션
- Firebase Storage → Supabase Storage
- 이미지 파일들 이전
- 파일 업로드 함수들 변경

## 🚨 주의사항

### 환경변수 관리
- **NEXT_PUBLIC_** 접두사: 브라우저에서 사용하는 변수
- **SERVICE_ROLE_KEY**: 서버에서만 사용, 절대 브라우저에 노출 금지

### 데이터 타입 차이
- **Firebase**: Timestamp → **Supabase**: ISO 문자열
- **Firebase**: 중첩 객체 가능 → **Supabase**: 정규화된 테이블
- **Firebase**: 문서 ID → **Supabase**: UUID

### 인증 상태 관리
```typescript
// Firebase
useAuthState(auth)

// Supabase  
supabaseAuthService.onAuthStateChange((event, session) => {
  const user = session?.user || null;
  // 상태 업데이트
});
```

## 📞 문제 해결

### Bootstrap 오류 해결법
```bash
# 완전한 캐시 정리
rmdir /s .next
rmdir /s node_modules
del package-lock.json

# 새로 설치
npm install
npm run dev
```

### 연결 테스트
```typescript
// Supabase 연결 테스트
const { data, error } = await supabase.from('job_seekers').select('count');
if (error) console.error('연결 실패:', error);
else console.log('연결 성공:', data);
```

---

**마지막 업데이트**: 2024년 12월
**다음 단계**: Bootstrap 오류 해결 → 인증 테스트 