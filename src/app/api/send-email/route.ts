import { NextRequest, NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { generateContactEmailHTML, generateJobApplicationEmailHTML, generateJobPostingNotificationHTML } from '@/lib/email-service';

// 환경변수  
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_TOKEN || process.env.MAILERSEND_API_KEY || '';
const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || 'nbhighschooljobs@gmail.com';
const FROM_NAME = process.env.MAILERSEND_FROM_NAME || 'NB High School Jobs Platform';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nbhighschooljobs@gmail.com';

// MailerSend 인스턴스 생성
const mailerSend = new MailerSend({
  apiKey: MAILERSEND_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 환경변수 디버깅 (보안상 일부만 표시)
    console.log('🔍 환경변수 체크:');
    console.log('- API_KEY 존재:', !!MAILERSEND_API_KEY);
    console.log('- API_KEY 길이:', MAILERSEND_API_KEY?.length || 0);
    console.log('- FROM_EMAIL:', FROM_EMAIL);
    console.log('- FROM_NAME:', FROM_NAME);
    console.log('- ADMIN_EMAIL:', ADMIN_EMAIL);

    // API 키 검증
    if (!MAILERSEND_API_KEY) {
      console.error('❌ MailerSend API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'MailerSend API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    let to: string;
    let subject: string; 
    let text: string;
    let html: string;

    // 기존 SendGrid 방식 (type과 data가 있는 경우)
    if (body.type && body.data) {
      switch (body.type) {
        case 'contact_form':
          to = ADMIN_EMAIL;
          subject = `새로운 문의사항: ${body.data.name}님으로부터`;
          text = `이름: ${body.data.name}\n이메일: ${body.data.email}\n전화번호: ${body.data.phone}\n\n문의내용:\n${body.data.message}`;
          html = generateContactEmailHTML(body.data);
          break;

        case 'job_application':
          to = ADMIN_EMAIL;
          subject = `새로운 구직신청: ${body.data.name}님 (${body.data.jobTitle || '직무 미명시'})`;
          text = `지원자: ${body.data.name}\n이메일: ${body.data.email}\n지원직무: ${body.data.jobTitle || '미명시'}`;
          html = generateJobApplicationEmailHTML(body.data);
          break;

        case 'job_posting_notification':
          to = body.adminEmail || ADMIN_EMAIL;
          subject = `새로운 구인공고 등록: ${body.data.title}`;
          text = `회사: ${body.data.company}\n직무: ${body.data.title}\n위치: ${body.data.location}`;
          html = generateJobPostingNotificationHTML(body.data);
          break;

        default:
          return NextResponse.json(
            { error: '지원하지 않는 이메일 타입입니다.' },
            { status: 400 }
          );
      }
    }
    // 새로운 직접 방식 (to, subject, text/html이 직접 제공되는 경우)
    else if (body.to && body.subject && (body.text || body.html)) {
      // ⚠️ Trial 계정 제한: 모든 이메일을 관리자 이메일로 전송
      to = ADMIN_EMAIL;
      subject = `[원래받을사람: ${body.to}] ${body.subject}`;
      text = body.text || '';
      html = body.html || body.text;
      
      console.log(`🔄 Trial 제한으로 인해 ${body.to} → ${ADMIN_EMAIL}로 리다이렉트`);
    }
    // 필수 필드 누락
    else {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (type+data 또는 to+subject+text/html)' },
        { status: 400 }
      );
    }

    // 발신자 설정
    const sentFrom = new Sender(FROM_EMAIL, FROM_NAME);

    // 수신자 설정 (배열로 처리)
    const recipients = Array.isArray(to) 
      ? to.map(email => new Recipient(email)) 
      : [new Recipient(to)];

    // 이메일 매개변수 구성
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    // MailerSend로 이메일 전송
    const response = await mailerSend.email.send(emailParams);

    console.log('✅ 이메일 전송 성공:', {
      to: to,
      subject: subject,
      status: response.statusCode
    });

    return NextResponse.json({
      success: true,
      message: '이메일이 성공적으로 전송되었습니다.',
      status: response.statusCode
    });

  } catch (error: unknown) {
    console.error('❌ 이메일 전송 실패:', error);

    // MailerSend 에러 처리
    if (error && typeof error === 'object' && 'response' in error) {
      const mailerSendError = error as { 
        response?: { 
          data?: unknown; 
          status?: number; 
          statusText?: string;
        }; 
        message?: string; 
      };
      
      console.error('MailerSend 에러:', mailerSendError.response?.data);
      
      // Trial 계정 제한 에러 특별 처리
      const errorData = JSON.stringify(mailerSendError.response?.data || '');
      if (errorData.includes('Trial accounts') || errorData.includes('MS42225')) {
        return NextResponse.json(
          { 
            success: false,
            error: '⚠️ MailerSend Trial 계정 제한',
            message: '인증된 이메일 주소로만 전송 가능합니다.',
            details: '해결방법: MailerSend에서 도메인 또는 이메일 주소를 인증해주세요.',
            helpUrl: 'https://app.mailersend.com/domains'
          },
          { status: 422 }
        );
      }
      
      return NextResponse.json(
        { 
          error: '이메일 전송 중 오류가 발생했습니다.',
          details: mailerSendError.response?.data || mailerSendError.message
        },
        { status: mailerSendError.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 