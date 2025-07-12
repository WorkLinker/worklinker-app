# 캐나다 학생 일자리 플랫폼 🍁

> 뉴브런즈윅 주 고등학생들을 위한 무료 오픈소스 일자리 매칭 플랫폼

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🎯 프로젝트 소개

이 프로젝트는 **완전 무료**로 제공되는 오픈소스 플랫폼으로, 캐나다 뉴브런즈윅 주의 고등학생들이 방학 중 풀타임, 학기 중 파트타임, 봉사활동 등 다양한 일자리 기회를 찾을 수 있도록 돕습니다.

### ✨ 핵심 가치
- 🆓 **100% 무료** - 모든 기능 무료 제공
- 🌐 **오픈소스** - 투명하고 지속 가능한 개발
- 🤝 **지역사회 중심** - 뉴브런즈윅 학생들을 위한 맞춤 서비스
- 🎓 **교육 중심** - 학생들의 성장과 진로 개발 지원

## 🚀 주요 기능

### 👨‍🎓 학생 구직 기능
- 📄 레쥬메 업로드 및 프로필 관리
- 📝 기본 정보 입력 (이름, 이메일, 학교, 학년 등)
- 💼 근무 형태 선택 (풀타임/파트타임/봉사활동)
- ✅ 관리자 승인 후 기업 노출

### 🏢 구인 게시판
- 📢 기업 구인공고 직접 등록
- 🔍 상세한 업무 설명 및 요구사항 입력
- 💰 급여 정보 및 연락처 제공
- 🔎 검색 및 필터링 기능

### 👩‍🏫 추천서 시스템 (선생님 전용)
- 📋 학생별 추천서 작성 및 업로드
- 📚 과목 및 관계 정보 입력
- 📎 파일 첨부 기능 (PDF, DOC, DOCX)
- 🔗 학생 프로필 연결

### 🎪 이벤트 & 교육
- 🎤 취업설명회 정보 및 참가 신청
- 💪 면접 스킬 향상 워크숍
- 🎯 진로 세미나 및 봉사활동 설명회
- 📅 상세한 일정 및 참여 혜택 안내

### 📞 문의 시스템
- 💬 온라인 문의 폼
- 📂 카테고리별 문의 분류
- ❓ 자주 묻는 질문 (FAQ)
- 📧 연락처 정보 제공

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Pretendard 폰트
- **Forms**: React Hook Form, Zod 검증
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Deployment**: Vercel

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 홈페이지 (풀스크린 히어로)
│   ├── job-seekers/       # 학생 구직 페이지
│   ├── job-postings/      # 구인 게시판
│   ├── references/        # 추천서 업로드 (선생님 전용)
│   ├── events/            # 이벤트 & 교육
│   ├── contact/           # 문의하기
│   ├── layout.tsx         # 루트 레이아웃
│   └── globals.css        # 전역 스타일
├── components/            # 재사용 가능한 컴포넌트
│   ├── Navigation.tsx     # 네비게이션 바
│   └── Footer.tsx         # 푸터
├── lib/                   # 유틸리티 및 설정
│   ├── firebase.ts        # Firebase 설정
│   └── utils.ts           # 유틸리티 함수
├── types/                 # TypeScript 타입 정의
│   └── index.ts
docs/                      # 프로젝트 문서
├── 클라이언트요구사항.txt
├── 클라이언트정보.txt
├── 홈페이지만들때참고.txt
└── 환경변수값모음.txt
```

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/canada-student-job-platform.git
cd canada-student-job-platform
```

### 2. 종속성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값들을 설정하세요:

```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# 사이트 정보
SITE_NAME=캐나다 학생 일자리 플랫폼
CONTACT_EMAIL=nbhighschooljobs@gmail.com
CONTACT_PHONE=506-429-6148
CONTACT_ADDRESS=122 Brianna Dr Fredericton NB COA 1N0
CONTACT_PERSON=Matthew Jeon
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🎨 디자인 특징

- 🎓 **청소년 친화적** 디자인
- 🔵 **파랑/하늘색** 계열 메인 컬러
- 🧭 **직관적인 메뉴** 구조
- 📱 **모바일 반응형** 디자인
- 🏔️ **풀스크린 히어로** 섹션
- 🇰🇷 **한국어 폰트** 최적화 (Pretendard)
- 🍁 **캐나다 테마** 요소

## 📱 주요 화면

### 🏠 홈페이지
- 풀스크린 히어로 섹션
- 무료 오픈소스 배지
- 애니메이션 효과
- 캐나다 플래그 이모지
- 통계 및 CTA 버튼

### 👨‍🎓 학생 구직 페이지
- 단계별 폼 구성
- 파일 업로드 기능
- 실시간 유효성 검사
- 성공 확인 페이지

### 🏢 구인 게시판
- 카드 기반 레이아웃
- 고급 검색 필터
- 모달 상세 보기
- 반응형 그리드

## 🤝 기여하기

이 프로젝트는 오픈소스이며 모든 기여를 환영합니다!

### 기여 방법
1. 이 저장소를 Fork 하세요
2. 새로운 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

### 기여 가이드라인
- 코드 스타일: Prettier + ESLint 설정 준수
- 커밋 메시지: [Conventional Commits](https://www.conventionalcommits.org/) 형식
- 테스트: 새로운 기능에 대한 테스트 코드 작성
- 문서화: README 및 코드 주석 업데이트

## 🌍 다국어 지원

- 🇰🇷 **현재**: 한국어 (개발 단계)
- 🇨🇦 **계획**: 영어 (배포 전 전환 예정)

## 🚀 배포

### Vercel 배포
```bash
npm run build
vercel --prod
```

### Firebase 설정
1. Firebase 프로젝트 생성
2. Authentication, Firestore, Storage 활성화
3. 환경변수 설정
4. 보안 규칙 구성

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)로 배포됩니다.

## 🙏 후원 및 지원

이 프로젝트가 도움이 되었다면:
- ⭐ GitHub Star를 눌러주세요
- 🐛 버그 리포트나 기능 제안을 해주세요
- 🤝 프로젝트에 기여해주세요
- 💬 다른 사람들에게 공유해주세요

## 📞 연락처

- **이메일**: nbhighschooljobs@gmail.com
- **전화**: 506-429-6148
- **주소**: 122 Brianna Dr, Fredericton NB COA 1N0, Canada
- **프로젝트 관리자**: Matthew Jeon

---

<p align="center">
  <strong>🍁 캐나다 학생들의 더 나은 미래를 위한 무료 오픈소스 플랫폼 🍁</strong>
</p>

<p align="center">
  Made with ❤️ in New Brunswick, Canada
</p>
