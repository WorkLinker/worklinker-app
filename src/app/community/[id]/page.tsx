'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth';
import { ArrowLeft, Heart, MessageCircle, Eye, User, Clock, Send, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { authService } from '@/lib/auth-service';

// 샘플 게시물 데이터 (커뮤니티 페이지와 동일)
const samplePosts = [
  {
    id: 1,
    title: '신입 바리스타 일자리 후기 공유합니다',
    content: '처음 바리스타로 일하게 되어 걱정이 많았는데, 생각보다 재미있고 배울 점이 많아요! 고등학생도 충분히 할 수 있는 일이라고 생각합니다.\n\n처음에는 커피 머신 사용법을 익히는 게 어려웠지만, 매니저님이 친절하게 알려주셔서 금방 익숙해졌어요. 특히 손님들과 대화하는 것이 즐겁고, 영어 실력도 늘어서 일석이조인 것 같습니다.\n\n급여도 시급 15달러로 나쁘지 않고, 팁도 받을 수 있어서 용돈 벌기에는 충분해요. 같은 또래 친구들도 많이 일해서 친구도 사귈 수 있었구요!\n\n혹시 바리스타 일자리를 고민하고 계신 분들이 있다면 추천드립니다!',
    author: '커피러버',
    category: 'job',
    createdAt: '2025-01-10',
    views: 156,
    likes: 23,
    comments: 8,
    isLiked: false
  },
  {
    id: 2,
    title: '졸업 후 진로 고민 중입니다',
    content: '내년에 졸업인데 대학 진학할지 취업할지 고민이 많아요. 같은 고민하는 분들 있나요? 조언도 구하고 싶습니다.\n\n대학 진학을 하면 좀 더 안정적인 미래를 기대할 수 있지만, 학비 부담이 크고 4년이라는 시간이 필요해요. 반면 취업을 하면 바로 사회 경험을 쌓고 돈을 벌 수 있지만, 장기적으로 어떨지 걱정이 됩니다.\n\n부모님은 대학 진학을 원하시지만, 저는 실무 경험을 먼저 쌓고 싶은 마음도 있어요. 같은 고민을 하고 계신 분들의 의견을 듣고 싶습니다.',
    author: '고민이많은학생',
    category: 'life',
    createdAt: '2025-01-09',
    views: 234,
    likes: 45,
    comments: 15,
    isLiked: false
  },
  {
    id: 3,
    title: '면접 준비 팁 공유해요!',
    content: '최근에 몇 군데 면접을 보면서 배운 점들을 공유해보려고 합니다. 특히 고등학생 대상 면접에서 자주 나오는 질문들 정리해봤어요.\n\n1. "왜 우리 회사를 선택했나요?" - 회사에 대해 미리 조사해가세요!\n2. "장점과 단점은 무엇인가요?" - 단점도 긍정적으로 표현하는 것이 중요해요\n3. "학업과 일을 어떻게 병행할 계획인가요?" - 구체적인 계획을 말씀드리세요\n\n복장도 중요한데, 너무 격식차릴 필요는 없지만 깔끔하게 입고 가시면 좋은 인상을 줄 수 있어요. 자신감이 가장 중요합니다!',
    author: '면접마스터',
    category: 'study',
    createdAt: '2025-01-08',
    views: 389,
    likes: 67,
    comments: 22,
    isLiked: false
  },
  {
    id: 4,
    title: '뉴브런즈윅 학생들 모여요!',
    content: '같은 지역 학생들끼리 정보 공유하고 네트워킹했으면 좋겠어요. 프레더릭턴 지역 학생분들 있으신가요?\n\n혼자 캐나다 생활을 하다 보니 가끔 외로울 때가 있어요. 같은 또래 친구들과 정보도 공유하고, 가끔 만나서 스터디 그룹도 만들면 좋을 것 같아요.\n\n특히 일자리 정보나 학교 생활에 대한 팁을 서로 나눌 수 있으면 좋겠습니다!',
    author: '뉴브런즈윅토박이',
    category: 'general',
    createdAt: '2025-01-07',
    views: 178,
    likes: 34,
    comments: 12,
    isLiked: false
  },
  {
    id: 5,
    title: '여름 방학 인턴십 경험 후기',
    content: '이번 여름에 로컬 회사에서 인턴십을 했는데 정말 좋은 경험이었어요. 실무 경험을 쌓을 수 있어서 뿌듯했습니다.',
    author: '인턴십경험자',
    category: 'job',
    createdAt: '2025-01-06',
    views: 298,
    likes: 52,
    comments: 18,
    isLiked: false
  },
  {
    id: 6,
    title: '영어 실력 향상 방법 공유',
    content: '캐나다에서 살면서 영어 실력을 늘리는 제 나름의 방법들을 공유해보려고 해요. 도움이 되었으면 좋겠습니다.',
    author: '영어마스터',
    category: 'study',
    createdAt: '2025-01-05',
    views: 412,
    likes: 89,
    comments: 31,
    isLiked: false
  },
  {
    id: 7,
    title: '캐나다 생활 적응 팁',
    content: '처음 캐나다에 와서 힘들었던 점들과 어떻게 극복했는지 공유해보려고 합니다.',
    author: '캐나다신입',
    category: 'life',
    createdAt: '2025-01-04',
    views: 267,
    likes: 43,
    comments: 16,
    isLiked: false
  },
  {
    id: 8,
    title: '코딩 공부 시작하는 분들께',
    content: '프로그래밍에 관심 있는 고등학생들을 위한 조언을 드리고 싶어요. 무료 리소스들도 많이 공유할게요.',
    author: '코딩초보',
    category: 'study',
    createdAt: '2025-01-03',
    views: 345,
    likes: 76,
    comments: 25,
    isLiked: false
  },
  {
    id: 9,
    title: '학교 생활과 아르바이트 병행하기',
    content: '학업과 일을 동시에 하면서 시간 관리하는 방법에 대해 이야기해보고 싶어요.',
    author: '시간관리왕',
    category: 'general',
    createdAt: '2025-01-02',
    views: 189,
    likes: 38,
    comments: 14,
    isLiked: false
  },
  {
    id: 10,
    title: '대학 지원서 작성 팁',
    content: '대학 지원서를 작성하면서 알게 된 유용한 팁들을 공유해드릴게요.',
    author: '대학지원생',
    category: 'study',
    createdAt: '2025-01-01',
    views: 423,
    likes: 95,
    comments: 37,
    isLiked: false
  }
];

// 샘플 댓글 데이터
const sampleComments = [
  {
    id: 1,
    postId: 1,
    author: '카페알바생',
    content: '저도 바리스타로 일하고 있는데 공감이 많이 돼요! 처음엔 정말 어려웠는데 지금은 재미있어요.',
    createdAt: '2025-01-10 14:30',
    likes: 5,
    isLiked: false
  },
  {
    id: 2,
    postId: 1,
    author: '학생A',
    content: '바리스타 지원해보고 싶은데 경험이 없어도 괜찮을까요?',
    createdAt: '2025-01-10 16:45',
    likes: 2,
    isLiked: false
  },
  {
    id: 3,
    postId: 1,
    author: '커피러버',
    content: '@학생A 경험 없어도 충분히 가능해요! 대부분 처음부터 차근차근 가르쳐주시니까 걱정 마세요 😊',
    createdAt: '2025-01-10 17:20',
    likes: 8,
    isLiked: false
  },
  {
    id: 4,
    postId: 2,
    author: '대학생선배',
    content: '저는 대학을 먼저 가는 것을 추천드려요. 장기적으로 더 많은 기회가 있어요.',
    createdAt: '2025-01-09 10:15',
    likes: 12,
    isLiked: false
  },
  {
    id: 5,
    postId: 2,
    author: '취업성공자',
    content: '고등학교 졸업 후 바로 취업했는데 후회하지 않아요! 다만 본인의 성향을 잘 파악하는 것이 중요해요.',
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
    // 사용자 정보 가져오기
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });

    // 게시글 정보 가져오기 (샘플 데이터 사용)
    const foundPost = samplePosts.find(p => p.id === postId);
    if (foundPost) {
      setPost({ ...foundPost, views: foundPost.views + 1 }); // 조회수 증가
      setComments(sampleComments.filter(c => c.postId === postId));
    }
    setLoading(false);

    return () => unsubscribe();
  }, [postId]);

  const handleLikePost = () => {
    if (!user) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
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
      alert('좋아요를 누르려면 로그인이 필요합니다.');
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
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    if (newComment.trim() === '') {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    const comment = {
      id: comments.length + 1,
      postId: postId,
      author: user.displayName || user.email?.split('@')[0] || '익명',
      content: newComment,
      createdAt: new Date().toLocaleString('ko-KR'),
      likes: 0,
      isLiked: false
    };

    setComments([...comments, comment]);
    setNewComment('');
    
    // 게시글의 댓글 수 증가
    setPost((prevPost: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      ...prevPost,
      comments: prevPost.comments + 1
    }));
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return '일반';
      case 'job': return '취업';
      case 'study': return '학습';
      case 'life': return '일상';
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
            <p className="text-lg text-gray-600">게시글을 불러오는 중...</p>
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
            <p className="text-lg text-gray-600 mb-4">게시글을 찾을 수 없습니다.</p>
            <button 
              onClick={() => router.push('/community')}
              className="btn-primary"
            >
              게시판으로 돌아가기
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
          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/community')}
              className="flex items-center text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              게시판으로 돌아가기
            </button>
          </div>

          {/* 게시글 상세 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            {/* 게시글 헤더 */}
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

            {/* 게시글 내용 */}
            <div className="p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                댓글 {comments.length}개
              </h2>
            </div>

            {/* 댓글 작성 폼 */}
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
                        placeholder="댓글을 작성해주세요..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          className="flex items-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                        >
                          <Send size={16} />
                          <span>댓글 작성</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
                  <button 
                    onClick={() => router.push('/')}
                    className="btn-primary"
                  >
                    로그인하기
                  </button>
                </div>
              )}
            </div>

            {/* 댓글 목록 */}
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
                  <p className="text-gray-500">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
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