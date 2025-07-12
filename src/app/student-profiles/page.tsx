'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  FileText, 
  Star,
  Clock,
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Upload,
  CheckCircle,
  Plus
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobSeekerService } from '@/lib/firebase-services';
import { authService } from '@/lib/auth-service';
import { User as FirebaseUser } from 'firebase/auth';

// 구직 신청 폼 스키마
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

export default function StudentProfilesPage() {
  // 기존 학생 프로필 상태
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  
  // 슬라이드 상태
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 2;
  
  // 구직 신청 상태
  const [showJobSeekerForm, setShowJobSeekerForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 사용자 인증 상태
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 폼 관리
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<JobSeekerForm>({
    resolver: zodResolver(JobSeekerSchema)
  });

  // 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 사용자 인증 상태 확인
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser: FirebaseUser | null) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // 로그인한 사용자만 학생 목록 로드
      if (currentUser) {
        loadApprovedStudents();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadApprovedStudents = async () => {
    try {
      setLoading(true);
      console.log('👨‍🎓 승인된 학생 목록 로드...');
      
      const approvedStudents = await jobSeekerService.getApprovedJobSeekers();
      setStudents(approvedStudents);
      
      console.log('✅ 승인된 학생 목록 로드 완료:', approvedStudents.length, '명');
    } catch (error) {
      console.error('❌ 학생 목록 로드 오류:', error);
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
      
      const result = await jobSeekerService.submitApplication(data, resumeFile || undefined);
      
      if (result.success) {
        console.log('🎉 구직 신청이 성공적으로 제출되었습니다!');
        setSubmitted(true);
        reset();
        setResumeFile(null);
        setShowJobSeekerForm(false);
      }
    } catch (error) {
      console.error('❌ 구직 신청 제출 오류:', error);
      alert('제출 중 오류가 발생했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ko-KR');
    } catch {
      return '';
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    const badges = {
      'full-time': { label: '풀타임', color: 'bg-green-100 text-green-800' },
      'part-time': { label: '파트타임', color: 'bg-blue-100 text-blue-800' },
      'volunteer': { label: '봉사활동', color: 'bg-purple-100 text-purple-800' }
    };
    
    const badge = badges[availability as keyof typeof badges] || { label: availability, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  // 필터링된 학생 목록
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.skills?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
    const matchesAvailability = availabilityFilter === 'all' || student.availability === availabilityFilter;
    
    return matchesSearch && matchesGrade && matchesAvailability;
  });

  // 페이지네이션
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // 학생에게 연락하기
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleContactStudent = (student: any) => {
    const subject = `[구인 문의] ${student.name}님에게 연락드립니다`;
    const body = `안녕하세요 ${student.name}님,

저희 회사에서 ${student.name}님의 프로필을 확인하고 연락드립니다.

학년: ${student.grade}학년
학교: ${student.school}
기술/경험: ${student.skills}

추가 문의사항이나 면접 일정 등에 대해 논의하고 싶습니다.

감사합니다.`;

    const mailtoLink = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  // 이력서 다운로드
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDownloadResume = async (student: any) => {
    try {
      if (!student.resumeUrl) {
        alert('이력서 파일이 없습니다.');
        return;
      }

      // Firebase Storage URL인 경우 직접 다운로드
      if (student.resumeUrl.includes('firebase') || student.resumeUrl.startsWith('http')) {
        const link = document.createElement('a');
        link.href = student.resumeUrl;
        link.download = student.resumeFileName || `${student.name}_이력서.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // 파일명만 있는 경우 (업로드 대기중)
        alert(`${student.resumeFileName} 파일이 아직 업로드 처리 중입니다. 나중에 다시 시도해주세요.`);
      }
    } catch (error) {
      console.error('이력서 다운로드 오류:', error);
      alert('이력서 다운로드 중 오류가 발생했습니다.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 상태를 확인하는 중입니다...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 네비게이션은 여전히 표시 */}
        <div className="absolute inset-x-0 top-0 z-50">
          <Navigation />
        </div>
        
        {/* 로그인 요구 메시지 */}
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <User size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">
              학생 프로필을 보시려면 로그인이 필요합니다.<br/>
              상단의 로그인 버튼을 클릭해주세요.
            </p>
            <div className="bg-sky-50 rounded-lg p-4">
              <p className="text-sky-700 text-sm">
                💡 이 기능은 채용 담당자를 위한 서비스입니다
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 풀스크린 히어로 섹션 */}
      <section className="relative h-screen overflow-hidden">
        {/* 네비게이션 오버레이 */}
        <div className="absolute inset-x-0 top-0 z-50">
          <Navigation />
        </div>
        
        {/* 슬라이드 컨테이너 */}
        <div className="relative h-full">
          {/* 첫 번째 슬라이드 */}
          <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
            currentSlide === 0 ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="relative h-full">
              <Image
                src="/images/학생구직.png"
                alt="학생 구직"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              
              {/* 콘텐츠 */}
              <div className="absolute inset-0 flex items-end pb-24">
                <div className="container mx-auto px-6 text-center">
                  <h1 className="hero-title hero-title-default mb-4 sm:mb-6">
                    가능성과 열정을 가진 인재들의 이야기를 담았습니다
                  </h1>
                  
                  {/* 두 개의 버튼 카드 */}
                  <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                    {/* 학생 프로필 둘러보기 버튼 */}
                    <button
                      onClick={() => {
                        const profileSection = document.getElementById('student-profiles');
                        profileSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="group bg-white/90 backdrop-blur-sm text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3 border-2 border-transparent hover:border-orange-400"
                    >
                      <Eye size={24} className="group-hover:text-orange-500 transition-colors" />
                      <span>학생 프로필 둘러보기 👀</span>
                    </button>

                    {/* 구직 신청하기 버튼 */}
                    <button
                      onClick={() => setShowJobSeekerForm(true)}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3"
                    >
                      <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                      <span>구직 신청하기 📝</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 두 번째 슬라이드 */}
          <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
            currentSlide === 1 ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="relative h-full">
              <Image
                src="/images/학생프로필.png"
                alt="학생 프로필"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              
              {/* 콘텐츠 */}
              <div className="absolute inset-0 flex items-end pb-24">
                <div className="container mx-auto px-6 text-center">
                  <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
                    당신의 꿈을
                    <span className="block bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                      현실로 만들어요
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
                    레쥬메를 업로드하고 기본 정보를 입력하세요.<br/>
                    기업들이 여러분의 재능을 발견할 수 있도록 도와드립니다!
                  </p>
                  
                  {/* 두 개의 버튼 카드 */}
                  <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                    {/* 학생 프로필 둘러보기 버튼 */}
                    <button
                      onClick={() => {
                        const profileSection = document.getElementById('student-profiles');
                        profileSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="group bg-white/90 backdrop-blur-sm text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3 border-2 border-transparent hover:border-sky-400"
                    >
                      <Eye size={24} className="group-hover:text-sky-500 transition-colors" />
                      <span>학생 프로필 둘러보기 👀</span>
                    </button>

                    {/* 구직 신청하기 버튼 */}
                    <button
                      onClick={() => setShowJobSeekerForm(true)}
                      className="group bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3"
                    >
                      <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                      <span>구직 신청하기 📋</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 슬라이드 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-40">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? 'bg-white shadow-lg scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          {/* 네비게이션 화살표 */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 z-40"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 z-40"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      {/* 학생 프로필 섹션 */}
      <section id="student-profiles" className="py-20">
        <div className="container mx-auto px-6">
          {/* 헤더 */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              승인된 <span className="text-sky-500">학생 프로필</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              관리자의 검토를 통과한 우수한 학생들의 프로필입니다. 
              각 학생의 정보를 확인하고 연락해보세요!
            </p>
          </div>

          {/* 통계 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-sky-500 mb-2">{students.length}</div>
              <div className="text-gray-600">총 학생 수</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">{filteredStudents.length}</div>
              <div className="text-gray-600">검색 결과</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">{totalPages}</div>
              <div className="text-gray-600">총 페이지</div>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색창 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="이름, 학교, 기술로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* 필터 */}
              <div className="flex gap-4">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="all">모든 학년</option>
                  <option value="9">9학년</option>
                  <option value="10">10학년</option>
                  <option value="11">11학년</option>
                  <option value="12">12학년</option>
                </select>

                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="all">모든 근무형태</option>
                  <option value="full-time">풀타임</option>
                  <option value="part-time">파트타임</option>
                  <option value="volunteer">봉사활동</option>
                </select>
              </div>

              {/* 구직 신청 버튼 */}
              <button
                onClick={() => setShowJobSeekerForm(true)}
                className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center space-x-2 whitespace-nowrap"
              >
                <Plus size={20} />
                <span>구직 신청하기</span>
              </button>
            </div>
          </div>

          {/* 학생 목록 */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
              <p className="text-gray-600">학생 목록을 불러오는 중...</p>
            </div>
          ) : currentStudents.length === 0 ? (
            <div className="text-center py-20">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {students.length === 0 ? '등록된 학생이 없습니다' : '검색 결과가 없습니다'}
              </h3>
              <p className="text-gray-500">
                {students.length === 0 
                  ? '첫 번째 학생이 되어보세요!' 
                  : '다른 검색어나 필터를 시도해보세요.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* 학생 카드 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {currentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-2"
                  >
                    <div className="p-6">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center">
                            <User size={24} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-500">{student.grade}학년</p>
                          </div>
                        </div>
                        {getAvailabilityBadge(student.availability)}
                      </div>

                      {/* 정보 */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <School size={16} />
                          <span className="text-sm">{student.school}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail size={16} />
                          <span className="text-sm">{student.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone size={16} />
                          <span className="text-sm">{student.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock size={16} />
                          <span className="text-sm">신청일: {formatDate(student.createdAt)}</span>
                        </div>
                      </div>

                      {/* 기술/경험 */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Star size={16} className="mr-1" />
                          기술 & 경험
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{student.skills}</p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleContactStudent(student)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                        >
                          <Mail size={16} />
                          <span>연락하기</span>
                        </button>
                        {student.resumeUrl && (
                          <button 
                            onClick={() => handleDownloadResume(student)}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="이력서 다운로드"
                          >
                            <Download size={16} className="text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === pageNumber
                            ? 'bg-sky-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 구직 신청 폼 모달 */}
      {showJobSeekerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">구직 신청</h2>
                <button
                  onClick={() => setShowJobSeekerForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 기본 정보 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="mt-4">
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
                  <h3 className="text-lg font-bold text-gray-900 mb-4">레쥬메 업로드</h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
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
                  <h3 className="text-lg font-bold text-gray-900 mb-4">기술 및 경험</h3>
                  
                  <div className="mb-4">
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

                  <div>
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
                        <span>파트타임 (학기 중)</span>
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
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('agreement')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      개인정보 수집 및 이용에 동의합니다 *
                    </span>
                  </label>
                  {errors.agreement && (
                    <p className="mt-1 text-sm text-red-600">{errors.agreement.message}</p>
                  )}
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowJobSeekerForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>제출 중...</span>
                      </>
                    ) : (
                      <span>신청서 제출</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {submitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">신청 완료!</h3>
              <p className="text-gray-600 mb-6">
                구직 신청이 성공적으로 제출되었습니다. 
                관리자 검토 후 승인되면 프로필이 공개됩니다.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 