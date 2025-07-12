/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, storage } from './firebase';
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
    try {
      let resumeUrl = '';
      
      // 레쥬메 파일 업로드 (Storage가 활성화된 경우에만)
      if (resumeFile) {
        try {
          const resumeRef = ref(storage, `resumes/${Date.now()}_${resumeFile.name}`);
          const snapshot = await uploadBytes(resumeRef, resumeFile);
          resumeUrl = await getDownloadURL(snapshot.ref);
          console.log('✅ 파일 업로드 성공:', resumeUrl);
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

  // 테스트용 구직자 데이터 5개 추가
  async addSampleJobSeekers() {
    try {
      const sampleJobSeekers = [
        {
          name: "김민수",
          email: "minsu.kim@student.ca",
          phone: "(506) 555-1001",
          grade: "12",
          school: "Fredericton High School",
          skills: "컴퓨터 프로그래밍 (Python, JavaScript), 웹사이트 제작, 그래픽 디자인 (Photoshop), 영어-한국어 번역, 고객 서비스",
          availability: "part-time",
          resumeUrl: "테스트 이력서 (파일 업로드 대기중)",
          resumeFileName: "MinsuKim_Resume.pdf",
          approved: true,
          approvedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          name: "Sarah Johnson",
          email: "sarah.johnson@student.ca", 
          phone: "(506) 555-1002",
          grade: "11",
          school: "Leo Hayes High School",
          skills: "베이비시터 경험 3년, 피아노 연주 (10년 경력), 수학 튜터링, 프랑스어 회화, 팀 스포츠 (배구, 농구)",
          availability: "part-time",
          resumeUrl: "테스트 이력서 (파일 업로드 대기중)",
          resumeFileName: "SarahJohnson_Resume.pdf", 
          approved: true,
          approvedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          name: "박지영",
          email: "jiyoung.park@student.ca",
          phone: "(506) 555-1003", 
          grade: "12",
          school: "George Street Middle School",
          skills: "카페 근무 경험 1년 (Starbucks), 라떼아트, 캐시어 업무, 재고 관리, SNS 마케팅, 한국어-영어 통번역",
          availability: "part-time",
          resumeUrl: "테스트 이력서 (파일 업로드 대기중)",
          resumeFileName: "JiyoungPark_Resume.pdf",
          approved: true,
          approvedAt: serverTimestamp(), 
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          name: "Michael Chen",
          email: "michael.chen@student.ca",
          phone: "(506) 555-1004",
          grade: "10", 
          school: "Oromocto High School",
          skills: "자전거 수리 및 정비, 스포츠 용품 판매 경험, 중국어-영어 번역, 컴퓨터 하드웨어 조립, 수영 강사 보조",
          availability: "part-time",
          resumeUrl: "테스트 이력서 (파일 업로드 대기중)",
          resumeFileName: "MichaelChen_Resume.pdf",
          approved: true,
          approvedAt: serverTimestamp(),
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp()
        },
        {
          name: "이소영",
          email: "soyoung.lee@student.ca",
          phone: "(506) 555-1005",
          grade: "11",
          school: "Rothesay Netherwood School", 
          skills: "예술 및 공예 (도자기, 그림), 온라인 쇼핑몰 운영 경험, 사진 촬영 및 편집, 이벤트 기획, 봉사활동 리더십",
          availability: "volunteer",
          resumeUrl: "테스트 이력서 (파일 업로드 대기중)",
          resumeFileName: "SoyoungLee_Resume.pdf",
          approved: true,
          approvedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      console.log('📝 테스트 구직자 데이터 5개 추가 시작...');
      
      for (const jobSeeker of sampleJobSeekers) {
        const docRef = await addDoc(collection(db, 'jobSeekers'), jobSeeker);
        console.log(`✅ 구직자 "${jobSeeker.name}" 추가 완료:`, docRef.id);
      }
      
      console.log('🎉 모든 테스트 구직자 데이터 추가 완료!');
      return { success: true, count: sampleJobSeekers.length };
    } catch (error) {
      console.error('❌ 테스트 구직자 데이터 추가 오류:', error);
      throw error;
    }
  }
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

  // 샘플 구인공고 데이터 추가 (개발/테스트용)
  async addSampleJobPostings() {
    try {
      const sampleJobPostings = [
        {
          title: "Tim Hortons 파트타임 직원 모집",
          company: "Tim Hortons 프레데릭턴 본점",
          location: "프레데릭턴, NB",
          description: "캐나다를 대표하는 커피 체인 Tim Hortons에서 친절하고 성실한 고등학생 파트타임 직원을 모집합니다. 커피 제조, 도넛 및 샌드위치 준비, 고객 서비스 등의 업무를 담당하게 됩니다. 유연한 스케줄과 동료들과의 즐거운 근무 환경을 제공합니다.",
          requirements: "고등학생 이상, 친절한 성격, 기본적인 영어 의사소통 가능, 팀워크 중시, 성실하고 책임감 있는 자세",
          salary: "시급 $15.50 - $16.00",
          jobType: "part-time",
          industry: "음식/요식업",
          contactEmail: "manager@timhortons-fredericton.ca",
          contactPhone: "(506) 555-0123",
          approved: false,
          views: 0,
          applications: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: "Atlantic Superstore 매장 직원",
          company: "Atlantic Superstore",
          location: "몽크턴, NB",
          description: "대서양 지역 최대 슈퍼마켓 체인에서 근무할 매장 직원을 모집합니다. 상품 진열, 재고 관리, 고객 안내, 계산대 업무 등을 담당합니다. 소매업 경험을 쌓고 싶은 학생들에게 좋은 기회입니다. 직원 할인 혜택과 유연한 근무 시간을 제공합니다.",
          requirements: "16세 이상 고등학생, 기본적인 수학 계산 능력, 고객 서비스 마인드, 체력적으로 건강한 자, 주말 근무 가능자 우대",
          salary: "시급 $15.20 - $15.75",
          jobType: "part-time",
          industry: "소매/판매",
          contactEmail: "hr@atlanticsuperstore-moncton.ca",
          contactPhone: "(506) 555-0234",
          approved: false,
          views: 0,
          applications: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: "영어 과외 튜터 (고등학생 대상)",
          company: "Fredericton Learning Center",
          location: "프레데릭턴, NB",
          description: "중학생들을 위한 영어 과외 튜터를 모집합니다. 독해, 작문, 문법 등 전반적인 영어 실력 향상을 도와주는 역할입니다. 교육에 관심이 있고 영어 실력이 우수한 고등학생들에게 좋은 경험이 될 것입니다. 주 2-3회, 1회 2시간 정도의 유연한 스케줄입니다.",
          requirements: "고등학교 3학년 이상, 영어 성적 A 이상, 인내심과 책임감, 의사소통 능력 우수, 중학생과 잘 어울릴 수 있는 성격",
          salary: "시급 $18.00 - $22.00",
          jobType: "part-time",
          industry: "교육/과외",
          contactEmail: "info@frederictonlearning.ca",
          contactPhone: "(506) 555-0345",
          approved: false,
          views: 0,
          applications: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: "피자헛 배달 도우미",
          company: "Pizza Hut Saint John",
          location: "세인트존, NB",
          description: "피자헛에서 배달 업무를 도와줄 고등학생을 모집합니다. 주문 준비, 포장, 배달 동행 등의 업무를 담당합니다. 운전면허가 없어도 지원 가능하며, 숙련된 배달원과 함께 업무를 배우게 됩니다. 팁 수입도 기대할 수 있는 활동적인 일자리입니다.",
          requirements: "16세 이상, 체력이 좋은 자, 길 찾기를 잘하는 자, 시간 약속을 잘 지키는 성격, 자전거나 대중교통 이용 가능",
          salary: "시급 $15.00 + 팁",
          jobType: "part-time",
          industry: "음식/요식업",
          contactEmail: "hiring@pizzahut-saintjohn.ca",
          contactPhone: "(506) 555-0456",
          approved: false,
          views: 0,
          applications: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: "Dollarama 매장 어시스턴트",
          company: "Dollarama Bathurst",
          location: "배서스트, NB",
          description: "인기 있는 할인점 Dollarama에서 매장 운영을 도와줄 학생 직원을 모집합니다. 상품 진열, 창고 정리, 고객 안내 등의 다양한 업무를 경험할 수 있습니다. 소매업의 기초를 배우고 싶은 학생들에게 추천하는 일자리입니다.",
          requirements: "고등학생, 기본적인 영어 회화 가능, 성실하고 꼼꼼한 성격, 팀워크를 중시하는 자세, 주말 근무 가능",
          salary: "시급 $15.20",
          jobType: "part-time",
          industry: "소매/판매",
          contactEmail: "manager@dollarama-bathurst.ca",
          contactPhone: "(506) 555-0567",
          approved: false,
          views: 0,
          applications: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      const results = [];
      for (const jobPosting of sampleJobPostings) {
        const docRef = await addDoc(collection(db, 'jobPostings'), jobPosting);
        results.push({ success: true, id: docRef.id, title: jobPosting.title });
        console.log(`✅ 샘플 구인공고 추가 성공: ${jobPosting.title} (${docRef.id})`);
      }

      console.log(`🎉 총 ${results.length}개의 샘플 구인공고가 추가되었습니다!`);
      return { success: true, jobPostings: results };
    } catch (error) {
      console.error('❌ 샘플 구인공고 추가 오류:', error);
      throw error;
    }
  }
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
    const adminEmails = ['admin@example.com', 'manager@jobsprout.ca', 'admin@jobsprout.ca'];
    return adminEmails.includes(email);
  },

  // 가짜 이벤트 데이터 추가 (개발/테스트용)
  async addSampleEvents() {
    try {
      const sampleEvents = [
        {
          title: "캐나다 취업 박람회 2024",
          description: "뉴브런즈윅 주 최대 규모의 취업 박람회입니다. 50개 이상의 기업이 참여하여 다양한 직종의 채용 정보를 제공합니다.",
          date: "2024-03-15",
          time: "10:00",
          location: "프레데릭턴 컨벤션 센터",
          type: "job-fair",
          maxParticipants: 200,
          organizer: "뉴브런즈윅 고용센터",
          agenda: [
            "10:00-11:00 등록 및 네트워킹",
            "11:00-15:00 기업 부스 운영",
            "15:00-16:00 채용 설명회",
            "16:00-17:00 1:1 면접"
          ],
          benefits: [
            "현장 면접 기회",
            "이력서 검토 서비스",
            "무료 점심 제공",
            "교통비 지원"
          ],
          requirements: [
            "고등학생 이상",
            "이력서 필수 지참",
            "사전 등록 필수"
          ],
          createdBy: "admin@jobsprout.ca"
        },
        {
          title: "리더십 워크숍: 미래의 리더가 되는 법",
          description: "학생들을 위한 실무 중심의 리더십 개발 프로그램입니다. 팀워크, 의사소통, 문제해결 능력을 키울 수 있습니다.",
          date: "2024-03-22",
          time: "14:00",
          location: "UNB 학생회관 대강당",
          type: "workshop",
          maxParticipants: 50,
          organizer: "청소년 리더십 센터",
          agenda: [
            "14:00-14:30 아이스브레이킹",
            "14:30-15:30 리더십 이론",
            "15:30-16:30 팀 프로젝트",
            "16:30-17:00 발표 및 피드백"
          ],
          benefits: [
            "리더십 인증서 발급",
            "멘토링 프로그램 연결",
            "네트워킹 기회",
            "무료 교재 제공"
          ],
          requirements: [
            "중학생 이상",
            "적극적인 참여 의지",
            "팀워크 정신"
          ],
          createdBy: "admin@jobsprout.ca"
        },
        {
          title: "AI와 미래 직업 세미나",
          description: "인공지능 시대에 대비한 새로운 직업과 필요한 스킬에 대해 알아보는 세미나입니다. IT 전문가들의 생생한 경험담을 들어보세요.",
          date: "2024-03-29",
          time: "19:00",
          location: "몽크턴 테크 센터",
          type: "seminar",
          maxParticipants: 100,
          organizer: "캐나다 AI 협회",
          agenda: [
            "19:00-19:15 개회사",
            "19:15-20:00 AI 트렌드 발표",
            "20:00-20:30 휴식 및 네트워킹",
            "20:30-21:15 패널 토론",
            "21:15-21:30 Q&A"
          ],
          benefits: [
            "최신 AI 트렌드 정보",
            "전문가 네트워킹",
            "진로 상담 기회",
            "세미나 자료 제공"
          ],
          requirements: [
            "고등학생 이상",
            "기본 컴퓨터 지식",
            "영어 가능자 우대"
          ],
          createdBy: "admin@jobsprout.ca"
        },
        {
          title: "청소년 창업 아이디어 경진대회",
          description: "창의적인 사업 아이디어를 가진 청소년들을 위한 경진대회입니다. 우수 아이디어에는 창업 지원금이 제공됩니다.",
          date: "2024-04-05",
          time: "13:00",
          location: "세인트존 비즈니스 센터",
          type: "competition",
          maxParticipants: 80,
          organizer: "청소년 창업 지원센터",
          agenda: [
            "13:00-13:30 등록 및 팀 배치",
            "13:30-15:00 아이디어 발표",
            "15:00-15:30 심사 및 휴식",
            "15:30-16:30 결과 발표",
            "16:30-17:00 시상식"
          ],
          benefits: [
            "1등 상금 $1,000",
            "창업 멘토링 제공",
            "투자자 연결 기회",
            "참가 인증서"
          ],
          requirements: [
            "만 14-19세",
            "창업 아이디어 필수",
            "팀 구성 가능"
          ],
          createdBy: "admin@jobsprout.ca"
        },
        {
          title: "병원 인턴십 체험 프로그램",
          description: "의료진의 실제 업무를 체험해볼 수 있는 특별한 기회입니다. 의료계 진출을 희망하는 학생들에게 추천합니다.",
          date: "2024-04-12",
          time: "09:00",
          location: "프레데릭턴 종합병원",
          type: "experience",
          maxParticipants: 25,
          organizer: "프레데릭턴 의료진협회",
          agenda: [
            "09:00-09:30 오리엔테이션",
            "09:30-11:00 병원 투어",
            "11:00-12:00 의료진 강연",
            "12:00-13:00 점심시간",
            "13:00-15:00 실습 체험",
            "15:00-15:30 질의응답"
          ],
          benefits: [
            "실제 의료 현장 경험",
            "의료진과의 멘토링",
            "진로 상담 기회",
            "체험 수료증"
          ],
          requirements: [
            "고등학생 이상",
            "의료계 관심자",
            "건강 검진서 필수",
            "부모 동의서"
          ],
          createdBy: "admin@jobsprout.ca"
        },
        {
          title: "코딩 부트캠프: 웹 개발 입문",
          description: "3일간의 집중적인 웹 개발 부트캠프입니다. HTML, CSS, JavaScript 기초부터 실제 웹사이트 제작까지 배워보세요.",
          date: "2024-04-19",
          time: "09:00",
          location: "NBCC 프레데릭턴 캠퍼스",
          type: "workshop",
          maxParticipants: 30,
          organizer: "뉴브런즈윅 코딩 아카데미",
          agenda: [
            "Day 1: HTML/CSS 기초",
            "Day 2: JavaScript 프로그래밍",
            "Day 3: 프로젝트 제작",
            "최종 발표 및 피드백"
          ],
          benefits: [
            "무료 노트북 대여",
            "코딩 수료증",
            "GitHub 포트폴리오",
            "IT 업계 멘토 연결"
          ],
          requirements: [
            "중학생 이상",
            "컴퓨터 기초 지식",
            "3일 전일 참석 필수"
          ],
          createdBy: "admin@jobsprout.ca"
        },
        {
          title: "환경 보호 프로젝트 참가자 모집",
          description: "지역 환경 보호를 위한 청소년 자원봉사 프로젝트입니다. 환경에 대한 인식을 높이고 실천할 수 있는 기회를 제공합니다.",
          date: "2024-04-26",
          time: "08:00",
          location: "세인트존 하버프론트",
          type: "experience",
          maxParticipants: 60,
          organizer: "NB 환경보호청",
          agenda: [
            "08:00-09:00 등록 및 장비 배급",
            "09:00-12:00 해안 정화 활동",
            "12:00-13:00 점심 및 휴식",
            "13:00-15:00 환경 교육",
            "15:00-16:00 활동 마무리"
          ],
          benefits: [
            "자원봉사 시간 인정",
            "환경 보호 인증서",
            "무료 점심 제공",
            "단체 사진 촬영"
          ],
          requirements: [
            "모든 연령 환영",
            "야외 활동 가능자",
            "장갑 및 작업복 착용"
          ],
          createdBy: "admin@jobsprout.ca"
        }
      ];

      // 각 이벤트를 Firebase에 추가
      const results = [];
      for (const event of sampleEvents) {
        const docRef = await addDoc(collection(db, 'events'), {
          ...event,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        results.push({ success: true, id: docRef.id, title: event.title });
        console.log(`✅ 샘플 이벤트 추가 성공: ${event.title} (${docRef.id})`);
      }

      console.log(`🎉 총 ${results.length}개의 샘플 이벤트가 추가되었습니다!`);
      return { success: true, events: results };
    } catch (error) {
      console.error('❌ 샘플 이벤트 추가 오류:', error);
      throw error;
    }
  }
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

  // 테스트용 봉사 기회 데이터 추가
  async addSampleVolunteerPostings() {
    try {
      const samplePostings = [
        {
          organizationName: "프레더릭턴 공공도서관",
          organizationType: "도서관",
          contactPerson: "Sarah Johnson",
          email: "volunteer@fredlib.ca",
          phone: "(506) 460-2020",
          title: "아동 독서 프로그램 보조",
          description: "매주 토요일 오전에 진행되는 아동 독서 프로그램에서 아이들의 독서 활동을 도와주실 봉사자를 모집합니다. 책 읽기, 활동 보조, 정리 정돈 등의 업무를 담당하게 됩니다.",
          location: "프레데릭턴, NB",
          startDate: "2024-02-01",
          endDate: "2024-06-30",
          timeCommitment: "매주 토요일 오전 9시-12시",
          requiredSkills: "아이들과의 소통 능력, 기본적인 영어 실력, 책 읽기를 좋아하는 마음",
          benefits: "봉사 확인서 발급, 도서관 이용 혜택, 추천서 작성 가능",
          additionalInfo: "14세 이상 고등학생 지원 가능, 부모님 동의서 필요",
          approved: true,
          views: 15,
          applicantCount: 3,
          approvedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          organizationName: "선셋 요양원",
          organizationType: "요양원/요양소",
          contactPerson: "Michael Park",
          email: "volunteer@sunset-care.ca",
          phone: "(506) 455-1234",
          title: "어르신 말벗 및 활동 도우미",
          description: "요양원 어르신들과 함께 시간을 보내며 대화 상대가 되어주고, 간단한 레크리에이션 활동을 도와주실 봉사자를 찾습니다. 따뜻한 마음과 인내심이 필요합니다.",
          location: "프레데릭턴, NB",
          startDate: "2024-01-15",
          endDate: "2024-12-31",
          timeCommitment: "주 1-2회, 각 2시간",
          requiredSkills: "어르신들과의 소통 능력, 인내심, 기본적인 영어 또는 한국어",
          benefits: "봉사 확인서, 간식 제공, 의미 있는 경험",
          additionalInfo: "16세 이상, 건강검진서 제출 필요",
          approved: true,
          views: 22,
          applicantCount: 5,
          approvedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          organizationName: "뉴브런즈윅 푸드뱅크",
          organizationType: "푸드뱅크/급식소",
          contactPerson: "Jennifer Lee",
          email: "volunteer@nbfoodbank.org",
          phone: "(506) 458-9555",
          title: "식품 분류 및 배포 도우미",
          description: "지역사회의 도움이 필요한 가정들을 위해 기부받은 식품을 분류하고 포장하는 일을 도와주실 봉사자를 모집합니다. 체력을 요하는 작업이 포함될 수 있습니다.",
          location: "프레데릭턴, NB",
          startDate: "2024-01-20",
          endDate: "2024-05-31",
          timeCommitment: "주말 중 하루, 4시간",
          requiredSkills: "체력, 팀워크, 기본적인 위생 관념",
          benefits: "봉사 확인서, 중식 제공, 지역사회 기여 경험",
          additionalInfo: "15세 이상, 안전교육 이수 필수",
          approved: true,
          views: 18,
          applicantCount: 7,
          approvedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      const promises = samplePostings.map(posting => addDoc(collection(db, 'volunteerPostings'), posting));
      await Promise.all(promises);
      
      console.log('✅ 샘플 봉사 기회 데이터 추가 완료:', samplePostings.length, '개');
      return { success: true, count: samplePostings.length };
    } catch (error) {
      console.error('❌ 샘플 봉사 기회 데이터 추가 오류:', error);
      throw error;
    }
  }
}; 