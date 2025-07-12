'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobSeekerService } from '@/lib/firebase-services';

const JobSeekerSchema = z.object({
  name: z.string().min(2, '이름은 2글자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  phone: z.string().min(10, '올바른 전화번호를 입력해주세요'),
  grade: z.string().min(1, '학년을 선택해주세요'),
  school: z.string().min(2, '학교명을 입력해주세요'),
  skills: z.string().min(1, '기술/경험을 입력해주세요'),
  availability: z.enum(['full-time', 'part-time', 'volunteer']),
  agreement: z.boolean().refine((val) => val === true, '약관에 동의해주세요')
});

type JobSeekerForm = z.infer<typeof JobSeekerSchema>;

export default function JobSeekersPage() {
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<JobSeekerForm>({
    resolver: zodResolver(JobSeekerSchema)
  });

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
      
      setResumeFile(file);
    }
  };

  const onSubmit = async (data: JobSeekerForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('📝 구직 신청 제출 시작...');
      
      // 실제 Firebase에 데이터 저장
      const result = await jobSeekerService.submitApplication(data, resumeFile || undefined);
      
      if (result.success) {
        console.log('🎉 구직 신청이 성공적으로 제출되었습니다!');
        setSubmitted(true);
        reset();
        setResumeFile(null);
      }
    } catch (error) {
      console.error('❌ 구직 신청 제출 오류:', error);
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
              신청이 완료되었습니다!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              제출해주신 정보를 검토한 후, 승인 결과를 이메일로 안내드리겠습니다.
              <br />
              일반적으로 2-3일 내에 처리됩니다.
            </p>
            <div className="bg-sky-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-sky-900 mb-3">다음 단계</h2>
              <ul className="text-sky-800 space-y-2">
                <li>• 관리자가 제출된 정보를 검토합니다</li>
                <li>• 승인 후 기업들이 프로필을 확인할 수 있습니다</li>
                <li>• 적합한 기회가 있을 때 연락을 받게 됩니다</li>
              </ul>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-primary"
            >
              다른 신청서 작성하기
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
      <section className="h-screen flex items-center justify-center relative overflow-hidden">
        {/* Navigation overlay */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/학생구직.png"
            alt="학생 구직"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            캐나다 학생 구직 신청
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            뉴브런즈윅 주 고등학생을 위한 전문 구직 서비스
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                const formSection = document.getElementById('application-form');
                if (formSection) {
                  formSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              지금 신청하기
            </button>
            <button
              onClick={() => {
                const infoSection = document.getElementById('info-section');
                if (infoSection) {
                  infoSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors backdrop-blur-sm"
            >
              자세히 보기
            </button>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section id="info-section" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            학생 구직 신청
          </h1>

          <p className="text-lg text-sky-600 font-semibold">
            캐나다 학생들을 위한 전문 구직 서비스
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section id="application-form" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">기본 정보</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="student@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호 *
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="506-123-4567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학년 *
                    </label>
                    <select
                      {...register('grade')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="">학년을 선택하세요</option>
                      <option value="9">9학년</option>
                      <option value="10">10학년</option>
                      <option value="11">11학년</option>
                      <option value="12">12학년</option>
                    </select>
                    {errors.grade && (
                      <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학교명 *
                  </label>
                  <input
                    type="text"
                    {...register('school')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="예: Fredericton High School"
                  />
                  {errors.school && (
                    <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
                  )}
                </div>
              </div>

              {/* 레쥬메 업로드 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">레쥬메 업로드</h2>
                
                <div className="file-upload">
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload size={48} className="text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        레쥬메 파일을 선택하세요
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, DOC, DOCX 파일만 업로드 가능 (최대 5MB)
                      </p>
                    </div>
                  </label>
                </div>

                {resumeFile && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <FileText size={20} className="text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">{resumeFile.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 기술/경험 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">기술 및 경험</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기술, 경험, 관심 분야 *
                  </label>
                  <textarea
                    {...register('skills')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="예: 컴퓨터 기초, 고객 서비스, 팀워크, 책임감 등"
                  />
                  {errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    근무 형태 *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('availability')}
                        value="full-time"
                        className="mr-2"
                      />
                      <span>풀타임 (방학 중)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('availability')}
                        value="part-time"
                        className="mr-2"
                      />
                      <span>파트타임 (주말/방과후)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('availability')}
                        value="volunteer"
                        className="mr-2"
                      />
                      <span>봉사활동</span>
                    </label>
                  </div>
                  {errors.availability && (
                    <p className="mt-1 text-sm text-red-600">{errors.availability.message}</p>
                  )}
                </div>
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
                    <p className="font-medium mb-2">개인정보 수집 및 이용 동의 *</p>
                    <p>
                      제출된 정보는 구직 매칭 목적으로만 사용되며, 
                      관리자 승인 후 기업들이 확인할 수 있습니다. 
                      개인정보는 안전하게 보관되며, 목적 달성 후 파기됩니다.
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
                  {isSubmitting ? '제출 중...' : '구직 신청하기'}
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