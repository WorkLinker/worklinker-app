'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  User, 
  Activity, 
  Briefcase, 
  MessageSquare, 
  Mail, 
  Calendar,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Eye,
  ArrowLeft,
  Camera
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { authService } from '@/lib/auth-service';
import { myPageService } from '@/lib/firebase-services';
import { User as FirebaseUser } from 'firebase/auth';

export default function MyPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activities, setActivities] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 기존에 저장된 프로필 이미지 로드
        const savedImage = localStorage.getItem(`profileImage_${currentUser.email}`);
        if (savedImage) {
          setProfileImage(savedImage);
        }
        
        try {
          const userActivities = await myPageService.getUserActivities(currentUser.email!);
          const userStats = await myPageService.getUserStats(currentUser.email!);
          setActivities(userActivities);
          setStats(userStats);
        } catch (error) {
          console.error('활동 내역 로드 오류:', error);
        }
      } else {
        // 로그인하지 않은 경우 홈으로 리다이렉트
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (approved: boolean) => {
    return approved ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle size={12} className="mr-1" />
        승인됨
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock size={12} className="mr-1" />
        검토 중
      </span>
    );
  };

  // 프로필 이미지 업로드 핸들러
  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);

    // 파일을 base64로 변환하여 미리보기
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfileImage(result);
      setIsUploading(false);
      
      // localStorage에 프로필 이미지 저장 (사용자별로)
      if (user?.email) {
        localStorage.setItem(`profileImage_${user.email}`, result);
        
        // Navigation 컴포넌트에 변경사항 알리기 (커스텀 이벤트)
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: {
            userEmail: user.email,
            imageData: result
          }
        }));
        
        console.log('프로필 이미지 업로드 및 저장 완료');
      }
    };
    reader.readAsDataURL(file);
  };

  // 프로필 이미지 제거
  const handleRemoveProfileImage = () => {
    setProfileImage(null);
    
    // localStorage에서도 제거
    if (user?.email) {
      localStorage.removeItem(`profileImage_${user.email}`);
      
      // Navigation 컴포넌트에 변경사항 알리기
      window.dispatchEvent(new CustomEvent('profileImageUpdated', {
        detail: {
          userEmail: user.email,
          imageData: null
        }
      }));
      
      console.log('프로필 이미지 제거됨');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">마이페이지를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-4">로그인이 필요합니다.</p>
            <button 
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              홈으로 돌아가기
            </button>
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
          {/* 헤더 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                이전으로
              </button>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* 프로필 이미지 업로드 섹션 */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center relative">
                  {profileImage ? (
                    <Image 
                      src={profileImage} 
                      alt="프로필 이미지" 
                      className="w-full h-full object-cover"
                      fill
                    />
                  ) : (
                    <User size={48} className="text-white" />
                  )}
                  
                  {/* 업로드 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <Camera size={24} className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 파일 입력 (숨김) */}
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                
                {/* 업로드 버튼 */}
                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors duration-200 group-hover:scale-110"
                >
                  <Camera size={16} />
                </label>
                
                {/* 이미지 제거 버튼 (이미지가 있을 때만 표시) */}
                {profileImage && (
                  <button
                    onClick={handleRemoveProfileImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.displayName || user.email?.split('@')[0]}님의 마이페이지
                </h1>
                <p className="text-lg text-gray-600 mb-4">{user.email}</p>
                <div className="flex items-center space-x-4 mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-800">
                    <Activity size={16} className="mr-1" />
                    총 {stats?.totalActivities || 0}개 활동
                  </span>
                  <span className="text-sm text-gray-500">
                    회원가입일: {formatDate(user.metadata?.creationTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center">
                  <Camera size={14} className="mr-1" />
                  프로필 사진에 마우스를 올려 업로드하세요
                </p>
              </div>
            </div>
          </div>

          {/* 활동 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">구직 신청</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                </div>
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                  <User size={24} className="text-sky-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">채용 공고</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalJobPostings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Briefcase size={24} className="text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">게시글</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalPosts || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare size={24} className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">추천서</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalReferences || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award size={24} className="text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">문의사항</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalContacts || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Mail size={24} className="text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">이벤트 참가</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalEventRegistrations || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calendar size={24} className="text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'overview', name: '전체 활동', icon: BarChart3 },
                  { id: 'applications', name: '구직 신청', icon: User },
                  { id: 'posts', name: '게시글', icon: MessageSquare },
                  { id: 'contacts', name: '문의사항', icon: Mail }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-sky-500 text-sky-600 bg-sky-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={18} className="mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* 전체 활동 탭 */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">최근 활동 내역</h3>
                  
                  {/* 최근 활동들을 시간순으로 정렬해서 표시 */}
                  <div className="space-y-4">
                    {activities && Object.entries(activities).some(([, items]: [string, any]) => items.length > 0) ? ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      // 모든 활동을 하나의 배열로 합치고 시간순 정렬
                      [
                        ...activities.jobApplications.map((item: any) => ({ ...item, type: 'job-application', typeName: '구직 신청' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.jobPostings.map((item: any) => ({ ...item, type: 'job-posting', typeName: '채용 공고' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.references.map((item: any) => ({ ...item, type: 'reference', typeName: '추천서' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.contacts.map((item: any) => ({ ...item, type: 'contact', typeName: '문의사항' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.posts.map((item: any) => ({ ...item, type: 'post', typeName: '게시글' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.eventRegistrations.map((item: any) => ({ ...item, type: 'event', typeName: '이벤트 참가' })) // eslint-disable-line @typescript-eslint/no-explicit-any
                      ]
                        .sort((a, b) => {
                          const dateA = a.createdAt?.toDate?.() || a.registeredAt?.toDate?.() || new Date(a.createdAt || a.registeredAt);
                          const dateB = b.createdAt?.toDate?.() || b.registeredAt?.toDate?.() || new Date(b.createdAt || b.registeredAt);
                          return dateB.getTime() - dateA.getTime();
                        })
                        .slice(0, 10) // 최근 10개만 표시
                        .map((activity, index) => (
                          <div key={`${activity.type}-${index}`} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  activity.type === 'job-application' ? 'bg-sky-100' :
                                  activity.type === 'job-posting' ? 'bg-purple-100' :
                                  activity.type === 'reference' ? 'bg-orange-100' :
                                  activity.type === 'contact' ? 'bg-red-100' :
                                  activity.type === 'post' ? 'bg-green-100' :
                                  'bg-indigo-100'
                                }`}>
                                  {activity.type === 'job-application' && <User size={16} className="text-sky-600" />}
                                  {activity.type === 'job-posting' && <Briefcase size={16} className="text-purple-600" />}
                                  {activity.type === 'reference' && <Award size={16} className="text-orange-600" />}
                                  {activity.type === 'contact' && <Mail size={16} className="text-red-600" />}
                                  {activity.type === 'post' && <MessageSquare size={16} className="text-green-600" />}
                                  {activity.type === 'event' && <Calendar size={16} className="text-indigo-600" />}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {activity.typeName}: {activity.title || activity.name || activity.subject || activity.eventTitle || '제목 없음'}
                                  </p>
                                  <p className="text-sm text-gray-500">{formatDate(activity.createdAt || activity.registeredAt)}</p>
                                </div>
                              </div>
                              {activity.approved !== undefined && getStatusBadge(activity.approved)}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <Activity size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-lg text-gray-500">아직 활동 내역이 없습니다.</p>
                        <p className="text-gray-400">다양한 기능을 이용해보세요!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 구직 신청 탭 */}
              {activeTab === 'applications' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">구직 신청 내역</h3>
                  {activities?.jobApplications?.length > 0 ? (
                    <div className="space-y-4">
                      {activities.jobApplications.map((app: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">{app.name}</h4>
                            {getStatusBadge(app.approved)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <p><span className="font-medium">학교:</span> {app.school}</p>
                            <p><span className="font-medium">학년:</span> {app.grade}</p>
                            <p><span className="font-medium">기술/경험:</span> {app.skills}</p>
                            <p><span className="font-medium">지원일:</span> {formatDate(app.createdAt)}</p>
                            {app.resumeFileName && (
                              <p><span className="font-medium">첨부파일:</span> {app.resumeFileName}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <User size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-lg text-gray-500">구직 신청 내역이 없습니다.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 게시글 탭 */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">작성한 게시글</h3>
                  {activities?.posts?.length > 0 ? (
                    <div className="space-y-4">
                      {activities.posts.map((post: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{post.title}</h4>
                            <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                          </div>
                          <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="inline-flex items-center">
                              <Eye size={16} className="mr-1" />
                              조회 {post.views || 0}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full">
                              {post.category === 'general' ? '일반' :
                               post.category === 'job' ? '취업' :
                               post.category === 'study' ? '학습' :
                               post.category === 'life' ? '일상' : post.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-lg text-gray-500">작성한 게시글이 없습니다.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 문의사항 탭 */}
              {activeTab === 'contacts' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">문의사항 내역</h3>
                  {activities?.contacts?.length > 0 ? (
                    <div className="space-y-4">
                      {activities.contacts.map((contact: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{contact.subject}</h4>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                contact.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {contact.resolved ? '답변 완료' : '답변 대기'}
                              </span>
                              <span className="text-sm text-gray-500">{formatDate(contact.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-4">{contact.message}</p>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">분류:</span> {
                              contact.category === 'general' ? '일반 문의' :
                              contact.category === 'technical' ? '기술 문제' :
                              contact.category === 'job-seeker' ? '구직자 문의' :
                              contact.category === 'employer' ? '기업/고용주 문의' :
                              contact.category === 'event' ? '이벤트 문의' : contact.category
                            }
                            {contact.urgent && (
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">긴급</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Mail size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-lg text-gray-500">문의사항이 없습니다.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 