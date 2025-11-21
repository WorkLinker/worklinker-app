/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, storage } from './firebase';
// import { supabase } from './supabase';

// Safe response generation helper
// const createSafeResponse = (message: string = 'Firebase not available') => ({
//   success: false,
//   error: message,
//   data: null
// });

// Check Firebase service availability
const isFirebaseAvailable = () => {
  return !!db && !!storage;
};


import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  orderBy, 
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 🎓 Student Job Application Services
export const jobSeekerService = {
  // Submit job application
  async submitApplication(data: any, resumeFile?: File) {
    if (!db) {
      console.warn('Firebase not configured - using placeholder response');
      return { success: false, error: 'Firebase not available. Please use Supabase services.' };
    }
    
    try {
      let resumeUrl = '';
      
      // Upload resume file (only when Storage is activated)
      if (resumeFile) {
        try {
          const resumeRef = ref(storage, `resumes/${Date.now()}_${resumeFile.name}`);
          const snapshot = await uploadBytes(resumeRef, resumeFile);
          resumeUrl = await getDownloadURL(snapshot.ref);
          console.log('File upload successful:', resumeUrl);
        } catch (storageError) {
          console.warn('⚠️ File upload failed (Storage not configured):', storageError);
          resumeUrl = `Filename: ${resumeFile.name} (Upload pending)`;
        }
      }
      
      // Save data to Firestore
      const docRef = await addDoc(collection(db, 'jobSeekers'), {
        ...data,
        resumeUrl,
        resumeFileName: resumeFile?.name || '',
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Job application submitted successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Job application error:', error);
      throw error;
    }
  },

  // Get all job seekers (approved only)
  async getApprovedJobSeekers() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available - returning empty job seekers list');
      return [];
    }
    
    try {
      // Separate where and orderBy to prevent composite index error
      const q = query(
        collection(db, 'jobSeekers'), 
        where('approved', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const jobSeekers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort on client side (descending by createdAt)
      jobSeekers.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ Job seekers list retrieved successfully:', jobSeekers.length, 'applicants');
      return jobSeekers;
    } catch (error) {
      console.error('❌ Job seekers list retrieval error:', error);
      throw error;
    }
  },

  // Get pending applicants list (for admin)
  async getPendingApplications() {
    try {
      // Separate where and orderBy to prevent composite index error
      const q = query(
        collection(db, 'jobSeekers'), 
        where('approved', '==', false)
      );
      const querySnapshot = await getDocs(q);
      const pendingApplications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort on client side (descending by createdAt)
      pendingApplications.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ Pending applicants list retrieved successfully:', pendingApplications.length, 'applicants');
      return pendingApplications;
    } catch (error) {
      console.error('❌ Pending applicants list retrieval error:', error);
      throw error;
    }
  },

  // Approve job application (for admin)
  async approveApplication(applicationId: string) {
    try {
      console.log('✅ Starting job application approval:', applicationId);
      
      const docRef = doc(db, 'jobSeekers', applicationId);
      await updateDoc(docRef, {
        approved: true,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Job application approved successfully:', applicationId);
      return { success: true, id: applicationId };
    } catch (error) {
      console.error('❌ Job application approval error:', error);
      throw error;
    }
  },

  // Reject job application (for admin)
  async rejectApplication(applicationId: string, reason?: string) {
    try {
      console.log('❌ Starting job application rejection:', applicationId, 'Reason:', reason);
      
      const docRef = doc(db, 'jobSeekers', applicationId);
      await updateDoc(docRef, {
        approved: false,
        rejected: true,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || 'No reason provided',
        updatedAt: serverTimestamp()
      });
      
      console.log('❌ Job application rejected successfully:', applicationId);
      return { success: true, id: applicationId };
    } catch (error) {
      console.error('❌ Job application rejection error:', error);
      throw error;
    }
  },


};

// 💼 Job Posting Application Services
export const jobApplicationService = {
  // Apply to job posting
  async submitApplication(jobPostingId: string, applicationData: any) {
    try {
      console.log('📝 Starting job posting application:', jobPostingId);
      
      // Save application data
      const docRef = await addDoc(collection(db, 'jobApplications'), {
        jobPostingId,
        ...applicationData,
        status: 'pending', // pending, reviewed, accepted, rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Increase job posting applicant count
      const jobPostingRef = doc(db, 'jobPostings', jobPostingId);
      const jobPostingSnapshot = await getDocs(query(collection(db, 'jobPostings'), where('__name__', '==', jobPostingId)));
      
      if (!jobPostingSnapshot.empty) {
        const currentData = jobPostingSnapshot.docs[0].data();
        await updateDoc(jobPostingRef, {
          applications: (currentData.applications || 0) + 1,
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('✅ Job posting application submitted successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Job posting application submission error:', error);
      throw error;
    }
  },

  // Get applicants list for specific job posting (for employers)
  async getApplicationsByJobPosting(jobPostingId: string) {
    try {
      const q = query(
        collection(db, 'jobApplications'),
        where('jobPostingId', '==', jobPostingId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Job posting applicants list retrieved successfully:', applications.length, 'applicants');
      return applications;
    } catch (error) {
      console.error('❌ Job posting applicants list retrieval error:', error);
      throw error;
    }
  },

  // Update application status (for employers)
  async updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    try {
      console.log('📝 Updating application status:', applicationId, '→', status);
      
      const docRef = doc(db, 'jobApplications', applicationId);
      await updateDoc(docRef, {
        status,
        statusNotes: notes || '',
        statusUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Application status updated successfully:', applicationId);
      return { success: true, id: applicationId };
    } catch (error) {
      console.error('❌ Application status update error:', error);
      throw error;
    }
  },

  // Get user's application history
  async getApplicationsByUser(userEmail: string) {
    try {
      const q = query(
        collection(db, 'jobApplications'),
        where('email', '==', userEmail),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ User application history retrieved successfully:', applications.length, 'applications');
      return applications;
    } catch (error) {
      console.error('❌ User application history retrieval error:', error);
      throw error;
    }
  }
};

// 🏢 Company Job Posting Services
export const jobPostingService = {
  // Submit job posting
  async submitJobPosting(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'jobPostings'), {
        ...data,
        approved: false,
        views: 0,
        applications: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Job posting submitted successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Job posting submission error:', error);
      throw error;
    }
  },

  // Get approved job postings list
  async getApprovedJobPostings() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available - returning empty job postings list');
      return [];
    }
    
    try {
      // Use simple query to prevent index error
      const querySnapshot = await getDocs(collection(db, 'jobPostings'));
      const jobPostings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort on client side
      jobPostings.sort((a, b) => {
        const timeA = (a as any)?.createdAt?.toDate?.() || new Date(0);
        const timeB = (b as any)?.createdAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      
      console.log('✅ Job postings list retrieved successfully:', jobPostings.length, 'postings (index error prevention mode)');
      return jobPostings;
    } catch (error) {
      console.error('❌ Job postings list retrieval error:', error);
      throw error;
    }
  },

  // Increase job posting views
  async incrementViews(jobPostingId: string) {
    try {
      const jobPostingRef = doc(db, 'jobPostings', jobPostingId);
      const jobPostingSnapshot = await getDocs(query(collection(db, 'jobPostings'), where('__name__', '==', jobPostingId)));
      
      if (!jobPostingSnapshot.empty) {
        const currentData = jobPostingSnapshot.docs[0].data();
        await updateDoc(jobPostingRef, {
          views: (currentData.views || 0) + 1,
          updatedAt: serverTimestamp()
        });
        console.log('👁️ Job posting views increased:', jobPostingId);
      }
    } catch (error) {
      console.error('❌ Views increment error:', error);
    }
  },


};

// 📄 Reference Services
export const referenceService = {
  // Submit reference
  async submitReference(data: any, referenceFile?: File) {
    try {
      let referenceFileUrl = '';
      
      // Upload reference file (only when Storage is activated)
      if (referenceFile) {
        try {
          const refRef = ref(storage, `references/${Date.now()}_${referenceFile.name}`);
          const snapshot = await uploadBytes(refRef, referenceFile);
          referenceFileUrl = await getDownloadURL(snapshot.ref);
          console.log('✅ File upload successful:', referenceFileUrl);
        } catch (storageError) {
          console.warn('⚠️ File upload failed (Storage not configured):', storageError);
          referenceFileUrl = `Filename: ${referenceFile.name} (Upload pending)`;
        }
      }
      
      const docRef = await addDoc(collection(db, 'references'), {
        ...data,
        referenceFileUrl,
        referenceFileName: referenceFile?.name || '',
        status: 'pending',
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Reference submitted successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Reference submission error:', error);
      throw error;
    }
  },

  // Get all references (for admin)
  async getAllReferences() {
    try {
      const q = query(collection(db, 'references'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const references = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ References retrieved:', references.length);
      return references;
    } catch (error) {
      console.error('❌ Get references error:', error);
      throw error;
    }
  },

  // Update reference status (approve/reject)
  async updateReferenceStatus(referenceId: string, status: 'approved' | 'rejected', adminNote?: string) {
    try {
      const refDoc = doc(db, 'references', referenceId);
      await updateDoc(refDoc, {
        status,
        approved: status === 'approved',
        adminNote: adminNote || '',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Reference ${status}:`, referenceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Update reference status error:', error);
      throw error;
    }
  },

  // Delete reference
  async deleteReference(referenceId: string) {
    try {
      await deleteDoc(doc(db, 'references', referenceId));
      console.log('✅ Reference deleted:', referenceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Delete reference error:', error);
      throw error;
    }
  }
};

// 🎉 Event Services
export const eventService = {
  // Create admin event
  async createEvent(data: any, adminEmail: string) {
    try {
      // Admin permission check (simple check - more sophisticated permission system needed in practice)
      const adminEmails = ['admin@example.com', 'manager@jobsprout.ca', 'admin@jobsprout.ca'];
      if (!adminEmails.includes(adminEmail)) {
        throw new Error('You do not have administrator permissions.');
      }

      const docRef = await addDoc(collection(db, 'events'), {
        ...data,
        createdBy: adminEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Admin event created successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Event creation error:', error);
      throw error;
    }
  },

  // Register for event
  async registerForEvent(eventId: string, participantData: any) {
    try {
      // Check if already registered
      const existingQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('email', '==', participantData.email)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        throw new Error('You have already registered for this event.');
      }

      const docRef = await addDoc(collection(db, 'eventRegistrations'), {
        eventId,
        ...participantData,
        registeredAt: serverTimestamp()
      });
      
      console.log('✅ Event registration successful:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Event registration error:', error);
      throw error;
    }
  },

  // Get real-time events list (with participant count)
  async getAllEventsWithParticipants() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available - returning empty events list');
      return [];
    }
    
    try {
      // Get events list (sorted by createdAt to prevent index error)
      const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate participant count for each event
      const eventsWithParticipants = await Promise.all(
        events.map(async (event) => {
          const participantsQuery = query(
            collection(db, 'eventRegistrations'),
            where('eventId', '==', event.id)
          );
          const participantsSnapshot = await getDocs(participantsQuery);
          const currentParticipants = participantsSnapshot.size;

          return {
            ...event,
            currentParticipants,
            remainingSlots: Math.max(0, ((event as any).maxParticipants || 0) - currentParticipants)
          };
        })
      );
      
      console.log('✅ Real-time events list retrieved successfully:', eventsWithParticipants.length, 'events');
      return eventsWithParticipants;
    } catch (error) {
      console.error('❌ Events list retrieval error:', error);
      throw error;
    }
  },

  // Subscribe to real-time events (with real-time participant count update)
  subscribeToEvents(callback: (events: any[]) => void) {
    try {
      const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      
      return onSnapshot(
        eventsQuery, 
        async (eventsSnapshot) => {
          const events = eventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Calculate real-time participant count for each event
          const eventsWithParticipants = await Promise.all(
            events.map(async (event) => {
              const participantsQuery = query(
                collection(db, 'eventRegistrations'),
                where('eventId', '==', event.id)
              );
              const participantsSnapshot = await getDocs(participantsQuery);
              const currentParticipants = participantsSnapshot.size;

              return {
                ...event,
                currentParticipants,
                remainingSlots: Math.max(0, ((event as any).maxParticipants || 0) - currentParticipants)
              };
            })
          );

          callback(eventsWithParticipants);
        },
        (error) => {
          console.warn('⚠️ Events subscription error (permission denied or network issue):', error);
        }
      );
    } catch (error) {
      console.warn('⚠️ Failed to setup events subscription:', error);
      return () => {};
    }
  },

  // Subscribe to real-time participant count for specific event
  subscribeToEventParticipants(eventId: string, callback: (count: number) => void) {
    try {
      const participantsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId)
      );
      
      return onSnapshot(
        participantsQuery, 
        (snapshot) => {
          callback(snapshot.size);
        },
        (error) => {
          console.warn('⚠️ Event participants subscription error (permission denied or network issue):', error);
        }
      );
    } catch (error) {
      console.warn('⚠️ Failed to setup event participants subscription:', error);
      return () => {};
    }
  },

  // Check admin permissions
  isAdmin(email: string): boolean {
    if (!isFirebaseAvailable()) {
      // When Firebase is unavailable, only histudentjobs@gmail.com is recognized as admin
      return email === 'histudentjobs@gmail.com';
    }
    const adminEmails = ['admin@example.com', 'manager@jobsprout.ca', 'admin@jobsprout.ca', 'histudentjobs@gmail.com'];
    return adminEmails.includes(email);
  },


};

// 💬 Community Board Services
export const communityService = {
  // Create post
  async createPost(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'communityPosts'), {
        ...data,
        views: 0,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Post created successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Post creation error:', error);
      throw error;
    }
  },

  // Get all posts
  async getAllPosts() {
    try {
      const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Posts list retrieved successfully:', posts.length, 'posts');
      return posts;
    } catch (error) {
      console.error('❌ Posts list retrieval error:', error);
      throw error;
    }
  },

  // Subscribe to real-time posts
  subscribeToposts(callback: (posts: any[]) => void) {
    try {
      const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q, 
        (querySnapshot) => {
          const posts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(posts);
        },
        (error) => {
          console.warn('⚠️ Community posts subscription error (permission denied or network issue):', error);
        }
      );
    } catch (error) {
      console.warn('⚠️ Failed to setup community posts subscription:', error);
      return () => {};
    }
  }
};

// 📞 Contact/Inquiry Services
export const contactService = {
  // Submit contact inquiry
  async submitContact(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'contacts'), {
        ...data,
        resolved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Contact inquiry submitted successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Contact inquiry submission error:', error);
      throw error;
    }
  },

  // For admin: Get all contact inquiries
  async getAllContacts() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available - returning empty contacts list');
      return [];
    }
    
    try {
      const q = query(
        collection(db, 'contacts'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const contacts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ All contact inquiries retrieved successfully:', contacts.length, 'inquiries');
      return contacts;
    } catch (error) {
      console.error('❌ Contact inquiries retrieval error:', error);
      throw error;
    }
  },

  // Update contact inquiry resolved status
  async updateContactStatus(contactId: string, resolved: boolean) {
    try {
      await updateDoc(doc(db, 'contacts', contactId), {
        resolved,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Contact inquiry status updated successfully:', contactId);
      return { success: true };
    } catch (error) {
      console.error('❌ Contact inquiry status update error:', error);
      throw error;
    }
  },

  // Delete contact inquiry
  async deleteContact(contactId: string) {
    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      
      console.log('✅ Contact inquiry deleted successfully:', contactId);
      return { success: true };
    } catch (error) {
      console.error('❌ Contact inquiry deletion error:', error);
      throw error;
    }
  }
};

// 📊 Admin Statistics Services
export const adminService = {
  // Get overall statistics
  async getStats() {
    try {
      const [jobSeekers, jobPostings, references, contacts, posts] = await Promise.all([
        getDocs(collection(db, 'jobSeekers')),
        getDocs(collection(db, 'jobPostings')),
        getDocs(collection(db, 'references')),
        getDocs(collection(db, 'contacts')),
        getDocs(collection(db, 'communityPosts'))
      ]);

      const stats = {
        jobSeekers: jobSeekers.size,
        jobPostings: jobPostings.size,
        references: references.size,
        contacts: contacts.size,
        posts: posts.size,
        lastUpdated: new Date()
      };

      console.log('✅ Statistics retrieved successfully:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Statistics retrieval error:', error);
      throw error;
    }
  }
};

// 👤 My Page Service
export const myPageService = {
  // Get all user activities by email
  async getUserActivities(userEmail: string) {
    try {
      console.log('👤 Starting user activity history retrieval:', userEmail);

      // Separate where and orderBy to prevent composite index error
      const [jobSeekers, jobPostings, references, contacts, posts, eventRegistrations] = await Promise.all([
        // Job application history
        getDocs(query(collection(db, 'jobSeekers'), where('email', '==', userEmail))),
        // Job posting submission history
        getDocs(query(collection(db, 'jobPostings'), where('contactEmail', '==', userEmail))),
        // Reference submission history
        getDocs(query(collection(db, 'references'), where('teacherEmail', '==', userEmail))),
        // Contact inquiry history
        getDocs(query(collection(db, 'contacts'), where('email', '==', userEmail))),
        // Community board posts (query by authorEmail field)
        getDocs(query(collection(db, 'communityPosts'), where('authorEmail', '==', userEmail))),
        // Event registration history
        getDocs(query(collection(db, 'eventRegistrations'), where('email', '==', userEmail)))
      ]);

      const activities = {
        jobApplications: jobSeekers.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        jobPostings: jobPostings.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        references: references.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        contacts: contacts.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        posts: posts.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        eventRegistrations: eventRegistrations.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };

      // Sort each activity on client side
      const sortByDate = (array: any[], dateField: string = 'createdAt') => {
        return array.sort((a: any, b: any) => {
          const dateA = a[dateField]?.toDate?.() || new Date(a[dateField] || 0);
          const dateB = b[dateField]?.toDate?.() || new Date(b[dateField] || 0);
          return dateB.getTime() - dateA.getTime();
        });
      };

      activities.jobApplications = sortByDate(activities.jobApplications);
      activities.jobPostings = sortByDate(activities.jobPostings);
      activities.references = sortByDate(activities.references);
      activities.contacts = sortByDate(activities.contacts);
      activities.posts = sortByDate(activities.posts);
      activities.eventRegistrations = sortByDate(activities.eventRegistrations, 'registeredAt');

      console.log('✅ User activity history retrieved successfully:', {
        jobApplications: activities.jobApplications.length,
        jobPostings: activities.jobPostings.length,
        references: activities.references.length,
        contacts: activities.contacts.length,
        posts: activities.posts.length,
        eventRegistrations: activities.eventRegistrations.length
      });

      return activities;
    } catch (error) {
      console.error('❌ User activity history retrieval error:', error);
      throw error;
    }
  },

  // Get user summary statistics
  async getUserStats(userEmail: string) {
    try {
      const activities = await this.getUserActivities(userEmail);
      
      return {
        totalApplications: activities.jobApplications.length,
        totalJobPostings: activities.jobPostings.length,
        totalReferences: activities.references.length,
        totalContacts: activities.contacts.length,
        totalPosts: activities.posts.length,
        totalEventRegistrations: activities.eventRegistrations.length,
        totalActivities: activities.jobApplications.length + 
                        activities.jobPostings.length + 
                        activities.references.length + 
                        activities.contacts.length + 
                        activities.posts.length + 
                        activities.eventRegistrations.length
      };
    } catch (error) {
      console.error('❌ User statistics retrieval error:', error);
      throw error;
    }
  }
};

// 📝 Site Content Management Services
export const contentService = {
  // Initialize default content
  async initializeDefaultContent() {
    try {
      const defaultContent = {
        // Hero slide data
        heroSlides: [
          {
            title: 'Your First Step to Career Success',
            subtitle: 'Turn your dreams into reality with professional guidance and hands-on experience'
          },
          {
            title: 'Discover the Talented Students of Tomorrow',
            subtitle: 'Connect with the future leaders of New Brunswick'
          },
          {
            title: 'Innovative Education Platform',
            subtitle: 'Where technology meets education to unlock new possibilities'
          }
        ],
        // CTA buttons
        ctaButtons: {
          student: 'Get Started as Student',
          company: 'Join as Employer'
        },
        // Main section
        mainSection: {
          badge: 'Our Mission',
          title: 'For Canadian Students',
          subtitle: 'Available to all high school students in New Brunswick',
          description: 'next-generation career support system',
          highlight: 'An innovative platform for every student\'s success'
        },
        // Feature cards
        featureCards: {
          student: {
            title: 'Student Jobs',
            description: 'Smart matching system that finds the perfect job opportunities for you',
            buttonText: 'Get Started →'
          },
          reference: {
            title: 'References',
            description: 'Digital reference ecosystem connecting students with teachers',
            buttonText: 'Get Started →'
          },
          company: {
            title: 'Employer Hub',
            description: 'Smart hiring platform to connect with talented Canadian students',
            buttonText: 'Explore →'
          },
          events: {
            title: 'Learning Events',
            description: 'Hands-on educational programs to prepare for your future',
            buttonText: 'Join Event →'
          }
        },
        // Mission section
        missionSection: {
          badge: 'Our Mission',
          title: 'An innovative platform for every student\'s success',
          description: 'We\'re building a world where every New Brunswick student can reach their full potential and make their dreams come true'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'siteContent'), defaultContent);
      console.log('✅ Default content initialization completed:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Default content initialization error:', error);
      throw error;
    }
  },

  // Reset to English default content
  async resetToEnglishContent(adminEmail: string) {
    try {
      const englishContent = {
        // Hero slide data
        heroSlides: [
          {
            title: 'Your First Step to Career Success',
            subtitle: 'Turn your dreams into reality with professional guidance and hands-on experience'
          },
          {
            title: 'Discover the Talented Students of Tomorrow',
            subtitle: 'Connect with the future leaders of New Brunswick'
          },
          {
            title: 'Innovative Education Platform',
            subtitle: 'Where technology meets education to unlock new possibilities'
          }
        ],
        // CTA buttons
        ctaButtons: {
          student: 'Get Started as Student',
          company: 'Join as Employer'
        },
        // Main section
        mainSection: {
          badge: 'Our Mission',
          title: 'For Canadian Students',
          subtitle: 'Available to all high school students in New Brunswick',
          description: 'next-generation career support system',
          highlight: 'An innovative platform for every student\'s success'
        },
        // Feature cards
        featureCards: {
          student: {
            title: 'Student Jobs',
            description: 'Smart matching system that finds the perfect job opportunities for you',
            buttonText: 'Get Started →'
          },
          reference: {
            title: 'References',
            description: 'Digital reference ecosystem connecting students with teachers',
            buttonText: 'Get Started →'
          },
          company: {
            title: 'Employer Hub',
            description: 'Smart hiring platform to connect with talented Canadian students',
            buttonText: 'Explore →'
          },
          events: {
            title: 'Learning Events',
            description: 'Hands-on educational programs to prepare for your future',
            buttonText: 'Join Event →'
          }
        },
        // Mission section
        missionSection: {
          badge: 'Our Mission',
          title: 'An innovative platform for every student\'s success',
          description: 'We\'re building a world where every New Brunswick student can reach their full potential and make their dreams come true'
        },
        updatedAt: serverTimestamp(),
        updatedBy: adminEmail
      };

      const docRef = await addDoc(collection(db, 'siteContent'), englishContent);
      console.log('✅ Content reset to English successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Content reset error:', error);
      throw error;
    }
  },

  // Get current content
  async getCurrentContent(): Promise<any> {
    try {
      const q = query(collection(db, 'siteContent'), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create default content if none exists
        console.log('📝 Creating default content...');
        await this.initializeDefaultContent();
        return await this.getCurrentContent();
      }

      const latestContent = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      };

      console.log('✅ Current content retrieval successful');
      return latestContent;
    } catch (error) {
      console.warn('⚠️ Firebase content retrieval failed (permission or network issue), returning default content:', error);
      // Return default content instead of throwing error
      return {
        heroSlides: [
          {
            title: 'Your First Step to Career Success',
            subtitle: 'Turn your dreams into reality with professional guidance and hands-on experience'
          },
          {
            title: 'Discover the Talented Students of Tomorrow',
            subtitle: 'Connect with the future leaders of New Brunswick'
          },
          {
            title: 'Innovative Education Platform',
            subtitle: 'Where technology meets education to unlock new possibilities'
          }
        ],
        ctaButtons: {
          student: 'Get Started as Student',
          company: 'Join as Employer'
        },
        featureCards: {
          student: {
            title: 'Student Jobs',
            description: 'Smart matching system that finds the perfect job opportunities for you',
            buttonText: 'Get Started'
          },
          reference: {
            title: 'References',
            description: 'Digital reference ecosystem connecting students with teachers',
            buttonText: 'Get Started'
          },
          company: {
            title: 'Employer Hub',
            description: 'Smart hiring platform to connect with talented Canadian students',
            buttonText: 'Explore'
          },
          events: {
            title: 'Learning Events',
            description: 'Hands-on educational programs to prepare for your future',
            buttonText: 'Join Event'
          }
        }
      };
    }
  },

  // Update content
  async updateContent(updates: any, adminEmail: string) {
    try {
      // Check Firebase connection status
      if (!db) {
        throw new Error('Firebase database is not initialized');
      }
      
      // Get current content (for change history log)
      const currentContent = await this.getCurrentContent();
      
      // Create new content (for version control)
      const newContent = {
        ...currentContent,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail
      };
      
      // Remove ID (for creating new document)
      delete newContent.id;

      const docRef = await addDoc(collection(db, 'siteContent'), newContent);
      
      // Create change history log
      await logService.createContentChangeLog({
        contentId: docRef.id,
        changes: updates,
        previousContent: currentContent,
        adminEmail,
        changeType: 'content_update'
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Content update error (detailed):', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  // Subscribe to real-time content
  subscribeToContent(callback: (content: any) => void) {
    try {
      const q = query(collection(db, 'siteContent'), orderBy('updatedAt', 'desc'));
      return onSnapshot(
        q, 
        (querySnapshot) => {
          if (!querySnapshot.empty) {
            const latestContent = {
              id: querySnapshot.docs[0].id,
              ...querySnapshot.docs[0].data()
            };
            callback(latestContent);
          }
        },
        (error) => {
          // Handle permission or network errors
          console.warn('⚠️ Content subscription error (permission denied or network issue):', error);
          // Return default content even on error to ensure app works normally
          // Do nothing on subscription failure (default values already provided by getCurrentContent())
        }
      );
    } catch (error) {
      console.warn('⚠️ Failed to setup content subscription:', error);
      // Return empty unsubscribe function on subscription setup failure
      return () => {};
    }
  }
};

// 📊 Activity Log Services
export const logService = {
  // Create general activity log
  async createLog(logData: any) {
    try {
      const docRef = await addDoc(collection(db, 'logs'), {
        ...logData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      console.log('✅ Activity log creation successful:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Activity log creation error:', error);
      throw error;
    }
  },

  // Create content change log
  async createContentChangeLog(changeData: any) {
    try {
      const logData = {
        type: 'content_change',
        action: 'update',
        adminEmail: changeData.adminEmail,
        contentId: changeData.contentId,
        changes: changeData.changes,
        previousContent: changeData.previousContent,
        description: 'Site content has been modified',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      return await this.createLog(logData);
    } catch (error) {
      console.error('❌ Content change log creation error:', error);
      throw error;
    }
  },

  // Create user approval/rejection log
  async createUserActionLog(actionData: any) {
    try {
      const logData = {
        type: 'user_action',
        action: actionData.action, // 'approve' or 'reject'
        adminEmail: actionData.adminEmail,
        targetUserId: actionData.targetUserId,
        targetUserEmail: actionData.targetUserEmail,
        reason: actionData.reason || '',
        description: `Job application has been ${actionData.action === 'approve' ? 'approved' : 'rejected'}`,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      return await this.createLog(logData);
    } catch (error) {
      console.error('❌ User action log creation error:', error);
      throw error;
    }
  },

  // Get all logs (for admin)
  async getAllLogs(limit = 50) {
    try {
      const q = query(
        collection(db, 'logs'), 
        orderBy('timestamp', 'desc'),
        // Limit to 50 for performance optimization
      );
      
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Activity logs retrieved successfully:', logs.length, 'logs');
      return logs;
    } catch (error) {
      console.error('❌ Activity logs retrieval error:', error);
      throw error;
    }
  },

  // Get logs by specific type
  async getLogsByType(type: string, limit = 30) {
    try {
      const q = query(
        collection(db, 'logs'),
        where('type', '==', type),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ ${type} logs retrieved successfully:`, logs.length, 'logs');
      return logs;
    } catch (error) {
      console.error(`❌ ${type} logs retrieval error:`, error);
      throw error;
    }
  },

  // Subscribe to real-time logs
  subscribeToLogs(callback: (logs: any[]) => void, limit = 30) {
    try {
      const q = query(
        collection(db, 'logs'), 
        orderBy('timestamp', 'desc')
      );
      
      return onSnapshot(
        q, 
        (querySnapshot) => {
          const logs = querySnapshot.docs.slice(0, limit).map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(logs);
        },
        (error) => {
          console.warn('⚠️ Logs subscription error (permission denied or network issue):', error);
        }
      );
    } catch (error) {
      console.warn('⚠️ Failed to setup logs subscription:', error);
      return () => {};
    }
  }
}; 

// 🤝 Volunteer Services
export const volunteerService = {
  // Submit volunteer posting
  async submitVolunteerPosting(data: any) {
    try {
      console.log('🤝 Starting volunteer posting submission:', data);
      
      const docRef = await addDoc(collection(db, 'volunteerPostings'), {
        ...data,
        approved: false,
        views: 0,
        applicantCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Volunteer posting submitted successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Volunteer posting submission error:', error);
      throw error;
    }
  },

  // Get approved volunteer opportunities list
  async getApprovedVolunteerPostings() {
    try {
      const q = query(
        collection(db, 'volunteerPostings'), 
        where('approved', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const volunteerPostings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort on client side (descending by createdAt)
      volunteerPostings.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ Approved volunteer opportunities list retrieved successfully:', volunteerPostings.length, 'opportunities');
      return volunteerPostings;
    } catch (error) {
      console.error('❌ Volunteer opportunities list retrieval error:', error);
      throw error;
    }
  },

  // Get pending volunteer postings list (for admin)
  async getPendingVolunteerPostings() {
    try {
      const q = query(
        collection(db, 'volunteerPostings'), 
        where('approved', '==', false)
      );
      const querySnapshot = await getDocs(q);
      const pendingPostings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort on client side (descending by createdAt)
      pendingPostings.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ Pending volunteer postings list retrieved successfully:', pendingPostings.length, 'postings');
      return pendingPostings;
    } catch (error) {
      console.error('❌ Pending volunteer postings list retrieval error:', error);
      throw error;
    }
  },

  // Approve volunteer posting (for admin)
  async approveVolunteerPosting(postingId: string) {
    try {
      console.log('✅ Starting volunteer posting approval:', postingId);
      
      const docRef = doc(db, 'volunteerPostings', postingId);
      await updateDoc(docRef, {
        approved: true,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Volunteer posting approved successfully:', postingId);
      return { success: true, id: postingId };
    } catch (error) {
      console.error('❌ Volunteer posting approval error:', error);
      throw error;
    }
  },

  // Reject volunteer posting (for admin)
  async rejectVolunteerPosting(postingId: string, reason?: string) {
    try {
      console.log('❌ Starting volunteer posting rejection:', postingId, 'Reason:', reason);
      
      const docRef = doc(db, 'volunteerPostings', postingId);
      await updateDoc(docRef, {
        approved: false,
        rejected: true,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || 'No reason provided',
        updatedAt: serverTimestamp()
      });
      
      console.log('❌ Volunteer posting rejected successfully:', postingId);
      return { success: true, id: postingId };
    } catch (error) {
      console.error('❌ Volunteer posting rejection error:', error);
      throw error;
    }
  },

  // Increase volunteer opportunity views
  async incrementVolunteerViews(postingId: string) {
    try {
      const docRef = doc(db, 'volunteerPostings', postingId);
      await updateDoc(docRef, {
        views: (await getDocs(query(collection(db, 'volunteerPostings'), where('__name__', '==', postingId)))).docs[0]?.data()?.views + 1 || 1,
        updatedAt: serverTimestamp()
      });
      
      console.log('👁️ Volunteer opportunity views increased:', postingId);
    } catch (error) {
      console.error('❌ Views increment error:', error);
      // Views are not critical, so don't throw error
    }
  },

  // Apply for volunteer opportunity
  async submitVolunteerApplication(postingId: string, applicationData: any) {
    try {
      console.log('🤝 Starting volunteer application:', postingId, applicationData);
      
      const docRef = await addDoc(collection(db, 'volunteerApplications'), {
        postingId,
        ...applicationData,
        status: 'pending',
        appliedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Increase volunteer opportunity applicant count
      const postingRef = doc(db, 'volunteerPostings', postingId);
      const postingSnapshot = await getDocs(query(collection(db, 'volunteerPostings'), where('__name__', '==', postingId)));
      const currentCount = postingSnapshot.docs[0]?.data()?.applicantCount || 0;
      
      await updateDoc(postingRef, {
        applicantCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Volunteer application submitted successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Volunteer application error:', error);
      throw error;
    }
  },

  // Get applicants list for specific volunteer opportunity (for admin)
  async getApplicationsByVolunteerPosting(postingId: string) {
    try {
      const q = query(
        collection(db, 'volunteerApplications'),
        where('postingId', '==', postingId),
        orderBy('appliedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Volunteer applicants list retrieved successfully:', applications.length, 'applicants');
      return applications;
    } catch (error) {
      console.error('❌ Volunteer applicants list retrieval error:', error);
      throw error;
    }
  },

  // Get user's volunteer application history
  async getApplicationsByUser(userEmail: string) {
    try {
      const q = query(
        collection(db, 'volunteerApplications'),
        where('email', '==', userEmail),
        orderBy('appliedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ User volunteer application history retrieved successfully:', applications.length, 'applications');
      return applications;
    } catch (error) {
      console.error('❌ User volunteer application history retrieval error:', error);
      throw error;
    }
  },


};

// 🎨 Design Editing Services
export const designService = {
  // Upload image (Firebase Storage)
  async uploadImage(file: File, category: string, imageName: string) {
    try {
      console.log('📸 Starting image upload:', imageName, 'Category:', category);
      
      // Generate file name (prevent duplication)
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${category}/${imageName}_${timestamp}.${fileExtension}`;
      
      // Upload to Firebase Storage
      const imageRef = ref(storage, `design-assets/${fileName}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Save image information to Firestore
      await addDoc(collection(db, 'designAssets'), {
        category,
        imageName,
        fileName,
        downloadURL,
        originalName: file.name,
        size: file.size,
        uploadedAt: serverTimestamp(),
        isActive: true
      });
      
      console.log('✅ Image uploaded successfully:', downloadURL);
      return { success: true, url: downloadURL, fileName };
    } catch (error) {
      console.error('❌ Image upload error:', error);
      throw error;
    }
  },

  // Update current active image URL
  async updateActiveImage(category: string, imageName: string, newUrl: string) {
    try {
      console.log('🔄 Starting active image update:', { category, imageName, newUrl });
      
      // Get existing settings
      console.log('📖 Retrieving existing settings...');
      const settingsRef = doc(db, 'siteSettings', 'design');
      const settingsSnap = await getDoc(settingsRef);
      
      let currentSettings: any = {};
      if (settingsSnap.exists()) {
        currentSettings = settingsSnap.data();
        console.log('📖 Existing settings found:', currentSettings);
      } else {
        console.log('📖 No existing settings found, creating new');
      }
      
      // Update image URL
      const updatedSettings = {
        ...currentSettings,
        images: {
          ...currentSettings.images,
          [category]: {
            ...currentSettings.images?.[category],
            [imageName]: newUrl
          }
        },
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore (setDoc creates if doesn't exist, updates if exists)
      console.log('💾 Saving to Firestore...', updatedSettings);
      await setDoc(settingsRef, updatedSettings, { merge: true });
      console.log('💾 Firestore save completed');
      
      console.log('✅ Active image update completed');
      console.log('📄 Updated settings:', updatedSettings);
      return { success: true };
    } catch (error) {
      console.error('❌ Active image update error (detailed):', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        category,
        imageName,
        newUrl
      });
      throw error;
    }
  },

  // Save color theme
  async saveColorTheme(colors: any) {
    try {
      console.log('🎨 Saving color theme:', colors);
      
      const settingsRef = doc(db, 'siteSettings', 'design');
      const settingsSnap = await getDoc(settingsRef);
      
      let currentSettings = {};
      if (settingsSnap.exists()) {
        currentSettings = settingsSnap.data();
      }
      
      const updatedSettings = {
        ...currentSettings,
        colors: {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
          background: colors.background,
          lastUpdated: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore (setDoc creates if doesn't exist, updates if exists)
      await setDoc(settingsRef, updatedSettings, { merge: true });
      
      console.log('✅ Color theme saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Color theme save error:', error);
      throw error;
    }
  },

  // Save font settings
  async saveFontSettings(fonts: any) {
    try {
      console.log('✍️ Saving font settings:', fonts);
      
      const settingsRef = doc(db, 'siteSettings', 'design');
      const settingsSnap = await getDoc(settingsRef);
      
      let currentSettings = {};
      if (settingsSnap.exists()) {
        currentSettings = settingsSnap.data();
      }
      
      const updatedSettings = {
        ...currentSettings,
        fonts: {
          bodyFont: fonts.bodyFont,
          headingFont: fonts.headingFont,
          bodySize: fonts.bodySize,
          headingSize: fonts.headingSize,
          lineHeight: fonts.lineHeight,
          lastUpdated: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore (setDoc creates if doesn't exist, updates if exists)
      await setDoc(settingsRef, updatedSettings, { merge: true });
      
      console.log('✅ Font settings saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Font settings save error:', error);
      throw error;
    }
  },

  // Get current design settings
  async getCurrentDesignSettings() {
    // Define default settings
    const defaultSettings = {
      colors: {
        primary: '#0ea5e9',
        secondary: '#7dd3fc',
        accent: '#0369a1',
        background: '#dbeafe'
      },
      fonts: {
        bodyFont: 'inter',
        headingFont: 'inter',
        bodySize: 16,
        headingSize: 32,
        lineHeight: 1.5
      },
      images: {
        heroSlides: {
          slide1: '/images/main-home-1.png',
          slide2: '/images/main-home-2.jpg',
          slide3: '/images/main-home-3.png'
        },
        featureCards: {
          student: '/images/student-opportunities.png',
          reference: '/images/reference-support.png',
          company: '/images/company-recruitment.png',
          events: '/images/education-events.png'
        }
      }
    };
    
    try {
      const settingsRef = doc(db, 'siteSettings', 'design');
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        console.log('📋 Returning default design settings (no custom settings found)');
        return defaultSettings;
      }
      
      const settings = settingsSnap.data();
      console.log('✅ Current design settings retrieval completed');
      return settings;
    } catch (error) {
      console.warn('⚠️ Firebase design settings retrieval failed (permission or network issue), returning default settings:', error);
      // Return default settings instead of throwing error
      return defaultSettings;
    }
  },

  // Subscribe to real-time design settings
  subscribeToDesignSettings(callback: (settings: any) => void) {
    try {
      const settingsRef = doc(db, 'siteSettings', 'design');
      
      return onSnapshot(
        settingsRef, 
        (snapshot) => {
          if (!snapshot.exists()) {
            // Return default settings
            callback({
              colors: {
                primary: '#0ea5e9',
                secondary: '#7dd3fc',
                accent: '#0369a1',
                background: '#dbeafe'
              },
              fonts: {
                bodyFont: 'inter',
                headingFont: 'inter',
                bodySize: 16,
                headingSize: 32,
                lineHeight: 1.5
              },
              images: {
                heroSlides: {
                  slide1: '/images/main-home-1.png',
                  slide2: '/images/main-home-2.jpg',
                  slide3: '/images/main-home-3.png'
                },
                featureCards: {
                  student: '/images/student-opportunities.png',
                  reference: '/images/reference-support.png',
                  company: '/images/company-recruitment.png',
                  events: '/images/education-events.png'
                }
              }
            });
          } else {
            callback(snapshot.data());
          }
        },
        (error) => {
          // Handle permission or network errors
          console.warn('⚠️ Design settings subscription error (permission denied or network issue):', error);
          // Return default settings even on error to ensure app works normally
          // Do nothing on subscription failure (default values already provided by getCurrentDesignSettings())
        }
      );
    } catch (error) {
      console.warn('⚠️ Failed to setup design settings subscription:', error);
      // Return empty unsubscribe function on subscription setup failure
      return () => {};
    }
  },

  // Apply preset theme
  async applyPresetTheme(themeName: string) {
    try {
      const presetThemes = {
        'sky': {
          primary: '#0ea5e9',
          secondary: '#7dd3fc',
          accent: '#0369a1',
          background: '#dbeafe'
        },
        'purple': {
          primary: '#8b5cf6',
          secondary: '#c4b5fd',
          accent: '#6d28d9',
          background: '#ede9fe'
        },
        'green': {
          primary: '#10b981',
          secondary: '#6ee7b7',
          accent: '#047857',
          background: '#d1fae5'
        },
        'orange': {
          primary: '#f59e0b',
          secondary: '#fcd34d',
          accent: '#d97706',
          background: '#fef3c7'
        }
      };
      
      const theme = presetThemes[themeName as keyof typeof presetThemes];
      if (!theme) {
        throw new Error('Theme does not exist.');
      }
      
      await this.saveColorTheme(theme);
      console.log('✅ Preset theme application completed:', themeName);
      return { success: true, theme };
    } catch (error) {
      console.error('❌ Preset theme application error:', error);
      throw error;
    }
  }
};

// 📞 Contact Settings Services
export const contactSettingsService = {
  // Get current contact settings
  async getCurrentContactSettings() {
    const defaultSettings = {
      email: 'histudentjobs@gmail.com',
      phone: '506-429-6148',
      address: '122 Brianna Dr, Fredericton NB COA 1N0',
      businessHours: {
        weekdays: '9 AM - 6 PM',
        weekends: '10 AM - 4 PM'
      }
    };
    
    try {
      const settingsRef = doc(db, 'siteSettings', 'contact');
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        console.log('📋 Returning default contact settings');
        return defaultSettings;
      }
      
      const settings = settingsSnap.data();
      console.log('✅ Contact settings retrieval completed');
      return settings;
    } catch (error) {
      console.warn('⚠️ Contact settings retrieval failed, returning default settings:', error);
      return defaultSettings;
    }
  },

  // Save contact settings
  async saveContactSettings(settings: any) {
    try {
      console.log('💾 Saving contact settings:', settings);
      
      const settingsRef = doc(db, 'siteSettings', 'contact');
      const updatedSettings = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(settingsRef, updatedSettings, { merge: true });
      
      console.log('✅ Contact settings saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Contact settings save error:', error);
      throw error;
    }
  },

  // Subscribe to real-time contact settings
  subscribeToContactSettings(callback: (settings: any) => void) {
    try {
      const settingsRef = doc(db, 'siteSettings', 'contact');
      
      return onSnapshot(
        settingsRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            callback({
              email: 'histudentjobs@gmail.com',
              phone: '506-429-6148',
              address: '122 Brianna Dr, Fredericton NB COA 1N0',
              businessHours: {
                weekdays: '9 AM - 6 PM',
                weekends: '10 AM - 4 PM'
              }
            });
          } else {
            callback(snapshot.data());
          }
        },
        (error) => {
          console.warn('⚠️ Contact settings subscription error:', error);
        }
      );
    } catch (error) {
      console.warn('⚠️ Failed to setup contact settings subscription:', error);
      return () => {};
    }
  }
};