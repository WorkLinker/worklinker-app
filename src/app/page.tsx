'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, Briefcase, GraduationCap, BookOpen, TrendingUp, Trophy, Target, Sparkles, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { contentService } from '@/lib/firebase-services';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [clickedElements, setClickedElements] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [siteContent, setSiteContent] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 기본 슬라이드 (Firestore 로딩 중 사용)
  const defaultSlides = [
    {
      image: '/images/메인홈1.png',
      title: '미래를 만들어갈 학생 인재들을 만나보세요',
      subtitle: '뉴브런즈윅의 미래를 이끌어갈 인재들과 함께하세요'
    },
    {
      image: '/images/메인홈2.jpg',
      title: '성공적인 진로를 위한 첫걸음',
      subtitle: '전문적인 지도와 실무 경험으로 꿈을 현실로 만들어보세요'
    },
    {
      image: '/images/메인홈3.png',
      title: '혁신적인 교육 플랫폼',
      subtitle: '기술과 교육이 만나 새로운 가능성을 열어갑니다'
    }
  ];

  // Firestore에서 콘텐츠 가져오기 및 실시간 구독
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeContent = async () => {
      try {
        // 초기 콘텐츠 로드
        const content = await contentService.getCurrentContent();
        setSiteContent(content);

        // 실시간 구독 시작
        unsubscribe = contentService.subscribeToContent((updatedContent) => {
          setSiteContent(updatedContent);
          console.log('🔄 콘텐츠 실시간 업데이트됨');
        });
      } catch (error) {
        console.error('❌ 콘텐츠 초기화 오류:', error);
        // 오류 시 기본 콘텐츠 사용
      }
    };

    initializeContent();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 현재 사용할 슬라이드 (Firestore 콘텐츠 or 기본값)
  const slides = siteContent?.heroSlides ? 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    siteContent.heroSlides.map((slide: any, index: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      ...slide,
      image: defaultSlides[index]?.image || '/images/메인홈1.png'
    })) : 
    defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // 스크롤 애니메이션을 위한 Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => {
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // 클릭 효과 핸들러
  const handleClick = (elementId: string, href?: string) => {
    setClickedElements(prev => ({ ...prev, [elementId]: true }));
    
    if (href) {
      setIsLoading(prev => ({ ...prev, [elementId]: true }));
      
      // 실제 네비게이션 전에 약간의 지연으로 효과 보여주기
      setTimeout(() => {
        window.location.href = href;
      }, 300);
    }
    
    // 클릭 효과 제거
    setTimeout(() => {
      setClickedElements(prev => ({ ...prev, [elementId]: false }));
    }, 200);
  };

  // Ripple 효과 생성 함수
  const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  };



  return (
    <div className="min-h-screen bg-blue-50">
      {/* Full Screen Hero Section with Slideshow */}
      <section id="hero-section" className="h-screen flex items-end justify-center relative overflow-hidden pb-20">
        {/* Navigation overlay */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        
        {/* Slideshow Background */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {slides.map((slide: any, index: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={slide.image}
                alt={`메인 슬라이드 ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          ))}
        </div>

        {/* Slide Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-40 bg-white/20 backdrop-blur-sm rounded-full p-4 md:p-3 hover:bg-white/30 transition-all"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-40 bg-white/20 backdrop-blur-sm rounded-full p-4 md:p-3 hover:bg-white/30 transition-all"
        >
          <ChevronRight size={24} className="text-white" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex space-x-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {slides.map((_: any, index: any) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>



        {/* Dynamic Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-8 sm:mb-12">
            <h1 className="hero-title hero-title-default mb-4 sm:mb-6">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-sky-100 max-w-4xl mx-auto drop-shadow-md leading-relaxed">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={(e) => {
                createRipple(e);
                handleClick('cta-student', '/job-seekers');
              }}
              className={`group relative bg-gradient-to-r from-sky-400 to-sky-500 text-white px-8 sm:px-12 py-5 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl hover:from-sky-500 hover:to-sky-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center space-x-3 sm:space-x-4 overflow-hidden ${
                clickedElements['cta-student'] ? 'animate-pulse' : ''
              }`}
              disabled={isLoading['cta-student']}
            >
              {isLoading['cta-student'] ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <GraduationCap size={24} className="sm:w-7 sm:h-7 relative z-10 group-hover:rotate-12 transition-transform" />
                  <span className="relative z-10">
                    {siteContent?.ctaButtons?.student || '학생으로 시작하기'}
                  </span>
                  <ArrowRight size={24} className="sm:w-7 sm:h-7 relative z-10 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
            <button
              onClick={(e) => {
                createRipple(e);
                handleClick('cta-company', '/job-postings');
              }}
              className={`group relative bg-sky-600 text-white px-8 sm:px-12 py-5 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl hover:bg-sky-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl border border-sky-500 flex items-center justify-center space-x-3 sm:space-x-4 overflow-hidden ${
                clickedElements['cta-company'] ? 'animate-pulse' : ''
              }`}
              disabled={isLoading['cta-company']}
            >
              {isLoading['cta-company'] ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <Briefcase size={24} className="sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
                  <span>{siteContent?.ctaButtons?.company || '기업으로 참여하기'}</span>
                  <TrendingUp size={24} className="sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features-section" className="py-32 bg-gradient-to-b from-sky-50 to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center bg-sky-100 rounded-full px-6 py-2 mb-8">
              <BookOpen size={20} className="mr-2 text-sky-600" />
              <span className="text-sky-600 font-semibold">통합 진로 플랫폼</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
              캐나다 학생들을 위한
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-sky-600 mt-2">
                원스톱 진로 솔루션
              </span>
            </h2>
            <p className="text-lg sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              뉴브런즈윅 주의 모든 고등학생들이 이용할 수 있는 
              <span className="font-bold text-sky-600">차세대 진로 지원 시스템</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 학생 구직 */}
            <div 
              id="card-student" 
              data-animate
              className={`group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-4 border border-sky-100 relative overflow-hidden h-full flex flex-col cursor-pointer ${
                isVisible['card-student'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } ${clickedElements['card-student'] ? 'scale-95' : ''}`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                createRipple(e);
                handleClick('card-student', '/job-seekers');
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-sky-500"></div>
              {/* 이미지 추가 */}
              <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
                <Image
                  src="/images/7번.png"
                  alt="학생 구직"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-sky-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-xl">
                <GraduationCap size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">학생 구직</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed text-lg flex-grow">
                스마트한 매칭 시스템으로 당신에게 완벽한 일자리를 찾아드립니다
              </p>
              <div className="block w-full bg-gradient-to-r from-sky-400 to-sky-500 text-white text-center py-4 rounded-xl font-bold hover:from-sky-500 hover:to-sky-600 transition-all shadow-lg mt-auto">
                {isLoading['card-student'] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  '시작하기 →'
                )}
              </div>
            </div>

            {/* 추천서 지원 */}
            <div 
              id="card-reference" 
              data-animate
              className={`group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 delay-200 transform hover:-translate-y-4 border border-sky-100 relative overflow-hidden h-full flex flex-col cursor-pointer ${
                isVisible['card-reference'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } ${clickedElements['card-reference'] ? 'scale-95' : ''}`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                createRipple(e);
                handleClick('card-reference', '/references');
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-300 to-sky-400"></div>
              {/* 이미지 추가 */}
              <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
                <Image
                  src="/images/4번.png"
                  alt="추천서 지원"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-sky-300 to-sky-400 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-xl">
                <Award size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">추천서 지원</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed text-lg flex-grow">
                선생님들과 연결되는 디지털 추천서 생태계
              </p>
              <div className="block w-full bg-gradient-to-r from-sky-300 to-sky-400 text-white text-center py-4 rounded-xl font-bold hover:from-sky-400 hover:to-sky-500 transition-all shadow-lg mt-auto">
                {isLoading['card-reference'] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  '참여하기 →'
                )}
              </div>
            </div>

            {/* 기업 채용 */}
            <div 
              id="card-company" 
              data-animate
              className={`group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 delay-500 transform hover:-translate-y-4 border border-sky-100 relative overflow-hidden h-full flex flex-col cursor-pointer ${
                isVisible['card-company'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } ${clickedElements['card-company'] ? 'scale-95' : ''}`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                createRipple(e);
                handleClick('card-company', '/job-postings');
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-sky-600"></div>
              {/* 이미지 추가 */}
              <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
                <Image
                  src="/images/3번.png"
                  alt="기업 채용"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-sky-500 to-sky-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-xl">
                <Trophy size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">기업 채용</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed text-lg flex-grow">
                우수한 캐나다 인재들과 만나는 스마트 채용 플랫폼
              </p>
              <div className="block w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white text-center py-4 rounded-xl font-bold hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg mt-auto">
                {isLoading['card-company'] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  '둘러보기 →'
                )}
              </div>
            </div>

            {/* 교육 이벤트 */}
            <div 
              id="card-events" 
              data-animate
              className={`group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 delay-700 transform hover:-translate-y-4 border border-sky-100 relative overflow-hidden h-full flex flex-col cursor-pointer ${
                isVisible['card-events'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } ${clickedElements['card-events'] ? 'scale-95' : ''}`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                createRipple(e);
                handleClick('card-events', '/events');
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-200 to-sky-300"></div>
              {/* 이미지 추가 */}
              <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
                <Image
                  src="/images/교육이벤트.png"
                  alt="교육 이벤트"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-sky-200 to-sky-300 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-xl">
                <Sparkles size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">교육 이벤트</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed text-lg flex-grow">
                미래를 준비하는 실무 중심 교육 프로그램
              </p>
              <div className="block w-full bg-gradient-to-r from-sky-200 to-sky-300 text-white text-center py-4 rounded-xl font-bold hover:from-sky-300 hover:to-sky-400 transition-all shadow-lg mt-auto">
                {isLoading['card-events'] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  '참가하기 →'
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Mission Section */}
      <section className="py-32 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 text-white relative overflow-hidden">


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center bg-sky-700 rounded-full px-8 py-3 mb-8 border border-sky-600">
              <Trophy size={24} className="mr-3 text-yellow-300" />
              <span className="text-xl font-bold">우리의 목표</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
              모든 학생의 성공을 위한
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-100 to-white mt-2">
                혁신적인 플랫폼
              </span>
            </h2>
            
            <p className="text-lg sm:text-2xl md:text-3xl text-sky-100 max-w-5xl mx-auto mb-12 sm:mb-16 leading-relaxed">
              모든 뉴브런즈윅 학생들이 자신의 잠재력을 발휘하고 
              <span className="font-bold text-white">꿈을 실현할 수 있는 세상</span>을 만들어갑니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div 
                id="mission-1" 
                data-animate
                className={`text-center group transition-all duration-700 ${
                  isVisible['mission-1'] 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-sky-300 to-sky-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-2xl">
                  <GraduationCap size={40} className="text-sky-600" />
                </div>
                <h3 className="text-3xl font-bold mb-4">교육 기회 평등</h3>
                <p className="text-sky-100 text-lg">모든 학생에게 동등한 성장 기회 제공</p>
              </div>
              <div 
                id="mission-2" 
                data-animate
                className={`text-center group transition-all duration-700 delay-200 ${
                  isVisible['mission-2'] 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-sky-300 to-sky-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-2xl">
                  <Users size={40} className="text-sky-600" />
                </div>
                <h3 className="text-3xl font-bold mb-4">지역사회 연결</h3>
                <p className="text-sky-100 text-lg">학생과 기업을 잇는 든든한 다리 역할</p>
              </div>
              <div 
                id="mission-3" 
                data-animate
                className={`text-center group transition-all duration-700 delay-500 ${
                  isVisible['mission-3'] 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-sky-300 to-sky-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-2xl">
                  <Trophy size={40} className="text-sky-600" />
                </div>
                <h3 className="text-3xl font-bold mb-4">미래 준비</h3>
                <p className="text-sky-100 text-lg">실무 경험과 전문적인 진로 지도</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center bg-gradient-to-r from-sky-100 to-sky-200 rounded-full px-6 py-2 mb-8">
              <Target size={20} className="mr-2 text-sky-600" />
              <span className="text-sky-600 font-semibold">간단한 시작</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-sky-600">
                3단계면 충분합니다
              </span>
            </h2>
            <p className="text-lg sm:text-2xl text-gray-600 max-w-3xl mx-auto">
              복잡한 절차 없이 <span className="font-bold text-sky-600">편리하고 똑똑한 시스템</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center relative">
              <div className="w-32 h-32 bg-gradient-to-br from-sky-400 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10">
                <span className="text-white text-4xl font-bold">1</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">스마트 가입</h3>
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                개인 맞춤형 프로필 생성으로 빠른 시작
              </p>
              {/* Connection Line */}
              <div className="hidden md:block absolute top-16 left-full w-full h-1 bg-gradient-to-r from-sky-300 to-transparent -translate-x-1/2 z-0"></div>
            </div>
            
            <div className="text-center relative">
              <div className="w-32 h-32 bg-gradient-to-br from-sky-300 to-sky-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10">
                <span className="text-white text-4xl font-bold">2</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">똑똑한 매칭</h3>
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                정확한 알고리즘이 찾아주는 완벽한 기회들
              </p>
              {/* Connection Line */}
              <div className="hidden md:block absolute top-16 left-full w-full h-1 bg-gradient-to-r from-sky-300 to-transparent -translate-x-1/2 z-0"></div>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <span className="text-white text-4xl font-bold">3</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">성공적인 연결</h3>
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                실시간 알림으로 놓치지 않는 기회들
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Final CTA */}
      <section className="py-32 bg-gradient-to-br from-sky-700 via-sky-800 to-sky-900 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-sky-300 rounded-full opacity-20 blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-sky-400 rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
        </div>



        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-sky-100 to-white">
              당신의 미래가
            </span>
            <span className="block text-white mt-2">
              여기서 시작됩니다
            </span>
          </h2>
          <p className="text-lg sm:text-2xl md:text-3xl text-sky-100 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed">
            뉴브런즈윅의 모든 학생들이 성공할 수 있도록 
            <span className="font-bold text-white">전문 기술과 서비스</span>로 지원합니다
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center mb-12 sm:mb-16">
            <Link 
              href="/job-seekers" 
              className="group relative bg-gradient-to-r from-sky-400 to-sky-500 text-white px-10 sm:px-16 py-6 sm:py-8 rounded-2xl font-bold text-lg sm:text-2xl hover:from-sky-500 hover:to-sky-600 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center space-x-3 sm:space-x-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sky-300 to-sky-400 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <Sparkles size={28} className="sm:w-8 sm:h-8 relative z-10" />
              <span className="relative z-10">지금 시작하기</span>
              <ArrowRight size={28} className="sm:w-8 sm:h-8 relative z-10 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link 
              href="/contact" 
              className="group bg-white/10 backdrop-blur-sm text-white px-10 sm:px-16 py-6 sm:py-8 rounded-2xl font-bold text-lg sm:text-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 shadow-2xl border-2 border-white/30 flex items-center justify-center space-x-3 sm:space-x-4"
            >
              <Trophy size={28} className="sm:w-8 sm:h-8 text-yellow-300" />
              <span>문의하기</span>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-sky-200 text-lg sm:text-2xl font-bold mb-3 sm:mb-4">
              🍁 Proudly serving New Brunswick students 🍁
            </p>
            <p className="text-sky-300 text-base sm:text-lg mb-6">
              Made with advanced technology in Canada
            </p>
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}
