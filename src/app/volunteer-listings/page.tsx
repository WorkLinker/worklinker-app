'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, MapPin, Clock, Users, Heart, Calendar, Building, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { volunteerService } from '@/lib/firebase-services';

export default function VolunteerListingsPage() {
  const [volunteerPostings, setVolunteerPostings] = useState<any[]>([]);
  const [filteredPostings, setFilteredPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganizationType, setSelectedOrganizationType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  const organizationTypes = [
    '전체',
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

  // 봉사 기회 목록 로드
  useEffect(() => {
    loadVolunteerPostings();
  }, []);

  const loadVolunteerPostings = async () => {
    try {
      setLoading(true);
      const postings = await volunteerService.getApprovedVolunteerPostings();
      setVolunteerPostings(postings);
      setFilteredPostings(postings);
    } catch (error) {
      console.error('❌ 봉사 기회 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링
  useEffect(() => {
    let filtered = volunteerPostings;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(posting =>
        posting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posting.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 기관 유형 필터링
    if (selectedOrganizationType && selectedOrganizationType !== '전체') {
      filtered = filtered.filter(posting => posting.organizationType === selectedOrganizationType);
    }

    setFilteredPostings(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 리셋
  }, [searchTerm, selectedOrganizationType, volunteerPostings]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredPostings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPostings = filteredPostings.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('ko-KR');
  };

  const getOrganizationTypeColor = (type: string) => {
    const colors = {
      '도서관': 'bg-blue-100 text-blue-800',
      '요양원/요양소': 'bg-pink-100 text-pink-800',
      '노인정/복지관': 'bg-purple-100 text-purple-800',
      '약국/의료기관': 'bg-red-100 text-red-800',
      '정부기관/공공기관': 'bg-gray-100 text-gray-800',
      '학교/교육기관': 'bg-green-100 text-green-800',
      '종교기관': 'bg-yellow-100 text-yellow-800',
      '환경단체': 'bg-emerald-100 text-emerald-800',
      '동물보호소': 'bg-orange-100 text-orange-800',
      '푸드뱅크/급식소': 'bg-indigo-100 text-indigo-800',
      '기타': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">봉사 기회를 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Full Screen Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/images/봉사활동.png"
          alt="봉사 기회"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Navigation Overlay */}
        <div className="absolute top-0 left-0 right-0 z-30">
          <Navigation />
        </div>
        
        {/* Hero Content - Positioned at Bottom */}
        <div className="absolute bottom-20 left-0 right-0 z-20 text-center text-white px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              의미 있는<br />
              <span className="text-green-400">봉사 활동</span> 찾기
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
              지역사회에 도움이 되는 다양한 봉사 기회를 찾아보세요<br />
              당신의 작은 관심이 큰 변화를 만듭니다
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="#volunteer-list"
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Heart size={20} className="mr-2" />
                봉사 기회 찾기
              </Link>
              <Link 
                href="/volunteer-postings"
                className="inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/30 rounded-full font-semibold text-lg transition-all duration-300"
              >
                <Plus size={20} className="mr-2" />
                봉사자 모집하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <div id="volunteer-list" className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <Link href="/" className="hover:text-green-600 transition-colors">홈</Link>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-green-600 font-medium">봉사 기회</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="봉사 기회, 기관명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              />
            </div>
            
            {/* Organization Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={selectedOrganizationType}
                onChange={(e) => setSelectedOrganizationType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
              >
                {organizationTypes.map((type) => (
                  <option key={type} value={type === '전체' ? '' : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mt-6 text-sm text-gray-600">
            총 <span className="font-semibold text-green-600">{filteredPostings.length}</span>개의 봉사 기회
          </div>
        </div>
      </div>

      {/* Volunteer Postings Grid */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-12">
          {currentPostings.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                검색 조건에 맞는 봉사 기회가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                다른 검색어나 필터를 시도해보세요
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedOrganizationType('');
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                전체 봉사 기회 보기
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPostings.map((posting) => (
                <div key={posting.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrganizationTypeColor(posting.organizationType)}`}>
                        {posting.organizationType}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users size={14} className="mr-1" />
                        {posting.applicantCount || 0}명 지원
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {posting.title}
                    </h3>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                      <Building size={16} className="mr-2 text-green-600" />
                      <span className="font-medium">{posting.organizationName}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {posting.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-2 text-green-600" />
                        <span>{posting.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-green-600" />
                        <span>{posting.timeCommitment}</span>
                      </div>
                      {posting.startDate && (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-green-600" />
                          <span>{posting.startDate} 시작</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-6 pt-0">
                    <Link
                      href={`/volunteer-listings/${posting.id}`}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Heart size={16} className="mr-2" />
                      봉사 지원하기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={20} />
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      currentPage === page
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
} 