const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

async function generateUserGuidePDF() {
  try {
    console.log('Starting User Guide PDF generation...');
    
    // Read the markdown file
    const markdownPath = path.join(__dirname, '../docs/High_School_Students_Jobs_User_Guide_2025-07-17.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    
    // Convert markdown to HTML
    const htmlContent = marked(markdownContent);
    
    // Create complete HTML document
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>High School Students Jobs - User Guide</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      margin-top: 30px;
      font-size: 28px;
    }
    
    h2 {
      color: #34495e;
      border-bottom: 2px solid #e74c3c;
      padding-bottom: 8px;
      margin-top: 25px;
      font-size: 22px;
    }
    
    h3 {
      color: #2c3e50;
      margin-top: 20px;
      font-size: 18px;
    }
    
    p {
      margin: 12px 0;
      text-align: justify;
    }
    
    ul, ol {
      margin: 12px 0;
      padding-left: 25px;
    }
    
    li {
      margin: 8px 0;
    }
    
    strong {
      color: #2c3e50;
    }
    
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(to right, #3498db, #e74c3c);
      margin: 30px 0;
    }
    
    .header-info {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    @media print {
      body {
        font-size: 12px;
      }
      
      h1 {
        font-size: 20px;
      }
      
      h2 {
        font-size: 16px;
      }
      
      h3 {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
    
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    const outputPath = path.join(__dirname, '../docs/High_School_Students_Jobs_User_Guide_2025-07-17.pdf');
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1in',
        right: '0.8in',
        bottom: '1in',
        left: '0.8in'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; margin: 0 auto; color: #666;">
          <span>High School Students Jobs Platform - User Guide</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; margin: 0 auto; color: #666;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });
    
    await browser.close();
    
    console.log(`PDF generated successfully: ${outputPath}`);
    console.log('User Guide PDF generation completed!');
    
  } catch (error) {
    console.error('Error generating User Guide PDF:', error);
    process.exit(1);
  }
}

// Run the generator
generateUserGuidePDF(); 