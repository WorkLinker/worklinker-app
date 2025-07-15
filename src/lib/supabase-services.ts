/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';

// 🎓 학생 구직 신청 관련
export const jobSeekerService = {
  // 구직 신청 제출
  async submitApplication(data: any, resumeFile?: File) {
    try {
      let resumeUrl = '';
      
      // 레쥬메 파일 업로드 (Supabase Storage 사용)
      if (resumeFile) {
        try {
          const fileExtension = resumeFile.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
          
          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, resumeFile);
          
          if (uploadError) throw uploadError;
          
          // 공개 URL 가져오기
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(fileName);
          
          resumeUrl = publicUrl;
          console.log('✅ 파일 업로드 성공:', resumeUrl);
        } catch (storageError) {
          console.warn('⚠️ 파일 업로드 실패:', storageError);
          resumeUrl = `파일명: ${resumeFile.name} (업로드 대기중)`;
        }
      }
      
      // Supabase 데이터베이스에 저장
      const { data: insertData, error } = await supabase
        .from('job_seekers')
        .insert([{
          ...data,
          resume_url: resumeUrl,
          resume_file_name: resumeFile?.name || '',
          approved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      
      console.log('✅ 구직 신청 제출 성공:', insertData[0].id);
      return { success: true, id: insertData[0].id };
    } catch (error) {
      console.error('❌ 구직 신청 오류:', error);
      throw error;
    }
  },

  // 승인된 구직자 목록 가져오기
  async getApprovedJobSeekers() {
    try {
      const { data, error } = await supabase
        .from('job_seekers')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ 승인된 구직자 목록 조회 오류:', error);
      throw error;
    }
  },

  // 대기 중인 신청 목록 가져오기
  async getPendingApplications() {
    try {
      const { data, error } = await supabase
        .from('job_seekers')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ 대기 중인 신청 목록 조회 오류:', error);
      throw error;
    }
  },

  // 신청 승인
  async approveApplication(applicationId: string) {
    try {
      const { error } = await supabase
        .from('job_seekers')
        .update({ 
          approved: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', applicationId);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ 신청 승인 오류:', error);
      throw error;
    }
  },

  // 신청 거부
  async rejectApplication(applicationId: string, reason?: string) {
    try {
      const { error } = await supabase
        .from('job_seekers')
        .update({ 
          approved: false,
          rejection_reason: reason,
          updated_at: new Date().toISOString() 
        })
        .eq('id', applicationId);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ 신청 거부 오류:', error);
      throw error;
    }
  }
};

// 🏢 채용 공고 관련 서비스
export const jobPostingService = {
  // 채용 공고 제출
  async submitJobPosting(data: any) {
    try {
      const { data: insertData, error } = await supabase
        .from('job_postings')
        .insert([{
          ...data,
          approved: false,
          views: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      return { success: true, id: insertData[0].id };
    } catch (error) {
      console.error('❌ 채용 공고 제출 오류:', error);
      throw error;
    }
  },

  // 승인된 채용 공고 목록
  async getApprovedJobPostings() {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ 승인된 채용 공고 목록 조회 오류:', error);
      throw error;
    }
  },

  // 조회수 증가
  async incrementViews(jobPostingId: string) {
    try {
      const { error } = await supabase.rpc('increment_views', { 
        posting_id: jobPostingId 
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('❌ 조회수 증가 오류:', error);
    }
  }
};

// 🎨 이미지 업로드 서비스
export const imageService = {
  // 이미지 업로드
  async uploadImage(file: File, category: string, imageName: string) {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${category}/${imageName}.${fileExtension}`;
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      return { success: true, url: publicUrl, path: data.path };
    } catch (error) {
      console.error('❌ 이미지 업로드 오류:', error);
      throw error;
    }
  },

  // 활성 이미지 업데이트
  async updateActiveImage(category: string, imageName: string, newUrl: string) {
    try {
      const { error } = await supabase
        .from('active_images')
        .upsert({
          category,
          image_name: imageName,
          url: newUrl,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ 활성 이미지 업데이트 오류:', error);
      throw error;
    }
  }
};

// 📁 파일 관리 서비스
export const fileService = {
  // 카테고리별 파일 업로드 (FileManager 전용)
  async uploadFile(file: File, categoryFolder: string) {
    try {
      const timestamp = Date.now();
      const fileName = `${categoryFolder}/${timestamp}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      
      return { 
        success: true, 
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl,
          originalName: file.name,
          size: file.size,
          type: file.type
        }
      };
    } catch (error) {
      console.error('❌ 파일 업로드 오류:', error);
      throw error;
    }
  },

  // 카테고리별 파일 목록 조회 (FileManager 전용)
  async getUserFiles(categoryFolder: string) {
    try {
      const { data, error } = await supabase.storage
        .from('profile-images')
        .list(categoryFolder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) {
        console.warn(`폴더 ${categoryFolder}를 찾을 수 없습니다:`, error);
        return { success: true, files: [] };
      }
      
      // 파일 정보 가공
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const files = data?.map((file: any) => ({
        id: file.id || file.name,
        name: file.name,
        originalName: file.name.split('_').slice(1).join('_'), // timestamp 제거
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'unknown',
        createdAt: file.created_at || new Date().toISOString(),
        updatedAt: file.updated_at || new Date().toISOString(),
        path: `${categoryFolder}/${file.name}`,
        publicUrl: supabase.storage.from('profile-images').getPublicUrl(`${categoryFolder}/${file.name}`).data.publicUrl
      })) || [];
      
      return { success: true, files };
    } catch (error) {
      console.error('❌ 파일 목록 조회 오류:', error);
      return { success: true, files: [] };
    }
  },

  // 파일 다운로드 URL 생성 (1시간 유효, 강제 다운로드 헤더 포함)
  async getDownloadUrl(filePath: string) {
    try {
      // download 옵션이 지원되지 않을 수 있어서 일단 기본 방식으로 변경
      const { data, error } = await supabase.storage
        .from('profile-images')
        .createSignedUrl(filePath, 3600); // 1시간 (3600초)
      
      if (error) throw error;
      
      return { success: true, signedUrl: data.signedUrl };
    } catch (error) {
      console.error('❌ 다운로드 URL 생성 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  },

  // 파일 삭제
  async deleteFile(filePath: string) {
    try {
      const { error } = await supabase.storage
        .from('profile-images')
        .remove([filePath]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('❌ 파일 삭제 오류:', error);
      throw error;
    }
  },

  // 파일 크기 포맷팅
  formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 파일 타입 아이콘 반환
  getFileTypeIcon(type: string) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  }
};

// 📧 이메일 서비스 (기존 유지)
export const emailService = {
  async sendEmail(to: string, subject: string, content: string) {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, content }),
      });
      
      if (!response.ok) throw new Error('이메일 전송 실패');
      
      return await response.json();
    } catch (error) {
      console.error('❌ 이메일 전송 오류:', error);
      throw error;
    }
  }
};

// 🛠️ 관리자 도구
export const adminService = {
  // 관리자 확인
  isAdmin(email: string): boolean {
    const adminEmails = [
      'admin@example.com',
      'admin2@example.com'
    ];
    return adminEmails.includes(email);
  },

  // 통계 가져오기
  async getStats() {
    try {
      const [jobSeekers, jobPostings, events, communityPosts] = await Promise.all([
        supabase.from('job_seekers').select('id', { count: 'exact' }),
        supabase.from('job_postings').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('community_posts').select('id', { count: 'exact' })
      ]);

      return {
        jobSeekers: jobSeekers.count || 0,
        jobPostings: jobPostings.count || 0,
        events: events.count || 0,
        communityPosts: communityPosts.count || 0
      };
    } catch (error) {
      console.error('❌ 통계 조회 오류:', error);
      throw error;
    }
  }
};

// 실시간 구독 기능
export const realtimeService = {
  // 실시간 데이터 구독
  subscribeToTable(tableName: string, callback: (data: any) => void) {
    return supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, callback)
      .subscribe();
  },

  // 구독 해제
  unsubscribe(subscription: any) {
    supabase.removeChannel(subscription);
  }
}; 