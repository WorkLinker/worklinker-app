const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function generateComprehensivePDFReport() {
  try {
    console.log('📄 NB Student Hub 종합 기능 분석 보고서 PDF 생성을 시작합니다...');

    // 1. 마크다운 파일 읽기
    const markdownPath = path.join(__dirname, '../docs/NB_Student_Hub_종합_기능_분석_보고서_2025-01-15.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    console.log('✅ 마크다운 파일 읽기 완료');

    // 2. 마크다운을 HTML로 변환
    const htmlContent = marked(markdownContent);
    console.log('✅ HTML 변환 완료');

    // 3. CSS 스타일링과 함께 완전한 HTML 문서 생성
    const fullHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NB Student Hub - 종합 기능 분석 보고서</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            color: #1a365d;
            font-size: 2.5em;
            margin-bottom: 1em;
            border-bottom: 4px solid #3182ce;
            padding-bottom: 0.5em;
            text-align: center;
        }
        
        h2 {
            color: #2d3748;
            font-size: 1.8em;
            margin: 2em 0 1em 0;
            border-left: 5px solid #4299e1;
            padding-left: 1rem;
            background: linear-gradient(to right, #ebf8ff, transparent);
            padding: 0.5rem 1rem;
        }
        
        h3 {
            color: #4a5568;
            font-size: 1.3em;
            margin: 1.5em 0 0.8em 0;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.3em;
        }
        
        h4 {
            color: #2d3748;
            font-size: 1.1em;
            margin: 1.2em 0 0.6em 0;
            font-weight: 600;
        }
        
        p {
            margin-bottom: 1em;
            text-align: justify;
        }
        
        strong {
            color: #2d3748;
            font-weight: 600;
        }
        
        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }
        
        li {
            margin-bottom: 0.5em;
        }
        
        code {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 0.2em 0.4em;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
            color: #e53e3e;
        }
        
        pre {
            background: #1a202c;
            color: #f7fafc;
            border-radius: 8px;
            padding: 1.5em;
            margin: 1.5em 0;
            overflow-x: auto;
            border-left: 4px solid #4299e1;
        }
        
        pre code {
            background: none;
            border: none;
            color: #f7fafc;
            padding: 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th, td {
            border: 1px solid #e2e8f0;
            padding: 0.8em 1em;
            text-align: left;
        }
        
        th {
            background: #4299e1;
            color: white;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background: #f7fafc;
        }
        
        hr {
            border: none;
            height: 2px;
            background: linear-gradient(to right, #4299e1, #63b3ed, #4299e1);
            margin: 3em 0;
        }
        
        blockquote {
            border-left: 4px solid #4299e1;
            background: #f7fafc;
            padding: 1em 1.5em;
            margin: 1.5em 0;
            font-style: italic;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .header-info {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .completion-badge {
            background: #48bb78;
            color: white;
            padding: 0.5em 1em;
            border-radius: 25px;
            font-size: 1.1em;
            font-weight: 600;
            display: inline-block;
            margin: 0.5em;
        }
        
        .tech-stack {
            background: #edf2f7;
            padding: 1em;
            border-radius: 8px;
            margin: 1em 0;
            border-left: 4px solid #4299e1;
        }
        
        .feature-count {
            background: #fed7d7;
            color: #c53030;
            padding: 0.3em 0.8em;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9em;
        }
        
        .page-count {
            background: #bee3f8;
            color: #2b6cb0;
            padding: 0.3em 0.8em;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9em;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            h2 {
                page-break-before: auto;
            }
            
            pre {
                page-break-inside: avoid;
            }
            
            table {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header-info">
        <h1 style="border: none; color: white; margin: 0;">🚀 NB Student Hub</h1>
        <p style="font-size: 1.2em; margin: 0.5em 0;">종합 기능 분석 보고서</p>
        <div class="completion-badge">완성도 98%</div>
        <p style="font-size: 1em; margin: 1em 0 0 0;">개발환경: VSCode | 기술스택: Next.js 15, TypeScript, Firebase</p>
    </div>
    ${htmlContent}
</body>
</html>`;

    // 4. Puppeteer로 PDF 생성
    console.log('🚀 Puppeteer로 PDF 생성 중...');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
    
    const pdfPath = path.join(__dirname, '../docs/NB_Student_Hub_종합_기능_분석_보고서_2025-01-15.pdf');
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();
    
    console.log('✅ PDF 생성 완료!');
    console.log(`📍 파일 위치: ${pdfPath}`);
    console.log('🎉 NB Student Hub 종합 기능 분석 보고서 PDF가 성공적으로 생성되었습니다!');
    
  } catch (error) {
    console.error('❌ PDF 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
generateComprehensivePDFReport(); 