'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, Users, MapPin, Clock, Calendar, Building, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { volunteerService } from '@/lib/firebase-services';

export default function VolunteerPostingsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    phone: '',
    title: '',
    description: '',
    organizationType: '',
    location: '',
    startDate: '',
    endDate: '',
    timeCommitment: '',
    requiredSkills: '',
    benefits: '',
    additionalInfo: ''
  });

  const organizationTypes = [
    '도서관',
    '요양원/요양소', 
    '노인정/복지관',
    '약국/의료기관',
    '정부기관/공공기관',
    '학교/교육기관',
    '종교기관',
    '환경단체',
    '동물보호소',
    '푸드뱅크/급식소',
    '기타'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await volunteerService.submitVolunteerPosting(formData);
      
      if (result.success) {
        setIsSubmitted(true);
        console.log('✅ 봉사자 모집 등록 성공:', result.id);
      }
    } catch (error) {
      console.error('❌ 봉사자 모집 등록 오류:', error);
      alert('등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 봉사자 모집 등록이 완료되었습니다!
              </h1>
              <p className="text-gray-600 mb-6">
                관리자 검토 후 승인되면 봉사 기회 목록에 게시됩니다.<br/>
                승인 결과는 이메일로 안내드리겠습니다.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">📋 다음 단계</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 관리자 검토 (1-2일 소요)</li>
                  <li>• 승인 시 자동으로 목록에 게시</li>
                  <li>• 학생들의 지원 접수 시작</li>
                  <li>• 지원자 정보를 이메일로 전달</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/volunteer-listings"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  봉사 기회 목록 보기
                </Link>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      organizationName: '',
                      contactPerson: '',
                      email: '',
                      phone: '',
                      title: '',
                      description: '',
                      organizationType: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      timeCommitment: '',
                      requiredSkills: '',
                      benefits: '',
                      additionalInfo: ''
                    });
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  새로운 모집 등록
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <Image
          src="/images/봉사활동.png"
          alt="봉사자 모집"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 text-center text-white px-4">
          <div className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Heart size={16} className="mr-2" />
            봉사자 모집
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            함께 만드는 더 나은 지역사회
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
            뉴브런즈윅의 미래를 이끌어갈 학생 봉사자들을 모집해보세요
          </p>
        </div>
      </section>

      {/* Navigation Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-green-600">홈</Link>
            <span className="mx-2">•</span>
            <span className="text-green-600">봉사자 모집 등록</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Info Section */}
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="mr-3 text-green-600" size={28} />
              봉사자 모집 등록 안내
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">📋 모집 대상</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 뉴브런즈윅 고등학생 (9-12학년)</li>
                  <li>• 만 14-18세 학생</li>
                  <li>• 지역사회 봉사 의지가 있는 학생</li>
                  <li>• 기본적인 영어 소통 가능자</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">⚡ 등록 절차</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 봉사자 모집 정보 입력</li>
                  <li>• 관리자 검토 (1-2일)</li>
                  <li>• 승인 후 목록 게시</li>
                  <li>• 학생 지원 접수 및 매칭</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="mr-3 text-green-600" size={28} />
              봉사자 모집 등록
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Organization Info */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="mr-2 text-green-600" size={20} />
                  기관 정보
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      기관명 *
                    </label>
                    <input
                      type="text"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="예: 프레더릭턴 공공도서관"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      기관 유형 *
                    </label>
                    <select
                      name="organizationType"
                      value={formData.organizationType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">기관 유형을 선택하세요</option>
                      {organizationTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      담당자명 *
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처 *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="(506) 555-0123"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="contact@organization.ca"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Volunteer Info */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="mr-2 text-green-600" size={20} />
                  봉사 활동 정보
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      봉사 제목 *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="예: 도서관 아동 독서 프로그램 보조"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      활동 내용 *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="봉사 활동의 구체적인 내용, 업무, 목적 등을 자세히 설명해주세요."
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        활동 장소 *
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="프레더릭턴, NB"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        시간 약속 *
                      </label>
                      <input
                        type="text"
                        name="timeCommitment"
                        value={formData.timeCommitment}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="예: 주 2회, 각 3시간"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        시작일
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        종료일
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      필요한 기술/경험
                    </label>
                    <textarea
                      name="requiredSkills"
                      value={formData.requiredSkills}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="예: 아이들과 소통 능력, 기본적인 컴퓨터 활용, 영어 회화 등"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      봉사자 혜택
                    </label>
                    <textarea
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="예: 봉사 확인서 발급, 추천서 작성, 교통비 지원, 간식 제공 등"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      추가 정보
                    </label>
                    <textarea
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="기타 참고사항, 특별 요구사항 등"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-between items-center pt-6">
                <Link
                  href="/volunteer-listings"
                  className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  봉사 기회 목록으로 돌아가기
                </Link>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-lg font-medium transition-all ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      등록 중...
                    </span>
                  ) : (
                    '봉사자 모집 등록'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 