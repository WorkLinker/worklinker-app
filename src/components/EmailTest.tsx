'use client';
import { useState } from 'react';

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  const sendTestEmail = async (email: string) => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: '🧪 MailerSend 테스트 이메일',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0369a1; text-align: center; margin-bottom: 30px;">
              🧪 MailerSend 테스트 이메일
            </h2>
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p>안녕하세요!</p>
              <p>이 이메일은 MailerSend 이메일 시스템 테스트를 위해 발송되었습니다.</p>
              <p>이 메시지를 받으셨다면 이메일 시스템이 정상적으로 작동하고 있습니다! 🎉</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                이 메시지는 캐나다 학생 일자리 플랫폼에서 자동으로 발송되었습니다.
              </p>
            </div>
          </div>
        `,
        text: 'MailerSend 테스트 이메일입니다. 이 메시지를 받으셨다면 이메일 시스템이 정상적으로 작동하고 있습니다!'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const sendApprovalEmail = async (email: string, userName: string) => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: '✅ 지원서 승인 알림',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669; text-align: center; margin-bottom: 30px;">
              ✅ 지원서가 승인되었습니다!
            </h2>
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
              <p>안녕하세요 ${userName}님,</p>
              <p>제출해주신 지원서가 <strong>승인</strong>되었습니다!</p>
              <p>곧 담당자가 연락을 드릴 예정입니다.</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                이 메시지는 캐나다 학생 일자리 플랫폼에서 자동으로 발송되었습니다.
              </p>
            </div>
          </div>
        `,
        text: `안녕하세요 ${userName}님, 제출해주신 지원서가 승인되었습니다! 곧 담당자가 연락을 드릴 예정입니다.`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const sendRejectionEmail = async (email: string, userName: string, reason: string) => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: '❌ 지원서 처리 결과 안내',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626; text-align: center; margin-bottom: 30px;">
              지원서 처리 결과 안내
            </h2>
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
              <p>안녕하세요 ${userName}님,</p>
              <p>제출해주신 지원서를 검토한 결과, 아쉽게도 이번에는 함께할 수 없게 되었습니다.</p>
              <p><strong>사유:</strong> ${reason}</p>
              <p>다른 기회에 다시 지원해주시기 바랍니다.</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                이 메시지는 캐나다 학생 일자리 플랫폼에서 자동으로 발송되었습니다.
              </p>
            </div>
          </div>
        `,
        text: `안녕하세요 ${userName}님, 제출해주신 지원서를 검토한 결과, 아쉽게도 이번에는 함께할 수 없게 되었습니다. 사유: ${reason}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendTestEmail(testEmail);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: '테스트 이메일 전송 실패',
        error: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalTest = async () => {
    if (!testEmail) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendApprovalEmail(testEmail, '테스트 사용자');
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: '승인 이메일 전송 실패',
        error: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectionTest = async () => {
    if (!testEmail) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendRejectionEmail(testEmail, '테스트 사용자', '테스트 거절 사유입니다.');
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: '거절 이메일 전송 실패',
        error: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">📧 이메일 시스템 테스트</h3>
      
      <div className="mb-4">
        <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
          테스트 이메일 주소
        </label>
        <input
          type="email"
          id="testEmail"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder="test@example.com"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 mb-4">
        <button
          onClick={handleTestEmail}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-gray-400"
        >
          {isLoading ? '전송 중...' : '🧪 기본 테스트 이메일'}
        </button>
        
        <button
          onClick={handleApprovalTest}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? '전송 중...' : '✅ 승인 이메일 테스트'}
        </button>
        
        <button
          onClick={handleRejectionTest}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
        >
          {isLoading ? '전송 중...' : '❌ 거절 이메일 테스트'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
          <h4 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✅ 성공' : '❌ 실패'}
          </h4>
          <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          {result.status && (
            <p className="text-xs text-gray-600 mt-2">
              응답 코드: {result.status}
            </p>
          )}
          {result.error && (
            <p className="text-xs text-red-600 mt-2">
              에러: {typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="font-semibold text-gray-800 mb-2">📋 사용 방법</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. MailerSend API 키를 설정하세요</li>
          <li>2. 테스트 이메일 주소를 입력하세요</li>
          <li>3. 원하는 이메일 타입을 선택하세요</li>
          <li>4. 결과를 확인하세요</li>
        </ol>
      </div>
    </div>
  );
} 