'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader
} from 'lucide-react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { sendContactEmail, ContactFormData } from '@/lib/email-service';
import { contactService } from '@/lib/firebase-services';

// Get contact information from environment variables
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'nbhighschooljobs@gmail.com';
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '506-429-6148';
const CONTACT_ADDRESS = process.env.NEXT_PUBLIC_CONTACT_ADDRESS || '122 Brianna Dr, Fredericton NB COA 1N0';

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('📝 Submitting contact form...');
      
      // Step 1: Save inquiry to Firebase (always executed)
      const firebaseResult = await contactService.submitContact(formData);
      
      if (firebaseResult.success) {
        console.log('✅ Contact saved to Firebase successfully');
        
        // Step 2: Email sending disabled - using Firebase only for maximum reliability
        console.log('📧 Email sending disabled - all inquiries saved to Firebase database');
        console.log('📝 Admin can view all inquiries in the admin dashboard Contact Management section');
        
        // Process as success if Firebase save succeeded
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setError('An error occurred while saving your inquiry. Please try again.');
      }
    } catch (err) {
      console.error('❌ Contact form submission error:', err);
      setError('An error occurred while submitting your inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-screen hero section */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden">
        {/* Navigation overlay */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
                            src="/images/contact-us.jpg"
            alt="Contact Us"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Hero Content - bottom overlay */}
        <div className="absolute inset-0 flex items-end pb-24">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Have questions or need assistance? Contact us anytime. 
              We&apos;ll provide you with a helpful response.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  const contactSection = document.getElementById('contact-section');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
              >
                Send Inquiry
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
                Contact Info
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact information section */}
      <section id="info-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contact Information
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You can reach us through various methods
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <a 
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-purple-600 hover:text-purple-700 transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
              <a 
                href={`tel:${CONTACT_PHONE}`}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                {CONTACT_PHONE}
              </a>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Address</h3>
              <p className="text-gray-600">
                {CONTACT_ADDRESS.split(', ').map((part, index) => (
                  <span key={index}>
                    {part}
                    {index < CONTACT_ADDRESS.split(', ').length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Hours</h3>
              <div className="text-gray-600 space-y-1">
                <p>Weekdays: 9 AM - 6 PM</p>
                <p>Weekends: 10 AM - 4 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact form section */}
      <section id="contact-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Send Inquiry
            </h2>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Your inquiry has been submitted successfully!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your inquiry has been saved to our system and we will respond within 24 hours.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setError(null);
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Send Another Inquiry
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" lang="en">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-600">{error}</span>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      title="Please enter your name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your name"
                      onInvalid={(e) => {
                        e.preventDefault();
                        (e.target as HTMLInputElement).setCustomValidity('Please enter your name');
                      }}
                      onInput={(e) => {
                        (e.target as HTMLInputElement).setCustomValidity('');
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      title="Please enter a valid email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your email"
                      onInvalid={(e) => {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        if (input.validity.valueMissing) {
                          input.setCustomValidity('Please enter your email address');
                        } else if (input.validity.typeMismatch) {
                          input.setCustomValidity('Please enter a valid email address');
                        }
                      }}
                      onInput={(e) => {
                        (e.target as HTMLInputElement).setCustomValidity('');
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    title="Please enter your phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    title="Please provide details about your inquiry"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Please provide details about your inquiry"
                    onInvalid={(e) => {
                      e.preventDefault();
                      (e.target as HTMLTextAreaElement).setCustomValidity('Please provide details about your inquiry');
                    }}
                    onInput={(e) => {
                      (e.target as HTMLTextAreaElement).setCustomValidity('');
                    }}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Q. How do I sign up?
              </h3>
              <p className="text-gray-600 mb-4">
                You can easily sign up using your Google account. 
                Start on the Student Job Search or Employer Recruitment page.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Q. Is job searching free?
              </h3>
              <p className="text-gray-600 mb-4">
                Yes, all services are completely free. 
                This is a non-profit platform supporting student employment.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Q. What types of jobs are available?
              </h3>
              <p className="text-gray-600 mb-4">
                We have various part-time jobs suitable for high school students, 
                including cafes, restaurants, retail stores, and office work.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Q. When will I receive a response?
              </h3>
              <p className="text-gray-600 mb-4">
                We respond within 24 hours of receiving your inquiry. 
                For urgent matters, please call us directly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional help section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need Additional Help?
          </h2>
          <p className="text-gray-600 mb-8">
            You can also contact us through other methods
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Send Email</span>
            </a>
            
            <a
              href={`tel:${CONTACT_PHONE}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Phone className="w-5 h-5" />
              <span>Call Us</span>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 