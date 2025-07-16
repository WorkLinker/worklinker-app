'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MessageSquare, Plus, Search, User, Clock, Heart, MessageCircle, Eye, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { communityService } from '@/lib/firebase-services';
import { authService } from '@/lib/auth-service';
import { User as FirebaseUser } from 'firebase/auth';

const PostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  author: z.string().min(2, 'Please enter your name'),
  category: z.enum(['general', 'job', 'study', 'life']),
});

type PostForm = z.infer<typeof PostSchema>;

// Post type definition
interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  category: 'general' | 'job' | 'study' | 'life';
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
}

// Posts will be loaded from Firebase (sample data removed)

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Show 8 items per page

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PostForm>({
    resolver: zodResolver(PostSchema)
  });

  // Get current logged in user information
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: PostForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('💬 Starting post creation...');
      
      // Add author email
      const postDataWithEmail = {
        ...data,
        authorEmail: user?.email || data.author // Email for my page lookup
      };

      // Save data to Firebase
      const result = await communityService.createPost(postDataWithEmail);
      
      if (result.success) {
        console.log('🎉 Post created successfully!');
        
        // Temporarily add to local state (until real-time updates)
        const newPost = {
          id: posts.length + 1, // Temporary ID for local display
          ...data,
          createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          views: 0,
          likes: 0,
          comments: 0
        };
        setPosts([newPost, ...posts]);
        
        setSubmitted(true);
        reset();
        setShowForm(false);
        setCurrentPage(1); // Go to first page after new post
        
        // Remove success message after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Post creation error:', error);
      alert('An error occurred while creating the post. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return 'General';
      case 'job': return 'Jobs';
      case 'study': return 'Study';
      case 'life': return 'Life';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-gray-100 text-gray-800';
      case 'job': return 'bg-sky-100 text-sky-800';
      case 'study': return 'bg-sky-100 text-sky-800';
      case 'life': return 'bg-sky-100 text-sky-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.likes + b.comments) - (a.likes + a.comments);
      case 'views':
        return b.views - a.views;
      case 'latest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedPosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPosts = sortedPosts.slice(startIndex, startIndex + itemsPerPage);

  // Go to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy]);

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
            src="/images/community.png"
            alt="Community Board"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="hero-title hero-title-premium mb-4 sm:mb-6">
            Connect with fellow students
          </h1>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Community Board
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            A space for New Brunswick students to connect and share freely.
            <br />
            Share job info, study tips, daily stories, and more.
          </p>
          <p className="text-lg text-sky-600 font-semibold mb-8">
            Growing together as a student community
          </p>
          
          {submitted && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-green-800 font-medium">Post submitted successfully!</span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => {
              if (!user) {
                alert('You need to sign in to create a post.');
                return;
              }
              setShowForm(true);
            }}
            className="bg-sky-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-sky-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3 mx-auto"
          >
            <Plus size={20} />
            <span>Create New Post</span>
          </button>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="job">Jobs</option>
                <option value="study">Study</option>
                <option value="life">Life</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Posts List */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {currentPosts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-sky-300 transition-all cursor-pointer"
                onClick={() => router.push(`/community/${post.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                        {getCategoryLabel(post.category)}
                      </span>
                      <span className="text-gray-500 text-xs">#{post.id}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-sky-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 mb-3 text-sm">
                      {post.content}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{post.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                      <Eye size={14} />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center space-x-1 hover:text-red-600 transition-colors">
                      <Heart size={14} />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1 hover:text-sky-600 transition-colors">
                      <MessageCircle size={14} />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {currentPosts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No posts found.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedPosts.length)} of {sortedPosts.length}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-sky-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Post Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="general">General</option>
                  <option value="job">Jobs</option>
                  <option value="study">Study</option>
                  <option value="life">Life</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter post title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  {...register('author')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter your name"
                  defaultValue={user?.displayName || user?.email?.split('@')[0] || ''}
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  {...register('content')}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter post content"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Post'}
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