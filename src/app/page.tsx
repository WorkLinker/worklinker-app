'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, Briefcase, GraduationCap, TrendingUp, Trophy, Sparkles, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { contentService, designService } from '@/lib/firebase-services';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({
    'card-student': true,
    'card-reference': true,
    'card-company': true,
    'card-events': true,
    'features-section': true
  });
  const [clickedElements, setClickedElements] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_siteContent, setSiteContent] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [designSettings, setDesignSettings] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // CSS 변수 업데이트 함수
  const updateCSSVariables = (settings: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!settings) return;
    
    const root = document.documentElement;
    
    // 색상 테마 적용
    if (settings.colors) {
      root.style.setProperty('--color-primary', settings.colors.primary || '#0ea5e9');
      root.style.setProperty('--color-secondary', settings.colors.secondary || '#7dd3fc');
      root.style.setProperty('--color-accent', settings.colors.accent || '#0369a1');
      root.style.setProperty('--color-background', settings.colors.background || '#dbeafe');
    }
    
    // 폰트 설정 적용
    if (settings.fonts) {
      const fontFamilies = {
        // 🇰🇷 한국어 최적화
        'pretendard': 'Pretendard, sans-serif',
        'noto-sans-kr': '"Noto Sans KR", sans-serif',
        'nanum-gothic': '"Nanum Gothic", sans-serif',
        'spoqa-han-sans': '"Spoqa Han Sans", sans-serif',
        
        // 📝 깔끔한 Sans-serif
        'inter': 'Inter, sans-serif',
        'roboto': 'Roboto, sans-serif',
        'open-sans': '"Open Sans", sans-serif',
        'lato': 'Lato, sans-serif',
        'source-sans-pro': '"Source Sans Pro", sans-serif',
        'nunito': 'Nunito, sans-serif',
        'poppins': 'Poppins, sans-serif',
        'work-sans': '"Work Sans", sans-serif',
        'fira-sans': '"Fira Sans", sans-serif',
        'ubuntu': 'Ubuntu, sans-serif',
        'system-ui': 'system-ui, sans-serif',
        
        // 💪 임팩트 있는 Display
        'montserrat': 'Montserrat, sans-serif',
        'oswald': 'Oswald, sans-serif',
        'raleway': 'Raleway, sans-serif',
        'bebas-neue': '"Bebas Neue", sans-serif',
        'anton': 'Anton, sans-serif',
        'fredoka-one': '"Fredoka One", sans-serif',
        
        // 🎨 우아한 Serif
        'playfair-display': '"Playfair Display", serif',
        'merriweather': 'Merriweather, serif',
        'cormorant-garamond': '"Cormorant Garamond", serif',
        'crimson-text': '"Crimson Text", serif',
        'libre-baskerville': '"Libre Baskerville", serif',
        'source-serif-pro': '"Source Serif Pro", serif',
        'noto-serif': '"Noto Serif KR", serif',
        
        // ✨ 독특한 스타일
        'dancing-script': '"Dancing Script", cursive',
        'pacifico': 'Pacifico, cursive',
        'comfortaa': 'Comfortaa, cursive',
        'lobster': 'Lobster, cursive'
      };
      
      root.style.setProperty('--font-body', fontFamilies[settings.fonts.bodyFont as keyof typeof fontFamilies] || fontFamilies['pretendard']);
      root.style.setProperty('--font-heading', fontFamilies[settings.fonts.headingFont as keyof typeof fontFamilies] || fontFamilies['pretendard']);
      root.style.setProperty('--font-size-body', `${settings.fonts.bodySize || 16}px`);
      root.style.setProperty('--font-size-heading', `${settings.fonts.headingSize || 32}px`);
      root.style.setProperty('--line-height', settings.fonts.lineHeight?.toString() || '1.5');
    }
    
    console.log('🎨 CSS variables updated successfully:', settings);
  };
  
  // Default slides (used while Firestore is loading)
  const defaultSlides = [
    {
      image: '/images/main-home-1.png',
      title: 'Your First Step to Career Success',
      subtitle: 'Turn your dreams into reality with professional guidance and hands-on experience',
      alt: 'New Brunswick Student Hub - Career Success Platform for Students'
    },
    {
      image: '/images/main-home-2.jpg',
      title: 'Discover the Talented Students of Tomorrow',
      subtitle: 'Connect with the future leaders of New Brunswick',
      alt: 'Canadian Students - Future Leaders and Talented Youth'
    },
    {
      image: '/images/main-home-3.png',
      title: 'Innovative Education Platform',
      subtitle: 'Where technology meets education to unlock new possibilities',
      alt: 'Innovative Educational Technology Platform for Career Development'
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

        // Start real-time subscription
        unsubscribe = contentService.subscribeToContent((updatedContent) => {
          setSiteContent(updatedContent);
          console.log('🔄 Content updated in real-time');
        });
      } catch (error) {
        console.error('❌ Content initialization error:', error);
        // Use default content on error
      }
    };

    initializeContent();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 디자인 설정 실시간 구독
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeDesignSettings = async () => {
      try {
        // 초기 디자인 설정 로드
        const settings = await designService.getCurrentDesignSettings();
        setDesignSettings(settings);
        updateCSSVariables(settings);

        // Set up real-time subscription
        unsubscribe = designService.subscribeToDesignSettings((updatedSettings) => {
          setDesignSettings(updatedSettings);
          updateCSSVariables(updatedSettings);
          console.log('🎨 Design settings updated in real-time');
        });
      } catch (error) {
        console.error('❌ Design settings initialization error:', error);
      }
    };

    initializeDesignSettings();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Current slides to use (always use defaultSlides with English content)
  const slides = defaultSlides.map((slide, index) => {
    const designImage = designSettings?.images?.heroSlides?.[`slide${index + 1}`];
    // Only use design image if it's not a Korean filename
    const useDesignImage = designImage && !designImage.includes('메인홈') && !designImage.includes('%');
    return {
    ...slide,
      image: useDesignImage ? designImage : slide.image,
      alt: slide.alt || slide.title
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000); // 10초로 늘림 (더 여유롭게)
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
          {slides.map((slide: {title: string, subtitle: string, image: string, alt?: string}, index: number) => (
            <div
              key={index}
              className={`absolute inset-0 slide-transition ${
                index === currentSlide 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-110'
              }`}
              style={{
                filter: index === currentSlide ? 'blur(0px)' : 'blur(2px)',
                transform: index === currentSlide 
                  ? 'scale(1) translateX(0)' 
                  : 'scale(1.08) translateX(0)'
              }}
            >
              <Image
                src={slide.image}
                alt={slide.alt || slide.title}
                fill
                sizes="100vw"
                className="object-cover object-center"
                priority={index === 0}
                quality={85}
                loading={index === 0 ? 'eager' : 'lazy'}
                onError={() => {
                  console.error(`Failed to load slide image: ${slide.image}`);
                }}
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          ))}
        </div>

        {/* Slide Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-40 bg-white/20 backdrop-blur-sm rounded-full p-4 md:p-3 hover:bg-white/40 hover:scale-110 transition-all duration-300 ease-out shadow-lg hover:shadow-xl"
        >
          <ChevronLeft size={24} className="text-white transition-transform duration-300 hover:-translate-x-1" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-40 bg-white/20 backdrop-blur-sm rounded-full p-4 md:p-3 hover:bg-white/40 hover:scale-110 transition-all duration-300 ease-out shadow-lg hover:shadow-xl"
        >
          <ChevronRight size={24} className="text-white transition-transform duration-300 hover:translate-x-1" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex space-x-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {slides.map((_: any, index: any) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`rounded-full transition-all duration-700 ease-out transform hover:scale-125 ${
                index === currentSlide 
                  ? 'w-8 h-3 bg-white shadow-lg' 
                  : 'w-3 h-3 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>



        {/* Dynamic Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-8 sm:mb-12">
            <h1 className="hero-title hero-title-default dynamic-font-heading mb-4 sm:mb-6">
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
              className={`group relative dynamic-gradient-primary text-white px-8 sm:px-12 py-5 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center space-x-3 sm:space-x-4 overflow-hidden ${
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
                    Get Started as Student
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
              className={`group relative dynamic-bg-accent text-white px-8 sm:px-12 py-5 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl dynamic-border-accent border flex items-center justify-center space-x-3 sm:space-x-4 overflow-hidden ${
                clickedElements['cta-company'] ? 'animate-pulse' : ''
              }`}
              disabled={isLoading['cta-company']}
            >
              {isLoading['cta-company'] ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <Briefcase size={24} className="sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
                  <span>Join as Employer</span>
                  <TrendingUp size={24} className="sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features-section" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight dynamic-font-heading">
              For Canadian Students
            </h2>
            <p className="text-lg sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Available to all high school students in New Brunswick - 
              <span className="font-bold dynamic-text-primary">next-generation career support system</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Student Job Search */}
            <div 
              id="card-student" 
              data-animate
              className={`group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-4 border dynamic-border-primary relative overflow-hidden h-full flex flex-col cursor-pointer ${
                isVisible['card-student'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } ${clickedElements['card-student'] ? 'scale-95' : ''}`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                createRipple(e);
                handleClick('card-student', '/job-seekers');
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 dynamic-gradient-primary"></div>
              {/* Feature image */}
              <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
                <Image
                  src={designSettings?.images?.featureCards?.student || "/images/student-opportunities.png"}
                  alt="Student job search"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="w-24 h-24 dynamic-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-xl">
                <GraduationCap size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dynamic-font-heading">Student Jobs</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed text-lg flex-grow">
                Smart matching system that finds the perfect job opportunities for you
              </p>
              <div className="block w-full dynamic-gradient-primary text-white text-center py-4 rounded-xl font-bold transition-all shadow-lg mt-auto">
                {isLoading['card-student'] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Get Started →'
                )}
              </div>
            </div>

            {/* Reference Support */}
            <div 
              id="card-reference" 
              data-animate
              className={`group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 delay-200 transform hover:-translate-y-4 border dynamic-border-secondary relative overflow-hidden h-full flex flex-col cursor-pointer ${
                isVisible['card-reference'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } ${clickedElements['card-reference'] ? 'scale-95' : ''}`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                createRipple(e);
                handleClick('card-reference', '/references');
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 dynamic-gradient-accent"></div>
              {/* Feature image */}
              <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
                <Image
                  src={designSettings?.images?.featureCards?.reference || "/images/reference-support.png"}
                  alt="Reference support"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="w-24 h-24 dynamic-gradient-accent rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-xl">
                <Award size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dynamic-font-heading">References</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed text-lg flex-grow">
                Digital reference ecosystem connecting students with teachers
              </p>
              <div className="block w-full dynamic-gradient-accent text-white text-center py-4 rounded-xl font-bold transition-all shadow-lg mt-auto">
                {isLoading['card-reference'] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Get Started →'
                )}
              </div>
            </div>

            {/* Employer Hiring */}
            <div 
              id="card-company" 
              data-animate
              className={`group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 delay-500 transform hover:-translate-y-4 border dynamic-border-accent relative overflow-hidden h-full flex flex-col cursor-pointer ${
                isVisible['card-company'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } ${clickedElements['card-company'] ? 'scale-95' : ''}`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                createRipple(e);
                handleClick('card-company', '/job-postings');
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 dynamic-gradient-accent"></div>
              {/* Feature image */}
              <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
                <Image
                  src={designSettings?.images?.featureCards?.company || "/images/company-recruitment.png"}
                  alt="Employer hiring"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="w-24 h-24 dynamic-gradient-accent rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-xl">
                <Trophy size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dynamic-font-heading">Employer Hub</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed text-lg flex-grow">
                Smart hiring platform to connect with talented Canadian students
              </p>
              <div className="block w-full dynamic-gradient-accent text-white text-center py-4 rounded-xl font-bold transition-all shadow-lg mt-auto">
                {isLoading['card-company'] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Explore →'
                )}
              </div>
            </div>

            {/* Learning Events */}
            <div 
              id="card-events" 
              data-animate
              className={`group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 delay-700 transform hover:-translate-y-4 border dynamic-border-secondary relative overflow-hidden h-full flex flex-col cursor-pointer ${
                isVisible['card-events'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } ${clickedElements['card-events'] ? 'scale-95' : ''}`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                createRipple(e);
                handleClick('card-events', '/events');
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 dynamic-gradient-primary"></div>
              {/* Feature image */}
              <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
                <Image
                  src={designSettings?.images?.featureCards?.events || "/images/education-events.png"}
                  alt="Learning events"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="w-24 h-24 dynamic-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-xl">
                <Sparkles size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dynamic-font-heading">Learning Events</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed text-lg flex-grow">
                Hands-on educational programs to prepare for your future
              </p>
              <div className="block w-full dynamic-gradient-primary text-white text-center py-4 rounded-xl font-bold transition-all shadow-lg mt-auto">
                {isLoading['card-events'] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Join Event →'
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Mission Section */}
      <section className="py-32 dynamic-gradient-accent text-white relative overflow-hidden">


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center dynamic-bg-accent rounded-full px-8 py-3 mb-8 border dynamic-border-accent">
              <Trophy size={24} className="mr-3 text-yellow-300" />
              <span className="text-xl font-bold">Our Mission</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8 leading-tight dynamic-font-heading">
              An innovative platform
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-100 to-white mt-2">
                for every student&apos;s success
              </span>
            </h2>
            
            <p className="text-lg sm:text-2xl md:text-3xl text-sky-100 max-w-5xl mx-auto mb-12 sm:mb-16 leading-relaxed">
              We&apos;re building a world where every New Brunswick student can reach their full potential and 
              <span className="font-bold text-white">make their dreams come true</span>.
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
                <div className="w-20 h-20 dynamic-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-2xl">
                  <GraduationCap size={40} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 dynamic-font-heading">Equal Opportunities</h3>
                <p className="text-sky-100 text-lg">Providing equal growth opportunities for every student</p>
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
                <div className="w-20 h-20 dynamic-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-2xl">
                  <Users size={40} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 dynamic-font-heading">Community Connection</h3>
                <p className="text-sky-100 text-lg">Building strong bridges between students and employers</p>
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
                <div className="w-20 h-20 dynamic-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-2xl">
                  <Trophy size={40} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 dynamic-font-heading">Future Ready</h3>
                <p className="text-sky-100 text-lg">Hands-on experience with professional career guidance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight dynamic-font-heading">
              Simple 3-Step Process
            </h2>
            <p className="text-lg sm:text-2xl text-gray-600 max-w-3xl mx-auto">
              No complicated procedures - just a <span className="font-bold dynamic-text-primary">convenient and smart system</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center relative">
              <div className="w-32 h-32 dynamic-gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10">
                <span className="text-white text-4xl font-bold">1</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dynamic-font-heading">Smart Sign-Up</h3>
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                Create your personalized profile and get started quickly
              </p>
              {/* Connection Line */}
              <div className="hidden md:block absolute top-16 left-full w-full h-1 bg-gradient-to-r from-sky-300 to-transparent -translate-x-1/2 z-0"></div>
            </div>
            
            <div className="text-center relative">
              <div className="w-32 h-32 dynamic-gradient-accent rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10">
                <span className="text-white text-4xl font-bold">2</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dynamic-font-heading">Smart Matching</h3>
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                Our precise algorithm finds the perfect opportunities for you
              </p>
              {/* Connection Line */}
              <div className="hidden md:block absolute top-16 left-full w-full h-1 bg-gradient-to-r from-sky-300 to-transparent -translate-x-1/2 z-0"></div>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 dynamic-gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <span className="text-white text-4xl font-bold">3</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dynamic-font-heading">Successful Connections</h3>
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                Real-time notifications ensure you never miss an opportunity
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
              Your future
            </span>
            <span className="block text-white mt-2">
              starts here
            </span>
          </h2>
          <p className="text-lg sm:text-2xl md:text-3xl text-sky-100 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed">
            Supporting every New Brunswick student&apos;s success with 
            <span className="font-bold text-white">professional technology and services</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center mb-12 sm:mb-16">
            <Link 
              href="/job-seekers" 
              className="group relative bg-gradient-to-r from-sky-400 to-sky-500 text-white px-10 sm:px-16 py-6 sm:py-8 rounded-2xl font-bold text-lg sm:text-2xl hover:from-sky-500 hover:to-sky-600 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center space-x-3 sm:space-x-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sky-300 to-sky-400 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <Sparkles size={28} className="sm:w-8 sm:h-8 relative z-10" />
              <span className="relative z-10">Get Started Now</span>
              <ArrowRight size={28} className="sm:w-8 sm:h-8 relative z-10 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link 
              href="/contact" 
              className="group bg-white/10 backdrop-blur-sm text-white px-10 sm:px-16 py-6 sm:py-8 rounded-2xl font-bold text-lg sm:text-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 shadow-2xl border-2 border-white/30 flex items-center justify-center space-x-3 sm:space-x-4"
            >
              <Trophy size={28} className="sm:w-8 sm:h-8 text-yellow-300" />
              <span>Contact Us</span>
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
