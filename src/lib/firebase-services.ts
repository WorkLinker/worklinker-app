/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, storage } from './firebase';
// import { supabase } from './supabase';

// 안전한 응답 생성 헬퍼
// const createSafeResponse = (message: string = 'Firebase not available') => ({
//   success: false,
//   error: message,
//   data: null
// });

// Firebase 서비스 가용성 확인
const isFirebaseAvailable = () => {
  return !!db && !!storage;
};
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 🎓 학생 구직 신청 관련
export const jobSeekerService = {
  // 구직 신청 제출
  async submitApplication(data: any, resumeFile?: File) {
    if (!db) {
      console.warn('Firebase not configured - using placeholder response');
      return { success: false, error: 'Firebase not available. Please use Supabase services.' };
    }
    
    try {
      let resumeUrl = '';
      
      // 레쥬메 파일 업로드 (Storage가 활성화된 경우에만)
      if (resumeFile) {
        try {
          const resumeRef = ref(storage, `resumes/${Date.now()}_${resumeFile.name}`);
          const snapshot = await uploadBytes(resumeRef, resumeFile);
          resumeUrl = await getDownloadURL(snapshot.ref);
          console.log('File upload successful:', resumeUrl);
        } catch (storageError) {
          console.warn('⚠️ 파일 업로드 실패 (Storage 미설정):', storageError);
          resumeUrl = `파일명: ${resumeFile.name} (업로드 대기중)`;
        }
      }
      
      // Firestore에 데이터 저장
      const docRef = await addDoc(collection(db, 'jobSeekers'), {
        ...data,
        resumeUrl,
        resumeFileName: resumeFile?.name || '',
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 구직 신청 제출 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 구직 신청 오류:', error);
      throw error;
    }
  },

  // 모든 구직자 목록 조회 (승인된 것만)
  async getApprovedJobSeekers() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available - returning empty job seekers list');
      return [];
    }
    
    try {
      // 복합 인덱스 오류 방지를 위해 where와 orderBy 분리
      const q = query(
        collection(db, 'jobSeekers'), 
        where('approved', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const jobSeekers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 클라이언트 사이드에서 정렬 (createdAt 기준 내림차순)
      jobSeekers.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ 구직자 목록 조회 성공:', jobSeekers.length, '명');
      return jobSeekers;
    } catch (error) {
      console.error('❌ 구직자 목록 조회 오류:', error);
      throw error;
    }
  },

  // 승인 대기 중인 구직자 목록 조회 (관리자용)
  async getPendingApplications() {
    try {
      // 복합 인덱스 오류 방지를 위해 where와 orderBy 분리
      const q = query(
        collection(db, 'jobSeekers'), 
        where('approved', '==', false)
      );
      const querySnapshot = await getDocs(q);
      const pendingApplications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 클라이언트 사이드에서 정렬 (createdAt 기준 내림차순)
      pendingApplications.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ 승인 대기 구직자 목록 조회 성공:', pendingApplications.length, '명');
      return pendingApplications;
    } catch (error) {
      console.error('❌ 승인 대기 구직자 목록 조회 오류:', error);
      throw error;
    }
  },

  // 구직 신청 승인 (관리자용)
  async approveApplication(applicationId: string) {
    try {
      console.log('✅ 구직 신청 승인 시작:', applicationId);
      
      const docRef = doc(db, 'jobSeekers', applicationId);
      await updateDoc(docRef, {
        approved: true,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 구직 신청 승인 완료:', applicationId);
      return { success: true, id: applicationId };
    } catch (error) {
      console.error('❌ 구직 신청 승인 오류:', error);
      throw error;
    }
  },

  // 구직 신청 거절 (관리자용)
  async rejectApplication(applicationId: string, reason?: string) {
    try {
      console.log('❌ 구직 신청 거절 시작:', applicationId, '사유:', reason);
      
      const docRef = doc(db, 'jobSeekers', applicationId);
      await updateDoc(docRef, {
        approved: false,
        rejected: true,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || '사유 없음',
        updatedAt: serverTimestamp()
      });
      
      console.log('❌ 구직 신청 거절 완료:', applicationId);
      return { success: true, id: applicationId };
    } catch (error) {
      console.error('❌ 구직 신청 거절 오류:', error);
      throw error;
    }
  },


};

// 💼 구인공고 지원 관련
export const jobApplicationService = {
  // 구인공고에 지원하기
  async submitApplication(jobPostingId: string, applicationData: any) {
    try {
      console.log('📝 구인공고 지원 제출 시작:', jobPostingId);
      
      // 지원 데이터 저장
      const docRef = await addDoc(collection(db, 'jobApplications'), {
        jobPostingId,
        ...applicationData,
        status: 'pending', // pending, reviewed, accepted, rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 구인공고의 지원자 수 증가
      const jobPostingRef = doc(db, 'jobPostings', jobPostingId);
      const jobPostingSnapshot = await getDocs(query(collection(db, 'jobPostings'), where('__name__', '==', jobPostingId)));
      
      if (!jobPostingSnapshot.empty) {
        const currentData = jobPostingSnapshot.docs[0].data();
        await updateDoc(jobPostingRef, {
          applications: (currentData.applications || 0) + 1,
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('✅ 구인공고 지원 제출 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 구인공고 지원 제출 오류:', error);
      throw error;
    }
  },

  // 특정 구인공고의 지원자 목록 조회 (기업용)
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
      
      console.log('✅ 구인공고 지원자 목록 조회 성공:', applications.length, '명');
      return applications;
    } catch (error) {
      console.error('❌ 구인공고 지원자 목록 조회 오류:', error);
      throw error;
    }
  },

  // 지원 상태 업데이트 (기업용)
  async updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    try {
      console.log('📝 지원 상태 업데이트:', applicationId, '→', status);
      
      const docRef = doc(db, 'jobApplications', applicationId);
      await updateDoc(docRef, {
        status,
        statusNotes: notes || '',
        statusUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 지원 상태 업데이트 완료:', applicationId);
      return { success: true, id: applicationId };
    } catch (error) {
      console.error('❌ 지원 상태 업데이트 오류:', error);
      throw error;
    }
  },

  // 사용자별 지원 내역 조회
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
      
      console.log('✅ 사용자 지원 내역 조회 성공:', applications.length, '개');
      return applications;
    } catch (error) {
      console.error('❌ 사용자 지원 내역 조회 오류:', error);
      throw error;
    }
  }
};

// 🏢 기업 채용 공고 관련
export const jobPostingService = {
  // 채용 공고 등록
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
      
      console.log('✅ 채용 공고 등록 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 채용 공고 등록 오류:', error);
      throw error;
    }
  },

  // 승인된 채용 공고 목록 조회
  async getApprovedJobPostings() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available - returning empty job postings list');
      return [];
    }
    
    try {
      // 개발 환경에서는 모든 구인공고 표시 (승인 여부 상관없이)
      const q = query(
        collection(db, 'jobPostings'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const jobPostings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ 채용 공고 목록 조회 성공:', jobPostings.length, '개 (개발모드: 모든 공고 표시)');
      return jobPostings;
    } catch (error) {
      console.error('❌ 채용 공고 목록 조회 오류:', error);
      throw error;
    }
  },

  // 구인공고 조회수 증가
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
        console.log('👁️ 구인공고 조회수 증가:', jobPostingId);
      }
    } catch (error) {
      console.error('❌ 조회수 증가 오류:', error);
    }
  },


};

// 📄 추천서 관련
export const referenceService = {
  // 추천서 제출
  async submitReference(data: any, referenceFile?: File) {
    try {
      let referenceFileUrl = '';
      
      // 추천서 파일 업로드 (Storage가 활성화된 경우에만)
      if (referenceFile) {
        try {
          const refRef = ref(storage, `references/${Date.now()}_${referenceFile.name}`);
          const snapshot = await uploadBytes(refRef, referenceFile);
          referenceFileUrl = await getDownloadURL(snapshot.ref);
          console.log('✅ 파일 업로드 성공:', referenceFileUrl);
        } catch (storageError) {
          console.warn('⚠️ 파일 업로드 실패 (Storage 미설정):', storageError);
          referenceFileUrl = `파일명: ${referenceFile.name} (업로드 대기중)`;
        }
      }
      
      const docRef = await addDoc(collection(db, 'references'), {
        ...data,
        referenceFileUrl,
        referenceFileName: referenceFile?.name || '',
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 추천서 제출 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 추천서 제출 오류:', error);
      throw error;
    }
  }
};

// 🎉 이벤트 관련
export const eventService = {
  // 관리자 이벤트 등록
  async createEvent(data: any, adminEmail: string) {
    try {
      // 관리자 권한 확인 (간단한 체크 - 실제로는 더 정교한 권한 시스템 필요)
      const adminEmails = ['admin@example.com', 'manager@jobsprout.ca', 'admin@jobsprout.ca'];
      if (!adminEmails.includes(adminEmail)) {
        throw new Error('관리자 권한이 없습니다.');
      }

      const docRef = await addDoc(collection(db, 'events'), {
        ...data,
        createdBy: adminEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 관리자 이벤트 등록 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 이벤트 등록 오류:', error);
      throw error;
    }
  },

  // 이벤트 참가 신청
  async registerForEvent(eventId: string, participantData: any) {
    try {
      // 이미 등록했는지 확인
      const existingQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('email', '==', participantData.email)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        throw new Error('이미 이 이벤트에 등록하셨습니다.');
      }

      const docRef = await addDoc(collection(db, 'eventRegistrations'), {
        eventId,
        ...participantData,
        registeredAt: serverTimestamp()
      });
      
      console.log('✅ 이벤트 참가 신청 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 이벤트 참가 신청 오류:', error);
      throw error;
    }
  },

  // 실시간 이벤트 목록 조회 (참가자 수 포함)
  async getAllEventsWithParticipants() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available - returning empty events list');
      return [];
    }
    
    try {
      // 이벤트 목록 조회 (인덱스 오류 방지를 위해 createdAt으로 정렬)
      const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 각 이벤트의 참가자 수 계산
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
      
      console.log('✅ 실시간 이벤트 목록 조회 성공:', eventsWithParticipants.length, '개');
      return eventsWithParticipants;
    } catch (error) {
      console.error('❌ 이벤트 목록 조회 오류:', error);
      throw error;
    }
  },

  // 실시간 이벤트 구독 (참가자 수 실시간 업데이트)
  subscribeToEvents(callback: (events: any[]) => void) {
    const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(eventsQuery, async (eventsSnapshot) => {
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

             // 각 이벤트의 실시간 참가자 수 계산
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
    });
  },

  // 특정 이벤트의 참가자 수 실시간 조회
  subscribeToEventParticipants(eventId: string, callback: (count: number) => void) {
    const participantsQuery = query(
      collection(db, 'eventRegistrations'),
      where('eventId', '==', eventId)
    );
    
    return onSnapshot(participantsQuery, (snapshot) => {
      callback(snapshot.size);
    });
  },

  // 관리자 권한 확인
  isAdmin(email: string): boolean {
    if (!isFirebaseAvailable()) {
      // Firebase 없을 때는 nbhighschooljobs@gmail.com만 관리자로 인정
      return email === 'nbhighschooljobs@gmail.com';
    }
    const adminEmails = ['admin@example.com', 'manager@jobsprout.ca', 'admin@jobsprout.ca', 'nbhighschooljobs@gmail.com'];
    return adminEmails.includes(email);
  },


};

// 💬 자유게시판 관련
export const communityService = {
  // 게시물 작성
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
      
      console.log('✅ 게시물 작성 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 게시물 작성 오류:', error);
      throw error;
    }
  },

  // 모든 게시물 조회
  async getAllPosts() {
    try {
      const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ 게시물 목록 조회 성공:', posts.length, '개');
      return posts;
    } catch (error) {
      console.error('❌ 게시물 목록 조회 오류:', error);
      throw error;
    }
  },

  // 실시간 게시물 구독
  subscribeToposts(callback: (posts: any[]) => void) {
    const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(posts);
    });
  }
};

