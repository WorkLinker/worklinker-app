'use client';
import { useState } from 'react';
// import { sendTestEmail, sendApprovalEmail, sendRejectionEmail } from '@/lib/email-service'; // 제거됨

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // const response = await sendTestEmail(testEmail); // 임시 비활성화
      setResult({
        success: false,
        message: '이메일 시스템이 임시 비활성화되었습니다.',
        error: '환경변수 설정 후 활성화 예정'
      });
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
      // const response = await sendApprovalEmail(testEmail, '테스트 사용자'); // 임시 비활성화
      setResult({
        success: false,
        message: '이메일 시스템이 임시 비활성화되었습니다.',
        error: '환경변수 설정 후 활성화 예정'
      });
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
      // const response = await sendRejectionEmail(testEmail, '테스트 사용자', '테스트 거절 사유입니다.'); // 임시 비활성화
      setResult({
        success: false,
        message: '이메일 시스템이 임시 비활성화되었습니다.',
        error: '환경변수 설정 후 활성화 예정'
      });
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
          {result.messageId && (
            <p className="text-xs text-gray-600 mt-2">
              메시지 ID: {result.messageId}
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
          <li>1. SendGrid API 키를 설정하세요</li>
          <li>2. 테스트 이메일 주소를 입력하세요</li>
          <li>3. 원하는 이메일 타입을 선택하세요</li>
          <li>4. 결과를 확인하세요</li>
        </ol>
      </div>
    </div>
  );
} 