# NB High School Jobs - 캐나다 학생 취업 플랫폼

뉴브런즈윅 주 고등학생들을 위한 전문 구직 서비스 플랫폼입니다.

## 🚀 프로덕션 배포 정보

### **배포 URL**
- **메인 사이트**: [Vercel 배포 URL]
- **관리자 대시보드**: [배포 URL]/admin

### **현재 상태**
- ✅ **프로덕션 준비 완료**
- ✅ **테스트 데이터 모두 제거됨**
- ✅ **이메일 자동발송 정상 작동**
- ✅ **모든 기능 테스트 완료**

## 🛠️ 기술 스택

### **프론트엔드**
- **Next.js 15** (React 기반)
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 반응형 UI
- **Lucide React** - 아이콘

### **백엔드 & 데이터베이스**
- **Firebase Firestore** - 게시판, 인증, 메인 데이터
- **Supabase** - 파일 업로드, 이미지 저장
- **MailerSend** - 이메일 자동발송

### **배포 & 호스팅**
- **Vercel** - 웹사이트 호스팅
- **GitHub** - 소스 코드 관리
- **도메인**: Wix 구매 → Vercel 연결 준비

## 📋 주요 기능

### **👥 사용자 기능**
- 회원가입/로그인 (Firebase Auth)
- 구직 신청서 제출
- 이력서 파일 업로드 (Supabase Storage)
- 커뮤니티 게시판 이용
- 이벤트 참여 신청
- 봉사활동 지원
- 추천서 요청

### **🏢 기업 기능**
- 구인공고 등록
- 지원자 관리
- 연락처 관리

### **👨‍💼 관리자 기능**
- 전체 데이터 관리
- 승인/거부 처리
- 통계 및 분석
- 파일 관리
- 사용자 관리

### **📧 자동화 시스템**
- 문의 폼 자동 이메일 발송
- 지원/승인 알림
- 관리자 통지

## 🔧 환경 설정

### **필수 환경변수 (.env.local)**
```bash
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# MailerSend 설정
MAILERSEND_API_TOKEN=
MAILERSEND_FROM_EMAIL=
MAILERSEND_FROM_NAME=

# 연락처 정보
ADMIN_EMAIL=
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_CONTACT_ADDRESS=
```

### **Vercel 배포 환경변수**
위 모든 환경변수가 Vercel Dashboard에 설정되어 있습니다.

## 📱 반응형 지원

- **데스크톱**: 1024px 이상
- **태블릿**: 768px - 1023px  
- **모바일**: 767px 이하

모든 페이지가 완전 반응형으로 구현되어 있습니다.

## 🗄️ 데이터베이스 구조

### **Firebase Collections**
- `jobSeekers` - 구직자 신청
- `jobPostings` - 구인공고
- `events` - 이벤트 정보
- `communityPosts` - 커뮤니티 게시글
- `volunteerPostings` - 봉사활동
- `references` - 추천서

### **Supabase Tables**
- 파일 업로드 메타데이터
- 이미지 관리 정보

## 🚀 배포 프로세스

1. **코드 변경** → GitHub push
2. **자동 배포** → Vercel 자동 감지
3. **빌드 완료** → 사이트 업데이트

## 👨‍💻 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build

# 프로덕션 실행
npm start
```

## 🧹 데이터 정리 스크립트

프로덕션 배포를 위해 모든 테스트 데이터가 제거되었습니다.

추가 정리가 필요한 경우:
```bash
npx tsx scripts/cleanup-test-data.ts
```

## 🔗 도메인 연결 가이드

Wix에서 구매한 도메인을 Vercel에 연결하려면:

1. **Vercel Dashboard** → Domain 설정
2. **Wix DNS 설정** → A/CNAME 레코드 변경
3. **DNS 전파** 대기 (최대 48시간)

자세한 가이드는 별도 문서에서 제공됩니다.

## 📞 지원 및 문의

- **이메일**: nbhighschooljobs@gmail.com
- **전화**: (506) 429-6148
- **주소**: 122 Brianna Dr, Fredericton NB COA 1N0

## 📄 라이선스

이 프로젝트는 클라이언트 전용 맞춤 개발 프로젝트입니다.

---

**🎉 프로덕션 배포 완료 - 클라이언트 납품 준비 완료**

> 모든 기능이 정상 작동하며, 깨끗한 상태로 클라이언트에게 인계할 수 있습니다.
> 도메인 연결만 완료하면 서비스 오픈이 가능합니다.
