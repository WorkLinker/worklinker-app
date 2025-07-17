# NB Student Hub - User Guide and Development Manual

## Chapter 1: Project Overview
NB Student Hub is a comprehensive employment and volunteer matching platform specifically designed for high school students in the New Brunswick region of Canada.

---

## Chapter 2: Project Structure

```
part1/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable components
│   ├── lib/                 # Utility and service functions
│   └── types/               # TypeScript type definitions
├── docs/                    # Documentation and reports
├── public/                  # Static files (images, icons, etc.)
└── scripts/                 # Development scripts
```

---

## Chapter 3: Development Environment Setup

### System Requirements
- Node.js 18 or higher
- npm package manager
- Git version control
- Visual Studio Code (recommended)

### Installation and Setup
```bash
# Step 1: Clone repository
git clone https://github.com/WorkLinker/worklinker-app.git
cd worklinker-app

# Step 2: Install dependencies
npm install

# Step 3: Environment variable setup
cp .env.local.example .env.local
# Configure Firebase and other API keys in .env.local file

# Step 4: Start development server
npm run dev
```

### Available Commands
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # Code quality check
npm run generate:pdf # Generate technical report PDF
```

---

## Chapter 4: Environment Configuration

Set the following environment variables in the .env.local file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Email Service (MailerSend)
MAILERSEND_API_TOKEN=your_mailersend_token

# Additional Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Chapter 5: Main Features Usage

### Homepage
- URL: /
- Function: Platform introduction, key features overview, latest job postings preview

### Job Posting System
- View Jobs: /job-listings - View all job postings with filtering
- Post Jobs: /job-postings - Company job posting registration
- Apply: /job-listings/[id]/apply - Apply to specific job posting
- Manage Applicants: /job-listings/[id]/applicants - Company applicant management

### Job Seeker System
- Register: /job-seekers - Student job seeker profile registration
- View Profiles: /student-profiles - View registered student profiles

### Volunteer System
- Opportunities: /volunteer-listings - View volunteer opportunities
- Post Opportunities: /volunteer-postings - Register volunteer opportunities

### Community
- Board: /community - Community bulletin board and information sharing
- Posts: /community/[id] - Individual post viewing

### Additional Features
- Contact: /contact - Contact inquiry registration and management
- References: /references - Reference letter management system
- My Page: /my-page - User personal activity history
- Admin: /admin - Administrator dashboard (admin access only)

---

## Chapter 6: Administrator Functions

### Administrator Account Setup
Administrator emails are configured in the isAdmin function in src/lib/firebase-services.ts:

```typescript
export const isAdmin = (email: string): boolean => {
  const adminEmails = [
    'admin@example.com',  // Add administrator emails here
    'manager@example.com'
  ];
  return adminEmails.includes(email.toLowerCase());
};
```

### Administrator Dashboard Features
- Approval Management: Approve/reject job seekers, job postings, volunteer activities
- Statistics View: Platform usage status and activity statistics
- File Management: Manage and download uploaded files
- Activity Logs: Monitor all user activities
- Contact Management: View and manage user inquiries

---

## Chapter 7: Responsive Design

This platform provides optimized experience across various devices:

- Desktop: 1200px and above - Full feature access
- Tablet: 768px-1199px - Adaptive layout
- Mobile: 767px and below - Mobile-optimized interface

---

## Chapter 8: Security and Authentication

### Firebase Authentication
- Email/password authentication system
- Automatic login persistence
- Administrator privilege separation system

### Data Security
- Firestore security rules applied
- Client-side validation
- Server-side validation (API Routes)

---

## Chapter 9: Database Structure

### Firestore Collections
```
├── jobPostings            # Job postings
├── jobSeekers            # Job applications
├── jobApplications       # Application history
├── volunteerPostings     # Volunteer postings
├── volunteerApplications # Volunteer applications
├── communityPosts        # Community posts
├── contacts              # Contact inquiries
├── references            # Reference letters
├── eventRegistrations    # Event registrations
├── uploadedFiles         # File metadata
└── logs                  # Activity logs
```

### Key Field Structure Example
```javascript
// jobPostings collection
{
  title: "Part-time Sales Assistant",
  company: "Local Store Inc.",
  location: "Fredericton, NB",
  jobType: "part-time",
  industry: "Retail",
  description: "Job description...",
  requirements: "Requirements...",
  contactEmail: "hr@localstore.com",
  approved: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Chapter 10: Deployment and Hosting

### Vercel Deployment (Currently Used)
1. GitHub Integration: Automatic deployment on code push
2. Environment Variables: Set in Vercel Dashboard
3. Domain Connection: Custom domain connection available

### Deployment URLs
- Production: https://worklinker-app.vercel.app
- Development: http://localhost:3000

---

## Chapter 11: Development Tips

### Adding New Pages
```bash
# 1. Create new folder in app directory
mkdir src/app/new-page

# 2. Create page.tsx file
touch src/app/new-page/page.tsx
```

### Adding New Components
```bash
# Create component in components directory
touch src/components/NewComponent.tsx
```

### Adding Firebase Service Functions
Add new service functions to src/lib/firebase-services.ts and export them.

### Adding Type Definitions
Define new TypeScript types in src/types/index.ts.

---

## Chapter 12: Troubleshooting

### Common Issues

#### Firebase Connection Errors
```bash
# Check environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY

# Recheck .env.local file
cat .env.local
```

#### Build Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Type checking
npm run lint
```

#### Image Loading Errors
- Check image paths in public/ directory
- Recommend using Next.js Image component

---

## Chapter 13: Support and Contact

### Development Inquiries
- Email: [Developer Email]
- GitHub Issues: Bug reports and feature requests

### Usage Inquiries
- Platform Contact: Use /contact page
- Administrator Contact: Use administrator dashboard

---

## Chapter 14: Version History

### v1.0 (January 15, 2025)
- Initial platform completion
- All major features implemented
- Firebase index optimization
- File management system completion
- Administrator dashboard implementation
- Responsive design completion

### Future Plans
- Domain connection (nbhischooljobs.com)
- Email notification system enhancement
- AI-based matching system
- PWA (Progressive Web App) application

---

## Chapter 15: Development Technologies Details

### Primary Languages Used
- HTML5: Semantic markup for accessible web structure
- CSS3: Modern styling with Flexbox and CSS Grid
- JavaScript ES6+: Modern JavaScript features and syntax
- TypeScript: Static typing for better code quality and development experience

### Development Environment Configuration
- Visual Studio Code: Primary integrated development environment
- Node.js: JavaScript runtime for server-side development
- npm: Package manager for dependency management
- Git: Version control system for code management

### Framework Implementation
- React: Component-based user interface library
- Next.js: Full-stack React framework with server-side rendering capabilities
- Tailwind CSS: Utility-first CSS framework for rapid UI development
- Firebase: Backend-as-a-Service for database and authentication

### Code Organization
- Component-based architecture with React functional components
- TypeScript interfaces for type safety
- Custom hooks for reusable logic
- API routes for server-side functionality

---

Document Last Updated: January 15, 2025
Project Status: Production Ready (98% Complete) 