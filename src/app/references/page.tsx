'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { FileText, Upload, CheckCircle, User, GraduationCap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { referenceService } from '@/lib/firebase-services';

const ReferenceSchema = z.object({
  studentName: z.string().min(2, 'Student name must be at least 2 characters'),
  studentEmail: z.string().email('Please enter a valid student email address'),
  teacherName: z.string().min(2, 'Teacher name must be at least 2 characters'),
  teacherEmail: z.string().email('Please enter a valid teacher email address'),
  subject: z.string().min(1, 'Please enter the subject'),
  relationship: z.string().min(5, 'Please describe the relationship in detail'),
  referenceText: z.string().min(100, 'Reference letter must be at least 100 characters'),
  agreement: z.boolean().refine((val) => val === true, 'Please agree to the terms')
});

type ReferenceForm = z.infer<typeof ReferenceSchema>;

export default function ReferencesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ReferenceForm>({
    resolver: zodResolver(ReferenceSchema)
  });

  const watchedValues = watch();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be 5MB or less.');
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, DOC, and DOCX files are allowed.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: ReferenceForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('📝 Starting reference letter submission...');
      
      const result = await referenceService.submitReference(data, selectedFile || undefined);
      
      if (result.success) {
        console.log('🎉 Reference letter submission successful!');
        setSubmitted(true);
        reset();
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('❌ Reference letter submission error:', error);
      alert('An error occurred during submission. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            src="/images/references.png"
            alt="Reference letter support"
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
              Sincere recommendations become strength
            </h1>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Reference Letter Upload
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            This is a teacher-only page. Please help students with their job search activities.
            <br />
            Reference letters are of great help to students.
          </p>
          <p className="text-lg text-sky-600 font-semibold">
            Connecting students and teachers through a digital reference system
          </p>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Teacher Only Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <User size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Teacher Only</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                This is a reference letter upload system exclusively for school teachers.
              </p>
              <div className="bg-sky-50 rounded-lg p-4">
                <p className="text-sky-700 font-medium text-sm">
                  Available after teacher verification
                </p>
              </div>
            </div>
            
            {/* Secure Storage Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Storage</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                All reference letters are securely encrypted and stored, linked to student profiles after approval.
              </p>
              <div className="bg-sky-50 rounded-lg p-4">
                <p className="text-sky-700 font-medium text-sm">
                  SSL encryption and GDPR compliant
                </p>
              </div>
            </div>
            
            {/* Professional Support Card */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:border-sky-200">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <GraduationCap size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional Support</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Support students&apos; successful career start through professional references.
              </p>
              <div className="bg-sky-50 rounded-lg p-4">
                <p className="text-sky-700 font-medium text-sm">
                  Supports New Brunswick students
                </p>
              </div>
            </div>
          </div>

          {/* Process Steps */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 className="font-semibold text-gray-900 mb-2">Student Information</h3>
                <p className="text-sm text-gray-600">Enter the student&apos;s basic information and your relationship</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 className="font-semibold text-gray-900 mb-2">Write Reference</h3>
                <p className="text-sm text-gray-600">Write a detailed reference letter or upload a file</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 className="font-semibold text-gray-900 mb-2">Review & Submit</h3>
                <p className="text-sm text-gray-600">Review your reference letter and submit</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                <h3 className="font-semibold text-gray-900 mb-2">Profile Connection</h3>
                <p className="text-sm text-gray-600">Reference is linked to the student&apos;s profile after approval</p>
              </div>
            </div>
          </div>

          {/* Reference Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Submit Reference Letter</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Student Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      {...register('studentName')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                    {errors.studentName && (
                      <p className="mt-1 text-sm text-red-600">{errors.studentName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Email *
                    </label>
                    <input
                      type="email"
                      {...register('studentEmail')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="student@school.ca"
                    />
                    {errors.studentEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.studentEmail.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Teacher Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Teacher Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teacher Name *
                    </label>
                    <input
                      type="text"
                      {...register('teacherName')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Ms. Johnson"
                    />
                    {errors.teacherName && (
                      <p className="mt-1 text-sm text-red-600">{errors.teacherName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teacher Email *
                    </label>
                    <input
                      type="email"
                      {...register('teacherEmail')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="teacher@school.ca"
                    />
                    {errors.teacherEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.teacherEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Taught *
                    </label>
                    <input
                      type="text"
                      {...register('subject')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="English, Math, Science, etc."
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship to Student *
                    </label>
                    <input
                      type="text"
                      {...register('relationship')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="e.g., Homeroom teacher for 2 years"
                    />
                    {errors.relationship && (
                      <p className="mt-1 text-sm text-red-600">{errors.relationship.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference Content */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Reference Letter Content</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Letter Content *
                  </label>
                  <textarea
                    {...register('referenceText')}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Please describe the student's integrity, abilities, attitude, growth process, etc. in detail.

Example:
- Academic achievement and learning attitude
- Responsibility and integrity
- Teamwork and leadership
- Special talents or experiences
- Job readiness and reasons for recommendation"
                  />
                  {errors.referenceText && (
                    <p className="mt-1 text-sm text-red-600">{errors.referenceText.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Current character count: {watchedValues.referenceText?.length || 0} characters (minimum 100)
                  </p>
                </div>
              </div>

              {/* File Upload (Optional) */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">File Upload (Optional)</h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    id="referenceFile"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="referenceFile" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload size={48} className="text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Upload additional reference file
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, DOC, DOCX files only (max 5MB)
                      </p>
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <FileText size={20} className="text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">{selectedFile.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('agreement')}
                    className="mt-1 mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm that the information provided is accurate and I have the authority to write this reference letter for the student. I agree to the collection and use of this information for student job placement purposes. *
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
                  className="px-8 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Reference</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {submitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reference Submitted!</h3>
              <p className="text-gray-600 mb-6">
                The reference letter has been successfully submitted. 
                It will be linked to the student&apos;s profile after administrator review.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
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