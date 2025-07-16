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
        subject: '🧪 MailerSend Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0369a1; text-align: center; margin-bottom: 30px;">
              🧪 MailerSend Test Email
            </h2>
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p>Hello!</p>
              <p>This email was sent to test the MailerSend email system.</p>
              <p>If you received this message, the email system is working properly! 🎉</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                This message was automatically sent from the Canadian Student Job Platform.
              </p>
            </div>
          </div>
        `,
        text: 'This is a MailerSend test email. If you received this message, the email system is working properly!'
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
        subject: '✅ Application Approval Notification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669; text-align: center; margin-bottom: 30px;">
              ✅ Your application has been approved!
            </h2>
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
              <p>Hello ${userName},</p>
              <p>Your submitted application has been <strong>approved</strong>!</p>
              <p>A representative will contact you soon.</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                This message was automatically sent from the Canadian Student Job Platform.
              </p>
            </div>
          </div>
        `,
        text: `Hello ${userName}, your submitted application has been approved! A representative will contact you soon.`
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
        subject: '❌ Application Review Result',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626; text-align: center; margin-bottom: 30px;">
              Application Review Result
            </h2>
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
              <p>Hello ${userName},</p>
              <p>After reviewing your submitted application, we regret to inform you that we cannot proceed with your application at this time.</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p>We encourage you to apply again for other opportunities.</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                This message was automatically sent from the Canadian Student Job Platform.
              </p>
            </div>
          </div>
        `,
        text: `Hello ${userName}, after reviewing your submitted application, we regret to inform you that we cannot proceed with your application at this time. Reason: ${reason}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter an email address.');
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
        message: 'Test email sending failed',
        error: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalTest = async () => {
    if (!testEmail) {
      alert('Please enter an email address.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendApprovalEmail(testEmail, 'Test User');
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: 'Approval email sending failed',
        error: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectionTest = async () => {
    if (!testEmail) {
      alert('Please enter an email address.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendRejectionEmail(testEmail, 'Test User', 'This is a test rejection reason.');
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: 'Rejection email sending failed',
        error: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">📧 Email System Test</h3>
      
      <div className="mb-4">
        <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Test Email Address
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
          {isLoading ? 'Sending...' : '🧪 Basic Test Email'}
        </button>
        
        <button
          onClick={handleApprovalTest}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Sending...' : '✅ Approval Email Test'}
        </button>
        
        <button
          onClick={handleRejectionTest}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Sending...' : '❌ Rejection Email Test'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
          <h4 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✅ Success' : '❌ Failed'}
          </h4>
          <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          {result.status && (
            <p className="text-xs text-gray-600 mt-2">
              Response Code: {result.status}
            </p>
          )}
          {result.error && (
            <p className="text-xs text-red-600 mt-2">
              Error: {typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="font-semibold text-gray-800 mb-2">📋 How to Use</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Set up your MailerSend API key</li>
          <li>2. Enter a test email address</li>
          <li>3. Select the desired email type</li>
          <li>4. Check the results</li>
        </ol>
      </div>
    </div>
  );
} 