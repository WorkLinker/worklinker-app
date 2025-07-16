'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon,
  AlertCircle,
  Shield
} from 'lucide-react';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { authService } from '@/lib/auth-service';
import { eventService } from '@/lib/firebase-services';
import { User as FirebaseUser } from 'firebase/auth';

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  downloadURL: string;
  uploadedAt: Date | { seconds: number; nanoseconds: number };
  category: string;
  uploadedBy: string;
}

interface AdminFileUploadProps {
  title?: string;
  category?: string;
  showTitle?: boolean;
}

export default function AdminFileUpload({ 
  title = "관리자 파일 업로드", 
  category = "admin", 
  showTitle = true 
}: AdminFileUploadProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (currentUser && eventService.isAdmin(currentUser.email || '')) {
        loadFiles();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      console.log('📁 Loading admin files...');
      
      const q = query(
        collection(db, 'uploadedFiles'), 
        where('category', '==', category),
        orderBy('uploadedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const fileList: FileItem[] = [];
      querySnapshot.forEach((doc) => {
        fileList.push({
          id: doc.id,
          ...doc.data()
        } as FileItem);
      });
      
      setFiles(fileList);
      console.log(`✅ Loaded ${fileList.length} admin files`);
    } catch (error) {
      console.error('❌ Error loading admin files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (uploadFiles: FileList | File[]) => {
    if (!uploadFiles || uploadFiles.length === 0) return;
    if (!user || !eventService.isAdmin(user.email || '')) {
      alert('관리자 권한이 필요합니다.');
      return;
    }

    setUploading(true);
    
    try {
      const fileArray = Array.from(uploadFiles);
      
      for (const file of fileArray) {
        // File size validation (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`파일 ${file.name}이 너무 큽니다. 최대 크기는 10MB입니다.`);
          continue;
        }

        // Upload to Firebase Storage
        const timestamp = Date.now();
        const fileName = `${category}/${timestamp}_${file.name}`;
        const fileRef = ref(storage, `admin-files/${fileName}`);
        
        console.log(`📤 Uploading ${file.name}...`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Save metadata to Firestore
        await addDoc(collection(db, 'uploadedFiles'), {
          name: fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          downloadURL,
          category,
          uploadedBy: user.email,
          uploadedAt: serverTimestamp()
        });
        
        console.log(`✅ ${file.name} uploaded successfully`);
      }
      
      await loadFiles();
      alert(`🎉 ${fileArray.length}개 파일이 성공적으로 업로드되었습니다!`);
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const files = event.dataTransfer.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      console.log(`📥 Downloading ${file.originalName}...`);
      
      const response = await fetch(file.downloadURL);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`✅ ${file.originalName} downloaded successfully`);
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('다운로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!confirm(`"${file.originalName}" 파일을 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      console.log(`🗑️ Deleting ${file.originalName}...`);
      
      // Delete from Firebase Storage
      const fileRef = ref(storage, `admin-files/${file.name}`);
      await deleteObject(fileRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'uploadedFiles', file.id));
      
      await loadFiles();
      console.log(`✅ ${file.originalName} deleted successfully`);
    } catch (error) {
      console.error('❌ Delete error:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} className="text-blue-500" />;
    if (type.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    return <FileIcon size={20} className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 관리자가 아닌 경우 표시하지 않음
  if (!user || !eventService.isAdmin(user.email || '')) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {showTitle && (
        <div className="flex items-center mb-6">
          <Shield size={24} className="text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload size={48} className="text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          파일을 드래그하거나 클릭하여 업로드
        </h4>
        <p className="text-gray-600 mb-4">
          최대 10MB까지 업로드 가능합니다. 업로드 후 다운로드/삭제 가능합니다.
        </p>
        
        <input
          type="file"
          id={`admin-file-upload-${category}`}
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />
        
        <label
          htmlFor={`admin-file-upload-${category}`}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
            uploading 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              업로드 중...
            </>
          ) : (
            <>
              <Upload size={18} className="mr-2" />
              파일 선택
            </>
          )}
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              업로드된 파일 ({files.length}개)
            </h4>
            <div className="text-sm text-red-600 font-medium">
              🗑️ 각 파일 옆 Delete 버튼으로 삭제 가능
            </div>
          </div>
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="font-medium text-gray-900">{file.originalName}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors"
                    title="다운로드"
                  >
                    <Download size={12} className="mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={12} className="mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Notice */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <AlertCircle size={16} className="text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">
            관리자 전용 기능입니다. 업로드된 파일은 관리자 대시보드에서도 관리할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
} 