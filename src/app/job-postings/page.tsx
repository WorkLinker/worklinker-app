'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Building, DollarSign, CheckCircle, Plus, Search } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobPostingService } from '@/lib/firebase-services';
// import { authService } from '@/lib/auth-service';
// import { User as FirebaseUser } from 'firebase/auth';

const JobPostingSchema = z.object({
  title: z.string().min(5, '제목은 5글자 이상이어야 합니다'),
  company: z.string().min(2, '회사명을 입력해주세요'),
  location: z.string().min(2, '근무지를 입력해주세요'),
  description: z.string().min(50, '상세 설명은 50글자 이상이어야 합니다'),
  requirements: z.string().min(10, '요구사항을 입력해주세요'),
  salary: z.string().optional(),
  jobType: z.enum(['full-time', 'part-time', 'volunteer']),
  industry: z.string().min(1, '업종을 선택해주세요'),
  contactEmail: z.string().email('올바른 이메일 주소를 입력해주세요'),
  contactPhone: z.string().optional(),
  agreement: z.boolean().refine((val) => val === true, '약관에 동의해주세요')
});

type JobPostingForm = z.infer<typeof JobPostingSchema>;



export default function JobPostingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [user, setUser] = useState<FirebaseUser | null>(null);

  // // 사용자 인증 상태 확인
  // useEffect(() => {
  //   const unsubscribe = authService.onAuthStateChange((currentUser) => {
  //     setUser(currentUser);
  //   });
  //   return () => unsubscribe();
  // }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<JobPostingForm>({
    resolver: zodResolver(JobPostingSchema)
  });

  const onSubmit = async (data: JobPostingForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('🏢 채용 공고 등록 시작...');
      
      // 실제 Firebase에 데이터 저장
      const result = await jobPostingService.submitJobPosting(data);
      
      if (result.success) {
        console.log('🎉 채용 공고가 성공적으로 등록되었습니다!');
        setSubmitted(true);
        reset();
        setShowForm(false);
      }
    } catch (error) {
      console.error('❌ 채용 공고 등록 오류:', error);
      alert('등록 중 오류가 발생했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
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
              구인공고가 등록되었습니다!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              제출해주신 구인공고를 검토한 후, 승인 결과를 이메일로 안내드리겠습니다.
              <br />
              일반적으로 1-2일 내에 처리됩니다.
            </p>
            <div className="bg-sky-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-sky-900 mb-3">다음 단계</h2>
              <ul className="text-sky-800 space-y-2">
                <li>• 관리자가 제출된 구인공고를 검토합니다</li>
                <li>• 승인 후 학생들이 공고를 확인할 수 있습니다</li>
                <li>• 적합한 학생이 있을 때 연락을 받게 됩니다</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.href = '/job-listings'}
              className="btn-primary"
            >
              구인공고 목록 보기
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
            src="/images/기업채용.png"
            alt="기업 채용"
            fill
            sizes="100vw"
            className="object-cover object-center"
            style={{ objectPosition: '50% 20%' }}
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                                      <h1 className="hero-title hero-title-premium mb-4 sm:mb-6">
              학생과 기업을 연결합니다
            </h1>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            구인 게시판
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            고등학생들에게 적합한 일자리를 제공하세요. 
            <br />
            풀타임, 파트타임, 봉사활동 등 다양한 기회를 등록할 수 있습니다.
          </p>
          <p className="text-lg text-sky-600 font-semibold mb-8">
            우수한 캐나다 인재들과 만나는 채용 플랫폼
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="bg-sky-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-sky-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
            >
              <Plus size={24} />
              <span>구인공고 등록</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/job-listings'}
              className="bg-purple-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-purple-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
            >
              <Building size={24} />
              <span>구인공고 확인하러가기</span>
            </button>
          </div>
        </div>
      </section>



      {/* Job Listings Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              📋 실시간 구인공고 확인
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              지금까지 등록된 모든 구인공고를 확인하고 싶으신가요?
              <br />
              <span className="font-bold text-purple-600">구인공고 확인하러가기</span> 버튼을 클릭하여 
              <br />
              <span className="font-bold">등록된 모든 구인공고</span>를 확인해보세요!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-purple-50 rounded-xl p-6">
                <Building size={32} className="text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">실제 데이터</h3>
                <p className="text-gray-600 text-sm">실시간으로 업데이트되는 구인공고</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6">
                <Search size={32} className="text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">스마트 검색</h3>
                <p className="text-gray-600 text-sm">회사명, 직무, 지역별 검색 및 필터링</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6">
                <DollarSign size={32} className="text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">페이지네이션</h3>
                <p className="text-gray-600 text-sm">많은 구인공고도 페이지별로 깔끔하게</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">💡 알려드립니다!</h3>
              <p className="mb-4">
                이 페이지에서 등록한 구인공고는 관리자 승인 후 구인공고 목록에 표시됩니다.
                <br />
                등록하신 구인공고가 목록에서 보이지 않는다면 잠시만 기다려주세요!
              </p>
              <button
                onClick={() => window.location.href = '/job-listings'}
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                🔍 지금 확인하러 가기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Job Posting Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">구인공고 등록</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      구인공고 제목 *
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="예: 카페 아르바이트 구해요"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회사명 *
                    </label>
                    <input
                      type="text"
                      {...register('company')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="예: ABC 카페"
                    />
                    {errors.company && (
                      <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      근무지 *
                    </label>
                    <input
                      type="text"
                      {...register('location')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="예: Fredericton, NB"
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      급여 (선택사항)
                    </label>
                    <input
                      type="text"
                      {...register('salary')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="예: $15.00/hour"
                    />
                  </div>
                </div>

                {/* 상세 정보 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업무 상세 설명 *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="구체적인 업무 내용과 근무 환경을 설명해주세요..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요구사항 *
                  </label>
                  <textarea
                    {...register('requirements')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="필요한 기술, 경험, 자격 등을 입력해주세요..."
                  />
                  {errors.requirements && (
                    <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      근무 형태 *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('jobType')}
                          value="full-time"
                          className="mr-2"
                        />
                        <span>풀타임 (방학 중)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('jobType')}
                          value="part-time"
                          className="mr-2"
                        />
                        <span>파트타임 (주말/방과후)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('jobType')}
                          value="volunteer"
                          className="mr-2"
                        />
                        <span>봉사활동</span>
                      </label>
                    </div>
                    {errors.jobType && (
                      <p className="mt-1 text-sm text-red-600">{errors.jobType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      업종 *
                    </label>
                    <select
                      {...register('industry')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">업종을 선택해주세요</option>
                      <option value="소매/판매">소매/판매</option>
                      <option value="음식/요식업">음식/요식업</option>
                      <option value="고객서비스">고객서비스</option>
                      <option value="교육/과외">교육/과외</option>
                      <option value="사무/관리">사무/관리</option>
                      <option value="건설/제조">건설/제조</option>
                      <option value="헬스케어">헬스케어</option>
                      <option value="IT/기술">IT/기술</option>
                      <option value="엔터테인먼트">엔터테인먼트</option>
                      <option value="운송/배송">운송/배송</option>
                      <option value="청소/관리">청소/관리</option>
                      <option value="기타">기타</option>
                    </select>
                    {errors.industry && (
                      <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                    )}
                  </div>
                </div>

                {/* 연락처 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처 이메일 *
                    </label>
                    <input
                      type="email"
                      {...register('contactEmail')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="contact@company.com"
                    />
                    {errors.contactEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처 전화번호 (선택사항)
                    </label>
                    <input
                      type="tel"
                      {...register('contactPhone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="506-123-4567"
                    />
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
                      <p className="font-medium mb-2">구인공고 등록 약관 동의 *</p>
                      <p>
                        등록된 구인공고는 관리자 검토 후 게시되며, 
                        고등학생에게 적합하지 않은 내용은 승인되지 않을 수 있습니다. 
                        정확한 정보를 제공해주시기 바랍니다.
                      </p>
                    </div>
                  </div>
                  {errors.agreement && (
                    <p className="mt-2 text-sm text-red-600">{errors.agreement.message}</p>
                  )}
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '등록 중...' : '구인공고 등록'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 