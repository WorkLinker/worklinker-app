'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  User, 
  Activity, 
  Briefcase, 
  MessageSquare, 
  Mail, 
  Calendar,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Eye,
  ArrowLeft,
  Camera
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { authService } from '@/lib/auth-service';
import { myPageService } from '@/lib/firebase-services';
import { User as FirebaseUser } from 'firebase/auth';

export default function MyPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activities, setActivities] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Load existing saved profile image
        const savedImage = localStorage.getItem(`profileImage_${currentUser.email}`);
        if (savedImage) {
          setProfileImage(savedImage);
        }
        
        try {
          const userActivities = await myPageService.getUserActivities(currentUser.email!);
          const userStats = await myPageService.getUserStats(currentUser.email!);
          setActivities(userActivities);
          setStats(userStats);
        } catch (error) {
          console.error('Activity history loading error:', error);
        }
      } else {
        // Redirect to home if not logged in
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const formatDate = (timestamp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!timestamp) return 'No date information';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (approved: boolean) => {
    return approved ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle size={12} className="mr-1" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock size={12} className="mr-1" />
        Under Review
      </span>
    );
  };

  // Profile image upload handler
  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be 5MB or less.');
      return;
    }

    // File format validation
    if (!file.type.startsWith('image/')) {
      alert('Only image files can be uploaded.');
      return;
    }

    setIsUploading(true);

    // Convert file to base64 for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfileImage(result);
      setIsUploading(false);
      
      // Save profile image to localStorage (per user)
      if (user?.email) {
        localStorage.setItem(`profileImage_${user.email}`, result);
        
        // Notify Navigation component of changes (custom event)
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: {
            userEmail: user.email,
            imageData: result
          }
        }));
        
        console.log('Profile image upload and save completed');
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove profile image
  const handleRemoveProfileImage = () => {
    setProfileImage(null);
    
    // Also remove from localStorage
    if (user?.email) {
      localStorage.removeItem(`profileImage_${user.email}`);
      
      // Notify Navigation component of changes
      window.dispatchEvent(new CustomEvent('profileImageUpdated', {
        detail: {
          userEmail: user.email,
          imageData: null
        }
      }));
      
      console.log('Profile image removed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading my page...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-4">Login required.</p>
            <button 
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-blue">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Profile image upload section */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center relative">
                  {profileImage ? (
                    <Image 
                      src={profileImage} 
                      alt="Profile Image" 
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-white" />
                  )}
                  
                  {/* Upload overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <Camera size={24} className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Hidden file input */}
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                
                {/* Upload button */}
                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors duration-200 group-hover:scale-110"
                >
                  <Camera size={16} />
                </label>
                
                {/* Remove image button (only shown when image exists) */}
                {profileImage && (
                  <button
                    onClick={handleRemoveProfileImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.displayName || user.email?.split('@')[0]}'s Profile
                </h1>
                <p className="text-lg text-gray-600 mb-4">{user.email}</p>
                <div className="flex items-center space-x-4 mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-800">
                    <Activity size={16} className="mr-1" />
                    Total {stats?.totalActivities || 0} Activities
                  </span>
                  <span className="text-sm text-gray-500">
                    Member since: {formatDate(user.metadata?.creationTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center">
                  <Camera size={14} className="mr-1" />
                  Hover over profile picture to upload
                </p>
              </div>
            </div>
          </div>

          {/* Activity Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Job Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                </div>
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                  <User size={24} className="text-sky-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Job Postings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalJobPostings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Briefcase size={24} className="text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalPosts || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare size={24} className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">References</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalReferences || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award size={24} className="text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inquiries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalContacts || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Mail size={24} className="text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Event Participation</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalEventRegistrations || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calendar size={24} className="text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'overview', name: 'All Activities', icon: BarChart3 },
                  { id: 'applications', name: 'Job Applications', icon: User },
                  { id: 'posts', name: 'Posts', icon: MessageSquare },
                  { id: 'contacts', name: 'Inquiries', icon: Mail }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-sky-500 text-sky-600 bg-sky-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={18} className="mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* All Activities Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity History</h3>
                  
                  {/* Display recent activities sorted by time */}
                  <div className="space-y-4">
                    {activities && Object.entries(activities).some(([, items]: [string, any]) => items.length > 0) ? ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      // Combine all activities into one array and sort by time
                      [
                        ...activities.jobApplications.map((item: any) => ({ ...item, type: 'job-application', typeName: 'Job Application' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.jobPostings.map((item: any) => ({ ...item, type: 'job-posting', typeName: 'Job Posting' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.references.map((item: any) => ({ ...item, type: 'reference', typeName: 'Reference' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.contacts.map((item: any) => ({ ...item, type: 'contact', typeName: 'Inquiry' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.posts.map((item: any) => ({ ...item, type: 'post', typeName: 'Post' })), // eslint-disable-line @typescript-eslint/no-explicit-any
                        ...activities.eventRegistrations.map((item: any) => ({ ...item, type: 'event', typeName: 'Event Participation' })) // eslint-disable-line @typescript-eslint/no-explicit-any
                      ]
                        .sort((a, b) => {
                          const dateA = a.createdAt?.toDate?.() || a.registeredAt?.toDate?.() || new Date(a.createdAt || a.registeredAt);
                          const dateB = b.createdAt?.toDate?.() || b.registeredAt?.toDate?.() || new Date(b.createdAt || b.registeredAt);
                          return dateB.getTime() - dateA.getTime();
                        })
                        .slice(0, 10) // Show only recent 10
                        .map((activity, index) => (
                          <div key={`${activity.type}-${index}`} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  activity.type === 'job-application' ? 'bg-sky-100' :
                                  activity.type === 'job-posting' ? 'bg-purple-100' :
                                  activity.type === 'reference' ? 'bg-orange-100' :
                                  activity.type === 'contact' ? 'bg-red-100' :
                                  activity.type === 'post' ? 'bg-green-100' :
                                  'bg-indigo-100'
                                }`}>
                                  {activity.type === 'job-application' && <User size={16} className="text-sky-600" />}
                                  {activity.type === 'job-posting' && <Briefcase size={16} className="text-purple-600" />}
                                  {activity.type === 'reference' && <Award size={16} className="text-orange-600" />}
                                  {activity.type === 'contact' && <Mail size={16} className="text-red-600" />}
                                  {activity.type === 'post' && <MessageSquare size={16} className="text-green-600" />}
                                  {activity.type === 'event' && <Calendar size={16} className="text-indigo-600" />}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {activity.typeName}: {activity.title || activity.name || activity.subject || activity.eventTitle || 'No Title'}
                                  </p>
                                  <p className="text-sm text-gray-500">{formatDate(activity.createdAt || activity.registeredAt)}</p>
                                </div>
                              </div>
                              {activity.approved !== undefined && getStatusBadge(activity.approved)}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <Activity size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-lg text-gray-500">No activities yet.</p>
                        <p className="text-gray-400">Activities will appear here when you start using the platform.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Job Applications Tab */}
              {activeTab === 'applications' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Job Application History</h3>
                  {activities?.jobApplications?.length > 0 ? (
                    <div className="space-y-4">
                      {activities.jobApplications.map((application: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{application.title}</h4>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(application.approved)}
                              <span className="text-sm text-gray-500">{formatDate(application.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-4">{application.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                            <div><span className="font-medium">Contact:</span> {application.email}</div>
                            <div><span className="font-medium">Phone:</span> {application.phone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <User size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-lg text-gray-500">No job applications.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">My Posts</h3>
                  {activities?.posts?.length > 0 ? (
                    <div className="space-y-4">
                      {activities.posts.map((post: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{post.title}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                              <Eye size={16} className="text-gray-400" />
                              <span className="text-sm text-gray-500">{post.views || 0}</span>
                            </div>
                          </div>
                          <p className="text-gray-600">{post.content?.substring(0, 200)}...</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-lg text-gray-500">No posts written.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Inquiries Tab */}
              {activeTab === 'contacts' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Inquiry History</h3>
                  {activities?.contacts?.length > 0 ? (
                    <div className="space-y-4">
                      {activities.contacts.map((contact: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{contact.subject}</h4>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                contact.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {contact.resolved ? 'Answered' : 'Awaiting Response'}
                              </span>
                              <span className="text-sm text-gray-500">{formatDate(contact.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-4">{contact.message}</p>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Category:</span> {
                              contact.category === 'general' ? 'General Inquiry' :
                              contact.category === 'technical' ? 'Technical Issue' :
                              contact.category === 'job-seeker' ? 'Job Seeker Inquiry' :
                              contact.category === 'employer' ? 'Employer Inquiry' :
                              contact.category === 'event' ? 'Event Inquiry' : contact.category
                            }
                            {contact.urgent && (
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Urgent</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Mail size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-lg text-gray-500">No inquiries made.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 