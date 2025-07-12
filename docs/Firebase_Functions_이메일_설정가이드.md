# Firebase Functions 이메일 전송 설정 가이드

## 🎯 개요
Firebase Functions를 사용하여 서버리스 이메일 전송 시스템을 구축하는 방법을 설명합니다.

## 🚀 1단계: Firebase Functions 초기 설정

### 1-1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 1-2. Firebase 로그인
```bash
firebase login
```

### 1-3. Firebase Functions 초기화
```bash
firebase init functions
```

다음 옵션들을 선택:
- Use an existing project: 기존 Firebase 프로젝트 선택
- Language: TypeScript
- ESLint: Yes
- Install dependencies: Yes

## 📁 2단계: Functions 코드 구조

### 2-1. package.json 수정
`functions/package.json`에 SendGrid 종속성 추가:

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.8.0",
    "@sendgrid/mail": "^8.1.0"
  }
}
```

### 2-2. 환경변수 설정
Firebase Functions에 환경변수 설정:

```bash
# Firebase 프로젝트 루트에서 실행
firebase functions:config:set sendgrid.api_key="SG.your_sendgrid_api_key_here"
firebase functions:config:set email.from="nbhighschooljobs@gmail.com"
firebase functions:config:set email.from_name="NB High School Jobs Platform"
```

## 🔧 3단계: Functions 코드 작성

### 3-1. functions/src/index.ts
```typescript
import { https, config } from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

// Firebase Admin 초기화
admin.initializeApp();

// SendGrid 설정
const sendgridApiKey = config().sendgrid.api_key;
const fromEmail = config().email.from;
const fromName = config().email.from_name;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

// 이메일 전송 함수
export const sendEmail = https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !context.auth.token.admin) {
    throw new https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }

  const { to, subject, html, text } = data;

  // 필수 필드 검증
  if (!to || !subject || (!html && !text)) {
    throw new https.HttpsError('invalid-argument', '필수 필드가 누락되었습니다.');
  }

  try {
    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      text: text,
      html: html || text
    };

    const response = await sgMail.send(msg);
    
    // 로그 기록
    await admin.firestore().collection('emailLogs').add({
      to: to,
      subject: subject,
      status: 'sent',
      messageId: response[0].headers['x-message-id'],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: context.auth.uid
    });

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      message: '이메일이 성공적으로 전송되었습니다.'
    };

  } catch (error: any) {
    console.error('이메일 전송 실패:', error);
    
    // 에러 로그 기록
    await admin.firestore().collection('emailLogs').add({
      to: to,
      subject: subject,
      status: 'failed',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: context.auth.uid
    });

    throw new https.HttpsError('internal', '이메일 전송 중 오류가 발생했습니다.');
  }
});

