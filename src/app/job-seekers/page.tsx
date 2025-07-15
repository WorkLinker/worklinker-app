'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { jobSeekerService } from '@/lib/firebase-services';

const JobSeekerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  grade: z.string().min(1, 'Please select your grade'),
  school: z.string().min(2, 'Please enter your school name'),
  skills: z.string().min(1, 'Please describe your skills/experience'),
  availability: z.enum(['full-time', 'part-time', 'volunteer']),
  agreement: z.boolean().refine((val) => val === true, 'Please agree to the terms')
});

type JobSeekerForm = z.infer<typeof JobSeekerSchema>;

export default function JobSeekersPage() {
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<JobSeekerForm>({
    resolver: zodResolver(JobSeekerSchema)
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size limit (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB.');
        return;
      }
      
      // File format restriction
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, DOC, and DOCX files are allowed.');
        return;
      }
      
      setResumeFile(file);
    }
  };

  const onSubmit = async (data: JobSeekerForm) => {
    setIsSubmitting(true);
    
    try {
      console.log('📝 Starting job application submission...');
      
      // Save data to Firebase
      const result = await jobSeekerService.submitApplication(data, resumeFile || undefined);
      
      if (result.success) {
        console.log('🎉 Job application submitted successfully!');
        setSubmitted(true);
        reset();
        setResumeFile(null);
      }
    } catch (error) {
      console.error('❌ Job application submission error:', error);
      alert('An error occurred during submission. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Application Submitted!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We&apos;ll review your information and notify you of the approval results via email.
              <br />
              This typically takes 2-3 days to process.
            </p>
            <div className="bg-sky-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-sky-900 mb-3">Next Steps</h2>
              <ul className="text-sky-800 space-y-2">
                <li>• Admin will review your submitted information</li>
                <li>• After approval, employers can view your profile</li>
                <li>• You&apos;ll be contacted when suitable opportunities arise</li>
              </ul>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-primary"
            >
              Submit Another Application
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden">
        {/* Navigation overlay */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/학생구직.png"
            alt="Student job search"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Student Job Application
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Professional job placement service for New Brunswick high school students
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                const formSection = document.getElementById('application-form');
                if (formSection) {
                  formSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              Apply Now
            </button>
            <button
              onClick={() => {
                const infoSection = document.getElementById('info-section');
                if (infoSection) {
                  infoSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors backdrop-blur-sm"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section id="info-section" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Student Job Application
          </h1>

          <p className="text-lg text-sky-600 font-semibold">
            Professional job placement service for Canadian students
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section id="application-form" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="student@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="506-123-4567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade *
                    </label>
                    <select
                      {...register('grade')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="">Select your grade</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                    {errors.grade && (
                      <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    {...register('school')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="e.g. Fredericton High School"
                  />
                  {errors.school && (
                    <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
                  )}
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume Upload</h2>
                
                <div className="file-upload">
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload size={48} className="text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Choose your resume file
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, DOC, DOCX files only (max 5MB)
                      </p>
                    </div>
                  </label>
                </div>

                {resumeFile && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <FileText size={20} className="text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">{resumeFile.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills/Experience */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills & Experience</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills, Experience, and Areas of Interest *
                  </label>
                  <textarea
                    {...register('skills')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="e.g. Basic computer skills, customer service, teamwork, responsibility, etc."
                  />
                  {errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('availability')}
                        value="full-time"
                        className="mr-2"
                      />
                      <span>Full-time (during holidays)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('availability')}
                        value="part-time"
                        className="mr-2"
                      />
                      <span>Part-time (weekends/after school)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('availability')}
                        value="volunteer"
                        className="mr-2"
                      />
                      <span>Volunteer work</span>
                    </label>
                  </div>
                  {errors.availability && (
                    <p className="mt-1 text-sm text-red-600">{errors.availability.message}</p>
                  )}
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('agreement')}
                    className="mt-1 mr-3"
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2">Privacy Policy & Terms Agreement *</p>
                    <p>
                      Submitted information will only be used for job matching purposes. 
                      After admin approval, employers can view your profile. 
                      Personal information is securely stored and will be destroyed after purpose completion.
                    </p>
                  </div>
                </div>
                {errors.agreement && (
                  <p className="mt-2 text-sm text-red-600">{errors.agreement.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 