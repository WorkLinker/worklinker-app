import { NextResponse } from 'next/server';

// 환경변수에서 값 가져오기
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'nbhighschooljobs@gmail.com';
const CONTACT_PHONE = process.env.CONTACT_PHONE || '506-429-6148';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nbhighschooljobs@gmail.com';

export interface EmailData {
  name: string;
  email: string;
  phone: string;
  grade: string;
  school: string;
  experience: string;
  motivation: string;
  availability: string;
  questions?: string;
  jobTitle?: string;
  companyName?: string;
  resumeFileName?: string;
  resumeSize?: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface JobPostingData {
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string;
  benefits: string;
  contactEmail: string;
  contactPhone: string;
  submitterName: string;
  submitterEmail: string;
}

export async function sendJobApplicationEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'job_application',
        data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ 이메일 전송 오류:', error);
    return {
      success: false,
      message: '이메일 전송 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
}

export function generateJobApplicationEmailHTML(data: EmailData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0369a1; text-align: center; margin-bottom: 30px;">
        🎯 새로운 구직 신청서가 도착했습니다!
      </h2>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; margin-top: 0;">📋 지원자 정보</h3>
        <p><strong>이름:</strong> ${data.name}</p>
        <p><strong>이메일:</strong> ${data.email}</p>
        <p><strong>전화번호:</strong> ${data.phone}</p>
        <p><strong>학년:</strong> ${data.grade}</p>
        <p><strong>학교:</strong> ${data.school}</p>
      </div>

      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; margin-top: 0;">💼 지원 정보</h3>
        <p><strong>지원 직무:</strong> ${data.jobTitle || '직무 정보 없음'}</p>
        <p><strong>회사명:</strong> ${data.companyName || '회사 정보 없음'}</p>
        <p><strong>근무 가능 시간:</strong> ${data.availability}</p>
      </div>

      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; margin-top: 0;">📝 지원자 메시지</h3>
        <p><strong>경험 및 기술:</strong><br>${data.experience.replace(/\n/g, '<br>')}</p>
        <p><strong>지원 동기:</strong><br>${data.motivation.replace(/\n/g, '<br>')}</p>
        ${data.questions ? `<p><strong>질문사항:</strong><br>${data.questions.replace(/\n/g, '<br>')}</p>` : ''}
      </div>

      <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #dc2626; margin-top: 0;">📎 첨부 파일</h3>
        ${data.resumeFileName ? 
          `<p><strong>이력서:</strong> ${data.resumeFileName} (${Math.round((data.resumeSize || 0) / 1024)}KB)</p>` : 
          '<p>첨부된 이력서가 없습니다.</p>'
        }
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          이 메시지는 캐나다 학생 일자리 플랫폼에서 자동으로 발송되었습니다.<br>
          <strong>연락처:</strong> ${CONTACT_EMAIL}<br>
          <strong>전화:</strong> ${CONTACT_PHONE}
        </p>
      </div>
    </div>
  `;
}

export function generateContactEmailHTML(data: ContactFormData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0369a1; text-align: center; margin-bottom: 30px;">
        📧 새로운 문의사항이 도착했습니다!
      </h2>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; margin-top: 0;">👤 문의자 정보</h3>
        <p><strong>이름:</strong> ${data.name}</p>
        <p><strong>이메일:</strong> ${data.email}</p>
        <p><strong>전화번호:</strong> ${data.phone}</p>
      </div>

      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; margin-top: 0;">💬 문의 내용</h3>
        <p style="line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          이 메시지는 캐나다 학생 일자리 플랫폼에서 자동으로 발송되었습니다.<br>
          <strong>연락처:</strong> ${CONTACT_EMAIL}<br>
          <strong>전화:</strong> ${CONTACT_PHONE}
        </p>
      </div>
    </div>
  `;
}

export async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'contact_form',
        data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ 문의 이메일 전송 오류:', error);
    return {
      success: false,
      message: '문의 이메일 전송 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
}

export async function sendJobPostingNotification(data: JobPostingData): Promise<{ success: boolean; message: string }> {
  try {
    const adminEmail = ADMIN_EMAIL;
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'job_posting_notification',
        data,
        adminEmail
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ 구인공고 알림 이메일 전송 오류:', error);
    return {
      success: false,
      message: '구인공고 알림 이메일 전송 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
}

export function generateJobPostingNotificationHTML(data: JobPostingData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0369a1; text-align: center; margin-bottom: 30px;">
        🏢 새로운 구인공고가 등록되었습니다!
      </h2>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; margin-top: 0;">📋 구인공고 정보</h3>
        <p><strong>직무명:</strong> ${data.title}</p>
        <p><strong>회사명:</strong> ${data.company}</p>
        <p><strong>근무지:</strong> ${data.location}</p>
        <p><strong>급여:</strong> ${data.salary}</p>
      </div>

      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; margin-top: 0;">📝 상세 정보</h3>
        <p><strong>업무 설명:</strong><br>${data.description.replace(/\n/g, '<br>')}</p>
        <p><strong>자격 요건:</strong><br>${data.requirements.replace(/\n/g, '<br>')}</p>
        <p><strong>복리후생:</strong><br>${data.benefits.replace(/\n/g, '<br>')}</p>
      </div>

      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0369a1; margin-top: 0;">📞 연락처</h3>
        <p><strong>담당자:</strong> ${data.submitterName}</p>
        <p><strong>이메일:</strong> ${data.submitterEmail}</p>
        <p><strong>회사 연락처:</strong> ${data.contactEmail}</p>
        <p><strong>전화번호:</strong> ${data.contactPhone}</p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          이 메시지는 캐나다 학생 일자리 플랫폼에서 자동으로 발송되었습니다.<br>
          <strong>연락처:</strong> ${CONTACT_EMAIL}<br>
          <strong>전화:</strong> ${CONTACT_PHONE}
        </p>
      </div>
    </div>
  `;
} 