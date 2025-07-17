'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  FileText, 
  Star,
  Clock,
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Upload,
  CheckCircle,
  Plus
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobSeekerService } from '@/lib/firebase-services';
import { authService } from '@/lib/auth-service';
import { User as FirebaseUser } from 'firebase/auth';

// Job application form schema
const JobSeekerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  grade: z.string().min(1, 'Please select your grade'),
  school: z.string().min(2, 'Please enter your school name'),
  skills: z.string().min(1, 'Please enter your skills/experience'),
  availability: z.enum(['full-time', 'part-time', 'volunteer']),
  agreement: z.boolean().refine((val) => val === true, 'Please agree to the terms')
});

type JobSeekerForm = z.infer<typeof JobSeekerSchema>;

export default function StudentProfilesPage() {
  // Existing student profile state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  
  // Slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 2;
  
  // Job application state
  const [showJobSeekerForm, setShowJobSeekerForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User authentication state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form management
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<JobSeekerForm>({
    resolver: zodResolver(JobSeekerSchema)
  });

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check user authentication state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser: FirebaseUser | null) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    // Always load student list (no authentication required)
    loadApprovedStudents();

    return () => unsubscribe();
  }, []);

  const loadApprovedStudents = async () => {
    try {
      setLoading(true);
      console.log('👨‍🎓 Loading approved student list...');
      
      const approvedStudents = await jobSeekerService.getApprovedJobSeekers();
      setStudents(approvedStudents);
      
      console.log('✅ Approved student list loaded:', approvedStudents.length, 'students');
    } catch (error) {
      console.error('❌ Error loading student list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size limit (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be 5MB or less.');
        return;
      }
      
      // File format restriction
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, DOC, and DOCX files are allowed.');
        return;
      }
      
      setResumeFile(file);
    }
  };

  const onSubmit = async (data: JobSeekerForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('📝 Starting job application submission...');
      
      const result = await jobSeekerService.submitApplication(data, resumeFile || undefined);
      
      if (result.success) {
        console.log('🎉 Job application submitted successfully!');
        setSubmitted(true);
        reset();
        setResumeFile(null);
        setShowJobSeekerForm(false);
      }
    } catch (error) {
      console.error('❌ Job application submission error:', error);
      alert('An error occurred during submission. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-CA');
    } catch {
      return '';
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    const badges = {
      'full-time': { label: 'Full-time', color: 'bg-green-100 text-green-800' },
      'part-time': { label: 'Part-time', color: 'bg-blue-100 text-blue-800' },
      'volunteer': { label: 'Volunteer', color: 'bg-purple-100 text-purple-800' }
    };
    
    const badge = badges[availability as keyof typeof badges] || { label: availability, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  // Filtered student list
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.skills?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
    const matchesAvailability = availabilityFilter === 'all' || student.availability === availabilityFilter;
    
    return matchesSearch && matchesGrade && matchesAvailability;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Contact student
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleContactStudent = (student: any) => {
    const subject = `[Job Inquiry] Contacting ${student.name}`;
    const body = `Hello ${student.name},

I found your profile through the High School Students Jobs and would like to contact you.

Grade: Grade ${student.grade}
School: ${student.school}
Skills/Experience: ${student.skills}

I would like to discuss additional details and possible interview schedules.

Thank you.`;

    const mailtoLink = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  // Download resume (Firebase Storage direct link method)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDownloadResume = async (student: any) => {
    try {
      if (!student.resumeUrl) {
        alert('No resume file available.');
        return;
      }

      // If only filename exists (upload pending)
      if (!student.resumeUrl || !student.resumeUrl.startsWith('http')) {
        alert(`${student.resumeFileName || 'File'} is still being processed. Please try again later.`);
        return;
      }

      console.log('📥 Starting resume download:', student.resumeFileName);

      // Set filename (with fallback)
      const fileName = student.resumeFileName || `${student.name}_resume.pdf`;
      
      // Firebase Storage URL을 직접 사용하여 다운로드
      const link = document.createElement('a');
      link.href = student.resumeUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Resume download initiated successfully:', fileName);
    } catch (error) {
      console.error('❌ Resume download error:', error);
      alert('An error occurred while downloading the resume. Please check your network connection.');
    }
  };

  const handleJobSeekerFormOpen = () => {
    if (!user) {
      alert('You need to sign in to submit a job application. Please click the Sign In button at the top.');
      return;
    }
    setShowJobSeekerForm(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading page...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full screen hero section */}
      <section className="relative h-screen overflow-hidden">
        {/* Navigation overlay */}
        <div className="absolute inset-x-0 top-0 z-50">
          <Navigation />
        </div>
        
        {/* Slide container */}
        <div className="relative h-full">
          {/* First slide */}
          <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
            currentSlide === 0 ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="relative h-full">
              <Image
                src="/images/student-jobs.png"
                alt="Student job search"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-end justify-center pb-20">
                <div className="container mx-auto px-6 text-center">
                  <h1 className="hero-title hero-title-default mb-4 sm:mb-6 text-center">
                    Stories of talented students with potential and passion
                  </h1>
                  
                  {/* Two button cards */}
                  <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                    {/* Browse student profiles button */}
                    <button
                      onClick={() => {
                        const profileSection = document.getElementById('student-profiles');
                        profileSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="group bg-white/90 backdrop-blur-sm text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3 border-2 border-transparent hover:border-orange-400"
                    >
                      <Eye size={24} className="group-hover:text-orange-500 transition-colors" />
                      <span>Browse Student Profiles 👀</span>
                    </button>

                    {/* Submit job application button */}
                    <button
                      onClick={handleJobSeekerFormOpen}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3"
                    >
                      <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                      <span>Submit Job Application 📝</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second slide */}
          <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
            currentSlide === 1 ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="relative h-full">
              <Image
                src="/images/student-profiles.png"
                alt="Student profile"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-end justify-center pb-20">
                <div className="container mx-auto px-6 text-center">
                  <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 text-center">
                    Turn your dreams
                    <span className="block bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                      into reality
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto text-center">
                    Upload your resume and enter your basic information.<br/>
                    Help employers discover your talents!
                  </p>
                  
                  {/* Two button cards */}
                  <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                    {/* Browse student profiles button */}
                    <button
                      onClick={() => {
                        const profileSection = document.getElementById('student-profiles');
                        profileSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="group bg-white/90 backdrop-blur-sm text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3 border-2 border-transparent hover:border-sky-400"
                    >
                      <Eye size={24} className="group-hover:text-sky-500 transition-colors" />
                      <span>Browse Student Profiles 👀</span>
                    </button>

                    {/* Submit job application button */}
                    <button
                      onClick={handleJobSeekerFormOpen}
                      className="group bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3"
                    >
                      <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                      <span>Submit Job Application 📋</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-40">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? 'bg-white shadow-lg scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 z-40"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 z-40"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      {/* Student profiles section */}
      <section id="student-profiles" className="py-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Approved <span className="text-sky-500">Student Profiles</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Outstanding student profiles that have passed administrator review. 
              Check out each student&apos;s information and get in touch!
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-sky-500 mb-2">{students.length}</div>
              <div className="text-gray-600">Total Students</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">{filteredStudents.length}</div>
              <div className="text-gray-600">Search Results</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">{totalPages}</div>
              <div className="text-gray-600">Total Pages</div>
            </div>
          </div>

          {/* Search and filters */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, school, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="all">All Grades</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>

                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="all">All Work Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>

              {/* Job application button */}
              <button
                onClick={handleJobSeekerFormOpen}
                className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center space-x-2 whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Submit Application</span>
              </button>
            </div>
          </div>

          {/* Student list */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading student list...</p>
            </div>
          ) : currentStudents.length === 0 ? (
            <div className="text-center py-20">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {students.length === 0 ? 'No students registered' : 'No search results'}
              </h3>
              <p className="text-gray-500">
                {students.length === 0 
                  ? 'Be the first student!' 
                  : 'Try different search terms or filters.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Student card grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {currentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-2"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center">
                            <User size={24} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-500">Grade {student.grade}</p>
                          </div>
                        </div>
                        {getAvailabilityBadge(student.availability)}
                      </div>

                      {/* Information */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <School size={16} />
                          <span className="text-sm">{student.school}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail size={16} />
                          <span className="text-sm">{student.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone size={16} />
                          <span className="text-sm">{student.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock size={16} />
                          <span className="text-sm">Applied: {formatDate(student.createdAt)}</span>
                        </div>
                      </div>

                      {/* Skills/Experience */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Star size={16} className="mr-1" />
                          Skills & Experience
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{student.skills}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleContactStudent(student)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                        >
                          <Mail size={16} />
                          <span>Contact</span>
                        </button>
                        {student.resumeUrl && (
                          <button 
                            onClick={() => handleDownloadResume(student)}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Download Resume"
                          >
                            <Download size={16} className="text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === pageNumber
                            ? 'bg-sky-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Job application form modal */}
      {showJobSeekerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Job Application</h2>
                <button
                  onClick={() => setShowJobSeekerForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="John Smith"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="student@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="506-123-4567"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade *
                      </label>
                      <select
                        {...register('grade')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      >
                        <option value="">Select your grade</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                      {errors.grade && (
                        <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name *
                    </label>
                    <input
                      type="text"
                      {...register('school')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="e.g., Fredericton High School"
                    />
                    {errors.school && (
                      <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
                    )}
                  </div>
                </div>

                {/* Resume upload */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Resume Upload</h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      id="resume"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="resume" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload size={48} className="text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Select your resume file
                        </p>
                        <p className="text-sm text-gray-500">
                          Only PDF, DOC, DOCX files allowed (max 5MB)
                        </p>
                      </div>
                    </label>
                  </div>

                  {resumeFile && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <FileText size={20} className="text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">{resumeFile.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills/Experience */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Skills & Experience</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills, Experience, Interests *
                    </label>
                    <textarea
                      {...register('skills')}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="e.g., Computer basics, customer service, teamwork, responsibility, etc."
                    />
                    {errors.skills && (
                      <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Type *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('availability')}
                          value="full-time"
                          className="mr-2"
                        />
                        <span>Full-time (during breaks)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('availability')}
                          value="part-time"
                          className="mr-2"
                        />
                        <span>Part-time (during school)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('availability')}
                          value="volunteer"
                          className="mr-2"
                        />
                        <span>Volunteer work</span>
                      </label>
                    </div>
                    {errors.availability && (
                      <p className="mt-1 text-sm text-red-600">{errors.availability.message}</p>
                    )}
                  </div>
                </div>

                {/* Terms agreement */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('agreement')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the collection and use of personal information *
                    </span>
                  </label>
                  {errors.agreement && (
                    <p className="mt-1 text-sm text-red-600">{errors.agreement.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowJobSeekerForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Application</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {submitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-gray-600 mb-6">
                Your job application has been successfully submitted. 
                Your profile will be published after administrator review and approval.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 