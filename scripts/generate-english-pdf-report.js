const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function generateEnglishPDFReport() {
  try {
    console.log('Generating English PDF report...');

    // 1. Read English markdown file
    const markdownPath = path.join(__dirname, '../docs/NB_Student_Hub_Technical_Report_2025-01-15.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    console.log('English markdown file read successfully');

    // 2. Convert markdown to HTML
    const htmlContent = marked(markdownContent);
    console.log('HTML conversion completed');

    // 3. Generate complete HTML document with CSS styling
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NB Student Hub - Technical Development Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a202c;
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
            font-weight: 700;
        }
        
        h2 {
            color: #2d3748;
            font-size: 1.8em;
            margin: 2em 0 1em 0;
            border-left: 5px solid #4299e1;
            padding-left: 1rem;
            background: linear-gradient(to right, #ebf8ff, transparent);
            padding: 0.8rem 1rem;
            font-weight: 600;
        }
        
        h3 {
            color: #4a5568;
            font-size: 1.3em;
            margin: 1.5em 0 0.8em 0;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.3em;
            font-weight: 600;
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
            color: #2d3748;
        }
        
        strong {
            color: #1a202c;
            font-weight: 600;
        }
        
        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }
        
        li {
            margin-bottom: 0.5em;
            color: #2d3748;
        }
        
        code {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 0.2em 0.4em;
            font-family: 'Monaco', 'Consolas', 'SF Mono', monospace;
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
        
        .tech-badge {
            background: #4299e1;
            color: white;
            padding: 0.3em 0.8em;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
            margin: 0.2em;
            display: inline-block;
        }
        
        .success-badge {
            background: #48bb78;
            color: white;
            padding: 0.2em 0.6em;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: 500;
        }
        
        .chapter-header {
            background: #f7fafc;
            border-left: 4px solid #4299e1;
            padding: 1rem;
            margin: 2rem 0 1rem 0;
            border-radius: 0 8px 8px 0;
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
        <h1 style="border: none; color: white; margin: 0;">NB Student Hub</h1>
        <p style="font-size: 1.2em; margin: 0.5em 0 0 0;">Technical Development Report - Production Ready</p>
        <p style="font-size: 1em; margin: 0.5em 0 0 0;">New Brunswick High School Student Job Platform</p>
    </div>
    ${htmlContent}
    
    <div style="margin-top: 3rem; padding: 2rem; background: #f7fafc; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0; color: #2d3748;">Development Environment</h3>
        <p style="margin: 0.5rem 0; color: #4a5568;">Visual Studio Code + Node.js + React + TypeScript</p>
        <p style="margin: 0.5rem 0; color: #4a5568;">Built for Canadian High School Students</p>
    </div>
</body>
</html>`;

    // 4. Generate PDF with Puppeteer
    console.log('Generating PDF with Puppeteer...');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
    
    const pdfPath = path.join(__dirname, '../docs/NB_Student_Hub_Technical_Report_2025-01-15.pdf');
    
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
    
    console.log('PDF generation completed successfully!');
    console.log(`File location: ${pdfPath}`);
    console.log('English technical report PDF has been generated successfully!');
    
  } catch (error) {
    console.error('Error occurred during PDF generation:', error);
    process.exit(1);
  }
}

// Execute script
generateEnglishPDFReport(); 