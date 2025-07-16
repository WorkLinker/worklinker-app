'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { Users, FileText, Building, Phone, DollarSign, Star, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { volunteerService } from '@/lib/firebase-services';

// Volunteer recruitment form schema
const VolunteerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  organizationType: z.string().min(1, 'Please select organization type'),
  contactPerson: z.string().min(2, 'Contact person name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().min(10, 'Please enter a valid phone number'),
  volunteerTitle: z.string().min(5, 'Volunteer position title must be at least 5 characters'),
  volunteerDescription: z.string().min(50, 'Description must be at least 50 characters'),
  location: z.string().min(5, 'Please enter the location'),
  startDate: z.string().min(1, 'Please enter start date'),
  endDate: z.string().min(1, 'Please enter end date'),
  timeCommitment: z.string().min(1, 'Please select time commitment'),
  requiredSkills: z.string().min(10, 'Required skills must be at least 10 characters'),
  benefits: z.string().min(10, 'Benefits must be at least 10 characters'),
  additionalInfo: z.string().optional(),
  agreement: z.boolean().refine((val) => val === true, 'Please agree to the terms')
});

type VolunteerForm = z.infer<typeof VolunteerSchema>;

export default function VolunteerPostingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<VolunteerForm>({
    resolver: zodResolver(VolunteerSchema)
  });

  const onSubmit = async (data: VolunteerForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('🔄 Starting volunteer recruitment registration...');
      
      const result = await volunteerService.submitVolunteerPosting(data);
      
      if (result.success) {
        console.log('✅ Volunteer recruitment registration successful!');
        setSubmitted(true);
        reset();
      }
    } catch (error) {
      console.error('❌ Volunteer recruitment registration error:', error);
      alert('An error occurred during registration. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Full Screen Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
                      src="/images/volunteer.png"
          alt="Volunteer recruitment"
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
              Building a better<br />
              <span className="text-green-400">community together</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
              Recruit student volunteers who will lead New Brunswick&apos;s future<br />
              Create meaningful opportunities to contribute to the community
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-green-600">Home</Link>
            <span className="mx-2">•</span>
            <span className="text-green-600">Volunteer Recruitment Registration</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Info Section */}
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="mr-3 text-green-600" size={28} />
              Volunteer Recruitment Registration Guide
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">📋 Target Volunteers</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• New Brunswick high school students (Grades 9-12)</li>
                  <li>• Students aged 14-18</li>
                  <li>• Students with community service motivation</li>
                  <li>• Basic English communication skills</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">⚡ Registration Process</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Enter volunteer recruitment information</li>
                  <li>• Administrator review (1-2 days)</li>
                  <li>• Publication after approval</li>
                  <li>• Accept student applications and matching</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="mr-3 text-green-600" size={28} />
              Volunteer Recruitment Registration
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Organization Info */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="mr-2 text-green-600" size={20} />
                  Organization Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      {...register('organizationName')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Fredericton Public Library"
                    />
                    {errors.organizationName && (
                      <p className="mt-1 text-sm text-red-600">{errors.organizationName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Type *
                    </label>
                    <select
                      {...register('organizationType')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select organization type</option>
                      <option value="non-profit">Non-profit Organization</option>
                      <option value="educational">Educational Institution</option>
                      <option value="healthcare">Healthcare Facility</option>
                      <option value="environmental">Environmental Organization</option>
                      <option value="community">Community Center</option>
                      <option value="library">Library</option>
                      <option value="religious">Religious Organization</option>
                      <option value="sports">Sports Club</option>
                      <option value="cultural">Cultural Organization</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.organizationType && (
                      <p className="mt-1 text-sm text-red-600">{errors.organizationType.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="mr-2 text-green-600" size={20} />
                  Contact Information
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      {...register('contactPerson')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                    {errors.contactPerson && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactPerson.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('contactEmail')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="contact@organization.ca"
                    />
                    {errors.contactEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register('contactPhone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="506-123-4567"
                    />
                    {errors.contactPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Volunteer Position Details */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="mr-2 text-green-600" size={20} />
                  Volunteer Position Details
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position Title *
                  </label>
                  <input
                    type="text"
                    {...register('volunteerTitle')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Youth Reading Assistant"
                  />
                  {errors.volunteerTitle && (
                    <p className="mt-1 text-sm text-red-600">{errors.volunteerTitle.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    {...register('volunteerDescription')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe the volunteer activities, responsibilities, and goals in detail..."
                  />
                  {errors.volunteerDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.volunteerDescription.message}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      {...register('location')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Fredericton, NB"
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Commitment *
                    </label>
                    <select
                      {...register('timeCommitment')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select time commitment</option>
                      <option value="flexible">Flexible hours</option>
                      <option value="weekends">Weekends only</option>
                      <option value="weekdays">Weekdays only</option>
                      <option value="evenings">Evenings</option>
                      <option value="summer">Summer vacation</option>
                      <option value="one-time">One-time event</option>
                    </select>
                    {errors.timeCommitment && (
                      <p className="mt-1 text-sm text-red-600">{errors.timeCommitment.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements & Benefits */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="mr-2 text-green-600" size={20} />
                  Requirements & Benefits
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills & Qualifications *
                  </label>
                  <textarea
                    {...register('requiredSkills')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Good communication skills, patience with children, basic computer skills, etc."
                  />
                  {errors.requiredSkills && (
                    <p className="mt-1 text-sm text-red-600">{errors.requiredSkills.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benefits & Learning Opportunities *
                  </label>
                  <textarea
                    {...register('benefits')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Community service hours, reference letter, skill development, networking opportunities, etc."
                  />
                  {errors.benefits && (
                    <p className="mt-1 text-sm text-red-600">{errors.benefits.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    {...register('additionalInfo')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Any other important information about the volunteer position..."
                  />
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Important Notice</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• All volunteer positions will be reviewed by administrators before publication</li>
                    <li>• Organizations must provide a safe and educational environment for students</li>
                    <li>• Volunteer hours must comply with New Brunswick labor regulations for minors</li>
                    <li>• Background checks may be required for certain positions</li>
                  </ul>
                </div>
                
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('agreement')}
                    className="mt-1 mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the terms and conditions above and confirm that our organization will provide appropriate supervision and a safe environment for student volunteers. *
                  </span>
                </label>
                {errors.agreement && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreement.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Registration</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </div>

      {/* Success Modal */}
      {submitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h3>
              <p className="text-gray-600 mb-6">
                Your volunteer recruitment has been successfully submitted. 
                It will be published after administrator review and approval.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 