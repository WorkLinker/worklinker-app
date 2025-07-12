'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { sendContactEmail, ContactFormData } from '@/lib/email-service';

// 환경변수에서 연락처 정보 가져오기
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'nbhighschooljobs@gmail.com';
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '506-429-6148';
const CONTACT_ADDRESS = process.env.NEXT_PUBLIC_CONTACT_ADDRESS || '122 Brianna Dr, Fredericton NB COA 1N0';

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await sendContactEmail(formData);
      
      if (result.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setError(result.message || '문의 전송 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('문의 전송 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 사용되지 않는 함수 주석 처리
  // const getCategoryLabel = (category: string) => {
  //   switch (category) {
  //     case 'general': return '일반 문의';
  //     case 'technical': return '기술 문의';
  //     case 'business': return '사업 문의';
  //     case 'support': return '지원 요청';
  //     default: return '기타';
  //   }
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navigation />
      
      {/* 히어로 섹션 */}
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              문의하기
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              궁금한 점이나 도움이 필요한 사항이 있으시면 언제든지 연락주세요. 
              성실히 답변해드리겠습니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* 연락처 정보 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-8 h-fit">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  연락처 정보
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">이메일</h3>
                      <a 
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">전화번호</h3>
                      <a 
                        href={`tel:${CONTACT_PHONE}`}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {CONTACT_PHONE}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">주소</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {CONTACT_ADDRESS.split(', ').map((part, index) => (
                          <span key={index}>
                            {part}
                            {index < CONTACT_ADDRESS.split(', ').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">운영시간</h3>
                      <div className="text-gray-600 space-y-1">
                        <p>평일: 오전 9시 - 오후 6시</p>
                        <p>주말: 오전 10시 - 오후 4시</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">빠른 답변을 위한 팁</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 구체적인 문의 내용 작성</li>
                    <li>• 연락 가능한 시간 명시</li>
                    <li>• 긴급한 경우 전화 연락</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 문의 폼 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  문의 보내기
                </h2>

                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      문의가 성공적으로 전송되었습니다!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      24시간 내에 답변을 드리겠습니다.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setError(null);
                        }}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        다시 문의하기
                      </button>
                      <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        홈으로 돌아가기
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                          <span className="text-red-600">{error}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          이름 *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="이름을 입력하세요"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          이메일 *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="이메일을 입력하세요"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        전화번호
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="전화번호를 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        문의 내용 *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="문의하실 내용을 자세히 작성해주세요"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>전송 중...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span>문의 보내기</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* 자주 묻는 질문 */}
          <div className="mt-16 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              자주 묻는 질문
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Q. 회원가입은 어떻게 하나요?
                </h3>
                <p className="text-gray-600 mb-4">
                  구글 계정을 통해 간편하게 회원가입할 수 있습니다. 
                  학생 구직 또는 기업 채용 페이지에서 시작하세요.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Q. 구직 신청은 무료인가요?
                </h3>
                <p className="text-gray-600 mb-4">
                  네, 모든 서비스는 완전 무료입니다. 
                  학생들의 취업 지원을 위한 비영리 플랫폼입니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Q. 어떤 종류의 일자리가 있나요?
                </h3>
                <p className="text-gray-600 mb-4">
                  카페, 레스토랑, 소매점, 사무직 등 
                  고등학생이 할 수 있는 다양한 파트타임 일자리가 있습니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Q. 답변은 언제 받을 수 있나요?
                </h3>
                <p className="text-gray-600 mb-4">
                  문의 접수 후 24시간 내에 답변을 드립니다. 
                  긴급한 경우 전화로 연락 주세요.
                </p>
              </div>
            </div>
          </div>

          {/* 추가 도움 섹션 */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              추가 도움이 필요하신가요?
            </h2>
            <p className="text-gray-600 mb-8">
              다른 방법으로도 연락하실 수 있습니다
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>이메일 보내기</span>
              </a>
              
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>전화 걸기</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 