// 📞 문의사항 관련
export const contactService = {
  // 문의사항 제출
  async submitContact(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'contacts'), {
        ...data,
        resolved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 문의사항 제출 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 문의사항 제출 오류:', error);
      throw error;
    }
  }
};

// 📊 관리자용 통계
export const adminService = {
  // 전체 통계 조회
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

      console.log('✅ 통계 조회 성공:', stats);
      return stats;
    } catch (error) {
      console.error('❌ 통계 조회 오류:', error);
      throw error;
    }
  }
};

// 👤 마이페이지 서비스
export const myPageService = {
  // 사용자별 모든 활동 내역 조회
  async getUserActivities(userEmail: string) {
    try {
      console.log('👤 사용자 활동 내역 조회 시작:', userEmail);

      // 복합 인덱스 오류 방지를 위해 where와 orderBy 분리
      const [jobSeekers, jobPostings, references, contacts, posts, eventRegistrations] = await Promise.all([
        // 구직 신청 내역
        getDocs(query(collection(db, 'jobSeekers'), where('email', '==', userEmail))),
        // 채용 공고 등록 내역
        getDocs(query(collection(db, 'jobPostings'), where('contactEmail', '==', userEmail))),
        // 추천서 제출 내역
        getDocs(query(collection(db, 'references'), where('teacherEmail', '==', userEmail))),
        // 문의사항 내역
        getDocs(query(collection(db, 'contacts'), where('email', '==', userEmail))),
        // 자유게시판 작성글 (authorEmail 필드로 조회)
        getDocs(query(collection(db, 'communityPosts'), where('authorEmail', '==', userEmail))),
        // 이벤트 참가 내역
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

      // 클라이언트 사이드에서 각 활동별로 정렬
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

      console.log('✅ 사용자 활동 내역 조회 성공:', {
        jobApplications: activities.jobApplications.length,
        jobPostings: activities.jobPostings.length,
        references: activities.references.length,
        contacts: activities.contacts.length,
        posts: activities.posts.length,
        eventRegistrations: activities.eventRegistrations.length
      });

      return activities;
    } catch (error) {
      console.error('❌ 사용자 활동 내역 조회 오류:', error);
      throw error;
    }
  },

  // 사용자 요약 통계
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
      console.error('❌ 사용자 통계 조회 오류:', error);
      throw error;
    }
  }
};

