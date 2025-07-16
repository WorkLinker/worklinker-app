'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, MapPin, Clock, Users, Heart, Calendar, Building, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { volunteerService } from '@/lib/firebase-services';

export default function VolunteerListingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [volunteerPostings, setVolunteerPostings] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredPostings, setFilteredPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganizationType, setSelectedOrganizationType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  const organizationTypes = [
    'All',
    'Library',
    'Nursing Home/Care Facility', 
    'Senior Center/Welfare Center',
    'Pharmacy/Medical Facility',
    'Government/Public Agency',
    'School/Educational Institution',
    'Religious Organization',
    'Environmental Group',
    'Animal Shelter',
    'Food Bank/Soup Kitchen',
    'Other'
  ];

  // Load volunteer opportunities list
  useEffect(() => {
    loadVolunteerPostings();
  }, []);

  const loadVolunteerPostings = async () => {
    try {
      setLoading(true);
      const postings = await volunteerService.getApprovedVolunteerPostings();
      setVolunteerPostings(postings);
      setFilteredPostings(postings);
    } catch (error) {
      console.error('❌ Volunteer opportunities load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search and filtering
  useEffect(() => {
    let filtered = volunteerPostings;

    // Search term filtering
    if (searchTerm) {
      filtered = filtered.filter(posting =>
        posting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posting.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Organization type filtering
    if (selectedOrganizationType && selectedOrganizationType !== 'All') {
      filtered = filtered.filter(posting => posting.organizationType === selectedOrganizationType);
    }

    setFilteredPostings(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [searchTerm, selectedOrganizationType, volunteerPostings]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPostings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPostings = filteredPostings.slice(startIndex, startIndex + itemsPerPage);



  const getOrganizationTypeColor = (type: string) => {
    const colors = {
      'Library': 'bg-blue-100 text-blue-800',
      'Nursing Home/Care Facility': 'bg-pink-100 text-pink-800',
      'Senior Center/Welfare Center': 'bg-purple-100 text-purple-800',
      'Pharmacy/Medical Facility': 'bg-red-100 text-red-800',
      'Government/Public Agency': 'bg-gray-100 text-gray-800',
      'School/Educational Institution': 'bg-green-100 text-green-800',
      'Religious Organization': 'bg-yellow-100 text-yellow-800',
      'Environmental Group': 'bg-emerald-100 text-emerald-800',
      'Animal Shelter': 'bg-orange-100 text-orange-800',
      'Food Bank/Soup Kitchen': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800'
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
            <p className="text-gray-600">Loading volunteer opportunities...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Full Screen Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
                      src="/images/volunteer.png"
          alt="Volunteer Opportunities"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Navigation Overlay */}
        <div className="absolute top-0 left-0 right-0 z-30">
          <Navigation />
        </div>
        
        {/* Hero Content - Positioned at Bottom */}
        <div className="absolute bottom-20 left-0 right-0 z-20 text-center text-white px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Find Meaningful<br />
              <span className="text-green-400">Volunteer Work</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover various volunteer opportunities that help your community<br />
              Your small interest can make a big difference
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="#volunteer-list"
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Heart size={20} className="mr-2" />
                Find Volunteer Opportunities
              </Link>
              <Link 
                href="/volunteer-postings"
                className="inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/30 rounded-full font-semibold text-lg transition-all duration-300"
              >
                <Plus size={20} className="mr-2" />
                Recruit Volunteers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <div id="volunteer-list" className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-green-600 font-medium">Volunteer Opportunities</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search volunteer opportunities, organization names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              />
            </div>
            
            {/* Organization Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={selectedOrganizationType}
                onChange={(e) => setSelectedOrganizationType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
              >
                {organizationTypes.map((type) => (
                  <option key={type} value={type === 'All' ? '' : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mt-6 text-sm text-gray-600">
            Total <span className="font-semibold text-green-600">{filteredPostings.length}</span> volunteer opportunities
          </div>
        </div>
      </div>

      {/* Volunteer Postings Grid */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-12">
          {currentPostings.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No volunteer opportunities found matching your criteria
              </h3>
              <p className="text-gray-600 mb-6">
                Try different search terms or filters
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedOrganizationType('');
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View all volunteer opportunities
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPostings.map((posting) => (
                <div key={posting.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrganizationTypeColor(posting.organizationType)}`}>
                        {posting.organizationType}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users size={14} className="mr-1" />
                        {posting.applicantCount || 0} applicants
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {posting.title}
                    </h3>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                      <Building size={16} className="mr-2 text-green-600" />
                      <span className="font-medium">{posting.organizationName}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {posting.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-2 text-green-600" />
                        <span>{posting.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-green-600" />
                        <span>{posting.timeCommitment}</span>
                      </div>
                      {posting.startDate && (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-green-600" />
                          <span>{posting.startDate} start</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-6 pt-0">
                    <Link
                      href={`/volunteer-listings/${posting.id}`}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Heart size={16} className="mr-2" />
                      Apply for Volunteer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={20} />
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      currentPage === page
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
} 