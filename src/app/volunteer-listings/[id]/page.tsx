'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar, 
  Building, 
  Phone, 
  Mail, 
  Users, 
  Heart, 
  CheckCircle,
  User,
  FileText
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { volunteerService } from '@/lib/firebase-services';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function VolunteerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user] = useAuthState(auth);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [posting, setPosting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    grade: '',
    school: '',
    motivation: '',
    experience: '',
    availability: ''
  });

  const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  const loadPostingDetails = useCallback(async (postingId: string) => {
    try {
      setLoading(true);
      // Ideally, we need an API to fetch a single posting,
      // but for now we're using a method to find it from the full list
      const allPostings = await volunteerService.getApprovedVolunteerPostings();
      const foundPosting = allPostings.find(p => p.id === postingId);
      
      if (foundPosting) {
        setPosting(foundPosting);
        // Increment view count
        await volunteerService.incrementVolunteerViews(postingId);
      } else {
        // Posting not found
        router.push('/volunteer-listings');
      }
    } catch (error) {
      console.error('❌ Error loading volunteer opportunity details:', error);
      router.push('/volunteer-listings');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (params.id) {
      loadPostingDetails(params.id as string);
    }
  }, [params.id, loadPostingDetails]);

  useEffect(() => {
    if (user?.email) {
      setApplicationData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Login is required to apply for volunteer opportunities.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await volunteerService.submitVolunteerApplication(params.id as string, {
        ...applicationData,
        userEmail: user.email,
        postingTitle: posting.title,
        organizationName: posting.organizationName
      });

      if (result.success) {
        setIsSubmitted(true);
        setShowApplicationForm(false);
      }
    } catch (error) {
      console.error('❌ Volunteer application error:', error);
      alert('An error occurred during application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-CA');
  };

  const getOrganizationTypeColor = (type: string) => {
    const colors = {
      'Library': 'bg-blue-100 text-blue-800',
      'Nursing Home': 'bg-pink-100 text-pink-800',
      'Senior Center': 'bg-purple-100 text-purple-800',
      'Pharmacy/Medical': 'bg-red-100 text-red-800',
      'Government/Public': 'bg-gray-100 text-gray-800',
      'School/Education': 'bg-green-100 text-green-800',
      'Religious': 'bg-yellow-100 text-yellow-800',
      'Environmental': 'bg-emerald-100 text-emerald-800',
      'Animal Shelter': 'bg-orange-100 text-orange-800',
      'Food Bank': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800',
      // Legacy Korean keys for backward compatibility
      '도서관': 'bg-blue-100 text-blue-800',
      '요양원/요양소': 'bg-pink-100 text-pink-800',
      '노인정/복지관': 'bg-purple-100 text-purple-800',
      '약국/의료기관': 'bg-red-100 text-red-800',
      '정부기관/공공기관': 'bg-gray-100 text-gray-800',
      '학교/교육기관': 'bg-green-100 text-green-800',
      '종교기관': 'bg-yellow-100 text-yellow-800',
      '환경단체': 'bg-emerald-100 text-emerald-800',
      '동물보호소': 'bg-orange-100 text-orange-800',
      '푸드뱅크/급식소': 'bg-indigo-100 text-indigo-800',
      '기타': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading volunteer opportunity information...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!posting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Volunteer Opportunity Not Found
            </h3>
            <Link
              href="/volunteer-listings"
              className="text-green-600 hover:underline"
            >
              Return to Volunteer Opportunities List
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Volunteer Application Completed!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for applying to volunteer for<br/>
                <strong>{posting.title}</strong> at <strong>{posting.organizationName}</strong>.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">📋 Next Steps</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• The organization coordinator will review your application</li>
                  <li>• If selected, the coordinator will contact you directly</li>
                  <li>• You will receive volunteer schedule and details</li>
                  <li>• Start volunteering!</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/volunteer-listings"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Other Opportunities
                </Link>
                <Link
                  href="/my-page"
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View My Applications
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      
      {/* Navigation Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-green-600">Home</Link>
            <span className="mx-2">•</span>
            <Link href="/volunteer-listings" className="hover:text-green-600">Volunteer Opportunities</Link>
            <span className="mx-2">•</span>
            <span className="text-green-600">{posting.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <Link
            href="/volunteer-listings"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Return to Volunteer Opportunities List
          </Link>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            
            {/* Header */}
            <div className="p-8 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrganizationTypeColor(posting.organizationType)}`}>
                      {posting.organizationType}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users size={16} className="mr-1" />
                      {posting.applicantCount || 0} applicants
                    </div>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {posting.title}
                  </h1>
                  
                  <div className="flex items-center text-gray-600 mb-6">
                    <Building size={20} className="mr-3 text-green-600" />
                    <span className="text-lg font-medium">{posting.organizationName}</span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin size={16} className="mr-2 text-green-600" />
                      <span>{posting.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock size={16} className="mr-2 text-green-600" />
                      <span>{posting.timeCommitment}</span>
                    </div>
                    {posting.startDate && (
                      <div className="flex items-center text-gray-600">
                        <Calendar size={16} className="mr-2 text-green-600" />
                        <span>{posting.startDate} ~ {posting.endDate || 'Ongoing'}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <FileText size={16} className="mr-2 text-green-600" />
                      <span>Posted: {formatDate(posting.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {user ? (
                    <button
                      onClick={() => setShowApplicationForm(true)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center"
                    >
                      <Heart size={20} className="mr-2" />
                      Apply for Volunteer
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Please log in to apply</p>
                      <button className="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed">
                        Login Required
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Description */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Description</h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{posting.description}</p>
                    </div>
                  </div>

                  {/* Required Skills */}
                  {posting.requiredSkills && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Required Skills/Experience</h2>
                      <p className="text-gray-700">{posting.requiredSkills}</p>
                    </div>
                  )}

                  {/* Benefits */}
                  {posting.benefits && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Volunteer Benefits</h2>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800">{posting.benefits}</p>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {posting.additionalInfo && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
                      <p className="text-gray-700">{posting.additionalInfo}</p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  
                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700">
                        <User size={16} className="mr-3 text-green-600" />
                        <span>{posting.contactPerson}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Mail size={16} className="mr-3 text-green-600" />
                        <a href={`mailto:${posting.email}`} className="hover:text-green-600">
                          {posting.email}
                        </a>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Phone size={16} className="mr-3 text-green-600" />
                        <a href={`tel:${posting.phone}`} className="hover:text-green-600">
                          {posting.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Volunteer Information</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Organization Type:</span>
                        <span className="ml-2 text-gray-600">{posting.organizationType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Activity Location:</span>
                        <span className="ml-2 text-gray-600">{posting.location}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Time Commitment:</span>
                        <span className="ml-2 text-gray-600">{posting.timeCommitment}</span>
                      </div>
                      {posting.startDate && (
                        <div>
                          <span className="font-medium text-gray-700">Period:</span>
                          <span className="ml-2 text-gray-600">
                            {posting.startDate} ~ {posting.endDate || 'Ongoing'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Apply for Volunteer</h2>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                {posting.organizationName} - {posting.title}
              </p>
            </div>

            {/* Application Form */}
            <form onSubmit={handleApplicationSubmit} className="p-6 space-y-4">
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={applicationData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={applicationData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                    required
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={applicationData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="(506) 555-0123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade *
                  </label>
                  <select
                    name="grade"
                    value={applicationData.grade}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your grade</option>
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name *
                </label>
                <input
                  type="text"
                  name="school"
                  value={applicationData.school}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Fredericton High School"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivation *
                </label>
                <textarea
                  name="motivation"
                  value={applicationData.motivation}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Please explain in detail why you are applying for this volunteer opportunity."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Experience
                </label>
                <textarea
                  name="experience"
                  value={applicationData.experience}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Please describe any relevant volunteer or activity experience."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability *
                </label>
                <input
                  type="text"
                  name="availability"
                  value={applicationData.availability}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. Weekdays 3pm-6pm, Weekends flexible"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </span>
                  ) : (
                    'Apply for Volunteer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 