// 📝 사이트 콘텐츠 관리 서비스
export const contentService = {
  // 기본 콘텐츠 초기화
  async initializeDefaultContent() {
    try {
      const defaultContent = {
        // 히어로 슬라이드 데이터
        heroSlides: [
          {
            title: '미래를 만들어갈 학생 인재들을 만나보세요',
            subtitle: '뉴브런즈윅의 미래를 이끌어갈 인재들과 함께하세요'
          },
          {
            title: '성공적인 진로를 위한 첫걸음',
            subtitle: '전문적인 지도와 실무 경험으로 꿈을 현실로 만들어보세요'
          },
          {
            title: '혁신적인 교육 플랫폼',
            subtitle: '기술과 교육이 만나 새로운 가능성을 열어갑니다'
          }
        ],
        // CTA 버튼
        ctaButtons: {
          student: '학생으로 시작하기',
          company: '기업으로 참여하기'
        },
        // 메인 섹션
        mainSection: {
          badge: '통합 진로 플랫폼',
          title: '캐나다 학생들을 위한',
          subtitle: '원스톱 진로 솔루션',
          description: '뉴브런즈윅 주의 모든 고등학생들이 이용할 수 있는',
          highlight: '차세대 진로 지원 시스템'
        },
        // 기능 카드들
        featureCards: {
          student: {
            title: '학생 구직',
            description: '스마트한 매칭 시스템으로 당신에게 완벽한 일자리를 찾아드립니다',
            buttonText: '시작하기 →'
          },
          reference: {
            title: '추천서 지원',
            description: '선생님들과 연결되는 디지털 추천서 생태계',
            buttonText: '참여하기 →'
          },
          company: {
            title: '기업 채용',
            description: '우수한 캐나다 인재들과 만나는 스마트 채용 플랫폼',
            buttonText: '둘러보기 →'
          },
          events: {
            title: '교육 이벤트',
            description: '미래를 준비하는 실무 중심 교육 프로그램',
            buttonText: '참가하기 →'
          }
        },
        // 미션 섹션
        missionSection: {
          badge: '우리의 목표',
          title: '청년 취업의 새로운 패러다임',
          description: '모든 학생이 꿈꾸는 미래를 실현할 수 있도록 돕겠습니다'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'siteContent'), defaultContent);
      console.log('✅ 기본 콘텐츠 초기화 완료:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 기본 콘텐츠 초기화 오류:', error);
      throw error;
    }
  },

  // 현재 콘텐츠 가져오기
  async getCurrentContent(): Promise<any> {
    try {
      const q = query(collection(db, 'siteContent'), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // 콘텐츠가 없으면 기본 콘텐츠 생성
        console.log('📝 기본 콘텐츠 생성 중...');
        await this.initializeDefaultContent();
        return await this.getCurrentContent();
      }

      const latestContent = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      };

      console.log('✅ 현재 콘텐츠 조회 성공');
      return latestContent;
    } catch (error) {
      console.error('❌ 현재 콘텐츠 조회 오류:', error);
      throw error;
    }
  },

  // 콘텐츠 업데이트
  async updateContent(updates: any, adminEmail: string) {
    try {
      // 현재 콘텐츠 가져오기 (변경 내역 로그용)
      const currentContent = await this.getCurrentContent();
      
      // 새 콘텐츠 생성 (버전 관리를 위해)
      const newContent = {
        ...currentContent,
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: adminEmail
      };
      
      // ID 제거 (새 문서 생성용)
      delete newContent.id;

      const docRef = await addDoc(collection(db, 'siteContent'), newContent);
      
      // 변경 내역 로그 생성
      await logService.createContentChangeLog({
        contentId: docRef.id,
        changes: updates,
        previousContent: currentContent,
        adminEmail,
        changeType: 'content_update'
      });

      console.log('✅ 콘텐츠 업데이트 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 콘텐츠 업데이트 오류:', error);
      throw error;
    }
  },

  // 실시간 콘텐츠 구독
  subscribeToContent(callback: (content: any) => void) {
    const q = query(collection(db, 'siteContent'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const latestContent = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        callback(latestContent);
      }
    });
  }
};

