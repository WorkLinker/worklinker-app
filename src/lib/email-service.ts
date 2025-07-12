// 이메일 전송 서비스 유틸리티

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

/**
 * 기본 이메일 전송 함수
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '이메일 전송 실패');
    }

    return data;
  } catch (error: unknown) {
    console.error('이메일 전송 에러:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return {
      success: false,
      message: '이메일 전송 중 오류가 발생했습니다.',
      error: errorMessage,
    };
  }
}

/**
 * 사용자 승인 이메일 전송
 */
export async function sendApprovalEmail(userEmail: string, userName: string): Promise<EmailResponse> {
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

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

/**
 * 사용자 거절 이메일 전송
 */
export async function sendRejectionEmail(userEmail: string, userName: string, reason?: string): Promise<EmailResponse> {
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

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

/**
 * 새로운 구직 신청 알림 이메일 (관리자용)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendNewApplicationNotification(applicationData: any): Promise<EmailResponse> {
  const adminEmail = 'nbhighschooljobs@gmail.com'; // 나중에 환경변수로 이동
  const subject = '🔔 새로운 구직 신청이 있습니다';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">새로운 구직 신청 알림</h2>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>신청자 정보:</h3>
        <p><strong>이름:</strong> ${applicationData.name}</p>
        <p><strong>이메일:</strong> ${applicationData.email}</p>
        <p><strong>학교:</strong> ${applicationData.school}</p>
        <p><strong>학년:</strong> ${applicationData.grade}</p>
        <p><strong>연락처:</strong> ${applicationData.phone}</p>
        ${applicationData.resume ? `<p><strong>이력서:</strong> ${applicationData.resume}</p>` : ''}
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>기술/경험:</h3>
        <p>${applicationData.experience || '작성되지 않음'}</p>
      </div>
      
      <p><strong>신청일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <p>관리자 페이지에서 승인/거절을 처리해주세요.</p>
      </div>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        이 메일은 자동으로 생성된 알림입니다.<br>
        NB High School Jobs Platform 관리자 시스템
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
  });
}

/**
 * 테스트 이메일 전송
 */
export async function sendTestEmail(testEmail: string): Promise<EmailResponse> {
  const subject = '🧪 이메일 시스템 테스트';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">이메일 시스템 테스트</h2>
      <p>안녕하세요!</p>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>이메일 시스템이 정상적으로 작동하고 있습니다! ✅</strong></p>
        <p>이 메일을 받으셨다면 SendGrid 연동이 성공적으로 완료되었습니다.</p>
      </div>
      
      <h3>테스트 정보:</h3>
      <ul>
        <li><strong>전송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</li>
        <li><strong>플랫폼:</strong> NB High School Jobs Platform</li>
        <li><strong>서비스:</strong> SendGrid Email Service</li>
      </ul>
      
      <p>이메일 시스템 설정이 완료되었습니다!</p>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        NB High School Jobs Platform<br>
        nbhighschooljobs@gmail.com<br>
        506-429-6148
      </p>
    </div>
  `;

  return await sendEmail({
    to: testEmail,
    subject,
    html,
  });
} 