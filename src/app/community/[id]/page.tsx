'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth';
import { ArrowLeft, Heart, MessageCircle, Eye, User, Clock, Send, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { authService } from '@/lib/auth-service';

// Sample post data for English community
const samplePosts = [
  {
    id: 1,
    title: 'My Experience as a New Barista - Job Review',
    content: 'I just started working as a barista and was nervous at first, but it&apos;s been really fun and I&apos;ve learned so much! I think it&apos;s definitely something high school students can do.\n\nLearning how to use the coffee machine was challenging at first, but my manager was really helpful and I got the hang of it quickly. I especially enjoy talking with customers, and my English has improved too - it&apos;s like killing two birds with one stone!\n\nThe pay is $15/hour which isn&apos;t bad, and we get tips too, so it&apos;s great for earning spending money. There are lots of other students my age working there, so I&apos;ve made new friends too!\n\nIf anyone is considering a barista job, I&apos;d definitely recommend it!',
    author: 'CoffeeLover',
    category: 'job',
    createdAt: '2025-01-10',
    views: 156,
    likes: 23,
    comments: 8,
    isLiked: false
  },
  {
    id: 2,
    title: 'Struggling with post-graduation plans',
    content: 'I&apos;m graduating next year and torn between going to university or starting work. Anyone else dealing with the same dilemma? I&apos;d love some advice.\n\nUniversity would give me more stable future prospects, but the tuition costs are huge and it takes 4 years. On the other hand, working right away means I can gain real-world experience and earn money immediately, but I&apos;m worried about long-term prospects.\n\nMy parents want me to go to university, but I&apos;m also interested in gaining practical experience first. I&apos;d love to hear from others facing the same decision.',
    author: 'ConfusedSenior',
    category: 'life',
    createdAt: '2025-01-09',
    views: 234,
    likes: 45,
    comments: 15,
    isLiked: false
  },
  {
    id: 3,
    title: 'Interview Preparation Tips!',
    content: 'I&apos;ve had several interviews recently and wanted to share what I&apos;ve learned. Here are common questions for high school student interviews:\n\n1. "Why did you choose our company?" - Research the company beforehand!\n2. "What are your strengths and weaknesses?" - Frame weaknesses positively\n3. "How do you plan to balance school and work?" - Have a specific plan ready\n\nDress code is important too - you don&apos;t need to be super formal, but looking neat makes a good impression. Confidence is key!\n\nRemember, they want to hire you just as much as you want the job. Good luck everyone!',
    author: 'InterviewPro',
    category: 'study',
    createdAt: '2025-01-08',
    views: 389,
    likes: 67,
    comments: 22,
    isLiked: false
  },
  {
    id: 4,
    title: 'New Brunswick students unite!',
    content: 'I&apos;d love to connect with other students in the area for networking and info sharing. Any students from Fredericton?\n\nLiving in Canada by myself can get lonely sometimes. I think it would be great to share information with other students my age and maybe form study groups.\n\nEspecially would love to share job opportunities and school life tips with each other!',
    author: 'NBNative',
    category: 'general',
    createdAt: '2025-01-07',
    views: 178,
    likes: 34,
    comments: 12,
    isLiked: false
  },
  {
    id: 5,
    title: 'Summer Internship Experience Review',
    content: 'I did an internship at a local company this summer and it was such a valuable experience. Really proud of gaining real work experience.',
    author: 'InternshipGrad',
    category: 'job',
    createdAt: '2025-01-06',
    views: 298,
    likes: 52,
    comments: 18,
    isLiked: false
  },
  {
    id: 6,
    title: 'Tips for Improving English Skills',
    content: 'Living in Canada has really helped my English improve. Here are my methods that have been most helpful.',
    author: 'EnglishMaster',
    category: 'study',
    createdAt: '2025-01-05',
    views: 412,
    likes: 89,
    comments: 31,
    isLiked: false
  },
  {
    id: 7,
    title: 'Tips for Adapting to Life in Canada',
    content: 'When I first came to Canada, there were some tough challenges. Here&apos;s how I overcame them.',
    author: 'CanadaNewbie',
    category: 'life',
    createdAt: '2025-01-04',
    views: 267,
    likes: 43,
    comments: 16,
    isLiked: false
  },
  {
    id: 8,
    title: 'For Those Starting to Learn Programming',
    content: 'I&apos;d love to give advice to high school students interested in programming. There are lots of free resources to share too.',
    author: 'CodingBeginner',
    category: 'study',
    createdAt: '2025-01-03',
    views: 345,
    likes: 76,
    comments: 25,
    isLiked: false
  },
  {
    id: 9,
    title: 'Balancing School and Part-time Work',
    content: 'I&apos;d like to discuss time management strategies for doing both school and work simultaneously.',
    author: 'TimeManager',
    category: 'general',
    createdAt: '2025-01-02',
    views: 189,
    likes: 38,
    comments: 14,
    isLiked: false
  },
  {
    id: 10,
    title: 'University Application Tips',
    content: 'Here are some useful tips I learned while writing university applications.',
    author: 'CollegeApplicant',
    category: 'study',
    createdAt: '2025-01-01',
    views: 423,
    likes: 95,
    comments: 37,
    isLiked: false
  }
];

// Sample comment data
const sampleComments = [
  {
    id: 1,
    postId: 1,
    author: 'CafeWorker',
    content: 'I&apos;m also working as a barista and totally relate! It was really difficult at first but now it&apos;s fun.',
    createdAt: '2025-01-10 14:30',
    likes: 5,
    isLiked: false
  },
  {
    id: 2,
    postId: 1,
    author: 'StudentA',
    content: 'I want to apply for a barista position but I have no experience. Do you think that&apos;s okay?',
    createdAt: '2025-01-10 16:45',
    likes: 2,
    isLiked: false
  },
  {
    id: 3,
    postId: 1,
    author: 'CoffeeLover',
    content: '@StudentA No experience is totally fine! Most places train you from scratch, so don&apos;t worry 😊',
    createdAt: '2025-01-10 17:20',
    likes: 8,
    isLiked: false
  },
  {
    id: 4,
    postId: 2,
    author: 'CollegeSenior',
    content: 'I recommend going to university first. There are more opportunities in the long run.',
    createdAt: '2025-01-09 10:15',
    likes: 12,
    isLiked: false
  },
  {
    id: 5,
    postId: 2,
    author: 'WorkingGrad',
    content: 'I went straight to work after high school and don&apos;t regret it! But it&apos;s important to understand your own personality.',
    createdAt: '2025-01-09 14:22',
    likes: 8,
    isLiked: false
  }
];

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = parseInt(params.id as string);
  
  const [post, setPost] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [comments, setComments] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user information
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });

    // Get post information (using sample data)
    const foundPost = samplePosts.find(p => p.id === postId);
    if (foundPost) {
      setPost({ ...foundPost, views: foundPost.views + 1 }); // Increase view count
      setComments(sampleComments.filter(c => c.postId === postId));
    }
    setLoading(false);

    return () => unsubscribe();
  }, [postId]);

  const handleLikePost = () => {
    if (!user) {
      alert('You need to sign in to like posts.');
      return;
    }

    setPost((prevPost: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      ...prevPost,
      isLiked: !prevPost.isLiked,
      likes: prevPost.isLiked ? prevPost.likes - 1 : prevPost.likes + 1
    }));
  };

  const handleLikeComment = (commentId: number) => {
    if (!user) {
      alert('You need to sign in to like comments.');
      return;
    }

    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
            }
          : comment
      )
    );
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You need to sign in to write comments.');
      return;
    }

    if (newComment.trim() === '') {
      alert('Please enter comment content.');
      return;
    }

    const comment = {
      id: comments.length + 1,
      postId: postId,
      author: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      content: newComment,
      createdAt: new Date().toLocaleString('en-US'),
      likes: 0,
      isLiked: false
    };

    setComments([...comments, comment]);
    setNewComment('');
    
    // Increase comment count for the post
    setPost((prevPost: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      ...prevPost,
      comments: prevPost.comments + 1
    }));
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
      case 'job': return 'bg-blue-100 text-blue-800';
      case 'study': return 'bg-green-100 text-green-800';
      case 'life': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-custom-blue">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-4">Post not found.</p>
            <button 
              onClick={() => router.push('/community')}
              className="btn-primary"
            >
              Back to Community
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/community')}
              className="flex items-center text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Community
            </button>
          </div>

          {/* Post details */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            {/* Post header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(post.category)}`}>
                  {getCategoryLabel(post.category)}
                </span>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Eye size={16} />
                    <span>{post.views}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle size={16} />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">{post.createdAt}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleLikePost}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    post.isLiked 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart size={18} className={post.isLiked ? 'fill-current' : ''} />
                  <span>{post.likes}</span>
                </button>
              </div>
            </div>

            {/* Post content */}
            <div className="p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {comments.length} Comment{comments.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {/* Comment form */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              {user ? (
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          className="flex items-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                        >
                          <Send size={16} />
                          <span>Post Comment</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">You need to sign in to write comments.</p>
                  <button 
                    onClick={() => router.push('/')}
                    className="btn-primary"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Comments list */}
            <div className="divide-y divide-gray-200">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">{comment.author}</span>
                          <span className="text-sm text-gray-500">{comment.createdAt}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-3">
                          {comment.content}
                        </p>
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center space-x-1 text-sm transition-colors ${
                            comment.isLiked 
                              ? 'text-red-600 hover:text-red-700' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Heart size={14} className={comment.isLiked ? 'fill-current' : ''} />
                          <span>{comment.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <MessageCircle size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
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