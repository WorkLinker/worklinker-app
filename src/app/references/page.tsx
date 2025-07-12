'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { FileText, Upload, CheckCircle, User, GraduationCap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { referenceService } from '@/lib/firebase-services';

const ReferenceSchema = z.object({
  studentName: z.string().min(2, '학생 이름은 2글자 이상이어야 합니다'),
  studentEmail: z.string().email('올바른 학생 이메일 주소를 입력해주세요'),
  teacherName: z.string().min(2, '선생님 이름은 2글자 이상이어야 합니다'),
  teacherEmail: z.string().email('올바른 선생님 이메일 주소를 입력해주세요'),
  subject: z.string().min(1, '과목명을 입력해주세요'),
  relationship: z.string().min(5, '관계를 구체적으로 설명해주세요'),
  referenceText: z.string().min(100, '추천서 내용은 100글자 이상이어야 합니다'),
  agreement: z.boolean().refine((val) => val === true, '약관에 동의해주세요')
});

type ReferenceForm = z.infer<typeof ReferenceSchema>;

export default function ReferencesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ReferenceForm>({
    resolver: zodResolver(ReferenceSchema)
  });

  const watchedValues = watch();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 파일 형식 제한
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('PDF, DOC, DOCX 파일만 업로드 가능합니다.');
        return;
      }
      
      setReferenceFile(file);
    }
  };

  const onSubmit = async (data: ReferenceForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('📄 추천서 제출 시작...');
      
      // 실제 Firebase에 데이터 저장
      const result = await referenceService.submitReference(data, referenceFile || undefined);
      
      if (result.success) {
        console.log('🎉 추천서가 성공적으로 제출되었습니다!');
        setSubmitted(true);
        reset();
        setReferenceFile(null);
      }
    } catch (error) {
      console.error('❌ 추천서 제출 오류:', error);
      alert('제출 중 오류가 발생했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              추천서가 제출되었습니다!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              제출해주신 추천서를 검토한 후, 승인 결과를 이메일로 안내드리겠습니다.
              <br />
              학생과 선생님 모두에게 확인 이메일이 발송됩니다.
            </p>
            <div className="bg-sky-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-sky-900 mb-3">제출 완료</h2>
              <ul className="text-sky-800 space-y-2">
                <li>• 추천서가 안전하게 저장되었습니다</li>
                <li>• 관리자 승인 후 학생 프로필에 연결됩니다</li>
                <li>• 기업들이 학생 평가 시 참고자료로 활용됩니다</li>
              </ul>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-primary"
            >
              다른 추천서 작성하기
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
            src="/images/추천서지원.png"
            alt="추천서 지원"
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
              진심이 담긴 추천이 힘이 됩니다
            </h1>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            추천서 업로드
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            선생님 전용 페이지입니다. 학생들의 구직 활동을 도와주세요.
            <br />
            추천서는 학생들에게 큰 도움이 됩니다.
          </p>
          <p className="text-lg text-sky-600 font-semibold">
            디지털 추천서 시스템으로 학생과 선생님을 연결
          </p>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Teacher Only Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <User size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">선생님 전용</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                학교 선생님들만 이용할 수 있는 추천서 업로드 시스템입니다.
              </p>
              <div className="bg-sky-50 rounded-lg p-4">
                <p className="text-sky-700 font-medium text-sm">
                  교사 인증 후 이용 가능
                </p>
              </div>
            </div>
            
            {/* Secure Storage Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">안전한 보관</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                모든 추천서는 안전하게 암호화되어 보관되며, 승인 후 학생 프로필에 연결됩니다.
              </p>
              <div className="bg-sky-50 rounded-lg p-4">
                <p className="text-sky-700 font-medium text-sm">
                  SSL 암호화 및 GDPR 준수
                </p>
              </div>
            </div>
            
            {/* Student Support Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <GraduationCap size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">학생 지원</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                추천서는 학생들의 구직 활동에 큰 도움이 되며, 기업들의 신뢰를 얻는 데 중요한 역할을 합니다.
              </p>
              <div className="bg-sky-50 rounded-lg p-4">
                <p className="text-sky-700 font-medium text-sm">
                  취업 성공률 향상 도구
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">추천서 작성 및 업로드</h2>
              <p className="text-gray-600">
                학생의 성실성, 능력, 태도 등을 기반으로 솔직하고 구체적인 추천서를 작성해주세요.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 학생 정보 */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">학생 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학생 이름 *
                    </label>
                    <input
                      type="text"
                      {...register('studentName')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="김학생"
                    />
                    {errors.studentName && (
                      <p className="mt-1 text-sm text-red-600">{errors.studentName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학생 이메일 *
                    </label>
                    <input
                      type="email"
                      {...register('studentEmail')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="student@example.com"
                    />
                    {errors.studentEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.studentEmail.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 선생님 정보 */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">선생님 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      선생님 이름 *
                    </label>
                    <input
                      type="text"
                      {...register('teacherName')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="김선생"
                    />
                    {errors.teacherName && (
                      <p className="mt-1 text-sm text-red-600">{errors.teacherName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      선생님 이메일 *
                    </label>
                    <input
                      type="email"
                      {...register('teacherEmail')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="teacher@school.ca"
                    />
                    {errors.teacherEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.teacherEmail.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 관계 정보 */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">관계 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      담당 과목 *
                    </label>
                    <input
                      type="text"
                      {...register('subject')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="수학, 영어, 과학 등"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학생과의 관계 *
                    </label>
                    <input
                      type="text"
                      {...register('relationship')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="예: 2년간 수학 과목 담당"
                    />
                    {errors.relationship && (
                      <p className="mt-1 text-sm text-red-600">{errors.relationship.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 추천서 내용 */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">추천서 내용</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추천서 내용 *
                  </label>
                  <textarea
                    {...register('referenceText')}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="학생의 성실성, 능력, 태도, 성장 과정 등을 구체적으로 설명해주세요. 
                    
예시:
- 학업 성취도 및 학습 태도
- 책임감과 성실성
- 팀워크 및 리더십
- 특별한 재능이나 경험
- 직업 준비도 및 추천 이유"
                  />
                  {errors.referenceText && (
                    <p className="mt-1 text-sm text-red-600">{errors.referenceText.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    현재 글자 수: {watchedValues.referenceText?.length || 0}자 (최소 100자)
                  </p>
                </div>
              </div>

              {/* 파일 업로드 (선택사항) */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">추천서 파일 업로드 (선택사항)</h3>
                
                <div className="file-upload">
                  <input
                    type="file"
                    id="reference-file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="reference-file" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload size={48} className="text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        추천서 파일 업로드 (선택사항)
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, DOC, DOCX 파일만 업로드 가능 (최대 5MB)
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        위에 작성한 내용과 함께 추가 서류가 있다면 업로드하세요
                      </p>
                    </div>
                  </label>
                </div>

                {referenceFile && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <FileText size={20} className="text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">{referenceFile.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 약관 동의 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('agreement')}
                    className="mt-1 mr-3"
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2">추천서 제출 동의 *</p>
                    <p>
                      본인은 위에 작성한 추천서가 사실임을 확인하며, 
                      해당 학생의 구직 활동을 위해 이 추천서가 사용되는 것에 동의합니다. 
                      추천서는 관리자 승인 후 학생 프로필에 연결되어 기업들이 참고할 수 있습니다.
                    </p>
                  </div>
                </div>
                {errors.agreement && (
                  <p className="mt-2 text-sm text-red-600">{errors.agreement.message}</p>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                >
                  {isSubmitting ? '제출 중...' : '추천서 제출하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 