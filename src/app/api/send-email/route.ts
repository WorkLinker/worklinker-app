import { NextRequest, NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { generateContactEmailHTML, generateJobApplicationEmailHTML, generateJobPostingNotificationHTML } from '@/lib/email-service';

// 환경변수  
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_TOKEN || process.env.MAILERSEND_API_KEY || '';
const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || 'nbhighschooljobs@gmail.com';
const FROM_NAME = process.env.MAILERSEND_FROM_NAME || 'NB High School Jobs Platform';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nbhighschooljobs@gmail.com';

// MailerSend 인스턴스 생성
let mailerSend: MailerSend | null = null;

// API 키가 있는 경우에만 MailerSend 인스턴스 생성
if (MAILERSEND_API_KEY) {
  try {
    mailerSend = new MailerSend({
  apiKey: MAILERSEND_API_KEY,
});
  } catch (error) {
    console.error('❌ MailerSend initialization failed:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Environment variables debugging (partial display for security)
    console.log('🔍 Environment variables check:');
    console.log('- API_KEY exists:', !!MAILERSEND_API_KEY);
    console.log('- API_KEY length:', MAILERSEND_API_KEY?.length || 0);
    console.log('- API_KEY prefix:', MAILERSEND_API_KEY ? MAILERSEND_API_KEY.substring(0, 8) + '...' : 'none');
    console.log('- FROM_EMAIL:', FROM_EMAIL);
    console.log('- FROM_NAME:', FROM_NAME);
    console.log('- ADMIN_EMAIL:', ADMIN_EMAIL);
    console.log('- MailerSend instance:', !!mailerSend);

    // API key validation
    if (!MAILERSEND_API_KEY || MAILERSEND_API_KEY.length < 10) {
      console.error('❌ MailerSend API key is not properly configured.');
      return NextResponse.json(
        { 
          success: false,
          error: 'MailerSend API key is not properly configured.',
          message: 'Please check your MAILERSEND_API_TOKEN environment variable.'
        },
        { status: 500 }
      );
    }

    if (!mailerSend) {
      console.error('❌ MailerSend instance is not available.');
      return NextResponse.json(
        { 
          success: false,
          error: 'MailerSend service is not available.',
          message: 'Email service initialization failed.'
        },
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
          subject = `New inquiry from: ${body.data.name}`;
          text = `Name: ${body.data.name}\nEmail: ${body.data.email}\nPhone: ${body.data.phone}\n\nMessage:\n${body.data.message}`;
          html = generateContactEmailHTML(body.data);
          break;

        case 'job_application':
          to = ADMIN_EMAIL;
          subject = `New job application: ${body.data.name} (${body.data.jobTitle || 'No job title specified'})`;
          text = `Applicant: ${body.data.name}\nEmail: ${body.data.email}\nJob Title: ${body.data.jobTitle || 'Not specified'}`;
          html = generateJobApplicationEmailHTML(body.data);
          break;

        case 'job_posting_notification':
          to = body.adminEmail || ADMIN_EMAIL;
          subject = `New job posting registered: ${body.data.title}`;
          text = `Company: ${body.data.company}\nJob Title: ${body.data.title}\nLocation: ${body.data.location}`;
          html = generateJobPostingNotificationHTML(body.data);
          break;

        default:
          return NextResponse.json(
            { 
              success: false,
              error: 'Unsupported email type.',
              message: `Email type '${body.type}' is not supported.`
            },
            { status: 400 }
          );
      }
    }
    // 새로운 직접 방식 (to, subject, text/html이 직접 제공되는 경우)
    else if (body.to && body.subject && (body.text || body.html)) {
      // ⚠️ Trial account limitation: Send all emails to admin email
      const originalTo = body.to;
      to = ADMIN_EMAIL;
      subject = `[Original recipient: ${originalTo}] ${body.subject}`;
      text = body.text || '';
      html = body.html || body.text;
      
      console.log(`🔄 Trial limitation: redirecting ${originalTo} → ${ADMIN_EMAIL}`);
    }
    // Missing required fields
    else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Required fields are missing.',
          message: 'Please provide either (type + data) or (to + subject + text/html)'
        },
        { status: 400 }
      );
    }

    console.log('📧 Preparing email:', { to, subject: subject.substring(0, 50) + '...' });

    // Sender configuration validation
    if (!FROM_EMAIL || !FROM_EMAIL.includes('@')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid sender email configuration.',
          message: 'Please check MAILERSEND_FROM_EMAIL environment variable.'
        },
        { status: 500 }
      );
    }

    // Recipient validation
    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid recipient email.',
          message: 'Recipient email address is not valid.'
        },
        { status: 400 }
      );
    }

    // Sender configuration
    const sentFrom = new Sender(FROM_EMAIL, FROM_NAME);

    // Recipient configuration (handle as array)
    const recipients = Array.isArray(to) 
      ? to.map(email => new Recipient(email)) 
      : [new Recipient(to)];

    // Email parameters configuration
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html || `<p>${text}</p>`)
      .setText(text);

    console.log('🚀 Sending email via MailerSend...');

    // Send email with MailerSend
    const response = await mailerSend.email.send(emailParams);

    console.log('✅ Email sent successfully:', {
      to: to,
      subject: subject.substring(0, 50) + '...',
      status: response.statusCode,
      response: response
    });

    return NextResponse.json({
      success: true,
      message: 'Email has been sent successfully.',
      statusCode: response.statusCode,
      messageId: response?.body?.data?.[0]?.message_id || 'unknown'
    });

  } catch (error: unknown) {
    console.error('❌ Email sending failed - Full error:', error);

    // MailerSend error handling
    if (error && typeof error === 'object') {
      // Type-safe error handling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyError = error as any;
      
      if (anyError.response) {
        const errorData = anyError.response.data;
        const errorStatus = anyError.response.status;
        const errorStatusText = anyError.response.statusText;
      
        console.error('MailerSend API error:', {
          status: errorStatus,
          statusText: errorStatusText,
          data: errorData
        });
      
        // Special handling for Trial account limitation error
        const errorString = JSON.stringify(errorData || '');
        if (errorString.includes('Trial accounts') || 
            errorString.includes('MS42225') ||
            errorString.includes('email address is not verified') ||
            errorString.includes('domain is not verified')) {
          return NextResponse.json(
            { 
              success: false,
              error: '⚠️ MailerSend Trial Account Limitation',
              message: 'Can only send to verified email addresses.',
              details: 'Please verify your domain or email addresses in MailerSend dashboard.',
              helpUrl: 'https://app.mailersend.com/domains',
              errorData: errorData
            },
            { status: 422 }
          );
        }

        // Handle authentication errors
        if (errorStatus === 401 || errorStatus === 403) {
          return NextResponse.json(
            { 
              success: false,
              error: 'MailerSend authentication failed',
              message: 'Please check your API key and permissions.',
              details: errorData
            },
            { status: 401 }
          );
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: 'MailerSend API error occurred.',
            message: 'An error occurred while sending the email.',
            details: errorData,
            status: errorStatus
          },
          { status: errorStatus || 500 }
        );
      }
      
      // Handle network or other errors
      if (anyError.message) {
      return NextResponse.json(
        { 
            success: false,
            error: 'Email service error',
            message: anyError.message,
            details: 'Please check your network connection and MailerSend service status.'
        },
          { status: 500 }
      );
    }
    }

    // Fallback error handling
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error occurred.',
        message: 'An unexpected error occurred while sending the email.',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 