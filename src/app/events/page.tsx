'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Users, ChevronRight, UserPlus, CheckCircle, ChevronLeft, Plus, Building } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { eventService } from '@/lib/firebase-services';
import { authService } from '@/lib/auth-service';
// import { User as SupabaseUser } from '@supabase/supabase-js';

export default function EventsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin event registration form data
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'workshop',
    maxParticipants: 30,
    organizer: '',
    agenda: [''],
    benefits: [''],
    requirements: ['']
  });

  // Date dropdown states
  const [dateForm, setDateForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });

  // Pagination related calculations
  const totalPages = Math.ceil(events.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEvents = events.slice(startIndex, startIndex + itemsPerPage);

  // User information and event real-time subscription
  useEffect(() => {
    const unsubscribeAuth = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });

    // Real-time event subscription
    const unsubscribeEvents = eventService.subscribeToEvents((eventsData) => {
      setEvents(eventsData);
      setLoading(false);
              console.log('🔄 Real-time event updates:', eventsData.length, 'events');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
    };
  }, []);

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'job-fair': return 'Job Fair';
      case 'workshop': return 'Workshop';
      case 'seminar': return 'Seminar';
      case 'competition': return 'Competition';
      case 'experience': return 'Experience Program';
      default: return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'job-fair': return 'bg-sky-100 text-sky-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      case 'seminar': return 'bg-purple-100 text-purple-800';
      case 'competition': return 'bg-orange-100 text-orange-800';
      case 'experience': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRegistration = async (eventId: string) => {
    if (!user) {
      alert('You need to sign in to register for events.');
      return;
    }

    setIsRegistering(true);
    
    try {
      console.log('🎉 Starting event registration...', eventId);
      
      const participantData = {
        name: user.displayName || user.email?.split('@')[0] || 'Participant',
        email: user.email || '',
        phone: '000-000-0000', // Should be input from form in practice
        school: 'School Information', // Should be input from form in practice
        grade: 'Grade Information', // Should be input from form in practice
                  eventTitle: selectedEvent?.title || 'Event'
      };
      
      const result = await eventService.registerForEvent(eventId, participantData);
      
      if (result.success) {
        console.log('✅ Event registration completed successfully!');
        setRegistrationSuccess(true);
        setSelectedEvent(null);
      }
    } catch (error: unknown) {
      console.error('❌ Event registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration. Please try again.';
      alert(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAdminEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !eventService.isAdmin(user.email || '')) {
      alert('Administrator privileges required.');
      return;
    }

    try {
      setIsRegistering(true);
      
      const eventData = {
        ...eventForm,
        agenda: eventForm.agenda.filter(item => item.trim() !== ''),
        benefits: eventForm.benefits.filter(item => item.trim() !== ''),
        requirements: eventForm.requirements.filter(item => item.trim() !== '')
      };

      const result = await eventService.createEvent(eventData, user.email || '');
      
      if (result.success) {
        alert('Event registered successfully!');
        setShowAdminForm(false);
        // Form reset
        setEventForm({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          type: 'workshop',
          maxParticipants: 30,
          organizer: '',
          agenda: [''],
          benefits: [''],
          requirements: ['']
        });
        // Date dropdown also reset
        setDateForm({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate()
        });
      }
    } catch (error: unknown) {
      console.error('❌ Admin event registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while registering the event.';
      alert(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };



  // const addFormField = (fieldName: 'agenda' | 'benefits' | 'requirements') => {
  //   setEventForm(prev => ({
  //     ...prev,
  //     [fieldName]: [...prev[fieldName], '']
  //   }));
  // };

  // const updateFormField = (fieldName: 'agenda' | 'benefits' | 'requirements', index: number, value: string) => {
  //   setEventForm(prev => ({
  //     ...prev,
  //     [fieldName]: prev[fieldName].map((item, i) => i === index ? value : item)
  //   }));
  // };

  // Date dropdown related functions
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const generateDays = () => {
    const daysInMonth = new Date(dateForm.year, dateForm.month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const handleDateChange = (field: 'year' | 'month' | 'day', value: number) => {
    const newDateForm = { ...dateForm, [field]: value };
    
    // Adjust if the day exceeds the maximum days in the month
    if (field === 'year' || field === 'month') {
      const daysInMonth = new Date(newDateForm.year, newDateForm.month, 0).getDate();
      if (newDateForm.day > daysInMonth) {
        newDateForm.day = daysInMonth;
      }
    }
    
    setDateForm(newDateForm);
    
    // Update eventForm's date
    const formattedDate = `${newDateForm.year}-${String(newDateForm.month).padStart(2, '0')}-${String(newDateForm.day).padStart(2, '0')}`;
    setEventForm(prev => ({ ...prev, date: formattedDate }));
  };

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const formatDate = (timestamp: any) => {
  //   if (!timestamp) return 'No date information';
  //   
  //   // Firebase Timestamp or general date string processing
  //   let date;
  //   if (timestamp.toDate) {
  //     date = timestamp.toDate();
  //   } else if (timestamp instanceof Date) {
  //     date = timestamp;
  //   } else {
  //     date = new Date(timestamp);
  //   }
  //   
  //   return date.toLocaleDateString('ko-KR', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric'
  //   });
  // };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Event registration completed!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              A confirmation email has been sent. 
              <br />
              You may receive additional instructions before the event.
            </p>
            <div className="bg-sky-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-sky-900 mb-3">Next Steps</h2>
              <ul className="text-sky-800 space-y-2">
                <li>• Reminder email the day before the event</li>
                <li>• Necessary preparations and reminders</li>
                <li>• Utilize event participation and networking opportunities</li>
              </ul>
            </div>
            <button
              onClick={() => setRegistrationSuccess(false)}
              className="btn-primary"
            >
              View Other Events
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
      <section className="h-screen flex items-end justify-center relative overflow-hidden pb-20">
        {/* Navigation overlay */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
                          src="/images/events.jpg"
            alt="Educational Events"
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
              Special student events are happening
            </h1>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Events & Education
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            Join diverse educational programs and career fairs to prepare for your future.
            <br />
            We provide hands-on workshops and networking opportunities.
          </p>
          <p className="text-lg text-orange-600 font-semibold mb-8">
            Job fairs, interview skills workshops, career seminars, and more diverse events
          </p>

          {/* Admin event registration button */}
          {user && eventService.isAdmin(user.email || '') && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <button
                onClick={() => setShowAdminForm(true)}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
              >
                <Plus size={20} />
                <span>Admin: Create Event</span>
              </button>

            </div>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Upcoming Events
              </h2>
              <div className="flex items-center bg-orange-100 rounded-full px-4 py-2">
                <Calendar size={16} className="mr-2 text-orange-600" />
                <span className="text-orange-600 font-medium text-sm">
                  {events.length} Total Events
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              Hands-on events designed by experts. All students are welcome to participate.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading events...</p>
            </div>
          ) : currentEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Participants</p>
                        <p className="text-xs font-medium">
                          {event.currentParticipants || 0}/{event.maxParticipants || 0}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                      {event.description}
                    </p>

                    <div className="space-y-1 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar size={14} className="mr-2" />
                        <span className="text-xs">{event.date}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock size={14} className="mr-2" />
                        <span className="text-xs">{event.time}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin size={14} className="mr-2" />
                        <span className="text-xs">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center">
                        <Users size={14} className="mr-1 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {event.remainingSlots || 0} spots remaining
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="flex items-center text-orange-600 hover:text-orange-800 font-medium text-sm"
                      >
                        <span>View Details</span>
                        <ChevronRight size={14} className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Building size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No events registered yet
              </h3>
              <p className="text-gray-600 mb-6">
                No events registered yet. Please wait for the administrator to register new events.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {events.length} items, showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, events.length)}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Admin event registration modal */}
      {showAdminForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Admin: Create New Event</h2>
                <button
                  onClick={() => setShowAdminForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdminEventSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g. 2025 Summer Job Fair"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type *
                    </label>
                    <select
                      required
                      value={eventForm.type}
                      onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="job-fair">Job Fair</option>
                      <option value="competition">Competition</option>
                      <option value="experience">Experience Program</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Year selection */}
                      <select
                        value={dateForm.year}
                        onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center"
                      >
                        {generateYears().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      
                      {/* Month selection */}
                      <select
                        value={dateForm.month}
                        onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center"
                      >
                        {generateMonths().map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      
                      {/* Day selection */}
                      <select
                        value={dateForm.day}
                        onChange={(e) => handleDateChange('day', parseInt(e.target.value))}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center"
                      >
                        {generateDays().map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selected date: {dateForm.year}/{dateForm.month}/{dateForm.day}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.time}
                      onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g. 10:00 AM - 4:00 PM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.location}
                      onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g. Fredericton Convention Centre"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Participants *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={eventForm.maxParticipants}
                      onChange={(e) => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter a detailed description of the event"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organizer *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm({...eventForm, organizer: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g. NB High School Jobs"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAdminForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(selectedEvent.type)}`}>
                    {getEventTypeLabel(selectedEvent.type)}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mt-2">
                    {selectedEvent.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar size={18} className="mr-3 text-gray-500" />
                      <span>{selectedEvent.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={18} className="mr-3 text-gray-500" />
                      <span>{selectedEvent.time}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={18} className="mr-3 text-gray-500" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={18} className="mr-3 text-gray-500" />
                      <span>{selectedEvent.currentParticipants || 0}/{selectedEvent.maxParticipants || 0} participants</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizer</h3>
                    <p className="text-gray-600">{selectedEvent.organizer}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 mb-6">{selectedEvent.description}</p>
                  
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((selectedEvent.currentParticipants || 0) / (selectedEvent.maxParticipants || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        <span className="font-medium text-orange-600">
                          {selectedEvent.remainingSlots || 0} spots remaining
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t text-center">
                {(selectedEvent.remainingSlots || 0) <= 0 ? (
                  <div className="text-center">
                    <p className="text-red-600 font-medium mb-4">
                      Sorry, this event is fully booked.
                    </p>
                    <p className="text-gray-600 text-sm">
                      Please check out our other upcoming events.
                    </p>
                  </div>
                ) : !user ? (
                  <div className="text-center">
                    <p className="text-gray-600 font-medium mb-4">
                      You need to sign in to register for events.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRegistration(selectedEvent.id)}
                    disabled={isRegistering}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] flex items-center justify-center space-x-2 mx-auto"
                  >
                    <UserPlus size={18} />
                    <span>{isRegistering ? 'Registering...' : 'Register for Event'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 