'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, MessageSquare, HelpCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { contactService } from '@/lib/firebase-services';

const ContactSchema = z.object({
  name: z.string().min(2, '이름은 2글자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  subject: z.string().min(5, '제목은 5글자 이상이어야 합니다'),
  category: z.enum(['general', 'technical', 'job-seeker', 'employer', 'event']),
  message: z.string().min(20, '메시지는 20글자 이상이어야 합니다'),
  urgent: z.boolean().optional()
});

type ContactForm = z.infer<typeof ContactSchema>;

// FAQ 데이터
const faqs = [
  {
    question: '학생 구직 신청은 어떻게 하나요?',
    answer: '\'학생 구직\' 페이지에서 기본 정보를 입력하고 레쥬메를 업로드하면 됩니다. 관리자 승인 후 기업들이 프로필을 확인할 수 있습니다.'
  },
  {
    question: '구인공고는 누구나 올릴 수 있나요?',
    answer: '네, 기업 및 개인 고용주 모두 구인공고를 등록할 수 있습니다. 다만 고등학생에게 적합한 일자리여야 하며, 관리자 승인 후 게시됩니다.'
  },
  {
    question: '추천서는 어떻게 업로드 하나요?',
    answer: '\'추천서 업로드\' 페이지는 선생님 전용입니다. 학생 정보와 함께 추천서 내용을 작성하여 제출하면 됩니다.'
  },
  {
    question: '이벤트 참가비는 얼마인가요?',
            answer: '모든 이벤트에 참여하실 수 있습니다. 일부 이벤트는 점심이나 간식도 제공됩니다.'
  },
  {
    question: '승인은 얼마나 걸리나요?',
    answer: '일반적으로 1-3일 내에 처리됩니다. 급한 경우 문의하기를 통해 연락주시면 빠른 처리가 가능합니다.'
  },
  {
    question: '개인정보는 어떻게 보호되나요?',
    answer: '모든 개인정보는 암호화되어 안전하게 보관되며, 구직 매칭 목적으로만 사용됩니다. 목적 달성 후 파기됩니다.'
  }
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ContactForm>({
    resolver: zodResolver(ContactSchema)
  });

  const watchedValues = watch();

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('📞 문의사항 제출 시작...');
      
      // 실제 Firebase에 데이터 저장
      const result = await contactService.submitContact(data);
      
      if (result.success) {
        console.log('🎉 문의사항이 성공적으로 제출되었습니다!');
        setSubmitted(true);
        reset();
      }
    } catch (error) {
      console.error('❌ 문의사항 제출 오류:', error);
      alert('전송 중 오류가 발생했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // const getCategoryLabel = (category: string) => {
  //   switch (category) {
  //     case 'general': return '일반 문의';
  //     case 'technical': return '기술 문제';
  //     case 'job-seeker': return '구직자 문의';
  //     case 'employer': return '기업/고용주 문의';
  //     case 'event': return '이벤트 문의';
  //     default: return category;
  //   }
  // };

  if (submitted) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              문의가 접수되었습니다!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              소중한 의견을 보내주셔서 감사합니다. 
              <br />
              빠른 시일 내에 답변 드리겠습니다.
            </p>
            <div className="bg-sky-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-sky-900 mb-3">처리 현황</h2>
              <ul className="text-sky-800 space-y-2">
                <li>• 문의가 관리자에게 전달되었습니다</li>
                <li>• 일반적으로 24시간 내에 답변 드립니다</li>
                <li>• 급한 경우 전화로 연락주시기 바랍니다</li>
              </ul>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-primary"
            >
              다른 문의하기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Hero Section */}
      <section className="h-screen flex items-end justify-center relative overflow-hidden pb-20">
        {/* Navigation overlay */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/2번.jpg"
            alt="문의하기"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                                      <h1 className="hero-title hero-title-premium mb-4 sm:mb-6">
              궁금한 건 언제든지 물어보세요
            </h1>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            문의하기
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            궁금한 점이 있으시거나 도움이 필요하시면 언제든지 연락주세요. 
            <br />
            친절하게 안내해드리겠습니다.
          </p>
          <p className="text-lg text-sky-600 font-semibold">
            24시간 지원 서비스로 빠른 답변 제공
          </p>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* First row - 3 main contact cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Email Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200 h-full flex flex-col">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Mail size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">이메일 문의</h3>
              <p className="text-gray-600 mb-6 leading-relaxed flex-grow">가장 빠른 답변을 받으실 수 있습니다</p>
              <div className="mt-auto">
                <a 
                  href="mailto:nbhighschooljobs@gmail.com" 
                  className="inline-block bg-sky-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors duration-200 shadow-md hover:shadow-lg mb-3"
                >
                  이메일 보내기
                </a>
                <p className="text-sky-600 font-medium text-sm">
                  nbhighschooljobs@gmail.com
                </p>
              </div>
            </div>
            
            {/* Phone Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200 h-full flex flex-col">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Phone size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">전화 상담</h3>
              <p className="text-gray-600 mb-6 leading-relaxed flex-grow">급한 문의는 전화로 연락하세요</p>
              <div className="mt-auto">
                <a 
                  href="tel:506-429-6148" 
                  className="inline-block bg-sky-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors duration-200 shadow-md hover:shadow-lg mb-3"
                >
                  전화 걸기
                </a>
                <p className="text-sky-600 font-medium text-sm">
                  506-429-6148
                </p>
              </div>
            </div>
            
            {/* Address Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200 h-full flex flex-col">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MapPin size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">방문 상담</h3>
              <p className="text-gray-600 mb-6 leading-relaxed flex-grow">사전 예약 후 방문 상담이 가능합니다</p>
              <div className="mt-auto">
                <div className="bg-sky-50 rounded-lg p-4 mb-4">
                  <address className="text-sky-700 not-italic font-medium">
                    122 Brianna Dr<br />
                    Fredericton NB COA 1N0
                  </address>
                </div>
                <button className="bg-sky-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors duration-200 shadow-md hover:shadow-lg">
                  지도 보기
                </button>
              </div>
            </div>
          </div>

          {/* Second row - Operating Hours Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-yellow-200">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                    <Clock size={36} className="text-white" />
                  </div>
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">운영시간</h3>
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <p className="text-yellow-800 font-semibold text-lg mb-2">
                      월요일 - 금요일: 9:00 AM - 6:00 PM
                    </p>
                    <p className="text-yellow-700">
                      주말 및 공휴일 제외 • 24시간 온라인 접수 가능
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                온라인 문의
              </h2>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이름 *
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="홍길동"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일 *
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문의 분류 *
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">문의 분류를 선택하세요</option>
                      <option value="general">일반 문의</option>
                      <option value="technical">기술 문제</option>
                      <option value="job-seeker">구직자 문의</option>
                      <option value="employer">기업/고용주 문의</option>
                      <option value="event">이벤트 문의</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 *
                    </label>
                    <input
                      type="text"
                      {...register('subject')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="문의 내용을 간단히 요약해주세요"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      메시지 *
                    </label>
                    <textarea
                      {...register('message')}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="문의하실 내용을 자세히 적어주세요..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      현재 글자 수: {watchedValues.message?.length || 0}자 (최소 20자)
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('urgent')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        긴급 문의 (24시간 이내 답변 필요)
                      </span>
                    </label>
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] flex items-center justify-center space-x-2"
                    >
                      <Send size={18} />
                      <span>{isSubmitting ? '전송 중...' : '문의 전송'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                자주 묻는 질문
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md border">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <div className="flex items-center">
                        <HelpCircle size={20} className="text-indigo-600 mr-2" />
                        <span className="text-2xl text-gray-400">
                          {openFaq === index ? '−' : '+'}
                        </span>
                      </div>
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-indigo-50 rounded-lg p-6">
                <div className="flex items-start">
                  <MessageSquare size={24} className="text-indigo-600 mr-3 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                      답변을 찾지 못하셨나요?
                    </h3>
                    <p className="text-indigo-800 mb-3">
                      위의 양식을 통해 문의해주시거나, 
                      직접 연락주시면 자세히 안내해드리겠습니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href="mailto:nbhighschooljobs@gmail.com"
                        className="btn-primary text-center text-sm"
                      >
                        이메일 보내기
                      </a>
                      <a
                        href="tel:506-429-6148"
                        className="btn-outline text-center text-sm"
                      >
                        전화 걸기
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 