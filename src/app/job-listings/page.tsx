'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Search, 
  Filter, 
  Calendar,
  Users,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  ChevronDown
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobPostingService } from '@/lib/firebase-services';

export default function JobListingsPage() {
  const [jobPostings, setJobPostings] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 페이지당 6개씩
  const [pageInput, setPageInput] = useState('');
  const router = useRouter();

  // 업종 목록 정의
  const industries = [
    '전체',
    '소매/판매',
    '음식/요식업',
    '고객서비스',
    '교육/과외',
    '사무/관리',
    '건설/제조',
    '헬스케어',
    'IT/기술',
    '엔터테인먼트',
    '운송/배송',
    '청소/관리',
    '기타'
  ];

  // 컴포넌트 마운트 시 구인공고 데이터 로드
  useEffect(() => {
    loadJobPostings();
  }, []);

  const loadJobPostings = async () => {
    try {
      setLoading(true);
      console.log('🔍 구인공고 목록 로드 시작...');
      
      // Firebase에서 승인된 구인공고 가져오기
      const posts = await jobPostingService.getApprovedJobPostings();
      setJobPostings(posts);
      
      console.log('✅ 구인공고 목록 로드 완료:', posts.length, '개');
    } catch (error) {
      console.error('❌ 구인공고 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링된 구인공고
  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = jobTypeFilter === 'all' || job.jobType === jobTypeFilter;
    
    const matchesIndustry = industryFilter === 'all' || 
                          industryFilter === '전체' || 
                          job.industry === industryFilter ||
                          (!job.industry && industryFilter === '기타');
    
    return matchesSearch && matchesType && matchesIndustry;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

  // 고급 페이지네이션 로직
  const pagesPerGroup = 10; // 한 그룹당 10페이지
  const currentGroup = Math.ceil(currentPage / pagesPerGroup);
  const startPage = (currentGroup - 1) * pagesPerGroup + 1;
  const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
  const totalGroups = Math.ceil(totalPages / pagesPerGroup);

  // 페이지 그룹 내 페이지 번호들
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  // 페이지 이동 함수들
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousGroup = () => {
    if (currentGroup > 1) {
      setCurrentPage(startPage - pagesPerGroup);
    }
  };

  const goToNextGroup = () => {
    if (currentGroup < totalGroups) {
      setCurrentPage(startPage + pagesPerGroup);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput('');
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return '풀타임';
      case 'part-time': return '파트타임';
      case 'volunteer': return '봉사활동';
      default: return type;
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-blue-100 text-blue-800';
      case 'volunteer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!timestamp) return '날짜 정보 없음';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  return (
    <div className="min-h-screen bg-custom-blue">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 간소화된 헤더 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2" />
                이전으로
              </button>
              <div className="flex items-center bg-purple-100 rounded-full px-4 py-1">
                <Building size={16} className="mr-2 text-purple-600" />
                <span className="text-purple-600 font-medium text-sm">
                  총 {filteredJobs.length}개
                </span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🏢 구인공고 목록
            </h1>
            <p className="text-gray-600">
              뉴브런즈윅 지역의 다양한 구인 기회를 확인해보세요
            </p>
          </div>

          {/* 검색 및 필터 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="회사명, 직무, 지역으로 검색..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => {
                      setJobTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white min-w-[140px]"
                  >
                    <option value="all">모든 근무형태</option>
                    <option value="full-time">풀타임</option>
                    <option value="part-time">파트타임</option>
                    <option value="volunteer">봉사활동</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={industryFilter}
                    onChange={(e) => {
                      setIndustryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white min-w-[140px]"
                  >
                    {industries.map((industry) => (
                      <option key={industry} value={industry === '전체' ? 'all' : industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-4 text-gray-400 pointer-events-none" />
                </div>
                
                <button
                  onClick={loadJobPostings}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <Filter size={18} />
                  <span>새로고침</span>
                </button>
              </div>
            </div>
          </div>

          {/* 구인공고 목록 */}
          {currentJobs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {currentJobs.map((job, index) => (
                <div key={job.id || index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.jobType)}`}>
                          {getJobTypeLabel(job.jobType)}
                        </span>
                        {job.industry && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {job.industry}
                          </span>
                        )}
                        <span className="text-gray-400 text-xs">#{job.id?.slice(-6) || index}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {job.title}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building size={14} className="mr-2" />
                        <span className="font-medium">{job.company}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin size={14} className="mr-2" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                      {job.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          <span>{formatDate(job.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <Eye size={12} className="mr-1" />
                          <span>조회 {job.views || 0}</span>
                        </div>
                        <div className="flex items-center text-purple-600 font-medium">
                          <Users size={12} className="mr-1" />
                          <span>지원자 {job.applications || 0}명</span>
                        </div>
                      </div>
                      {job.salary && (
                        <div className="flex items-center text-green-600 font-medium">
                          <DollarSign size={12} className="mr-1" />
                          <span className="text-xs">{job.salary}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">요구사항:</span>
                        <p className="text-gray-600 mt-1 line-clamp-2">{job.requirements}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                          <div className="flex items-center mb-1">
                            <Mail size={12} className="mr-2" />
                            <span className="truncate max-w-[150px]">{job.contactEmail}</span>
                          </div>
                          {job.contactPhone && (
                            <div className="flex items-center">
                              <Phone size={12} className="mr-2" />
                              <span>{job.contactPhone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              router.push(`/job-listings/${job.id}/apply`);
                            }}
                            className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-xs font-medium"
                          >
                            지원하러 가기
                          </button>
                          <button 
                            onClick={() => {
                              router.push(`/job-listings/${job.id}/applicants`);
                            }}
                            className="px-3 py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-xs font-medium"
                          >
                            지원자 관리
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Building size={64} className="text-gray-300 mx-auto mb-4" />
              {jobPostings.length === 0 ? (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    등록된 구인공고가 없습니다
                  </h3>
                  <p className="text-gray-600 mb-6">
                    아직 등록된 구인공고가 없습니다. 새로운 구인공고를 기다려주세요!
                  </p>
                  <button
                    onClick={() => router.push('/job-postings')}
                    className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    구인공고 등록하러 가기
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-600 mb-6">
                    다른 검색어나 필터를 시도해보세요.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setJobTypeFilter('all');
                      setIndustryFilter('all');
                      setCurrentPage(1);
                    }}
                    className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    필터 초기화
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 고급 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  총 {filteredJobs.length}개 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredJobs.length)}개 표시
                  <span className="ml-2 text-purple-600 font-medium">
                    (페이지 {currentPage} / {totalPages})
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* 페이지 직접 이동 */}
                  <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">페이지 이동:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      placeholder={`1-${totalPages}`}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                    >
                      이동
                    </button>
                  </form>

                  {/* 페이지네이션 컨트롤 */}
                  <div className="flex items-center space-x-1">
                    {/* 맨 처음으로 */}
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ≪
                    </button>

                    {/* 이전 그룹 */}
                    <button
                      onClick={goToPreviousGroup}
                      disabled={currentGroup === 1}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ‹
                    </button>
                    
                    {/* 페이지 번호들 */}
                    <div className="flex space-x-1">
                      {pageNumbers.map(page => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors min-w-[40px] text-sm ${
                            currentPage === page
                              ? 'bg-purple-500 text-white shadow-md'
                              : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {/* 다음 그룹 */}
                    <button
                      onClick={goToNextGroup}
                      disabled={currentGroup === totalGroups}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ›
                    </button>
                    
                    {/* 맨 끝으로 */}
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ≫
                    </button>
                  </div>
                </div>
              </div>

              {/* 그룹 정보 표시 */}
              {totalGroups > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <span>페이지 그룹: {currentGroup} / {totalGroups}</span>
                    <span>•</span>
                    <span>현재 그룹: {startPage}-{endPage} 페이지</span>
                    {totalPages > 999 && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600 font-medium">최대 999페이지까지 지원</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
} 