// 승인 이메일 전송 함수
export const sendApprovalEmail = https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }

  const { userEmail, userName } = data;

  if (!userEmail || !userName) {
    throw new https.HttpsError('invalid-argument', '사용자 이메일과 이름이 필요합니다.');
  }

  const subject = '🎉 구직 신청이 승인되었습니다!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">축하드립니다! 구직 신청이 승인되었습니다</h2>
      <p>안녕하세요, ${userName}님!</p>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>좋은 소식을 전해드립니다!</strong></p>
        <p>귀하의 구직 신청이 승인되었습니다. 이제 저희 플랫폼을 통해 다양한 일자리 기회를 탐색하실 수 있습니다.</p>
      </div>
      
      <h3>다음 단계:</h3>
      <ul>
        <li>로그인하여 프로필을 완성하세요</li>
        <li>관심 있는 일자리에 지원하세요</li>
        <li>정기적으로 새로운 기회를 확인하세요</li>
      </ul>
      
      <p>궁금한 점이 있으시면 언제든지 연락주세요!</p>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        NB High School Jobs Platform<br>
        nbhighschooljobs@gmail.com<br>
        506-429-6148
      </p>
    </div>
  `;

  try {
    const msg = {
      to: userEmail,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      html: html
    };

    const response = await sgMail.send(msg);
    
    await admin.firestore().collection('emailLogs').add({
      to: userEmail,
      subject: subject,
      type: 'approval',
      status: 'sent',
      messageId: response[0].headers['x-message-id'],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: context.auth.uid
    });

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      message: '승인 이메일이 성공적으로 전송되었습니다.'
    };

  } catch (error: any) {
    console.error('승인 이메일 전송 실패:', error);
    throw new https.HttpsError('internal', '승인 이메일 전송 중 오류가 발생했습니다.');
  }
});

// 거절 이메일 전송 함수
export const sendRejectionEmail = https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }

  const { userEmail, userName, reason } = data;

  if (!userEmail || !userName) {
    throw new https.HttpsError('invalid-argument', '사용자 이메일과 이름이 필요합니다.');
  }

  const subject = '구직 신청 결과 안내';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">구직 신청 결과 안내</h2>
      <p>안녕하세요, ${userName}님!</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>안타깝게도 이번 구직 신청이 승인되지 않았습니다.</p>
        ${reason ? `<p><strong>사유:</strong> ${reason}</p>` : ''}
      </div>
      
      <h3>재신청 안내:</h3>
      <ul>
        <li>부족한 부분을 보완하신 후 재신청하실 수 있습니다</li>
        <li>추가 질문이 있으시면 언제든지 문의해주세요</li>
        <li>계속해서 새로운 기회를 찾아보세요</li>
      </ul>
      
      <p>앞으로도 좋은 기회가 있을 것입니다. 포기하지 마세요!</p>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        NB High School Jobs Platform<br>
        nbhighschooljobs@gmail.com<br>
        506-429-6148
      </p>
    </div>
  `;

  try {
    const msg = {
      to: userEmail,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      html: html
    };

    const response = await sgMail.send(msg);
    
    await admin.firestore().collection('emailLogs').add({
      to: userEmail,
      subject: subject,
      type: 'rejection',
      status: 'sent',
      reason: reason || '',
      messageId: response[0].headers['x-message-id'],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: context.auth.uid
    });

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      message: '거절 이메일이 성공적으로 전송되었습니다.'
    };

  } catch (error: any) {
    console.error('거절 이메일 전송 실패:', error);
    throw new https.HttpsError('internal', '거절 이메일 전송 중 오류가 발생했습니다.');
  }
});
```

## 🚀 4단계: 배포 및 테스트

### 4-1. Functions 배포
```bash
firebase deploy --only functions
```

### 4-2. 관리자 권한 설정
Firebase Console에서 특정 사용자에게 관리자 권한 부여:

```javascript
// Firebase Console > Functions > 새 함수 생성 및 실행
const admin = require('firebase-admin');
admin.initializeApp();

// 관리자 권한 부여
async function setAdminRole(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`관리자 권한이 ${email}에게 부여되었습니다.`);
}

// 사용 예시
setAdminRole('nbhighschooljobs@gmail.com');
```

## 🔧 5단계: 클라이언트 측 사용법

### 5-1. Firebase Functions 호출 서비스
```typescript
// src/lib/firebase-email-service.ts
import { httpsCallable, getFunctions } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);

export const sendEmailFunction = httpsCallable(functions, 'sendEmail');
export const sendApprovalEmailFunction = httpsCallable(functions, 'sendApprovalEmail');
export const sendRejectionEmailFunction = httpsCallable(functions, 'sendRejectionEmail');

// 사용 예시
export async function sendApprovalNotification(userEmail: string, userName: string) {
  try {
    const result = await sendApprovalEmailFunction({ userEmail, userName });
    return result.data;
  } catch (error) {
    console.error('승인 이메일 전송 실패:', error);
    throw error;
  }
}
```

## 📊 6단계: 비용 및 제한사항

### Firebase Functions 무료 할당량
- **호출 횟수**: 월 200만 회
- **GB·초**: 월 40만 GB·초
- **네트워크 송신**: 월 5GB

### SendGrid 무료 할당량
- **일일 전송**: 100통/일
- **월 전송**: 최대 40,000통/월

## 🔍 7단계: 모니터링 및 로깅

### 7-1. Firebase Console에서 확인
- **Functions 로그**: Firebase Console > Functions > 로그
- **이메일 로그**: Firestore > emailLogs 컬렉션

### 7-2. SendGrid 대시보드
- **전송 통계**: SendGrid Console > Activity
- **전송 상태**: 실시간 배송 상태 확인

## 🆚 Next.js API Routes vs Firebase Functions

### Next.js API Routes (권장)
**장점:**
- 설정이 간단함
- 기존 Next.js 프로젝트에 통합하기 쉬움
- 로컬 개발 환경에서 바로 테스트 가능

**단점:**
- 서버 환경이 필요함 (Vercel, Netlify 등)

### Firebase Functions
**장점:**
- 완전 서버리스
- 자동 스케일링
- Firebase 생태계와 완벽 통합

**단점:**
- 초기 설정이 복잡함
- Cold Start 지연 시간
- 복잡한 권한 관리

## 🎯 결론

**초기 개발 단계**: Next.js API Routes 사용 권장
**대규모 확장 단계**: Firebase Functions로 마이그레이션 고려

현재 프로젝트에서는 Next.js API Routes를 사용하여 빠르게 이메일 기능을 구현한 후, 필요에 따라 Firebase Functions로 전환하는 것이 효율적입니다. 