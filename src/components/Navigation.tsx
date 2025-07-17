'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Home, Users, FileText, Calendar, Mail, MessageSquare, LogIn, LogOut, ChevronDown, UserCircle, Settings, Building, Heart } from 'lucide-react';
import { authService } from '@/lib/auth-service';
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

  // Navigation items
  const navigationItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/student-profiles', label: 'Student Profiles', icon: Users },
    { href: '/job-postings', label: 'Post a Job', icon: Building },
    { href: '/references', label: 'References', icon: FileText },
    { href: '/volunteer-listings', label: 'Volunteer', icon: Heart },
    { href: '/community', label: 'Community', icon: MessageSquare },
    { href: '/contact', label: 'Contact', icon: Mail },
  ];

  // User menu items
  const userMenuItems = [
    { href: '/my-page', label: 'My Page', icon: UserCircle },
  ];

  // Admin menu items
  const adminMenuItems = [
    { href: '/admin', label: 'Admin Page', icon: Settings },
  ];

  // Close mobile menu
  const closeMobileMenu = () => setIsOpen(false);

  // Close user dropdown
  const closeUserDropdown = () => setShowUserDropdown(false);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        const target = event.target as Element;
        if (!target.closest('.user-dropdown')) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  // Clear form data
  const clearFormData = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  // Email/password states for auth modal
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Login handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    
    try {
      await authService.signInWithEmail(email, password);
      setShowAuthModal(false);
      clearFormData();
      console.log('✅ Login successful');
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      alert('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Signup handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    
    try {
      await authService.signUpWithEmail(email, password, displayName);
      setShowAuthModal(false);
      clearFormData();
      console.log('✅ Registration successful');
    } catch (error: unknown) {
      console.error('❌ Registration error:', error);
      alert('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Google sign in handler
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    
    try {
      await authService.signInWithGoogle();
      setShowAuthModal(false);
      console.log('✅ Google login successful');
    } catch (error: unknown) {
      console.error('❌ Google login error:', error);
      alert('Google login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler
  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await authService.signOut();
      setUser(null);
      setProfileImage(null);
      setShowUserDropdown(false);
      console.log('✅ Successfully signed out');
      router.push('/');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Track authentication state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      console.log('👤 Auth state changed:', user ? `${user.email} logged in` : 'logged out');
      
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

  // Listen for profile image updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (user && user.email) {
        loadProfileImage(user.email);
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileUpdate as EventListener);
    };
  }, [user]);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/favicon-96x96.png"
              alt="Canada Student Job Platform"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-white hidden sm:block">
              High School Students Jobs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-white/20 text-white'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <IconComponent size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative user-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserDropdown(!showUserDropdown);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <UserCircle size={20} />
                  )}
                  <span className="hidden sm:block font-medium">
                    {user.displayName === '시스템 관리자' ? 'System Administrator' : (user.displayName || user.email)}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.displayName === '시스템 관리자' ? 'System Administrator' : (user.displayName || 'User')}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    {userMenuItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeUserDropdown}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <IconComponent size={16} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}

                    {/* Admin Menu */}
                    {user.email === 'admin@example.com' && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        {adminMenuItems.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeUserDropdown}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <IconComponent size={16} />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors border border-white/30"
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/20"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium ${
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <IconComponent size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Auth Section */}
              {user ? (
                <div className="pt-2 border-t border-gray-200">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  
                  {userMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-2 px-3 py-2 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                        onClick={closeMobileMenu}
                      >
                        <IconComponent size={16} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {user.email === 'admin@example.com' && (
                    adminMenuItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center space-x-2 px-3 py-2 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                          onClick={closeMobileMenu}
                        >
                          <IconComponent size={16} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })
                  )}

                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleSignOut();
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-base text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      setShowAuthModal(true);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-base text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {authLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div className="mt-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Sign in with Google
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-800"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 