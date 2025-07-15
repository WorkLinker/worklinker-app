'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { fileService } from '@/lib/supabase-services';
import { supabase } from '@/lib/supabase';
import { Upload, Download, Trash2, File, Image, FileText, Archive, Music, Video, RefreshCw } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
  path: string;
  publicUrl: string;
  category?: string;
  categoryId?: string;
}

// 업로드 카테고리 정의
const UPLOAD_CATEGORIES = [
  { id: 'job-resumes', name: '구직자 이력서', folder: 'job-resumes' },
  { id: 'company-docs', name: '회사 문서', folder: 'company-documents' },
  { id: 'event-images', name: '이벤트 이미지', folder: 'event-images' },
  { id: 'announcements', name: '공지사항 첨부파일', folder: 'announcements' },
  { id: 'volunteer-docs', name: '봉사활동 문서', folder: 'volunteer-documents' },
  { id: 'admin-files', name: '관리자 파일', folder: 'admin-files' },
  { id: 'misc', name: '기타 문서', folder: 'miscellaneous' }
];

export default function FileManager() {
  const [user] = useAuthState(auth);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('admin-files');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Supabase Storage 버킷 자동 생성 함수
  const createBucketIfNotExists = async () => {
    try {
      console.log('🔧 profile-images 버킷 생성 시도...');
      
      // 버킷 생성 시도
      const { error } = await supabase.storage.createBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error('❌ 버킷 생성 실패:', error);
        return false;
      }
      
      console.log('✅ profile-images 버킷 준비 완료');
      
      // Storage 정책 확인 및 설정 (권한 문제 해결)
      try {
        console.log('🔐 Storage 정책 확인 중...');
        
        // 간단한 테스트 파일 업로드로 권한 확인
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const testFile = new (File as any)([testBlob], 'test-permissions.txt', { type: 'text/plain' });
        
        const { error: testError } = await supabase.storage
          .from('profile-images')
          .upload('test/test-permissions.txt', testFile);
        
        if (testError) {
          console.warn('⚠️ Storage 정책 문제 감지:', testError.message);
          alert('⚠️ 파일 업로드 권한이 설정되지 않았습니다. Supabase 대시보드 → Storage → profile-images → Policies에서 업로드/다운로드 정책을 "Allow all operations"로 설정해주세요.');
        } else {
          console.log('✅ Storage 권한 확인 완료');
          // 테스트 파일 삭제
          await supabase.storage.from('profile-images').remove(['test/test-permissions.txt']);
        }
      } catch (policyError) {
        console.warn('⚠️ Storage 정책 테스트 실패:', policyError);
      }
      
      return true;
    } catch (error) {
      console.error('❌ 버킷 생성 중 오류:', error);
      return false;
    }
  };

  const loadFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Supabase 연결 상태 확인
      console.log('🔍 Supabase 연결 확인 중...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.warn('⚠️ Supabase Storage 연결 실패:', bucketError.message);
        alert('⚠️ 파일 시스템에 연결할 수 없습니다. 네트워크를 확인하세요.');
        setFiles([]);
        return;
      }
      
      console.log('✅ Supabase Storage 연결 성공, 버킷 목록:', buckets?.map((b: {name: string}) => b.name));
      
      // profile-images 버킷이 존재하는지 확인
              const profileImagesBucket = buckets?.find((bucket: {name: string}) => bucket.name === 'profile-images');
      if (!profileImagesBucket) {
        console.warn('❌ profile-images 버킷이 존재하지 않음. 자동 생성 시도...');
        
        const bucketCreated = await createBucketIfNotExists();
        if (!bucketCreated) {
          alert('⚠️ 파일 저장소를 생성할 수 없습니다. Supabase 대시보드에서 수동으로 "profile-images" 버킷을 생성해주세요.');
          setFiles([]);
          return;
        }
      }
      
      console.log('✅ profile-images 버킷 확인됨');
      
      // 모든 카테고리의 파일을 가져오기
      const allFiles: FileItem[] = [];
      
      for (const category of UPLOAD_CATEGORIES) {
        try {
          console.log(`📁 ${category.name} 폴더에서 파일 검색 중...`);
          const response = await fileService.getUserFiles(category.folder);
          if (response.success && response.files) {
            const filesWithCategory = response.files.map((file: {name: string, url: string, size: number, lastModified: string}) => ({
              ...file,
              category: category.name,
              categoryId: category.id
            }));
            allFiles.push(...filesWithCategory);
            console.log(`✅ ${category.name}: ${response.files.length}개 파일 발견`);
          }
        } catch (error) {
          console.log(`⚠️ 카테고리 ${category.name} 파일 로드 오류:`, error);
        }
      }
      
      console.log(`📁 총 ${allFiles.length}개 파일 로드됨`);
      setFiles(allFiles);
      
      if (allFiles.length === 0) {
        console.log('💡 파일이 없습니다. 첫 번째 파일을 업로드해보세요!');
      }
      
    } catch (error) {
      console.error('❌ 파일 목록 로드 치명적 오류:', error);
      alert(`❌ 파일 시스템 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    const selectedCategoryData = UPLOAD_CATEGORIES.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData) return;

    setUploading(true);
    try {
      console.log(`📤 파일 업로드 시작: ${selectedFile.name} → ${selectedCategoryData.name}`);
      
      // 파일 크기 확인
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 파일 타입 확인
      const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
      const isAllowed = allowedTypes.some(type => selectedFile.type.startsWith(type));
      if (!isAllowed) {
        alert('지원되지 않는 파일 형식입니다. 이미지, PDF, Word 문서만 업로드 가능합니다.');
        return;
      }
      
      const response = await fileService.uploadFile(selectedFile, selectedCategoryData.folder);
      
      if (response.success) {
        setSelectedFile(null);
        // 파일 입력 초기화
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        await loadFiles(); // 파일 목록 새로고침
        
        console.log('✅ 파일 업로드 성공:', response.data?.publicUrl);
        alert(`✅ 파일이 "${selectedCategoryData.name}" 카테고리에 성공적으로 업로드되었습니다!`);
      } else {
        throw new Error('업로드 응답이 성공이 아닙니다.');
      }
      
    } catch (error) {
      console.error('❌ 파일 업로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      
      if (errorMessage.includes('policy')) {
        alert('❌ 파일 업로드 권한이 없습니다. Supabase 대시보드에서 Storage 정책을 확인해주세요.');
      } else if (errorMessage.includes('bucket')) {
        alert('❌ 파일 저장소를 찾을 수 없습니다. 버킷이 생성되지 않았을 수 있습니다.');
      } else {
        alert(`❌ 파일 업로드에 실패했습니다: ${errorMessage}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      console.log('📥 파일 다운로드 시작:', fileName);
      
      const response = await fileService.getDownloadUrl(filePath);
      if (!response || !response.success || !response.signedUrl) {
        throw new Error(response?.error || '다운로드 URL 생성 실패');
      }
      
      // Fetch로 파일 데이터 가져오기
      const fileResponse = await fetch(response.signedUrl);
      if (!fileResponse.ok) {
        throw new Error('파일 데이터 가져오기 실패');
      }
      
      // Blob으로 변환
      const blob = await fileResponse.blob();
      
      // 강제 다운로드 처리
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 메모리 정리
      window.URL.revokeObjectURL(url);
      
      console.log('✅ 파일 다운로드 완료:', fileName);
    } catch (error) {
      console.error('❌ 파일 다운로드 오류:', error);
      alert('파일 다운로드에 실패했습니다. 네트워크 상태를 확인해주세요.');
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) return;

    try {
      await fileService.deleteFile(filePath);
      await loadFiles(); // 파일 목록 새로고침
      alert('파일이 삭제되었습니다.');
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      alert('파일 삭제에 실패했습니다.');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "w-6 h-6";

    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className={`${iconClass} text-green-500`} />;
      case 'pdf':
        return <FileText className={`${iconClass} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FileText className={`${iconClass} text-blue-500`} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className={`${iconClass} text-orange-500`} />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className={`${iconClass} text-purple-500`} />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className={`${iconClass} text-pink-500`} />;
      default:
        return <File className={`${iconClass} text-gray-500`} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  // 필터링된 파일 목록
  const filteredFiles = filterCategory === 'all' 
    ? files 
    : files.filter(file => file.categoryId === filterCategory);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 파일 업로드 섹션 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Upload className="w-6 h-6 mr-2 text-blue-600" />
          파일 업로드
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
              업로드 카테고리 선택
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              {UPLOAD_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  📁 {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              업로드할 파일 선택
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>업로드</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 파일 목록 섹션 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <File className="w-6 h-6 mr-2 text-green-600" />
            업로드된 파일 ({filteredFiles.length}개)
          </h2>
          <div className="flex items-center space-x-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="all">📂 모든 카테고리</option>
              {UPLOAD_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  📁 {category.name}
                </option>
              ))}
            </select>
            <button
              onClick={loadFiles}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filterCategory === 'all' 
                ? '업로드된 파일이 없습니다.' 
                : '이 카테고리에 업로드된 파일이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.name)}
                                         <div className="flex-1 min-w-0">
                       <p className="font-medium text-gray-900 truncate">{file.name}</p>
                       <div className="flex items-center space-x-4 text-sm text-gray-500">
                         <span>{formatFileSize(file.size)}</span>
                         {file.category && (
                           <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                             📁 {file.category}
                           </span>
                         )}
                         <span>업로드: {formatDate(file.createdAt)}</span>
                       </div>
                     </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(file.path, file.name)}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                      title="다운로드"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.path)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 