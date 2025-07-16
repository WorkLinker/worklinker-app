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

// Upload category definitions
const UPLOAD_CATEGORIES = [
  { id: 'job-resumes', name: 'Job Seeker Resumes', folder: 'job-resumes' },
  { id: 'company-docs', name: 'Company Documents', folder: 'company-documents' },
  { id: 'event-images', name: 'Event Images', folder: 'event-images' },
  { id: 'announcements', name: 'Announcement Attachments', folder: 'announcements' },
  { id: 'volunteer-docs', name: 'Volunteer Documents', folder: 'volunteer-documents' },
  { id: 'admin-files', name: 'Administrator Files', folder: 'admin-files' },
  { id: 'misc', name: 'Other Documents', folder: 'miscellaneous' }
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

  // Supabase Storage bucket auto-creation function
  const createBucketIfNotExists = async () => {
    try {
      console.log('🔧 Attempting to create profile-images bucket...');
      
      // Attempt to create bucket
      const { error } = await supabase.storage.createBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error('❌ Bucket creation failed:', error);
        return false;
      }
      
      console.log('✅ profile-images bucket ready');
      
      // Check and set Storage policies (resolve permission issues)
      try {
        console.log('🔐 Checking Storage policies...');
        
        // Simple test file upload to check permissions
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const testFile = new (File as any)([testBlob], 'test-permissions.txt', { type: 'text/plain' });
        
        const { error: testError } = await supabase.storage
          .from('profile-images')
          .upload('test/test-permissions.txt', testFile);
        
        if (testError) {
          console.warn('⚠️ Storage policy issue detected:', testError.message);
          alert('⚠️ File upload permissions are not configured. Please go to Supabase Dashboard → Storage → profile-images → Policies and set upload/download policies to "Allow all operations".');
        } else {
          console.log('✅ Storage permissions verified');
          // Delete test file
          await supabase.storage.from('profile-images').remove(['test/test-permissions.txt']);
        }
      } catch (policyError) {
        console.warn('⚠️ Storage policy test failed:', policyError);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error during bucket creation:', error);
      return false;
    }
  };

  const loadFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check Supabase connection status
      console.log('🔍 Checking Supabase connection...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.warn('⚠️ Supabase Storage connection failed:', bucketError.message);
        alert('⚠️ Cannot connect to file system. Please check your network.');
        setFiles([]);
        return;
      }
      
      console.log('✅ Supabase Storage connection successful, bucket list:', buckets?.map((b: {name: string}) => b.name));
      
      // Check if profile-images bucket exists
      const profileImagesBucket = buckets?.find((bucket: {name: string}) => bucket.name === 'profile-images');
      if (!profileImagesBucket) {
        console.warn('❌ profile-images bucket does not exist. Attempting auto-creation...');
        
        const bucketCreated = await createBucketIfNotExists();
        if (!bucketCreated) {
          alert('⚠️ Cannot create file storage. Please manually create "profile-images" bucket in Supabase Dashboard.');
          setFiles([]);
          return;
        }
      }
      
      console.log('✅ profile-images bucket verified');
      
      // Fetch files from all categories
      const allFiles: FileItem[] = [];
      
      for (const category of UPLOAD_CATEGORIES) {
        try {
          console.log(`📁 Searching for files in ${category.name} folder...`);
          const response = await fileService.getUserFiles(category.folder);
          if (response.success && response.files) {
            const filesWithCategory = response.files.map((file: {name: string, url: string, size: number, lastModified: string}) => ({
              ...file,
              category: category.name,
              categoryId: category.id
            }));
            allFiles.push(...filesWithCategory);
            console.log(`✅ ${category.name}: ${response.files.length} files found`);
          }
        } catch (error) {
          console.log(`⚠️ Error loading files from category ${category.name}:`, error);
        }
      }
      
      console.log(`📁 Total ${allFiles.length} files loaded`);
      setFiles(allFiles);
      
      if (allFiles.length === 0) {
        console.log('💡 No files found. Try uploading your first file!');
      }
      
    } catch (error) {
      console.error('❌ Critical error loading file list:', error);
      alert(`❌ File system error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.log(`📤 Starting file upload: ${selectedFile.name} → ${selectedCategoryData.name}`);
      
      // Check file size
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('⚠️ File size exceeds the 5MB limit. Please choose a smaller file.');
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
      const isAllowed = allowedTypes.some(type => selectedFile.type.startsWith(type));
      if (!isAllowed) {
        alert('⚠️ This file format is not supported. Please upload images, PDF, or Word documents only.');
        return;
      }
      
      const response = await fileService.uploadFile(selectedFile, selectedCategoryData.folder);
      
      if (response.success) {
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        await loadFiles(); // Refresh file list
        
        console.log('✅ File upload successful:', response.data?.publicUrl);
        alert(`✅ Great! Your file has been uploaded to the "${selectedCategoryData.name}" category successfully.`);
      } else {
        throw new Error('Upload response is not successful.');
      }
      
    } catch (error) {
      console.error('❌ File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('policy')) {
        alert('❌ Upload permission denied. Please contact the administrator to check storage policies.');
      } else if (errorMessage.includes('bucket')) {
        alert('❌ Storage configuration error. Please contact technical support.');
      } else {
        alert(`❌ Upload failed: ${errorMessage}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      console.log('📥 Starting file download:', fileName);
      
      const response = await fileService.getDownloadUrl(filePath);
      if (!response || !response.success || !response.signedUrl) {
        throw new Error(response?.error || 'Failed to generate download URL');
      }
      
      // Fetch file data
      const fileResponse = await fetch(response.signedUrl);
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file data');
      }
      
      // Convert to Blob
      const blob = await fileResponse.blob();
      
      // Force download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up memory
      window.URL.revokeObjectURL(url);
      
      console.log('✅ File download completed:', fileName);
    } catch (error) {
      console.error('❌ File download error:', error);
      alert('❌ Download failed. Please check your network connection and try again.');
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm('⚠️ Are you sure you want to delete this file? This action cannot be undone.')) return;

    try {
      await fileService.deleteFile(filePath);
      await loadFiles(); // Refresh file list
      alert('✅ File has been deleted successfully.');
    } catch (error) {
      console.error('File deletion error:', error);
      alert('❌ Failed to delete the file. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ CAUTION: This will permanently delete ALL uploaded files! Are you absolutely sure you want to continue?')) return;

    try {
      setLoading(true);
      
      // Delete all files one by one
      for (const file of files) {
        await fileService.deleteFile(file.path);
      }
      
      await loadFiles(); // Refresh file list
      alert('✅ All files have been deleted successfully!');
    } catch (error) {
      console.error('Bulk deletion error:', error);
      alert('❌ Some files could not be deleted. Please try again or contact support.');
    } finally {
      setLoading(false);
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
    return new Date(dateString).toLocaleString('en-CA');
  };

  // Filtered file list
  const filteredFiles = filterCategory === 'all' 
    ? files 
    : files.filter(file => file.categoryId === filterCategory);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Login required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Upload className="w-6 h-6 mr-2 text-blue-600" />
          File Upload
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Upload Category
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
              Select File to Upload
            </label>
            <div className="relative">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="block w-full cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : 'Choose File or Drag Here'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Images, PDF, Word documents (Max 5MB)
                </p>
              </label>
            </div>
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
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File List Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <File className="w-6 h-6 mr-2 text-green-600" />
            Uploaded Files ({filteredFiles.length})
          </h2>
          <div className="flex items-center space-x-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="all">📂 All Categories</option>
              {UPLOAD_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  📁 {category.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleDeleteAll}
              disabled={loading || files.length === 0}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All</span>
            </button>
            <button
              onClick={loadFiles}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
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
            <p className="text-gray-500 text-lg font-medium mb-2">
              {filterCategory === 'all' 
                ? 'No files uploaded yet' 
                : 'No files in this category'}
            </p>
            <p className="text-gray-400 text-sm">
              Upload your first file using the form above
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
                        <span>Uploaded: {formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(file.path, file.name)}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.path)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete"
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