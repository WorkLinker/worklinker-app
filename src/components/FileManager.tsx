'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon,
  Search,
  CheckCircle
} from 'lucide-react';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  downloadURL: string;
  uploadedAt: Date | { seconds: number; nanoseconds: number };
  category: string;
}

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadCategory, setUploadCategory] = useState('documents'); // 업로드 카테고리 상태 추가
  
  // 파일 업로드 확인 관련 상태
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const categories = [
    { value: 'all', label: 'All Files' },
    { value: 'resumes', label: 'Resumes' },
    { value: 'references', label: 'References' },
    { value: 'documents', label: 'Documents' },
    { value: 'images', label: 'Images' },
    { value: 'admin', label: 'Admin Files' }
  ];

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      console.log('📁 Loading files from Firebase...');
      
      const q = query(collection(db, 'uploadedFiles'), orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fileList: FileItem[] = [];
      querySnapshot.forEach((doc) => {
        fileList.push({
          id: doc.id,
          ...doc.data()
        } as FileItem);
      });
      
      setFiles(fileList);
      console.log(`✅ Loaded ${fileList.length} files`);
    } catch (error) {
      console.error('❌ Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (uploadFiles: FileList | File[]) => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    
    try {
      const fileArray = Array.from(uploadFiles);
      
      for (const file of fileArray) {
        // File size validation (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        // 사용자가 선택한 카테고리 사용
        let category = uploadCategory;
        
        // 파일 타입에 따른 자동 분류 (사용자 선택이 documents인 경우에만)
        if (uploadCategory === 'documents') {
          if (file.type.startsWith('image/')) {
            category = 'images';
          } else if (file.name.toLowerCase().includes('resume') || file.name.toLowerCase().includes('cv')) {
            category = 'resumes';
          } else if (file.name.toLowerCase().includes('reference')) {
            category = 'references';
          }
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
      
      // Reload files list
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

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} selected file(s)?`)) {
      return;
    }
    
    try {
      let successCount = 0;
      for (const fileId of selectedFiles) {
        const file = files.find(f => f.id === fileId);
        if (file) {
          try {
            // Use correct Storage path - file.name already includes category
            const storagePath = `admin-files/${file.name}`;
            const fileRef = ref(storage, storagePath);
            console.log(`🗑️ Bulk deleting from Storage: ${storagePath}`);
            
            await deleteObject(fileRef);
            await deleteDoc(doc(db, 'uploadedFiles', file.id));
            successCount++;
          } catch (fileError) {
            console.error(`❌ Failed to delete ${file.originalName}:`, fileError);
            // Try to delete from Firestore even if Storage fails
            try {
              await deleteDoc(doc(db, 'uploadedFiles', file.id));
              successCount++;
            } catch (firestoreError) {
              console.error(`❌ Firestore delete also failed for ${file.originalName}:`, firestoreError);
            }
          }
        }
      }
      
      setSelectedFiles([]);
      await loadFiles();
      
      if (successCount === selectedFiles.length) {
        alert(`✅ ${successCount} file(s) deleted successfully!`);
      } else {
        alert(`⚠️ ${successCount} out of ${selectedFiles.length} file(s) deleted. Some files may have already been removed.`);
      }
    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      alert('Bulk delete failed. Please try again.');
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.id));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Files...</h3>
        <p className="text-gray-600">Please wait while we load your files.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
    <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Upload size={28} className="mr-3 text-green-600" />
            File Management System
            </h2>
            <p className="text-gray-600 mt-2">
              Upload, manage, and download files securely with Firebase Storage
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-gray-500">
            {files.length} total files • {filteredFiles.length} visible
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Category
          </label>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={uploading}
          >
            {categories.filter(cat => cat.value !== 'all').map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select where to organize your uploaded files
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-green-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
          
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload size={48} className={`mx-auto mb-4 ${dragActive ? 'text-green-500' : 'text-gray-400'}`} />
            <div className="text-lg font-medium text-gray-900 mb-2">
              {uploading ? 'Uploading files...' : 'Click to upload files or drag and drop'}
            </div>
            <div className="text-sm text-gray-500">
              Maximum file size: 10MB • All file types supported
            </div>
          </label>
          
          {uploading && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            {/* 전체 선택/해제 버튼 */}
            {filteredFiles.length > 0 && (
              <button
                onClick={selectAllFiles}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <CheckCircle size={16} className="mr-1" />
                {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            
            {selectedFiles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-lg"
              >
                <Trash2 size={16} className="mr-1" />
                Delete ({selectedFiles.length}) Selected
              </button>
            )}
          </div>
        </div>
        
        {/* 파일 개수 및 선택 정보 */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Total {filteredFiles.length} files • {selectedFiles.length} selected
          </div>
          {selectedFiles.length > 0 && (
            <div className="text-red-600 font-medium">
              {selectedFiles.length} file(s) ready for deletion
            </div>
          )}
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="p-12 text-center">
            <FileIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first file to get started'
              }
            </p>
            {!(searchTerm || selectedCategory !== 'all') && (
              <div className="max-w-md mx-auto text-sm text-gray-500 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">✨ Available Features:</p>
                    <ul className="space-y-1">
                      <li>• Download files</li>
                      <li>• Delete individual files</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">🗑️ How to Delete:</p>
                    <ul className="space-y-1">
                      <li>• Click Delete button</li>
                      <li>• Select multiple & bulk delete</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-xs">
                    💡 After uploading files, <span className="font-bold text-red-600">Delete</span> buttons will appear next to each file
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      onChange={selectAllFiles}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getFileIcon(file.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {file.originalName}
                          </div>
                          <div className="text-sm text-gray-500">{file.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {file.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(file.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownload(file)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 hover:text-green-700 transition-colors"
                          title="Download"
                        >
                          <Download size={14} className="mr-1" />
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 hover:text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(1).map(category => {
            const count = files.filter(f => f.category === category.value).length;
            return (
              <div key={category.value} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500">{category.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm File Upload
              </h3>
              <button
                onClick={cancelUpload}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload to Category:
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="documents">Documents</option>
                <option value="resumes">Resumes</option>
                <option value="references">References</option>
                <option value="images">Images</option>
                <option value="admin">Admin Files</option>
              </select>
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