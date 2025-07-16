'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  DollarSign,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobPostingService, jobApplicationService } from '@/lib/firebase-services';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

const JobApplicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  grade: z.string().min(1, 'Please select your grade'),
  school: z.string().min(2, 'Please enter your school name'),
  experience: z.string().min(10, 'Please enter at least 10 characters for experience/skills'),
  motivation: z.string().min(50, 'Please enter at least 50 characters for your motivation'),
  availability: z.string().min(1, 'Please enter your available hours'),
  questions: z.string().optional()
});

type ApplicationForm = z.infer<typeof JobApplicationSchema>;

export default function JobApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [user] = useAuthState(auth);
  
  const [jobPosting, setJobPosting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<ApplicationForm>({
    resolver: zodResolver(JobApplicationSchema)
  });

  useEffect(() => {
    loadJobPosting();
    if (user) {
      // 로그인한 사용자 정보로 기본값 설정
      setValue('email', user.email || '');
      setValue('name', user.displayName || '');
    }
  }, [user, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobPosting = async () => {
    try {
      setLoading(true);
      const jobs = await jobPostingService.getApprovedJobPostings();
      const job = jobs.find(j => j.id === jobId);
      
      if (job) {
        setJobPosting(job);
        // 조회수 증가
        await jobPostingService.incrementViews(jobId);
      } else {
        router.push('/job-listings');
      }
    } catch (error) {
      console.error('❌ 구인공고 로드 오류:', error);
      router.push('/job-listings');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 파일 형식 제한
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('PDF, DOC, DOCX 파일만 업로드 가능합니다.');
        return;
      }
      
      setResumeFile(file);
    }
  };

  const onSubmit = async (data: ApplicationForm) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📝 지원서 제출 시작...');
      
      const applicationData = {
        ...data,
        jobTitle: jobPosting.title,
        companyName: jobPosting.company,
        resumeFileName: resumeFile?.name || '',
        resumeSize: resumeFile?.size || 0,
        applicantId: user.uid
      };

      const result = await jobApplicationService.submitApplication(jobId, applicationData);
      
      if (result.success) {
        console.log('🎉 지원서가 성공적으로 제출되었습니다!');
        setSubmitted(true);
        reset();
        setResumeFile(null);
      }
    } catch (error) {
      console.error('❌ 지원서 제출 오류:', error);
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="pt-20 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <AlertCircle size={64} className="text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                로그인이 필요합니다
              </h2>
              <p className="text-gray-600 mb-6">
                구인공고에 지원하려면 먼저 로그인해주세요.
              </p>
              <button
                onClick={() => router.push('/job-listings')}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                구인공고 목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">구인공고를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="pt-20 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                지원이 완료되었습니다!
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                You have successfully applied for <strong>&ldquo;{jobPosting.title}&rdquo;</strong>.
              </p>
              <p className="text-gray-600 mb-8">
                The company will review your application and contact you.
                <br />
                You can typically expect a response within 3-5 days.
              </p>
              <div className="bg-green-50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-green-900 mb-3">Next Steps</h2>
                <ul className="text-green-800 space-y-2 text-left">
                  <li>• The company will review your application</li>
                  <li>• They will contact you if you&apos;re a good fit</li>
                  <li>• You can check your application status on My Page</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/job-listings')}
                  className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  View Other Job Listings
                </button>
                <button
                  onClick={() => router.push('/my-page')}
                  className="px-6 py-3 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Check in My Profile
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
    <div className="min-h-screen bg-custom-blue">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft size={18} className="mr-2" />
              이전으로
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              🏢 구인공고 지원하기
            </h1>
            
            {/* 구인공고 정보 */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-purple-900 mb-2">
                {jobPosting.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-purple-700">
                <div className="flex items-center">
                  <Building size={14} className="mr-1" />
                  <span>{jobPosting.company}</span>
                </div>
                <div className="flex items-center">
                  <MapPin size={14} className="mr-1" />
                  <span>{jobPosting.location}</span>
                </div>
                {jobPosting.salary && (
                  <div className="flex items-center">
                    <DollarSign size={14} className="mr-1" />
                    <span>{jobPosting.salary}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 지원 폼 */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="예: Fredericton High School"
                  />
                  {errors.school && (
                    <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
                  )}
                </div>
              </div>

              {/* 지원 내용 */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">지원 내용</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      경험 및 기술 * <span className="text-gray-500">(10글자 이상)</span>
                    </label>
                    <textarea
                      {...register('experience')}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="관련 경험, 기술, 자격증 등을 상세히 작성해주세요..."
                    />
                    {errors.experience && (
                      <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      지원동기 * <span className="text-gray-500">(50글자 이상)</span>
                    </label>
                    <textarea
                      {...register('motivation')}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="왜 이 직무에 지원하게 되었는지, 어떤 기여를 할 수 있는지 작성해주세요..."
                    />
                    {errors.motivation && (
                      <p className="mt-1 text-sm text-red-600">{errors.motivation.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      근무 가능 시간 *
                    </label>
                    <textarea
                      {...register('availability')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="예: 평일 오후 4시-8시, 주말 오전 10시-오후 6시 가능"
                    />
                    {errors.availability && (
                      <p className="mt-1 text-sm text-red-600">{errors.availability.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      궁금한 점이나 추가 메시지 <span className="text-gray-500">(선택)</span>
                    </label>
                    <textarea
                      {...register('questions')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="궁금한 점이나 하고 싶은 말씀이 있으시면 작성해주세요..."
                    />
                  </div>
                </div>
              </div>

              {/* 파일 업로드 */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">이력서 첨부</h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    id="resume-upload"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload size={48} className="text-gray-400 mb-4" />
                    <div className="text-lg font-medium text-gray-900 mb-2">
                      이력서 파일 선택
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      PDF, DOC, DOCX 파일 (최대 5MB)
                    </div>
                    <div className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                      파일 선택하기
                    </div>
                  </label>
                  
                  {resumeFile && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center">
                        <FileText size={20} className="text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">
                          {resumeFile.name}
                        </span>
                        <span className="text-green-600 text-sm ml-2">
                          ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-6 py-4 bg-purple-500 text-white text-lg font-medium rounded-lg hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      지원서 제출 중...
                    </>
                  ) : (
                    <>
                      <Send size={20} className="mr-2" />
                      지원서 제출하기
                    </>
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