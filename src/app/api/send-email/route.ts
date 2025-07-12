import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// 환경변수 (나중에 .env.local로 이동)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'SG.your_sendgrid_api_key_here';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'nbhighschooljobs@gmail.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'NB High School Jobs Platform';

// SendGrid API 키 설정
sgMail.setApiKey(SENDGRID_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html } = await request.json();

    // 필수 필드 검증
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (to, subject, text/html)' },
        { status: 400 }
      );
    }

    // 이메일 메시지 구성
    const msg = {
      to: to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: subject,
      text: text,
      html: html || text
    };

    // SendGrid로 이메일 전송
    const response = await sgMail.send(msg);

    console.log('이메일 전송 성공:', {
      to: to,
      subject: subject,
      messageId: response[0].headers['x-message-id']
    });

    return NextResponse.json({
      success: true,
      message: '이메일이 성공적으로 전송되었습니다.',
      messageId: response[0].headers['x-message-id']
    });

  } catch (error: unknown) {
    console.error('이메일 전송 실패:', error);

    // SendGrid 에러 처리
    if (error && typeof error === 'object' && 'response' in error) {
      const sendgridError = error as { response?: { body?: { errors?: unknown }; }; code?: number; message?: string };
      console.error('SendGrid 에러:', sendgridError.response?.body);
      return NextResponse.json(
        { 
          error: '이메일 전송 중 오류가 발생했습니다.',
          details: sendgridError.response?.body?.errors || sendgridError.message
        },
        { status: sendgridError.code || 500 }
      );
    }

    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 