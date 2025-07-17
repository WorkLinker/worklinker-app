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
  title = "Admin File Upload", 
  category = "admin", 
  showTitle = true 
}: AdminFileUploadProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // 파일 업로드 확인 관련 상태
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
      alert('Administrator permission required.');
      return;
    }

    setUploading(true);
    
    try {
      const fileArray = Array.from(uploadFiles);
      
      for (const file of fileArray) {
        // File size validation (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
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
      alert(`🎉 ${fileArray.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setPendingFiles(fileArray);
      setShowConfirmModal(true);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setPendingFiles(fileArray);
      setShowConfirmModal(true);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  // 파일 업로드 확인
  const confirmUpload = async () => {
    if (pendingFiles.length === 0) return;
    
    setShowConfirmModal(false);
    await handleFileUpload(pendingFiles);
    setPendingFiles([]);
  };

  // 파일 업로드 취소
  const cancelUpload = () => {
    setPendingFiles([]);
    setShowConfirmModal(false);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      console.log(`📥 Downloading ${file.originalName}...`);
      
      // Firebase Storage URL을 직접 사용하여 다운로드
      const link = document.createElement('a');
      link.href = file.downloadURL;
      link.download = file.originalName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // 임시로 DOM에 추가하고 클릭
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ ${file.originalName} download initiated successfully`);
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return;
    }
    
    try {
      console.log(`🗑️ Deleting ${file.originalName}...`);
      
      // Delete from Firebase Storage - file.name already includes category
      const storagePath = `admin-files/${file.name}`;
      const fileRef = ref(storage, storagePath);
      console.log('🗑️ Deleting from Storage path:', storagePath);
      
      await deleteObject(fileRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'uploadedFiles', file.id));
      
      await loadFiles();
      console.log(`✅ ${file.originalName} deleted successfully`);
    } catch (error) {
      console.error('❌ Delete error:', error);
      
      // If Storage delete fails, still try to delete from Firestore
      try {
        await deleteDoc(doc(db, 'uploadedFiles', file.id));
        await loadFiles();
        console.log(`⚠️ ${file.originalName} deleted from database (Storage may have failed)`);
      } catch (firestoreError) {
        console.error('❌ Firestore delete also failed:', firestoreError);
        alert('Delete failed. Please try again.');
      }
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
    return date.toLocaleDateString('en-CA', {
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
          Drag files here or click to upload
        </h4>
        <p className="text-gray-600 mb-4">
          Maximum 10MB file size. Files can be downloaded/deleted after upload.
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
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} className="mr-2" />
              Select Files
            </>
          )}
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Uploaded Files ({files.length})
            </h4>
            <div className="text-sm text-red-600 font-medium">
              🗑️ Delete files using Delete button next to each file
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
                    title="Download"
                  >
                    <Download size={12} className="mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition-colors"
                    title="Delete"
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
            Administrator-only feature. Uploaded files can also be managed from the admin dashboard.
          </p>
        </div>
      </div>

      {/* Upload Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                <Shield size={20} className="inline mr-2 text-blue-600" />
                Admin File Upload
              </h3>
              <button
                onClick={cancelUpload}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-sm text-blue-700 bg-blue-50 p-3 rounded-lg mb-3">
                <AlertCircle size={16} className="mr-2" />
                Files will be uploaded to: <strong className="ml-1">{category}</strong> category
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Files to Upload ({pendingFiles.length}):
              </label>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {pendingFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelUpload}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 