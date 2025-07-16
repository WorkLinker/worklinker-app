'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  DollarSign,
  Users,
  Calendar,
  Mail,
  Phone,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobPostingService, jobApplicationService } from '@/lib/firebase-services';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [user] = useAuthState(auth);
  
  const [jobPosting, setJobPosting] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadJobPostingAndApplications();
    }
  }, [user, jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobPostingAndApplications = async () => {
    try {
      setLoading(true);
      
      // 구인공고 정보 로드
      const jobs = await jobPostingService.getApprovedJobPostings();
      const job = jobs.find(j => j.id === jobId);
      
      if (!job) {
        router.push('/job-listings');
        return;
      }
      
      setJobPosting(job);
      
      // 지원자 목록 로드
      const applicantList = await jobApplicationService.getApplicationsByJobPosting(jobId);
      setApplications(applicantList);
      
      console.log('✅ 구인공고 및 지원자 정보 로드 완료');
    } catch (error) {
      console.error('❌ 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    setUpdating(applicationId);
    
    try {
      await jobApplicationService.updateApplicationStatus(applicationId, newStatus, notes);
      
      // 로컬 상태 업데이트
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus, statusNotes: notes || '' }
            : app
        )
      );
      
      console.log('✅ 지원 상태 업데이트 완료');
    } catch (error) {
      console.error('❌ 상태 업데이트 오류:', error);
      alert('상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'reviewed': return 'Reviewed';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (timestamp: any) => {
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

  // 필터링된 지원자
  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="pt-20 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                로그인이 필요합니다
              </h2>
              <p className="text-gray-600 mb-6">
                지원자 목록을 확인하려면 로그인해주세요.
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
            <p className="text-lg text-gray-600">지원자 목록을 불러오는 중...</p>
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
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft size={18} className="mr-2" />
              이전으로
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              📋 지원자 목록 관리
            </h1>
            
            {/* 구인공고 정보 */}
            {jobPosting && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-purple-900 mb-2">
                  {jobPosting.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-purple-700 mb-3">
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
                  <div className="flex items-center">
                    <Eye size={14} className="mr-1" />
                    <span>조회 {jobPosting.views || 0}</span>
                  </div>
                  <div className="flex items-center text-purple-800 font-medium">
                    <Users size={14} className="mr-1" />
                    <span>지원자 {applications.length}명</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Filter size={20} className="text-gray-600" />
                <span className="font-medium text-gray-700">상태별 필터:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="all">All ({applications.length})</option>
                  <option value="pending">Pending Review ({applications.filter(a => a.status === 'pending').length})</option>
                  <option value="reviewed">Reviewed ({applications.filter(a => a.status === 'reviewed').length})</option>
                  <option value="accepted">Accepted ({applications.filter(a => a.status === 'accepted').length})</option>
                  <option value="rejected">Rejected ({applications.filter(a => a.status === 'rejected').length})</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                총 {filteredApplications.length}명의 지원자
              </div>
            </div>
          </div>

          {/* 지원자 목록 */}
          {filteredApplications.length > 0 ? (
            <div className="space-y-4">
              {filteredApplications.map((application, index) => (
                <div key={application.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                        <span className="text-gray-400 text-sm">#{index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <Mail size={14} className="mr-2" />
                          <span className="text-sm">{application.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone size={14} className="mr-2" />
                          <span className="text-sm">{application.phone}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Building size={14} className="mr-2" />
                          <span className="text-sm">{application.school} ({application.grade}학년)</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 mb-4">
                        <Calendar size={12} className="inline mr-1" />
                        지원일: {formatDate(application.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* 상세 정보 */}
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">경험 및 기술</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">{application.experience}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">지원동기</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">{application.motivation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">근무 가능 시간</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">{application.availability}</p>
                    </div>

                    {application.questions && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">궁금한 점/추가 메시지</h4>
                        <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded">{application.questions}</p>
                      </div>
                    )}

                    {application.resumeFileName && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">첨부 파일</h4>
                        <div className="flex items-center bg-gray-50 p-3 rounded">
                          <FileText size={16} className="text-gray-600 mr-2" />
                          <span className="text-sm text-gray-700">{application.resumeFileName}</span>
                          {application.resumeSize && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({(application.resumeSize / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex flex-wrap gap-2">
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'reviewed')}
                            disabled={updating === application.id}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            {updating === application.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Eye size={12} className="inline mr-1" />
                                Mark as Reviewed
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'accepted')}
                            disabled={updating === application.id}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} className="inline mr-1" />
                            합격
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={updating === application.id}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} className="inline mr-1" />
                            불합격
                          </button>
                        </>
                      )}

                      {application.status === 'reviewed' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'accepted')}
                            disabled={updating === application.id}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} className="inline mr-1" />
                            합격
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={updating === application.id}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} className="inline mr-1" />
                            불합격
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          const mailtoLink = `mailto:${application.email}?subject=${encodeURIComponent(`[${jobPosting?.title}] 지원 관련 연락`)}&body=${encodeURIComponent(`안녕하세요 ${application.name}님,\n\n"${jobPosting?.title}" 지원과 관련하여 연락드립니다.\n\n감사합니다.`)}`;
                          window.open(mailtoLink);
                        }}
                        className="px-3 py-1 border border-purple-500 text-purple-600 rounded text-sm hover:bg-purple-50 transition-colors"
                      >
                        <Mail size={12} className="inline mr-1" />
                        이메일 보내기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Users size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' ? '지원자가 없습니다' : '해당 상태의 지원자가 없습니다'}
              </h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? '아직 이 구인공고에 지원한 사람이 없습니다.' 
                  : '다른 상태 필터를 선택해보세요.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
} 