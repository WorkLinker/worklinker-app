'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Users, ChevronRight, UserPlus, CheckCircle, ChevronLeft, Plus, Building } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { eventService } from '@/lib/firebase-services';
import { authService } from '@/lib/auth-service';
// import { User as SupabaseUser } from '@supabase/supabase-js';

export default function EventsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // 관리자 이벤트 등록 폼 데이터
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'workshop',
    maxParticipants: 30,
    organizer: '',
    agenda: [''],
    benefits: [''],
    requirements: ['']
  });

  // 날짜 드롭다운용 상태
  const [dateForm, setDateForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });

  // 페이지네이션 관련 계산
  const totalPages = Math.ceil(events.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEvents = events.slice(startIndex, startIndex + itemsPerPage);

  // 사용자 정보 및 이벤트 실시간 구독
  useEffect(() => {
    const unsubscribeAuth = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });

    // 실시간 이벤트 구독
    const unsubscribeEvents = eventService.subscribeToEvents((eventsData) => {
      setEvents(eventsData);
      setLoading(false);
      console.log('🔄 실시간 이벤트 업데이트:', eventsData.length, '개');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
    };
  }, []);

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'job-fair': return '취업설명회';
      case 'workshop': return '워크숍';
      case 'seminar': return '세미나';
      case 'competition': return '경진대회';
      case 'experience': return '체험프로그램';
      default: return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'job-fair': return 'bg-sky-100 text-sky-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      case 'seminar': return 'bg-purple-100 text-purple-800';
      case 'competition': return 'bg-orange-100 text-orange-800';
      case 'experience': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRegistration = async (eventId: string) => {
    if (!user) {
      alert('이벤트 참가를 위해 로그인이 필요합니다.');
      return;
    }

    setIsRegistering(true);
    
    try {
      console.log('🎉 이벤트 참가 신청 시작...', eventId);
      
      const participantData = {
        name: user.displayName || user.email?.split('@')[0] || '참가자',
        email: user.email || '',
        phone: '010-0000-0000', // 실제로는 폼에서 입력받아야 함
        school: '학교 정보', // 실제로는 폼에서 입력받아야 함
        grade: '학년 정보', // 실제로는 폼에서 입력받아야 함
        eventTitle: selectedEvent?.title || '이벤트'
      };
      
      const result = await eventService.registerForEvent(eventId, participantData);
      
      if (result.success) {
        console.log('✅ 이벤트 참가 신청이 성공적으로 완료되었습니다!');
        setRegistrationSuccess(true);
        setSelectedEvent(null);
      }
    } catch (error: unknown) {
      console.error('❌ 이벤트 등록 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '등록 중 오류가 발생했습니다. 다시 시도해주세요.';
      alert(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAdminEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !eventService.isAdmin(user.email || '')) {
      alert('관리자 권한이 필요합니다.');
      return;
    }

    try {
      setIsRegistering(true);
      
      const eventData = {
        ...eventForm,
        agenda: eventForm.agenda.filter(item => item.trim() !== ''),
        benefits: eventForm.benefits.filter(item => item.trim() !== ''),
        requirements: eventForm.requirements.filter(item => item.trim() !== '')
      };

      const result = await eventService.createEvent(eventData, user.email || '');
      
      if (result.success) {
        alert('이벤트가 성공적으로 등록되었습니다!');
        setShowAdminForm(false);
        // 폼 초기화
        setEventForm({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          type: 'workshop',
          maxParticipants: 30,
          organizer: '',
          agenda: [''],
          benefits: [''],
          requirements: ['']
        });
        // 날짜 드롭다운도 초기화
        setDateForm({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate()
        });
      }
    } catch (error: unknown) {
      console.error('❌ 관리자 이벤트 등록 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '이벤트 등록 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };



  // const addFormField = (fieldName: 'agenda' | 'benefits' | 'requirements') => {
  //   setEventForm(prev => ({
  //     ...prev,
  //     [fieldName]: [...prev[fieldName], '']
  //   }));
  // };

  // const updateFormField = (fieldName: 'agenda' | 'benefits' | 'requirements', index: number, value: string) => {
  //   setEventForm(prev => ({
  //     ...prev,
  //     [fieldName]: prev[fieldName].map((item, i) => i === index ? value : item)
  //   }));
  // };

  // 날짜 드롭다운 관련 함수들
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const generateDays = () => {
    const daysInMonth = new Date(dateForm.year, dateForm.month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const handleDateChange = (field: 'year' | 'month' | 'day', value: number) => {
    const newDateForm = { ...dateForm, [field]: value };
    
    // 날이 해당 월의 최대 일수를 초과하는 경우 조정
    if (field === 'year' || field === 'month') {
      const daysInMonth = new Date(newDateForm.year, newDateForm.month, 0).getDate();
      if (newDateForm.day > daysInMonth) {
        newDateForm.day = daysInMonth;
      }
    }
    
    setDateForm(newDateForm);
    
    // eventForm의 date도 업데이트
    const formattedDate = `${newDateForm.year}-${String(newDateForm.month).padStart(2, '0')}-${String(newDateForm.day).padStart(2, '0')}`;
    setEventForm(prev => ({ ...prev, date: formattedDate }));
  };

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const formatDate = (timestamp: any) => {
  //   if (!timestamp) return '날짜 정보 없음';
  //   
  //   // Firebase Timestamp 또는 일반 날짜 문자열 처리
  //   let date;
  //   if (timestamp.toDate) {
  //     date = timestamp.toDate();
  //   } else if (timestamp instanceof Date) {
  //     date = timestamp;
  //   } else {
  //     date = new Date(timestamp);
  //   }
  //   
  //   return date.toLocaleDateString('ko-KR', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric'
  //   });
  // };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              이벤트 등록이 완료되었습니다!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              등록 확인 이메일이 발송되었습니다. 
              <br />
              이벤트 전에 추가 안내사항을 받으실 수 있습니다.
            </p>
            <div className="bg-sky-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-sky-900 mb-3">다음 단계</h2>
              <ul className="text-sky-800 space-y-2">
                <li>• 이벤트 전날 리마인더 이메일 발송</li>
                <li>• 필요한 준비물 및 주의사항 안내</li>
                <li>• 이벤트 참석 및 네트워킹 기회 활용</li>
              </ul>
            </div>
            <button
              onClick={() => setRegistrationSuccess(false)}
              className="btn-primary"
            >
              다른 이벤트 보기
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
            src="/images/5번.jpg"
            alt="교육 이벤트"
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
              특별한 학생 이벤트가 열립니다
            </h1>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            이벤트 & 교육
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            미래를 준비하는 다양한 교육 프로그램과 취업설명회에 참여하세요.
            <br />
            실무 중심의 워크숍과 네트워킹 기회를 제공합니다.
          </p>
          <p className="text-lg text-orange-600 font-semibold mb-8">
            취업설명회, 면접 스킬 워크숍, 진로 세미나 등 다양한 이벤트
          </p>

          {/* 관리자 이벤트 등록 버튼 */}
          {user && eventService.isAdmin(user.email || '') && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <button
                onClick={() => setShowAdminForm(true)}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
              >
                <Plus size={20} />
                <span>관리자: 이벤트 등록</span>
              </button>

            </div>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-gray-900">
                다가오는 이벤트
              </h2>
              <div className="flex items-center bg-orange-100 rounded-full px-4 py-2">
                <Calendar size={16} className="mr-2 text-orange-600" />
                <span className="text-orange-600 font-medium text-sm">
                  총 {events.length}개 이벤트
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              전문가들이 기획한 실무 중심의 이벤트들입니다. 모든 이벤트에 참여하실 수 있습니다.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">이벤트를 불러오는 중...</p>
            </div>
          ) : currentEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">참가자</p>
                        <p className="text-xs font-medium">
                          {event.currentParticipants || 0}/{event.maxParticipants || 0}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                      {event.description}
                    </p>

                    <div className="space-y-1 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar size={14} className="mr-2" />
                        <span className="text-xs">{event.date}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock size={14} className="mr-2" />
                        <span className="text-xs">{event.time}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin size={14} className="mr-2" />
                        <span className="text-xs">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center">
                        <Users size={14} className="mr-1 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {event.remainingSlots || 0}자리 남음
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="flex items-center text-orange-600 hover:text-orange-800 font-medium text-sm"
                      >
                        <span>자세히 보기</span>
                        <ChevronRight size={14} className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Building size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                등록된 이벤트가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                아직 등록된 이벤트가 없습니다. 관리자가 새로운 이벤트를 등록할 때까지 기다려주세요.
              </p>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {events.length}개 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, events.length)}개 표시
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 관리자 이벤트 등록 모달 */}
      {showAdminForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">관리자: 새 이벤트 등록</h2>
                <button
                  onClick={() => setShowAdminForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdminEventSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이벤트 제목 *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="예: 2025 여름방학 취업설명회"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이벤트 유형 *
                    </label>
                    <select
                      required
                      value={eventForm.type}
                      onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="workshop">워크숍</option>
                      <option value="seminar">세미나</option>
                      <option value="job-fair">취업설명회</option>
                      <option value="competition">경진대회</option>
                      <option value="experience">체험프로그램</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      날짜 *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* 년도 선택 */}
                      <select
                        value={dateForm.year}
                        onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center"
                      >
                        {generateYears().map(year => (
                          <option key={year} value={year}>{year}년</option>
                        ))}
                      </select>
                      
                      {/* 월 선택 */}
                      <select
                        value={dateForm.month}
                        onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center"
                      >
                        {generateMonths().map(month => (
                          <option key={month} value={month}>{month}월</option>
                        ))}
                      </select>
                      
                      {/* 일 선택 */}
                      <select
                        value={dateForm.day}
                        onChange={(e) => handleDateChange('day', parseInt(e.target.value))}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center"
                      >
                        {generateDays().map(day => (
                          <option key={day} value={day}>{day}일</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      선택된 날짜: {dateForm.year}년 {dateForm.month}월 {dateForm.day}일
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시간 *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.time}
                      onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="예: 10:00 AM - 4:00 PM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      장소 *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.location}
                      onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="예: Fredericton Convention Centre"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최대 참가자 수 *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={eventForm.maxParticipants}
                      onChange={(e) => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이벤트 설명 *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="이벤트에 대한 상세한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주최자 *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm({...eventForm, organizer: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="예: NB High School Jobs"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAdminForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? '등록 중...' : '이벤트 등록'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(selectedEvent.type)}`}>
                    {getEventTypeLabel(selectedEvent.type)}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mt-2">
                    {selectedEvent.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">이벤트 정보</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar size={18} className="mr-3 text-gray-500" />
                      <span>{selectedEvent.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={18} className="mr-3 text-gray-500" />
                      <span>{selectedEvent.time}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={18} className="mr-3 text-gray-500" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={18} className="mr-3 text-gray-500" />
                      <span>{selectedEvent.currentParticipants || 0}/{selectedEvent.maxParticipants || 0} 명 참가</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">주최</h3>
                    <p className="text-gray-600">{selectedEvent.organizer}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">설명</h3>
                  <p className="text-gray-600 mb-6">{selectedEvent.description}</p>
                  
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((selectedEvent.currentParticipants || 0) / (selectedEvent.maxParticipants || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        <span className="font-medium text-orange-600">
                          {selectedEvent.remainingSlots || 0}자리 남음
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t text-center">
                {(selectedEvent.remainingSlots || 0) <= 0 ? (
                  <div className="text-center">
                    <p className="text-red-600 font-medium mb-4">
                      죄송합니다. 이 이벤트는 정원이 마감되었습니다.
                    </p>
                    <p className="text-gray-600 text-sm">
                      다음 이벤트를 확인해주세요.
                    </p>
                  </div>
                ) : !user ? (
                  <div className="text-center">
                    <p className="text-gray-600 font-medium mb-4">
                      이벤트 참가를 위해 로그인이 필요합니다.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRegistration(selectedEvent.id)}
                    disabled={isRegistering}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] flex items-center justify-center space-x-2 mx-auto"
                  >
                    <UserPlus size={18} />
                    <span>{isRegistering ? '등록 중...' : '이벤트 참가 신청'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 