'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Home, Users, FileText, Calendar, Mail, MessageSquare, LogIn, LogOut, User, ChevronDown, UserCircle, Settings, Building, Heart } from 'lucide-react';
import { authService } from '@/lib/auth-service';
import { eventService } from '@/lib/firebase-services';
import { User as FirebaseUser } from 'firebase/auth';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  // Track authentication state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      console.log('👤 Authentication state changed:', user ? `${user.email} logged in` : 'logged out');
      
      // Load profile image when user logs in
      if (user && user.email) {
        loadProfileImage(user.email);
      } else {
        setProfileImage(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load profile image function
  const loadProfileImage = (userEmail: string) => {
    const savedImage = localStorage.getItem(`profileImage_${userEmail}`);
    if (savedImage) {
      setProfileImage(savedImage);
    }
  };

  // Listen for profile image changes
  useEffect(() => {
    const handleCustomProfileUpdate = () => {
      if (user && user.email) {
        loadProfileImage(user.email);
      }
    };

    window.addEventListener('profileImageUpdated', handleCustomProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profileImageUpdated', handleCustomProfileUpdate as EventListener);
    };
  }, [user]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        const target = event.target as Element;
        if (!target.closest('.user-dropdown-container')) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await authService.signOut();
      setUser(null);
      setProfileImage(null);
      setShowUserDropdown(false);
      console.log('✅ Successfully logged out');
      router.push('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <nav className="bg-transparent">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-12 sm:h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-1 sm:space-x-3 px-1 sm:px-3 py-1 sm:py-2 rounded-lg transition-all duration-200 hover:bg-white/20">
              <div className="flex items-center justify-center">
                <Image 
                  src="/favicon-96x96.png" 
                  alt="NB Student Hub Logo" 
                  width={80} 
                  height={80} 
                  className="w-10 h-10 sm:w-16 sm:h-16" 
                />
              </div>
              <div className="flex flex-col">
                {/* Mobile: shorter text, Desktop: longer text */}
                <span className="text-sm sm:text-2xl font-bold text-white block sm:hidden">
                  NB Jobs
                </span>
                <span className="text-lg sm:text-2xl font-bold text-white hidden sm:block">
                  NB Student Hub
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu - Center */}
          <div className="hidden md:flex items-center space-x-4 absolute left-1/2 transform -translate-x-1/2 max-w-fit">
            <Link
              href="/"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-lg font-semibold whitespace-nowrap text-white hover:bg-white/20 hover:text-white"
            >
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link
              href="/events"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-lg font-semibold whitespace-nowrap ${
                isActive('/events') 
                  ? 'bg-white/30 text-white shadow-md' 
                  : 'text-white hover:bg-white/20 hover:text-white'
              }`}
            >
              <Calendar size={20} />
              <span>Events</span>
            </Link>
            <Link
              href="/student-profiles"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-lg font-semibold whitespace-nowrap ${
                isActive('/student-profiles') 
                  ? 'bg-white/30 text-white shadow-md' 
                  : 'text-white hover:bg-white/20 hover:text-white'
              }`}
            >
              <Users size={20} />
              <span>Student Profiles</span>
            </Link>
            <Link
              href="/job-postings"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-lg font-semibold whitespace-nowrap ${
                isActive('/job-postings') 
                  ? 'bg-white/30 text-white shadow-md' 
                  : 'text-white hover:bg-white/20 hover:text-white'
              }`}
            >
              <Building size={20} />
              <span>Post a Job</span>
            </Link>
            <Link
              href="/references"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-lg font-semibold whitespace-nowrap ${
                isActive('/references') 
                  ? 'bg-white/30 text-white shadow-md' 
                  : 'text-white hover:bg-white/20 hover:text-white'
              }`}
            >
              <FileText size={20} />
              <span>References</span>
            </Link>
            <Link
              href="/volunteer-listings"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-lg font-semibold whitespace-nowrap ${
                isActive('/volunteer-listings') || isActive('/volunteer-postings')
                  ? 'bg-white/30 text-white shadow-md' 
                  : 'text-white hover:bg-white/20 hover:text-white'
              }`}
            >
              <Heart size={20} />
              <span>Volunteer</span>
            </Link>
            <Link
              href="/community"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-lg font-semibold whitespace-nowrap ${
                isActive('/community') 
                  ? 'bg-white/30 text-white shadow-md' 
                  : 'text-white hover:bg-white/20 hover:text-white'
              }`}
            >
              <MessageSquare size={20} />
              <span>Community</span>
            </Link>
            <Link
              href="/contact"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-lg font-semibold whitespace-nowrap ${
                isActive('/contact') 
                  ? 'bg-white/30 text-white shadow-md' 
                  : 'text-white hover:bg-white/20 hover:text-white'
              }`}
            >
              <Mail size={20} />
              <span>Contact</span>
            </Link>

          </div>

          {/* Right side - Auth buttons + Mobile menu button */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Desktop Auth buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <div className="relative user-dropdown-container">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/30 hover:border-white/50"
                  >
                    {/* Profile image or default icon */}
                    {profileImage ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white border border-gray-200">
                        <Image 
                          src={profileImage} 
                          alt="Profile" 
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <User size={20} />
                    )}
                    <span className="text-sm font-medium">
                      {eventService.isAdmin(user.email || '') 
                        ? 'Admin' 
                        : user.email || user.displayName || 'User'
                      }
                    </span>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        {/* Show admin page for administrators */}
                        {eventService.isAdmin(user.email || '') ? (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          <Settings size={18} />
                          <span>Admin Dashboard</span>
                        </Link>
                      ) : (
                      <Link
                        href="/my-page"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <UserCircle size={18} />
                        <span>My Profile</span>
                      </Link>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleSignOut();
                        }}
                        disabled={authLoading}
                        className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left disabled:opacity-50"
                      >
                        <LogOut size={18} />
                        <span>{authLoading ? 'Signing out...' : 'Sign Out'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      setIsSignUp(false);
                      setShowAuthModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-white hover:bg-white/20 hover:text-white text-lg font-semibold border border-white/30 hover:border-white/50"
                  >
                    <LogIn size={20} />
                    <span>Sign In</span>
                  </button>

                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:bg-white/20 p-1 sm:p-2 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                {isOpen ? <X size={18} className="sm:w-6 sm:h-6" /> : <Menu size={18} className="sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-white/20 bg-black/80 backdrop-blur-sm">
            <div className="pl-0 pr-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-semibold text-white hover:bg-white/20 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link
                href="/events"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-semibold ${
                  isActive('/events') 
                    ? 'bg-white/30 text-white shadow-md' 
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Calendar size={20} />
                <span>Events</span>
              </Link>
              <Link
                href="/student-profiles"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-semibold ${
                  isActive('/student-profiles') 
                    ? 'bg-white/30 text-white shadow-md' 
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Users size={20} />
                <span>Student Profiles</span>
              </Link>
              <Link
                href="/job-postings"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-semibold ${
                  isActive('/job-postings') 
                    ? 'bg-white/30 text-white shadow-md' 
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Building size={20} />
                <span>Post a Job</span>
              </Link>
              <Link
                href="/references"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-semibold ${
                  isActive('/references') 
                    ? 'bg-white/30 text-white shadow-md' 
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <FileText size={20} />
                <span>References</span>
              </Link>
              <Link
                href="/volunteer-listings"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-semibold ${
                  isActive('/volunteer-listings') || isActive('/volunteer-postings')
                    ? 'bg-white/30 text-white shadow-md' 
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Heart size={20} />
                <span>Volunteer</span>
              </Link>
              <Link
                href="/community"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-semibold ${
                  isActive('/community') 
                    ? 'bg-white/30 text-white shadow-md' 
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <MessageSquare size={20} />
                <span>Community</span>
              </Link>
              <Link
                href="/contact"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-semibold ${
                  isActive('/contact') 
                    ? 'bg-white/30 text-white shadow-md' 
                    : 'text-white hover:bg-white/20 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Mail size={20} />
                <span>Contact</span>
              </Link>

              
              {/* Mobile Auth button */}
              <div className="border-t border-white/20 mt-2 pt-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2 text-white">
                      <User size={20} />
                      <span className="text-base font-semibold">
                        {eventService.isAdmin(user.email || '') 
                          ? 'Admin' 
                          : user.email || user.displayName || 'User'
                        }
                      </span>
                    </div>
                    
                    {/* Show admin page for administrators, my profile for regular users */}
                      {eventService.isAdmin(user.email || '') ? (
                      <Link
                        href="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 text-orange-300 hover:bg-orange-600/20 hover:text-orange-200 rounded-lg transition-all duration-200 w-full"
                      >
                        <Settings size={20} />
                        <span>Admin Dashboard</span>
                      </Link>
                    ) : (
                    <Link
                      href="/my-page"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-200 w-full"
                    >
                      <UserCircle size={20} />
                      <span>My Profile</span>
                    </Link>
                    )}
                    
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        handleSignOut();
                      }}
                      disabled={authLoading}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-red-300 hover:bg-red-500/20 hover:text-red-200 text-base font-semibold border border-red-300/30 hover:border-red-300/50 w-full disabled:opacity-50"
                    >
                      <LogOut size={20} />
                      <span>{authLoading ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        setIsSignUp(false);
                        setShowAuthModal(true);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-white hover:bg-white/20 hover:text-white text-base font-semibold border border-white/30 hover:border-white/50 w-full"
                    >
                      <LogIn size={20} />
                      <span>Sign In</span>
                    </button>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            isSignUp={isSignUp}
            onToggleMode={() => setIsSignUp(!isSignUp)}
            router={router}
          />
        )}
      </div>
    </nav>
  );
}

// Login/Signup Modal Component
function AuthModal({ 
  isOpen, 
  onClose, 
  isSignUp, 
  onToggleMode,
  router 
}: {
  isOpen: boolean;
  onClose: () => void;
  isSignUp: boolean;
  onToggleMode: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
          await authService.signUpWithEmail(email, password, displayName);
        console.log('✅ Registration successful!');
      } else {
        await authService.signInWithEmail(email, password);
        console.log('✅ Login successful!');
      }
      
      onClose();
      setEmail('');
      setPassword('');
      setDisplayName('');
      
      // Navigate to main home
      console.log('🏠 Redirecting to home page...');
      router.push('/');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await authService.signInWithGoogle();
      console.log('✅ Google login successful!');
      onClose();
      
      // Navigate to main home
      console.log('🏠 Redirecting to home page...');
      router.push('/');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }

    setLoading(true);
    setError('');
    setResetSuccess('');

    try {
        await authService.sendPasswordResetEmail(email);
      setResetSuccess('Password reset email sent! Please check your email.');
      setShowForgotPassword(false);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {resetSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
            {resetSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="John Smith"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-sky-500 hover:text-sky-600"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>🔍</span>
            <span>{loading ? 'Processing...' : 'Continue with Google'}</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onToggleMode}
            className="text-sky-500 hover:text-sky-600 font-medium"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {/* Password Reset Modal */}
        {showForgotPassword && (
          <div className="absolute inset-0 bg-white rounded-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 