// 📊 활동 로그 서비스
export const logService = {
  // 일반 활동 로그 생성
  async createLog(logData: any) {
    try {
      const docRef = await addDoc(collection(db, 'logs'), {
        ...logData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      console.log('✅ 활동 로그 생성 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 활동 로그 생성 오류:', error);
      throw error;
    }
  },

  // 콘텐츠 변경 로그 생성
  async createContentChangeLog(changeData: any) {
    try {
      const logData = {
        type: 'content_change',
        action: 'update',
        adminEmail: changeData.adminEmail,
        contentId: changeData.contentId,
        changes: changeData.changes,
        previousContent: changeData.previousContent,
        description: '사이트 콘텐츠가 수정되었습니다',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      return await this.createLog(logData);
    } catch (error) {
      console.error('❌ 콘텐츠 변경 로그 생성 오류:', error);
      throw error;
    }
  },

  // 사용자 승인/거절 로그 생성
  async createUserActionLog(actionData: any) {
    try {
      const logData = {
        type: 'user_action',
        action: actionData.action, // 'approve' 또는 'reject'
        adminEmail: actionData.adminEmail,
        targetUserId: actionData.targetUserId,
        targetUserEmail: actionData.targetUserEmail,
        reason: actionData.reason || '',
        description: `구직 신청이 ${actionData.action === 'approve' ? '승인' : '거절'}되었습니다`,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      return await this.createLog(logData);
    } catch (error) {
      console.error('❌ 사용자 액션 로그 생성 오류:', error);
      throw error;
    }
  },

  // 모든 로그 조회 (관리자용)
  async getAllLogs(limit = 50) {
    try {
      const q = query(
        collection(db, 'logs'), 
        orderBy('timestamp', 'desc'),
        // limit를 50으로 제한하여 성능 최적화
      );
      
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ 활동 로그 조회 성공:', logs.length, '개');
      return logs;
    } catch (error) {
      console.error('❌ 활동 로그 조회 오류:', error);
      throw error;
    }
  },

  // 특정 타입 로그 조회
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
      
      console.log(`✅ ${type} 로그 조회 성공:`, logs.length, '개');
      return logs;
    } catch (error) {
      console.error(`❌ ${type} 로그 조회 오류:`, error);
      throw error;
    }
  },

  // 실시간 로그 구독
  subscribeToLogs(callback: (logs: any[]) => void, limit = 30) {
    const q = query(
      collection(db, 'logs'), 
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const logs = querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(logs);
    });
  }
}; 

// 🤝 봉사자 서비스
export const volunteerService = {
  // 봉사자 모집 등록
  async submitVolunteerPosting(data: any) {
    try {
      console.log('🤝 봉사자 모집 등록 시작:', data);
      
      const docRef = await addDoc(collection(db, 'volunteerPostings'), {
        ...data,
        approved: false,
        views: 0,
        applicantCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 봉사자 모집 등록 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 봉사자 모집 등록 오류:', error);
      throw error;
    }
  },

  // 승인된 봉사 기회 목록 조회
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
      
      // 클라이언트 사이드에서 정렬 (createdAt 기준 내림차순)
      volunteerPostings.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ 승인된 봉사 기회 목록 조회 성공:', volunteerPostings.length, '개');
      return volunteerPostings;
    } catch (error) {
      console.error('❌ 봉사 기회 목록 조회 오류:', error);
      throw error;
    }
  },

  // 승인 대기 중인 봉사자 모집 목록 조회 (관리자용)
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
      
      // 클라이언트 사이드에서 정렬 (createdAt 기준 내림차순)
      pendingPostings.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ 승인 대기 봉사자 모집 목록 조회 성공:', pendingPostings.length, '개');
      return pendingPostings;
    } catch (error) {
      console.error('❌ 승인 대기 봉사자 모집 목록 조회 오류:', error);
      throw error;
    }
  },

  // 봉사자 모집 승인 (관리자용)
  async approveVolunteerPosting(postingId: string) {
    try {
      console.log('✅ 봉사자 모집 승인 시작:', postingId);
      
      const docRef = doc(db, 'volunteerPostings', postingId);
      await updateDoc(docRef, {
        approved: true,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 봉사자 모집 승인 완료:', postingId);
      return { success: true, id: postingId };
    } catch (error) {
      console.error('❌ 봉사자 모집 승인 오류:', error);
      throw error;
    }
  },

  // 봉사자 모집 거절 (관리자용)
  async rejectVolunteerPosting(postingId: string, reason?: string) {
    try {
      console.log('❌ 봉사자 모집 거절 시작:', postingId, '사유:', reason);
      
      const docRef = doc(db, 'volunteerPostings', postingId);
      await updateDoc(docRef, {
        approved: false,
        rejected: true,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || '사유 없음',
        updatedAt: serverTimestamp()
      });
      
      console.log('❌ 봉사자 모집 거절 완료:', postingId);
      return { success: true, id: postingId };
    } catch (error) {
      console.error('❌ 봉사자 모집 거절 오류:', error);
      throw error;
    }
  },

  // 봉사 기회 조회수 증가
  async incrementVolunteerViews(postingId: string) {
    try {
      const docRef = doc(db, 'volunteerPostings', postingId);
      await updateDoc(docRef, {
        views: (await getDocs(query(collection(db, 'volunteerPostings'), where('__name__', '==', postingId)))).docs[0]?.data()?.views + 1 || 1,
        updatedAt: serverTimestamp()
      });
      
      console.log('👁️ 봉사 기회 조회수 증가:', postingId);
    } catch (error) {
      console.error('❌ 조회수 증가 오류:', error);
      // 조회수는 중요하지 않으므로 에러를 throw하지 않음
    }
  },

  // 봉사 지원하기
  async submitVolunteerApplication(postingId: string, applicationData: any) {
    try {
      console.log('🤝 봉사 지원 시작:', postingId, applicationData);
      
      const docRef = await addDoc(collection(db, 'volunteerApplications'), {
        postingId,
        ...applicationData,
        status: 'pending',
        appliedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 봉사 기회의 지원자 수 증가
      const postingRef = doc(db, 'volunteerPostings', postingId);
      const postingSnapshot = await getDocs(query(collection(db, 'volunteerPostings'), where('__name__', '==', postingId)));
      const currentCount = postingSnapshot.docs[0]?.data()?.applicantCount || 0;
      
      await updateDoc(postingRef, {
        applicantCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 봉사 지원 성공:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ 봉사 지원 오류:', error);
      throw error;
    }
  },

  // 특정 봉사 기회의 지원자 목록 조회 (관리자용)
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
      
      console.log('✅ 봉사 지원자 목록 조회 성공:', applications.length, '명');
      return applications;
    } catch (error) {
      console.error('❌ 봉사 지원자 목록 조회 오류:', error);
      throw error;
    }
  },

  // 사용자별 봉사 지원 내역 조회
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
      
      console.log('✅ 사용자 봉사 지원 내역 조회 성공:', applications.length, '개');
      return applications;
    } catch (error) {
      console.error('❌ 사용자 봉사 지원 내역 조회 오류:', error);
      throw error;
    }
  },


};

// 🎨 디자인 편집 관련
export const designService = {
  // 이미지 업로드 (Firebase Storage)
  async uploadImage(file: File, category: string, imageName: string) {
    try {
      console.log('📸 이미지 업로드 시작:', imageName, '카테고리:', category);
      
      // 파일 이름 생성 (중복 방지)
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${category}/${imageName}_${timestamp}.${fileExtension}`;
      
      // Firebase Storage에 업로드
      const imageRef = ref(storage, `design-assets/${fileName}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Firestore에 이미지 정보 저장
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
      
      console.log('✅ 이미지 업로드 성공:', downloadURL);
      return { success: true, url: downloadURL, fileName };
    } catch (error) {
      console.error('❌ 이미지 업로드 오류:', error);
      throw error;
    }
  },

  // 현재 활성 이미지 URL 업데이트
  async updateActiveImage(category: string, imageName: string, newUrl: string) {
    try {
      console.log('🔄 활성 이미지 업데이트:', category, imageName, newUrl);
      
      // 기존 설정 조회
      const settingsRef = doc(db, 'siteSettings', 'design');
      const settingsDoc = await getDocs(query(collection(db, 'siteSettings'), where('__name__', '==', 'design')));
      
      let currentSettings: any = {};
      if (!settingsDoc.empty) {
        currentSettings = settingsDoc.docs[0].data();
      }
      
      // 이미지 URL 업데이트
      const updatedSettings = {
        ...currentSettings,
        images: {
          ...currentSettings.images,
          [category]: {
            ...currentSettings.images?.[category],
            [imageName]: newUrl
          }
        },
        updatedAt: serverTimestamp()
      };
      
      // Firestore에 저장
      if (settingsDoc.empty) {
        await addDoc(collection(db, 'siteSettings'), { id: 'design', ...updatedSettings });
      } else {
        await updateDoc(settingsRef, updatedSettings);
      }
      
      console.log('✅ 활성 이미지 업데이트 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 활성 이미지 업데이트 오류:', error);
      throw error;
    }
  },

  // 색상 테마 저장
  async saveColorTheme(colors: any) {
    try {
      console.log('🎨 색상 테마 저장:', colors);
      
      const settingsRef = doc(db, 'siteSettings', 'design');
      const settingsDoc = await getDocs(query(collection(db, 'siteSettings'), where('__name__', '==', 'design')));
      
      let currentSettings = {};
      if (!settingsDoc.empty) {
        currentSettings = settingsDoc.docs[0].data();
      }
      
      const updatedSettings = {
        ...currentSettings,
        colors: {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
          background: colors.background,
          lastUpdated: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };
      
      if (settingsDoc.empty) {
        await addDoc(collection(db, 'siteSettings'), { id: 'design', ...updatedSettings });
      } else {
        await updateDoc(settingsRef, updatedSettings);
      }
      
      console.log('✅ 색상 테마 저장 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 색상 테마 저장 오류:', error);
      throw error;
    }
  },

  // 폰트 설정 저장
  async saveFontSettings(fonts: any) {
    try {
      console.log('✍️ 폰트 설정 저장:', fonts);
      
      const settingsRef = doc(db, 'siteSettings', 'design');
      const settingsDoc = await getDocs(query(collection(db, 'siteSettings'), where('__name__', '==', 'design')));
      
      let currentSettings = {};
      if (!settingsDoc.empty) {
        currentSettings = settingsDoc.docs[0].data();
      }
      
      const updatedSettings = {
        ...currentSettings,
        fonts: {
          bodyFont: fonts.bodyFont,
          headingFont: fonts.headingFont,
          bodySize: fonts.bodySize,
          headingSize: fonts.headingSize,
          lineHeight: fonts.lineHeight,
          lastUpdated: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };
      
      if (settingsDoc.empty) {
        await addDoc(collection(db, 'siteSettings'), { id: 'design', ...updatedSettings });
      } else {
        await updateDoc(settingsRef, updatedSettings);
      }
      
      console.log('✅ 폰트 설정 저장 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 폰트 설정 저장 오류:', error);
      throw error;
    }
  },

  // 현재 디자인 설정 조회
  async getCurrentDesignSettings() {
    try {
      const settingsDoc = await getDocs(query(collection(db, 'siteSettings'), where('__name__', '==', 'design')));
      
      if (settingsDoc.empty) {
        // 기본 설정 반환
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
              slide1: '/images/메인홈1.png',
              slide2: '/images/메인홈2.jpg',
              slide3: '/images/메인홈3.png'
            },
            featureCards: {
              student: '/images/7번.png',
              reference: '/images/4번.png',
              company: '/images/3번.png',
              events: '/images/교육이벤트.png'
            }
          }
        };
        
        console.log('📋 기본 디자인 설정 반환');
        return defaultSettings;
      }
      
      const settings = settingsDoc.docs[0].data();
      console.log('✅ 현재 디자인 설정 조회 완료');
      return settings;
    } catch (error) {
      console.error('❌ 디자인 설정 조회 오류:', error);
      throw error;
    }
  },

  // 디자인 설정 실시간 구독
  subscribeToDesignSettings(callback: (settings: any) => void) {
    const settingsQuery = query(collection(db, 'siteSettings'), where('__name__', '==', 'design'));
    
    return onSnapshot(settingsQuery, (snapshot) => {
      if (snapshot.empty) {
        // 기본 설정 반환
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
              slide1: '/images/메인홈1.png',
              slide2: '/images/메인홈2.jpg',
              slide3: '/images/메인홈3.png'
            },
            featureCards: {
              student: '/images/7번.png',
              reference: '/images/4번.png',
              company: '/images/3번.png',
              events: '/images/교육이벤트.png'
            }
          }
        });
      } else {
        callback(snapshot.docs[0].data());
      }
    });
  },

  // 프리셋 테마 적용
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
        throw new Error('존재하지 않는 테마입니다.');
      }
      
      await this.saveColorTheme(theme);
      console.log('✅ 프리셋 테마 적용 완료:', themeName);
      return { success: true, theme };
    } catch (error) {
      console.error('❌ 프리셋 테마 적용 오류:', error);
      throw error;
    }
  }
};