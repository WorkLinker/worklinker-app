'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase,
  Building, 
  MapPin, 
  DollarSign,
  Users,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { myPageService, jobApplicationService } from '@/lib/firebase-services';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType?: string;
  salary?: string;
  description?: string;
  approved?: boolean;
  views?: number;
  createdAt?: unknown;
  posterEmail?: string;
  requirements?: string;
  benefits?: string;
  contactEmail?: string;
  contactPhone?: string;
  applicationDeadline?: string;
  updatedAt?: unknown;
}

export default function MyJobsPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  const loadMyJobPostings = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      console.log('📋 Loading job postings for:', user.email);

      // Get all user activities (includes job postings)
      const activities = await myPageService.getUserActivities(user.email);
      const myJobs = (activities.jobPostings || []) as JobPosting[];

      // Get applicant counts for each job posting
      const counts: { [key: string]: number } = {};
      await Promise.all(
        myJobs.map(async (job) => {
          try {
            const applications = await jobApplicationService.getApplicationsByJobPosting(job.id);
            counts[job.id] = applications.length;
          } catch (error) {
            console.error(`❌ Error fetching applicants for job ${job.id}:`, error);
            counts[job.id] = 0;
          }
        })
      );

      setJobPostings(myJobs);
      setApplicantCounts(counts);
      console.log('✅ Job postings loaded successfully:', myJobs.length, 'postings');
    } catch (error) {
      console.error('❌ Error loading job postings:', error);
      alert('Failed to load job postings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user) {
      loadMyJobPostings();
    }
  }, [user, loadMyJobPostings]);


  const getStatusBadge = (approved: boolean) => {
    if (approved === true) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Approved
        </span>
      );
    } else if (approved === false) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock size={12} className="mr-1" />
          Pending Review
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle size={12} className="mr-1" />
          Rejected
        </span>
      );
    }
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    const ts = timestamp as { toDate?: () => Date } | Date | string | number;
    
    if (ts && typeof ts === 'object' && 'toDate' in ts && typeof ts.toDate === 'function') {
      date = ts.toDate();
    } else if (ts instanceof Date) {
      date = ts;
    } else {
      date = new Date(ts as string | number);
    }
    
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navigation />
        <div className="pt-20 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <AlertCircle size={64} className="text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Login Required
              </h2>
              <p className="text-gray-600 mb-6">
                Please log in to view your job postings.
              </p>
              <button
                onClick={() => router.push('/job-postings')}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Back to Job Postings
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading your job postings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  <Briefcase size={32} className="mr-3 text-purple-500" />
                  My Job Postings
                </h1>
                <p className="text-gray-600">
                  Manage all your job postings and applicants in one place
                </p>
              </div>
              <button
                onClick={() => router.push('/job-postings')}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                + Post New Job
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Postings</p>
                  <p className="text-3xl font-bold text-gray-900">{jobPostings.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Briefcase size={24} className="text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Applicants</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Object.values(applicantCounts).reduce((sum, count) => sum + count, 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approved Posts</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {jobPostings.filter(job => job.approved === true).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Job Postings List */}
          {jobPostings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Briefcase size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Job Postings Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by creating your first job posting to find talented candidates!
              </p>
              <button
                onClick={() => router.push('/job-postings')}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                Create First Job Posting
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobPostings.map((job) => (
                <div key={job.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        {getStatusBadge(job.approved)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Building size={14} className="mr-1" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          <span>{job.location}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center">
                            <DollarSign size={14} className="mr-1" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>Posted: {formatDate(job.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center text-blue-600">
                          <Users size={16} className="mr-1" />
                          <span className="font-medium">{applicantCounts[job.id] || 0} Applicants</span>
                        </div>
                        {job.views !== undefined && (
                          <div className="flex items-center text-gray-500">
                            <Eye size={16} className="mr-1" />
                            <span>{job.views || 0} Views</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {job.approved === true && (
                        <button
                          onClick={() => router.push(`/job-listings/${job.id}/applicants`)}
                          className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                        >
                          <Users size={16} className="mr-1" />
                          View Applicants
                          <ArrowRight size={16} className="ml-1" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          // TODO: Implement edit functionality
                          alert('Edit functionality coming soon!');
                        }}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Edit size={16} className="mr-1" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this job posting?')) {
                            // TODO: Implement delete functionality
                            alert('Delete functionality coming soon!');
                          }
                        }}
                        className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Job Description Preview */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

