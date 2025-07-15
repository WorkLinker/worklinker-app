'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Building, DollarSign, CheckCircle, Plus, Search } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobPostingService } from '@/lib/firebase-services';
// import { authService } from '@/lib/auth-service';
// import { User as FirebaseUser } from 'firebase/auth';

const JobPostingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  company: z.string().min(2, 'Please enter company name'),
  location: z.string().min(2, 'Please enter work location'),
  description: z.string().min(50, 'Detailed description must be at least 50 characters'),
  requirements: z.string().min(10, 'Please enter requirements'),
  salary: z.string().optional(),
  jobType: z.enum(['full-time', 'part-time', 'volunteer']),
  industry: z.string().min(1, 'Please select industry'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().optional(),
  agreement: z.boolean().refine((val) => val === true, 'Please agree to the terms')
});

type JobPostingForm = z.infer<typeof JobPostingSchema>;



export default function JobPostingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [user, setUser] = useState<FirebaseUser | null>(null);

  // // Check user authentication state
  // useEffect(() => {
  //   const unsubscribe = authService.onAuthStateChange((currentUser) => {
  //     setUser(currentUser);
  //   });
  //   return () => unsubscribe();
  // }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<JobPostingForm>({
    resolver: zodResolver(JobPostingSchema)
  });

  const onSubmit = async (data: JobPostingForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('🏢 Starting job posting registration...');
      
      // Save data to Firebase
      const result = await jobPostingService.submitJobPosting(data);
      
      if (result.success) {
        console.log('🎉 Job posting registered successfully!');
        setSubmitted(true);
        reset();
        setShowForm(false);
      }
    } catch (error) {
      console.error('❌ Job posting registration error:', error);
      alert('An error occurred during registration. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };



  if (submitted) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Job Posting Registered!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We will review your submitted job posting and notify you of the approval result via email.
              <br />
              This typically takes 1-2 days to process.
            </p>
            <div className="bg-sky-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-sky-900 mb-3">Next Steps</h2>
              <ul className="text-sky-800 space-y-2">
                <li>• Administrator will review the submitted job posting</li>
                <li>• Students can view the posting after approval</li>
                <li>• You will be contacted when suitable students are found</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.href = '/job-listings'}
              className="btn-primary"
            >
              View Job Listings
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
            src="/images/기업채용.png"
            alt="Company hiring"
            fill
            sizes="100vw"
            className="object-cover object-center"
            style={{ objectPosition: '50% 20%' }}
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                                      <h1 className="hero-title hero-title-premium mb-4 sm:mb-6">
              Connecting students and companies
            </h1>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Job Board
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            Provide suitable jobs for high school students. 
            <br />
            You can register various opportunities such as full-time, part-time, and volunteer work.
          </p>
          <p className="text-lg text-sky-600 font-semibold mb-8">
            A recruitment platform to meet outstanding Canadian talent
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="bg-sky-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-sky-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
            >
              <Plus size={24} />
              <span>Post a Job</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/job-listings'}
              className="bg-purple-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-purple-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
            >
              <Building size={24} />
              <span>View Job Listings</span>
            </button>
          </div>
        </div>
      </section>



      {/* Job Listings Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              📋 View Real-time Job Listings
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Want to check all the job postings registered so far?
              <br />
              Click the <span className="font-bold text-purple-600">View Job Listings</span> button to 
              <br />
              see <span className="font-bold">all registered job postings</span>!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-purple-50 rounded-xl p-6">
                <Building size={32} className="text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Real Data</h3>
                <p className="text-gray-600 text-sm">Job postings updated in real-time</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6">
                <Search size={32} className="text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Smart Search</h3>
                <p className="text-gray-600 text-sm">Search and filter by company, position, and location</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6">
                <DollarSign size={32} className="text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Salary Information</h3>
                <p className="text-gray-600 text-sm">Transparent salary information from hourly to annual</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">💡 Please Note!</h3>
              <p className="mb-4">
                Job postings registered on this page will appear in the job listings after administrator approval.
                <br />
                If your registered job posting is not visible in the list, please wait a moment!
              </p>
              <button
                onClick={() => window.location.href = '/job-listings'}
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                🔍 Check Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Job Posting Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Post a Job</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Café Part-time Position"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      {...register('company')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., ABC Café"
                    />
                    {errors.company && (
                      <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Location *
                    </label>
                    <input
                      type="text"
                      {...register('location')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Fredericton, NB"
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary (Optional)
                    </label>
                    <input
                      type="text"
                      {...register('salary')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., $15.00/hour"
                    />
                  </div>
                </div>

                {/* Detailed Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Please describe specific job duties and work environment..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements *
                  </label>
                  <textarea
                    {...register('requirements')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Please enter required skills, experience, qualifications, etc..."
                  />
                  {errors.requirements && (
                    <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Type *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('jobType')}
                          value="full-time"
                          className="mr-2"
                        />
                        <span>Full-time (during breaks)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('jobType')}
                          value="part-time"
                          className="mr-2"
                        />
                        <span>Part-time (weekends/after school)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('jobType')}
                          value="volunteer"
                          className="mr-2"
                        />
                        <span>Volunteer work</span>
                      </label>
                    </div>
                    {errors.jobType && (
                      <p className="mt-1 text-sm text-red-600">{errors.jobType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry *
                    </label>
                    <select
                      {...register('industry')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Please select industry</option>
                      <option value="retail-sales">Retail/Sales</option>
                      <option value="food-service">Food/Restaurant</option>
                      <option value="customer-service">Customer Service</option>
                      <option value="education-tutoring">Education/Tutoring</option>
                      <option value="office-admin">Office/Administration</option>
                      <option value="construction-manufacturing">Construction/Manufacturing</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="it-technology">IT/Technology</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="transportation-delivery">Transportation/Delivery</option>
                      <option value="cleaning-maintenance">Cleaning/Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.industry && (
                      <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      {...register('contactEmail')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="contact@company.com"
                    />
                    {errors.contactEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      {...register('contactPhone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="506-123-4567"
                    />
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      {...register('agreement')}
                      className="mt-1 mr-3"
                    />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-2">Job Posting Terms Agreement *</p>
                      <p>
                        Registered job postings will be published after administrator review, 
                        and content not suitable for high school students may not be approved. 
                        Please provide accurate information.
                      </p>
                    </div>
                  </div>
                  {errors.agreement && (
                    <p className="mt-2 text-sm text-red-600">{errors.agreement.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 