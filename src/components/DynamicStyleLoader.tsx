'use client';

import { useEffect } from 'react';
import { designService } from '@/lib/firebase-services';

export default function DynamicStyleLoader() {
  useEffect(() => {
    // Firebase에서 디자인 설정을 불러와서 CSS 변수 업데이트
    const loadAndApplyDesignSettings = async () => {
      try {
        // Firebase가 사용 가능한지 확인
        if (!designService?.getCurrentDesignSettings) {
          console.log('📝 DynamicStyleLoader: Firebase not available, using default styles');
          // 기본 스타일 적용
          const root = document.documentElement;
          root.style.setProperty('--font-body', 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
          root.style.setProperty('--font-heading', 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
          root.style.setProperty('--color-primary', '#0ea5e9');
          root.style.setProperty('--color-secondary', '#7dd3fc');
          root.style.setProperty('--color-accent', '#0369a1');
          root.style.setProperty('--color-background', '#dbeafe');
          console.log('✅ 기본 스타일 적용 완료');
          return;
        }
        
        const settings = await designService.getCurrentDesignSettings();
        
        if (settings.fonts) {
          const root = document.documentElement;
          
          // 폰트 패밀리 매핑
          const fontFamilyMap: { [key: string]: string } = {
            // 🇰🇷 한국어 최적화
            'pretendard': 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'noto-sans-kr': '"Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'nanum-gothic': '"Nanum Gothic", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'spoqa-han-sans': '"Spoqa Han Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            
            // 📝 깔끔한 Sans-serif
            'inter': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'roboto': 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'open-sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'lato': 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'source-sans-pro': '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'nunito': 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'poppins': 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'work-sans': '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'fira-sans': '"Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'ubuntu': 'Ubuntu, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            
            // 💪 임팩트 있는 Display
            'montserrat': 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'oswald': 'Oswald, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'raleway': 'Raleway, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'bebas-neue': '"Bebas Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'anton': 'Anton, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'fredoka-one': '"Fredoka One", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            
            // 🎨 우아한 Serif
            'playfair-display': '"Playfair Display", Georgia, "Times New Roman", serif',
            'merriweather': 'Merriweather, Georgia, "Times New Roman", serif',
            'cormorant-garamond': '"Cormorant Garamond", Georgia, "Times New Roman", serif',
            'crimson-text': '"Crimson Text", Georgia, "Times New Roman", serif',
            'libre-baskerville': '"Libre Baskerville", Georgia, "Times New Roman", serif',
            'source-serif-pro': '"Source Serif Pro", Georgia, "Times New Roman", serif',
            'noto-serif': '"Noto Serif KR", Georgia, "Times New Roman", serif',
            
            // ✨ 독특한 스타일
            'dancing-script': '"Dancing Script", cursive',
            'pacifico': 'Pacifico, cursive',
            'comfortaa': 'Comfortaa, cursive',
            'lobster': 'Lobster, cursive'
          };
          
          // CSS 변수 업데이트
          root.style.setProperty('--font-body', fontFamilyMap[settings.fonts.bodyFont] || fontFamilyMap['pretendard']);
          root.style.setProperty('--font-heading', fontFamilyMap[settings.fonts.headingFont] || fontFamilyMap['pretendard']);
          root.style.setProperty('--font-size-body', `${settings.fonts.bodySize || 16}px`);
          root.style.setProperty('--font-size-heading', `${settings.fonts.headingSize || 32}px`);
          root.style.setProperty('--line-height', `${settings.fonts.lineHeight || 1.5}`);
          
          console.log('✅ 동적 폰트 설정 적용 완료:', settings.fonts);
        }
        
        if (settings.colors) {
          const root = document.documentElement;
          
          // 색상 변수 업데이트
          root.style.setProperty('--color-primary', settings.colors.primary || '#0ea5e9');
          root.style.setProperty('--color-secondary', settings.colors.secondary || '#7dd3fc');
          root.style.setProperty('--color-accent', settings.colors.accent || '#0369a1');
          root.style.setProperty('--color-background', settings.colors.background || '#dbeafe');
          
          console.log('✅ 동적 색상 설정 적용 완료:', settings.colors);
        }
        
      } catch (error) {
        console.warn('⚠️ 디자인 설정 로드 실패 (Firebase 없음):', error);
        // Firebase 없을 때는 기본 스타일 적용
        const root = document.documentElement;
        root.style.setProperty('--font-body', 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
        root.style.setProperty('--font-heading', 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
        root.style.setProperty('--color-primary', '#0ea5e9');
        root.style.setProperty('--color-secondary', '#7dd3fc');
        root.style.setProperty('--color-accent', '#0369a1');
        root.style.setProperty('--color-background', '#dbeafe');
        console.log('✅ 기본 스타일 적용 완료');
      }
    };

    // 초기 로드
    loadAndApplyDesignSettings();

    // 실시간 변경사항 구독 (Firebase 사용 가능할 때만)
    // Firebase 없을 때는 실시간 구독 기능 비활성화
    console.log('⚠️ 실시간 구독 기능은 Firebase 없이 사용할 수 없습니다.');

    return () => {
      // Cleanup function (no subscription to clean up)
    };
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
} 