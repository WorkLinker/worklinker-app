import { Mail, Phone, MapPin, Star, Trophy, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-sky-700 via-sky-800 to-sky-900 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-32 h-32 bg-sky-300 rounded-full opacity-10 blur-2xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-sky-400 rounded-full opacity-10 blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Company Info */}
          <div className="lg:col-span-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-300 to-sky-400 rounded-xl flex items-center justify-center shadow-xl">
                <GraduationCap size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">High School Students Jobs</h3>
              </div>
            </div>
            
            <p className="text-sky-200 text-base sm:text-lg leading-relaxed mb-6 max-w-md mx-auto md:mx-0">
              A job matching platform available to all high school students 
              in New Brunswick. We provide transparent and 
              reliable services.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Trophy size={16} className="mr-2 text-yellow-300" />
                <span className="text-sm font-medium">Professional Service</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/job-seekers" className="text-sky-200 hover:text-sky-100 transition-colors text-base sm:text-lg">
                  Student Jobs
                </Link>
              </li>
              <li>
                <Link href="/job-postings" className="text-sky-200 hover:text-sky-100 transition-colors text-base sm:text-lg">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/references" className="text-sky-200 hover:text-sky-100 transition-colors text-base sm:text-lg">
                  References
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sky-200 hover:text-sky-100 transition-colors text-base sm:text-lg">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-sky-200 hover:text-sky-100 transition-colors text-base sm:text-lg">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h4 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Contact</h4>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <MapPin size={18} className="sm:w-5 sm:h-5 text-sky-300 flex-shrink-0" />
                <span className="text-sky-200 text-sm sm:text-base">New Brunswick, Canada</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <Mail size={18} className="sm:w-5 sm:h-5 text-sky-300 flex-shrink-0" />
                <span className="text-sky-200 text-sm sm:text-base">contact@nbstudentjobs.ca</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <Phone size={18} className="sm:w-5 sm:h-5 text-sky-300 flex-shrink-0" />
                <span className="text-sky-200 text-sm sm:text-base">+1 (506) 555-0123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 sm:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sky-200 text-base sm:text-lg">
                © 2025 High School Students Jobs. All rights reserved.
              </p>
              <p className="text-sky-300 text-sm sm:text-base mt-1 sm:mt-2">
                A professional platform for New Brunswick student success
              </p>
            </div>
            
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="flex items-center space-x-2 text-sky-200">
                <Star size={14} className="sm:w-4 sm:h-4 text-yellow-300" />
                <span className="text-xs sm:text-sm font-medium">Professional Service</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 