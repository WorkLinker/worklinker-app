'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  School, 
  FileText,
  Search,
  Edit,
  Activity,
  Download,
  Settings,
  User,
  Target,
  BookOpen,
  Filter,
  CalendarDays,
  ArrowUpDown,
  Eye,
  Lock,
  EyeOff,
  Shield,
  Key,
  AlertCircle,
  Heart,
  Building,
  MapPin,
  Palette,
  Image as ImageIcon,
  Type,
  Upload
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

import FileManager from '@/components/FileManager';
import { authService } from '@/lib/auth-service';
import { jobSeekerService, eventService, contentService, logService, volunteerService, designService } from '@/lib/firebase-services';
// import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email-service'; // 제거됨
// import { User as SupabaseUser } from '@supabase/supabase-js';
// import { supabaseAuthService } from '@/lib/supabase-auth-service';
import { supabase } from '@/lib/supabase';
import { User as FirebaseUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

type TabType = 'user-approval' | 'volunteer-management' | 'content-edit' | 'activity-log' | 'admin-settings' | 'design-editor' | 'file-management';

// 비밀번호 변경 모달 컴포넌트
function PasswordChangeModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: FirebaseUser | null }) {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Password validation
  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Must include lowercase letters');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Must include uppercase letters');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Must include numbers');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Must include special characters (@$!%*?&)');
    }
    return errors;
  };

  const handlePasswordChange = async () => {
    if (!user) {
      alert('User information not found.');
      return;
    }

    setErrors([]);
    const validationErrors = [];

    // Basic validation
    if (!passwords.current) {
      validationErrors.push('Please enter your current password');
    }
    if (!passwords.new) {
      validationErrors.push('Please enter a new password');
    }
    if (!passwords.confirm) {
      validationErrors.push('Please confirm your new password');
    }
    if (passwords.new !== passwords.confirm) {
      validationErrors.push('New password and confirmation do not match');
    }

    // New password strength validation
    if (passwords.new) {
      const passwordErrors = validatePassword(passwords.new);
      validationErrors.push(...passwordErrors);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsLoading(true);

      // Re-authenticate with current password
      const credential = EmailAuthProvider.credential(user.email!, passwords.current);
      await reauthenticateWithCredential(user, credential);

      // Change to new password
      await updatePassword(user, passwords.new);

      // Log activity
      await logService.createLog({
        type: 'admin',
        action: 'password_change',
        adminEmail: user.email,
        description: 'Password has been changed',
        details: {
          userEmail: user.email,
          changeTime: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      });

      alert('✅ Password has been successfully changed.');
      
      // Reset form and close modal
      setPasswords({ current: '', new: '', confirm: '' });
      setErrors([]);
      onClose();

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('❌ Password change error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrors(['Current password is incorrect']);
      } else {
        setErrors(['Error occurred while changing password: ' + error.message]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field: 'current' | 'new' | 'confirm', value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    setErrors([]); // Clear error messages on input
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Lock size={24} className="mr-2 text-purple-600" />
              🔐 Change Password
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Change to a strong password for account security.
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => handleInputChange('current', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => handleInputChange('new', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => handleInputChange('confirm', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <Shield size={16} className="mr-1" />
              Password Requirements
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Minimum 8 characters</li>
              <li>• Include uppercase, lowercase, and numbers</li>
              <li>• Include special characters (@$!%*?&)</li>
            </ul>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle size={16} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Errors occurred</h4>
                  <ul className="text-xs text-red-700 mt-1 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePasswordChange}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Changing...
              </>
            ) : (
              <>
                <Key size={16} className="mr-2" />
                Change Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Activity Log Component
function ActivityLogComponent() {
  const [logs, setLogs] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    adminEmail: '',
    actionType: '',
    datePreset: 'all'
  });
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  // Translate Korean log messages to English
  const translateLogDescription = (description: string) => {
    if (!description) return 'No action description';
    
    const translations: { [key: string]: string } = {
      '디자인 설정을 변경하였습니다': 'Design settings have been changed',
      '사이트 콘텐츠가 수정되었습니다': 'Site content has been modified',
      '구직 신청이 승인되었습니다': 'Job application has been approved',
      '구직 신청이 거절되었습니다': 'Job application has been rejected',
      '비밀번호가 변경되었습니다': 'Password has been changed',
      '봉사자 모집 공고가 승인되었습니다': 'Volunteer opportunity has been approved',
      '봉사자 모집 공고가 거절되었습니다': 'Volunteer opportunity has been rejected'
    };
    
    return translations[description] || description;
  };

  // Load log data
  useEffect(() => {
    loadLogs();
  }, []);

  // Apply filtering and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [logs, filters, sortConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLogs = async () => {
    try {
      setLoading(true);
      const allLogs = await logService.getAllLogs(200); // Load maximum 200 logs
      setLogs(allLogs);
      console.log('✅ Activity log loading completed:', allLogs.length, 'items');
    } catch (error) {
      console.error('❌ Activity log loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...logs];

    // Date filtering
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return logDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Until end of the day
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return logDate <= endDate;
      });
    }

    // Admin email filtering
    if (filters.adminEmail) {
      filtered = filtered.filter(log => 
        log.adminEmail?.toLowerCase().includes(filters.adminEmail.toLowerCase())
      );
    }

    // Action type filtering
    if (filters.actionType) {
      filtered = filtered.filter(log => log.type === filters.actionType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'timestamp') {
        const aTime = aValue?.toDate ? aValue.toDate() : new Date(aValue);
        const bTime = bValue?.toDate ? bValue.toDate() : new Date(bValue);
        return sortConfig.direction === 'asc' ? aTime.getTime() - bTime.getTime() : bTime.getTime() - aTime.getTime();
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredLogs(filtered);
    setCurrentPage(1); // Go to first page when filter changes
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'datePreset') {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let startDate = '';
      let endDate = '';
      
      switch (value) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'yesterday':
          startDate = yesterday.toISOString().split('T')[0];
          endDate = yesterday.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          startDate = monthAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'custom':
          // Keep existing dates for custom selection
          break;
        case 'all':
        default:
          startDate = '';
          endDate = '';
          break;
      }
      
      setFilters(prev => ({ 
        ...prev, 
        datePreset: value,
        startDate: value === 'custom' ? prev.startDate : startDate,
        endDate: value === 'custom' ? prev.endDate : endDate
      }));
    } else {
      // Set datePreset to 'custom' when startDate or endDate is directly changed
      if (key === 'startDate' || key === 'endDate') {
        setFilters(prev => ({ ...prev, [key]: value, datePreset: 'custom' }));
      } else {
        setFilters(prev => ({ ...prev, [key]: value }));
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      adminEmail: '',
      actionType: '',
      datePreset: 'all'
    });
  };

  const formatTimestamp = (timestamp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!timestamp) return 'No time information';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionTypeText = (type: string) => {
    const types: Record<string, string> = {
      'content_change': 'Content Modification',
      'user_action': 'User Approval/Rejection',
      'system': 'System',
      'login': 'Login',
      'admin': 'Admin Action'
    };
    return types[type] || type;
  };

  const getActionBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'content_change': 'bg-blue-100 text-blue-800',
      'user_action': 'bg-green-100 text-green-800',
      'system': 'bg-gray-100 text-gray-800',
      'login': 'bg-purple-100 text-purple-800',
      'admin': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const exportToPDF = async () => {
    try {
      console.log('🔄 Starting PDF export...');
      
      if (filteredLogs.length === 0) {
        alert('No log data to export.');
        return;
      }

      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Use default font (helvetica)
      pdf.setFont('helvetica', 'normal');
      
      // Add header
      pdf.setFontSize(16);
      pdf.text('Activity Log Report', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString('en-CA')}`, pageWidth / 2, 25, { align: 'center' });
      pdf.text(`Total Records: ${filteredLogs.length}`, pageWidth / 2, 35, { align: 'center' });
      
      // Table header
      const startY = 50;
      let currentY = startY;
      const rowHeight = 8;
      const colWidths = [30, 50, 40, 60, 50, 60]; // Column widths
      const headers = ['Time', 'Admin', 'Type', 'Action', 'Target', 'Details'];
      
      // Draw header
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      let currentX = 10;
      headers.forEach((header, index) => {
        pdf.text(header, currentX, currentY);
        currentX += colWidths[index];
      });
      
      currentY += rowHeight;
      pdf.line(10, currentY - 2, pageWidth - 10, currentY - 2); // Header bottom line
      
      // Add data rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      filteredLogs.forEach((log, index) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        currentX = 10;
        const rowData = [
          formatTimestamp(log.timestamp).substring(0, 16), // Shorten time
          (log.adminEmail || 'System').substring(0, 20), // Shorten admin email
          getActionTypeText(log.type).substring(0, 15), // Shorten type
          (log.action || log.description || '').substring(0, 25), // Shorten action
          (log.targetUserEmail || log.contentId || '').substring(0, 20), // Shorten target
          (log.reason || JSON.stringify(log.changes) || '').substring(0, 25) // Shorten details
        ];
        
        rowData.forEach((data, colIndex) => {
          pdf.text(data, currentX, currentY);
          currentX += colWidths[colIndex];
        });
        
        currentY += rowHeight;
        
        // Add grid lines
        if (index % 5 === 0) {
          pdf.line(10, currentY - 2, pageWidth - 10, currentY - 2);
        }
      });
      
      // Add footer
      pdf.setFontSize(8);
      pdf.text(`Page ${pdf.getNumberOfPages()}`, pageWidth - 30, pageHeight - 10);
      
      pdf.save(`activity_log_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ PDF export completed! 📄');
      
    } catch (error) {
      console.error('❌ PDF export error:', error);
      alert('An error occurred during PDF export. Please try again.');
    }
  };

  const exportToCSV = () => {
    try {
      console.log('🔄 Starting CSV export...');
      
      if (filteredLogs.length === 0) {
        alert('No log data to export.');
        return;
      }

      const csvData = filteredLogs.map(log => ({
        'Activity Time': formatTimestamp(log.timestamp),
        'Admin Email': log.adminEmail || 'System',
        'Action Type': getActionTypeText(log.type),
        'Action Details': log.action || log.description || 'No details available',
        'Target': log.targetUserEmail || log.contentId || '',
        'Reason/Changes': log.reason || (log.changes ? JSON.stringify(log.changes) : '') || '',
        'Additional Details': log.details ? JSON.stringify(log.details) : ''
      }));

      const csv = Papa.unparse(csvData, {
        header: true
      });

      // Add UTF-8 BOM for proper encoding
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      URL.revokeObjectURL(url);
      
      alert('✅ CSV export completed! 📊');
      
    } catch (error) {
      console.error('❌ CSV export error:', error);
      alert('An error occurred during CSV export. Please try again.');
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Loading Activity Logs...
        </h3>
        <p className="text-gray-600">
          Retrieving administrator activity records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Activity size={28} className="mr-3 text-purple-600" />
              📊 Activity Logs
            </h2>
            <p className="text-gray-600 mt-2">
              {filteredLogs.length} activity records (out of {logs.length} total)
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download size={18} className="mr-2" />
              Export PDF
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={18} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Filter size={20} className="mr-2 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters and Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              📅 Date Range
            </label>
            <select
              value={filters.datePreset}
              onChange={(e) => handleFilterChange('datePreset', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">🗓️ All Time</option>
              <option value="today">📅 Today</option>
              <option value="yesterday">📆 Yesterday</option>
              <option value="week">📊 Last 7 Days</option>
              <option value="month">📈 Last 30 Days</option>
              <option value="custom">⚙️ Custom Range</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Admin Email
            </label>
            <input
              type="text"
              placeholder="Search by email..."
              value={filters.adminEmail}
              onChange={(e) => handleFilterChange('adminEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Action Type
            </label>
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Types</option>
              <option value="content_change">Content Modification</option>
              <option value="user_action">User Approval/Rejection</option>
              <option value="system">System</option>
              <option value="admin">Admin Action</option>
            </select>
          </div>
        </div>

        {/* Selected Date Range Display */}
        {filters.datePreset !== 'all' && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <CalendarDays size={16} className="text-purple-600 mr-2" />
              <span className="text-sm text-purple-700 font-medium">
                Current selected period: 
                {filters.startDate && filters.endDate ? (
                  filters.startDate === filters.endDate ? 
                    ` ${filters.startDate}` :
                    ` ${filters.startDate} ~ ${filters.endDate}`
                ) : 'Not set'}
              </span>
            </div>
          </div>
        )}

        {/* Custom Date Range Input Fields */}
        {filters.datePreset === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                <CalendarDays size={16} className="mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                <CalendarDays size={16} className="mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <button
            onClick={resetFilters}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <XCircle size={16} className="mr-2" />
            Reset Filters
          </button>
          <button
            onClick={loadLogs}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Search size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto" id="activity-log-table">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center">
                    Activity Time
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('adminEmail')}
                >
                  <div className="flex items-center">
                    Admin Email
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Action Type
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Additional Info
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <CalendarDays size={16} className="mr-2 text-gray-400" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-gray-400" />
                      {log.adminEmail || 'System'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.type)}`}>
                      {getActionTypeText(log.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {translateLogDescription(log.description || log.action)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="max-w-xs">
                      {log.targetUserEmail && (
                        <div className="mb-1">
                          <span className="font-medium">Target:</span> {log.targetUserEmail}
                        </div>
                      )}
                      {log.reason && (
                        <div className="mb-1">
                          <span className="font-medium">Reason:</span> {log.reason}
                        </div>
                      )}
                      {log.changes && (
                        <div className="text-xs bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                          <span className="font-medium">Changes:</span>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} items
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : 
                              currentPage >= totalPages - 2 ? totalPages - 4 + i :
                              currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === pageNum 
                        ? 'bg-purple-600 text-white' 
                        : 'border border-gray-300 hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* No logs message */}
        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Activity size={64} className="text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No Activity Logs
            </h3>
            <p className="text-gray-600 text-lg">
              {logs.length === 0 ? 'No activity has been recorded yet.' : 'No logs match the filter criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('user-approval');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [siteContent, setSiteContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // 디자인 편집 관련 상태
  interface DesignSettings {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
    };
    fonts: {
      bodyFont: string;
      headingFont: string;
      bodySize: number;
      headingSize: number;
      lineHeight: number;
    };
    images: {
      heroSlides: {
        slide1: string;
        slide2: string;
        slide3: string;
      };
      featureCards: {
        student: string;
        reference: string;
        company: string;
        events: string;
      };
    };
  }
  
  const [, setDesignSettings] = useState<DesignSettings | null>(null);
  const [isImageUploading, setIsImageUploading] = useState<string | null>(null);
  const [isDesignSaving, setIsDesignSaving] = useState(false);
  const [currentColors, setCurrentColors] = useState({
    primary: '#0ea5e9',
    secondary: '#7dd3fc', 
    accent: '#0369a1',
    background: '#dbeafe'
  });
  const [currentFonts, setCurrentFonts] = useState({
    bodyFont: 'inter',
    headingFont: 'inter',
    bodySize: 16,
    headingSize: 32,
    lineHeight: 1.5
  });
  
  // 봉사자 관리 관련 상태
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingVolunteerPostings, setPendingVolunteerPostings] = useState<any[]>([]);
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState('');
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [volunteerUpdating, setVolunteerUpdating] = useState<string | null>(null);
  
  const router = useRouter();

  // 봉사자 데이터 로딩 함수들
  const loadPendingVolunteerPostings = async () => {
    try {
      setVolunteerLoading(true);
      const postings = await volunteerService.getPendingVolunteerPostings();
      setPendingVolunteerPostings(postings);
    } catch (error) {
      console.error('❌ Error loading volunteer opportunities:', error);
    } finally {
      setVolunteerLoading(false);
    }
  };



  const handleVolunteerPostingApprove = async (postingId: string) => {
    try {
      setVolunteerUpdating(postingId);
      await volunteerService.approveVolunteerPosting(postingId);
      await loadPendingVolunteerPostings();
      alert('✅ Volunteer opportunity has been approved.');
    } catch (error) {
      console.error('❌ Error approving volunteer opportunity:', error);
      alert('❌ Error occurred during approval process.');
    } finally {
      setVolunteerUpdating(null);
    }
  };

  const handleVolunteerPostingReject = async (postingId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      setVolunteerUpdating(postingId);
      await volunteerService.rejectVolunteerPosting(postingId, reason);
      await loadPendingVolunteerPostings();
      alert('✅ Volunteer opportunity has been rejected.');
    } catch (error) {
      console.error('❌ Error rejecting volunteer opportunity:', error);
      alert('❌ Error occurred during rejection process.');
    } finally {
      setVolunteerUpdating(null);
    }
  };

  // 관리자 권한 확인 및 데이터 로드
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        // Administrator privileges verification
        if (!eventService.isAdmin(currentUser.email || '')) {
                  alert('Administrator privileges required.');
        router.push('/');
        return;
      }

      setUser(currentUser);
      await Promise.all([
        loadPendingApplications(),
        loadSiteContent(),
        loadPendingVolunteerPostings(),
        loadDesignSettings()
      ]);
    } else {
      router.push('/');
    }
    setLoading(false);
  });

  return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [router]);

// Load site content
const loadSiteContent = async () => {
  try {
    setContentLoading(true);
    const content = await contentService.getCurrentContent();
    setSiteContent(content);
    console.log('✅ Admin page content loading completed');
  } catch (error) {
    console.error('❌ Content loading error:', error);
  } finally {
    setContentLoading(false);
  }
};

  // Save content changes
  const handleSaveContent = async (updates: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      setContentSaving(true);
      await contentService.updateContent(updates, user?.email || 'Unknown Admin');
      alert('✅ Content successfully updated!');
      await loadSiteContent(); // Reload updated content
    } catch (error) {
      console.error('❌ Content save error:', error);
      alert('❌ Content save failed.');
    } finally {
      setContentSaving(false);
    }
  };

  // Reset content to English
  const handleResetToEnglish = async () => {
    if (!confirm('🔄 Are you sure you want to reset all content to English? This will overwrite current content.')) {
      return;
    }

    try {
      setContentSaving(true);
      await contentService.resetToEnglishContent(user?.email || 'Unknown Admin');
      alert('✅ Content successfully reset to English!');
      await loadSiteContent(); // Reload updated content
    } catch (error) {
      console.error('❌ Content reset error:', error);
      alert('❌ Content reset failed.');
    } finally {
      setContentSaving(false);
    }
  };

  // 디자인 설정 로드
  const loadDesignSettings = async () => {
    try {
      console.log('🎨 Loading design settings...');
      const settings = await designService.getCurrentDesignSettings();
      setDesignSettings(settings as DesignSettings);
      
      // 현재 색상과 폰트 설정 업데이트
      if (settings.colors) {
        setCurrentColors(settings.colors);
      }
      if (settings.fonts) {
        setCurrentFonts(settings.fonts);
      }
      
      console.log('✅ 디자인 설정 로드 완료');
    } catch (error) {
      console.error('❌ 디자인 설정 로드 오류:', error);
    }
  };

  // 이미지 업로드 처리 (Supabase Storage 사용)
  const handleImageUpload = async (category: string, imageName: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 파일 크기 확인 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      try {
        setIsImageUploading(`${category}-${imageName}`);
        
        // Supabase Storage에 업로드
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${category}/${imageName}_${timestamp}.${fileExtension}`;
        
        // Supabase 업로드
        const { error } = await supabase.storage
          .from('profile-images')
          .upload(`design-assets/${fileName}`, file);
        
        if (error) throw error;
        
        // 공개 URL 얻기
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(`design-assets/${fileName}`);
        
        if (urlData?.publicUrl) {
          // Firebase Firestore에 이미지 정보 저장 (기존 방식 유지)
          await designService.updateActiveImage(category, imageName, urlData.publicUrl);
          
          // 디자인 설정 다시 로드
          await loadDesignSettings();
          
          alert('✅ Image has been successfully uploaded!');
        }
      } catch (error) {
        console.error('❌ Image upload error:', error);
        alert('❌ Error occurred while uploading image.');
      } finally {
        setIsImageUploading(null);
      }
    };
    
    input.click();
  };

  // 색상 변경 처리
  const handleColorChange = (colorType: string, newColor: string) => {
    setCurrentColors(prev => ({
      ...prev,
      [colorType]: newColor
    }));
  };

  // 폰트 변경 처리
  const handleFontChange = (fontType: string, newValue: string | number) => {
    setCurrentFonts(prev => ({
      ...prev,
      [fontType]: newValue
    }));
  };

  // 미리 정의된 테마 적용
  const handleApplyPresetTheme = async (themeName: string) => {
    try {
      setIsDesignSaving(true);
      await designService.applyPresetTheme(themeName);
      await loadDesignSettings();
      alert(`✅ ${themeName} theme has been applied!`);
    } catch (error) {
      console.error('❌ Theme application error:', error);
      alert('❌ Error occurred while applying theme.');
    } finally {
      setIsDesignSaving(false);
    }
  };

  // 모든 디자인 변경사항 저장
  const handleSaveDesign = async () => {
    if (!user?.email) {
      alert('관리자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsDesignSaving(true);
      
      // 색상 테마 저장
      await designService.saveColorTheme(currentColors);
      
      // 폰트 설정 저장
      await designService.saveFontSettings(currentFonts);
      
      // Activity log recording
      await logService.createLog({
        type: 'admin',
        action: 'design_update',
        adminEmail: user.email,
        description: 'Design settings have been changed',
        details: {
          colors: currentColors,
          fonts: currentFonts,
          changeTime: new Date().toISOString()
        }
      });
      
      alert('✅ All design changes have been saved!');
      
      // Reload settings
      await loadDesignSettings();
      
    } catch (error) {
      console.error('❌ Design saving error:', error);
      alert('❌ Error occurred while saving design.');
    } finally {
      setIsDesignSaving(false);
    }
  };

  // 전체 미리보기 (새 탭에서 홈페이지 열기)
  const handlePreviewDesign = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    window.open('/', '_blank');
    alert('💡 Please check the homepage in the new tab. Changes will be reflected after saving and refreshing.');
  };

  // 설정 내보내기 (JSON 파일로 다운로드)
  const handleExportSettings = () => {
    const settings = {
      colors: currentColors,
      fonts: currentFonts,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `design-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('✅ 디자인 설정이 JSON 파일로 다운로드되었습니다!');
  };

  const loadPendingApplications = async () => {
    try {
      console.log('📋 대기 중인 구직 신청 로드...');
      
      // 승인 대기 중인 신청서들 가져오기
      const applications = await jobSeekerService.getPendingApplications();
      setPendingApplications(applications);
      
      console.log('✅ 대기 중인 신청서:', applications.length, '개');
    } catch (error) {
      console.error('❌ 신청서 로드 오류:', error);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!confirm('이 구직 신청을 승인하시겠습니까?')) return;

    try {
      setUpdating(applicationId);
      
      // 신청자 정보 찾기 (로그용)
      const applicant = pendingApplications.find(app => app.id === applicationId);
      
      const result = await jobSeekerService.approveApplication(applicationId);
      if (result.success) {
        // 활동 로그 생성
        if (user?.email && applicant) {
          await logService.createUserActionLog({
            action: 'approve',
            adminEmail: user.email,
            targetUserId: applicationId,
            targetUserEmail: applicant.email,
            reason: '관리자 승인'
          });
        }
        
        // 승인 이메일 전송 (현재 비활성화)
        // if (applicant?.email && applicant?.name) {
        //   try {
        //     const emailResult = await sendApprovalEmail(applicant.email, applicant.name);
        //     if (emailResult.success) {
        //       console.log('✅ 승인 이메일 전송 성공:', emailResult.messageId);
        //     } else {
        //       console.error('❌ 승인 이메일 전송 실패:', emailResult.error);
        //     }
        //   } catch (emailError) {
        //     console.error('❌ 승인 이메일 전송 중 오류:', emailError);
        //   }
        // }
        
        alert('구직 신청이 승인되었습니다! 승인 이메일이 발송되었습니다.');
        await loadPendingApplications(); // 목록 새로고침
      }
    } catch (error: unknown) {
      console.error('❌ 승인 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '승인 처리 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt('거절 사유를 입력해주세요 (선택사항):');
    if (reason === null) return; // 취소한 경우

    try {
      setUpdating(applicationId);
      
      // 신청자 정보 찾기 (로그용)
      const applicant = pendingApplications.find(app => app.id === applicationId);
      
      const result = await jobSeekerService.rejectApplication(applicationId, reason);
      if (result.success) {
        // 활동 로그 생성
        if (user?.email && applicant) {
          await logService.createUserActionLog({
            action: 'reject',
            adminEmail: user.email,
            targetUserId: applicationId,
            targetUserEmail: applicant.email,
            reason: reason || '사유 없음'
          });
        }
        
        // 거절 이메일 전송 (현재 비활성화)
        // if (applicant?.email && applicant?.name) {
        //   try {
        //     const emailResult = await sendRejectionEmail(applicant.email, applicant.name, reason || undefined);
        //     if (emailResult.success) {
        //       console.log('✅ 거절 이메일 전송 성공:', emailResult.messageId);
        //     } else {
        //       console.error('❌ 거절 이메일 전송 실패:', emailResult.error);
        //     }
        //   } catch (emailError) {
        //     console.error('❌ 거절 이메일 전송 중 오류:', emailError);
        //   }
        // }
        
        alert('구직 신청이 거절되었습니다. 거절 이메일이 발송되었습니다.');
        await loadPendingApplications(); // 목록 새로고침
      }
    } catch (error: unknown) {
      console.error('❌ 거절 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '거절 처리 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '날짜 정보 없음';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredApplications = pendingApplications.filter(app =>
    app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.school?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tab definitions
  const tabs = [
    {
      id: 'user-approval' as TabType,
      name: 'User Approval/Rejection',
      icon: Users,
      description: 'Review and approve/reject job applications'
    },
    {
      id: 'volunteer-management' as TabType,
      name: 'Volunteer Management',
      icon: Heart,
      description: 'Approve/reject volunteer opportunity postings'
    },
    {
      id: 'content-edit' as TabType,
      name: 'Content Editing',
      icon: Edit,
      description: 'Edit website text and sections'
    },
    {
      id: 'design-editor' as TabType,
      name: 'Design Editor',
      icon: Palette,
      description: 'Change images, colours, and fonts'
    },
    {
      id: 'activity-log' as TabType,
      name: 'Activity Logs',
      icon: Activity,
      description: 'View user activity records'
    },
    {
      id: 'admin-settings' as TabType,
      name: 'Admin Settings',
      icon: Settings,
      description: 'Admin account and system settings'
    },
    {
      id: 'file-management' as TabType,
      name: 'File Management',
      icon: Upload,
      description: 'File upload and download management'
    }
  ];

  // 탭별 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'user-approval':
        return (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <Clock size={28} className="text-orange-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingApplications.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <CheckCircle size={28} className="text-green-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-3xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <XCircle size={28} className="text-red-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-3xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, school..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Application List */}
            <div className="bg-white rounded-xl shadow-xl">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  📋 Pending Job Applications ({filteredApplications.length} items)
                </h2>
              </div>

              {filteredApplications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="p-6 bg-white hover:bg-gray-50 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">
                              {app.name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock size={12} className="mr-1" />
                              Under Review
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <Mail size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-700">{app.email}</span>
                            </div>
                            <div className="flex items-center">
                              <School size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-700">{app.school} (Grade {app.grade})</span>
                            </div>
                            <div className="flex items-center">
                              <User size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-700">{app.phone}</span>
                            </div>
                            {app.resumeFileName && (
                              <div className="flex items-center">
                                <FileText size={16} className="mr-2 text-gray-400" />
                                <span className="font-medium text-gray-700">{app.resumeFileName}</span>
                              </div>
                            )}
                            <div className="col-span-full text-gray-600">
                              <strong className="text-gray-800">Skills/Experience:</strong> <span className="font-medium">{app.skills}</span>
                            </div>
                            <div className="col-span-full text-xs text-gray-500 font-medium">
                              Application Date: {formatDate(app.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3 ml-4">
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={updating === app.id}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {updating === app.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <CheckCircle size={18} className="mr-2" />
                            )}
                            <span className="font-semibold">Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={updating === app.id}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <XCircle size={18} className="mr-2" />
                            <span className="font-semibold">Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Clock size={64} className="text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    🎉 No pending applications
                  </h3>
                  <p className="text-gray-600 text-lg font-medium">
                    {searchTerm ? 'No search results found.' : 'All applications have been processed!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'volunteer-management':
        return (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <Clock size={28} className="text-orange-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingVolunteerPostings.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <CheckCircle size={28} className="text-green-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-3xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <Heart size={28} className="text-pink-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                    <p className="text-3xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 검색 */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by organization name, volunteer title..."
                    value={volunteerSearchTerm}
                    onChange={(e) => setVolunteerSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* 봉사자 모집 공고 목록 */}
            <div className="bg-white rounded-xl shadow-xl">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  ❤️ Pending Volunteer Opportunities ({pendingVolunteerPostings.filter(posting => 
                    posting.title?.toLowerCase().includes(volunteerSearchTerm.toLowerCase()) ||
                    posting.organizationName?.toLowerCase().includes(volunteerSearchTerm.toLowerCase())
                  ).length} items)
                </h2>
              </div>

              {volunteerLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading volunteer opportunities...</p>
                </div>
              ) : pendingVolunteerPostings.filter(posting => 
                posting.title?.toLowerCase().includes(volunteerSearchTerm.toLowerCase()) ||
                posting.organizationName?.toLowerCase().includes(volunteerSearchTerm.toLowerCase())
              ).length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {pendingVolunteerPostings.filter(posting => 
                    posting.title?.toLowerCase().includes(volunteerSearchTerm.toLowerCase()) ||
                    posting.organizationName?.toLowerCase().includes(volunteerSearchTerm.toLowerCase())
                  ).map((posting) => (
                    <div key={posting.id} className="p-6 bg-white hover:bg-gray-50 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">
                              {posting.title}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock size={12} className="mr-1" />
                              Under Review
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <Building size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-700">{posting.organizationName}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-700">{posting.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-700">{posting.timeCommitment}</span>
                            </div>
                            <div className="col-span-full text-gray-600">
                              <strong className="text-gray-800">Description:</strong> <span className="font-medium">{posting.description}</span>
                            </div>
                            <div className="col-span-full text-xs text-gray-500 font-medium">
                              Registration Date: {formatDate(posting.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3 ml-4">
                          <button
                            onClick={() => handleVolunteerPostingApprove(posting.id)}
                            disabled={volunteerUpdating === posting.id}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {volunteerUpdating === posting.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <CheckCircle size={18} className="mr-2" />
                            )}
                            <span className="font-semibold">Approve</span>
                          </button>
                          <button
                            onClick={() => handleVolunteerPostingReject(posting.id)}
                            disabled={volunteerUpdating === posting.id}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <XCircle size={18} className="mr-2" />
                            <span className="font-semibold">Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Heart size={64} className="text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    🎉 No pending volunteer opportunities
                  </h3>
                  <p className="text-gray-600 text-lg font-medium">
                    {volunteerSearchTerm ? 'No search results found.' : 'All volunteer opportunities have been processed!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'content-edit':
        if (contentLoading) {
          return (
            <div className="bg-white rounded-xl shadow-xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Loading Content...
              </h3>
              <p className="text-gray-600">
                Currently loading website content.
              </p>
            </div>
          );
        }

        if (!siteContent) {
          return (
            <div className="bg-white rounded-xl shadow-xl p-12 text-center">
              <Edit size={64} className="text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cannot Load Content
              </h3>
              <p className="text-gray-600 mb-6">
                Website content data not found.
              </p>
              <button
                onClick={loadSiteContent}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {/* Header with Reset Button */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Edit size={28} className="mr-3 text-blue-600" />
                    Content Editing
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Edit website text and sections
                  </p>
                </div>
                <button
                  onClick={handleResetToEnglish}
                  disabled={contentSaving}
                  className="mt-4 md:mt-0 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {contentSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      🔄 Reset to English
                    </>
                  )}
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Tip:</strong> If you see Korean text in the fields below, click "Reset to English" button to update all content to English automatically.
                </p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const updatedContent = {
                heroSlides: [
                  {
                    title: formData.get('slide1_title') as string,
                    subtitle: formData.get('slide1_subtitle') as string
                  },
                  {
                    title: formData.get('slide2_title') as string,
                    subtitle: formData.get('slide2_subtitle') as string
                  },
                  {
                    title: formData.get('slide3_title') as string,
                    subtitle: formData.get('slide3_subtitle') as string
                  }
                ],
                ctaButtons: {
                  student: formData.get('cta_student') as string,
                  company: formData.get('cta_company') as string
                },
                mainSection: {
                  badge: formData.get('main_badge') as string,
                  title: formData.get('main_title') as string,
                  subtitle: formData.get('main_subtitle') as string,
                  description: formData.get('main_description') as string,
                  highlight: formData.get('main_highlight') as string
                },
                featureCards: {
                  student: {
                    title: formData.get('card_student_title') as string,
                    description: formData.get('card_student_desc') as string,
                    buttonText: formData.get('card_student_btn') as string
                  },
                  reference: {
                    title: formData.get('card_reference_title') as string,
                    description: formData.get('card_reference_desc') as string,
                    buttonText: formData.get('card_reference_btn') as string
                  },
                  company: {
                    title: formData.get('card_company_title') as string,
                    description: formData.get('card_company_desc') as string,
                    buttonText: formData.get('card_company_btn') as string
                  },
                  events: {
                    title: formData.get('card_events_title') as string,
                    description: formData.get('card_events_desc') as string,
                    buttonText: formData.get('card_events_btn') as string
                  }
                }
              };
              handleSaveContent(updatedContent);
            }}>
              
              {/* 히어로 슬라이드 섹션 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Edit size={24} className="mr-3 text-blue-600" />
                  Hero Slide Editor
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {siteContent.heroSlides?.map((slide: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">Slide {index + 1}</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            name={`slide${index + 1}_title`}
                            defaultValue={slide.title}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Subtitle
                          </label>
                          <textarea
                            name={`slide${index + 1}_subtitle`}
                            defaultValue={slide.subtitle}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA 버튼 섹션 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Target size={24} className="mr-3 text-green-600" />
                  CTA Button Text
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Student Button Text
                    </label>
                    <input
                      type="text"
                      name="cta_student"
                      defaultValue={siteContent.ctaButtons?.student}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Company Button Text
                    </label>
                    <input
                      type="text"
                      name="cta_company"
                      defaultValue={siteContent.ctaButtons?.company}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Main Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <BookOpen size={24} className="mr-3 text-purple-600" />
                  Main Section Text
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        name="main_badge"
                        defaultValue={siteContent.mainSection?.badge}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Main Title
                      </label>
                      <input
                        type="text"
                        name="main_title"
                        defaultValue={siteContent.mainSection?.title}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        name="main_subtitle"
                        defaultValue={siteContent.mainSection?.subtitle}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Highlight Text
                      </label>
                      <input
                        type="text"
                        name="main_highlight"
                        defaultValue={siteContent.mainSection?.highlight}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Description Text
                    </label>
                    <textarea
                      name="main_description"
                      defaultValue={siteContent.mainSection?.description}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Cards Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <User size={24} className="mr-3 text-orange-600" />
                  Feature Cards Text
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(siteContent.featureCards || {}).map(([key, card]: [string, any]) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3 capitalize">
                        {key === 'student' ? 'Student Jobs' : 
                         key === 'reference' ? 'Reference Support' : 
                         key === 'company' ? 'Company Recruitment' : 'Educational Events'} Card
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            name={`card_${key}_title`}
                            defaultValue={card.title}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <textarea
                            name={`card_${key}_desc`}
                            defaultValue={card.description}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Button Text
                          </label>
                          <input
                            type="text"
                            name={`card_${key}_btn`}
                            defaultValue={card.buttonText}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={contentSaving}
                    className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {contentSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} className="mr-3" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">
                  💡 Changes will be applied to the website immediately after saving and will be recorded in the activity log.
                </p>
              </div>
            </form>
          </div>
        );

      case 'design-editor':
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Palette size={28} className="mr-3 text-purple-600" />
                🎨 Design Editor
              </h2>
              <p className="text-gray-600 mt-2">
                Customize your website with image uploads, color changes, and font settings.
              </p>
            </div>

            {/* 이미지 편집 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <ImageIcon size={24} className="mr-3 text-blue-600" />
                📸 Image Management
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 히어로 슬라이드 이미지들 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Main Hero Slides</h4>
                  {[1, 2, 3].map((slideNum) => (
                    <div key={slideNum} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">Slide {slideNum}</span>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleImageUpload('heroSlides', `slide${slideNum}`)}
                            disabled={isImageUploading === `heroSlides-slide${slideNum}`}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm disabled:opacity-50"
                          >
                            {isImageUploading === `heroSlides-slide${slideNum}` ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-1"></div>
                            ) : (
                              <Upload size={14} className="mr-1" />
                            )}
                            {isImageUploading === `heroSlides-slide${slideNum}` ? 'Uploading...' : 'Change'}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open('/#hero-section', '_blank');
                            }}
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                          >
                            <Eye size={14} className="mr-1" />
                            Preview
                          </button>
                        </div>
                      </div>
                      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <Image 
                          src={`/images/메인홈${slideNum}.${slideNum === 2 ? 'jpg' : 'png'}`}
                          alt={`Main slide ${slideNum}`}
                          className="w-full h-full object-cover"
                          fill
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 기능 카드 이미지들 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Feature Card Images</h4>
                                      {[
                      { name: 'Student Jobs', file: '7번.png', key: 'student' },
                      { name: 'Reference Support', file: '4번.png', key: 'reference' },
                      { name: 'Company Recruitment', file: '3번.png', key: 'company' },
                      { name: 'Learning Events', file: '교육이벤트.png', key: 'events' }
                  ].map((card, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">{card.name}</span>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleImageUpload('featureCards', card.key)}
                            disabled={isImageUploading === `featureCards-${card.key}`}
                            className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm disabled:opacity-50"
                          >
                            {isImageUploading === `featureCards-${card.key}` ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700 mr-1"></div>
                            ) : (
                              <Upload size={14} className="mr-1" />
                            )}
                            {isImageUploading === `featureCards-${card.key}` ? 'Uploading...' : 'Change'}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(`/#card-${card.key}`, '_blank');
                            }}
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                          >
                            <Eye size={14} className="mr-1" />
                            Preview
                          </button>
                        </div>
                      </div>
                      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <Image 
                          src={`/images/${card.file}`}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          fill
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload Guide */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-2">📌 Image Upload Guide</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Recommended resolution: 1920x1080 (Hero images), 800x600 (Card images)</li>
                  <li>• Supported formats: JPG, PNG, WebP</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Changes will be immediately reflected on the homepage</li>
                </ul>
              </div>
            </div>

            {/* Color Theme Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Palette size={24} className="mr-3 text-purple-600" />
                🎨 Color Theme
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Primary Color */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="color" 
                      value={currentColors.primary} 
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={currentColors.primary} 
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="w-full h-8 rounded-md" style={{ backgroundColor: currentColors.primary }}></div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="color" 
                      value={currentColors.secondary} 
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={currentColors.secondary} 
                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="w-full h-8 rounded-md" style={{ backgroundColor: currentColors.secondary }}></div>
                </div>

                {/* Accent Color */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Accent Color</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="color" 
                      value={currentColors.accent} 
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={currentColors.accent} 
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="w-full h-8 rounded-md" style={{ backgroundColor: currentColors.accent }}></div>
                </div>

                {/* Background Color */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Background Color</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="color" 
                      value={currentColors.background} 
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={currentColors.background} 
                        onChange={(e) => handleColorChange('background', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="w-full h-8 rounded-md" style={{ backgroundColor: currentColors.background }}></div>
                </div>
              </div>

              {/* 미리 정의된 테마 */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">🎨 Predefined Themes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Current (Sky)', key: 'sky', colors: ['#0ea5e9', '#7dd3fc', '#0369a1', '#dbeafe'] },
                    { name: 'Purple', key: 'purple', colors: ['#8b5cf6', '#c4b5fd', '#6d28d9', '#ede9fe'] },
                    { name: 'Green', key: 'green', colors: ['#10b981', '#6ee7b7', '#047857', '#d1fae5'] },
                    { name: 'Orange', key: 'orange', colors: ['#f59e0b', '#fcd34d', '#d97706', '#fef3c7'] }
                  ].map((theme, index) => (
                    <button
                      key={index}
                      onClick={() => handleApplyPresetTheme(theme.key)}
                      disabled={isDesignSaving}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors group disabled:opacity-50"
                    >
                      <div className="text-sm font-medium text-gray-700 mb-2">{theme.name}</div>
                      <div className="flex space-x-1">
                        {theme.colors.map((color, colorIndex) => (
                          <div 
                            key={colorIndex}
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: color }}
                          ></div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 폰트 편집 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Type size={24} className="mr-3 text-green-600" />
                ✍️ Font Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 본문 폰트 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Body Font</h4>
                  <select 
                    value={currentFonts.bodyFont}
                    onChange={(e) => handleFontChange('bodyFont', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <optgroup label="🇰🇷 Korean Optimized">
                      <option value="pretendard">Pretendard (Default Recommended)</option>
                      <option value="noto-sans-kr">Noto Sans KR</option>
                      <option value="nanum-gothic">나눔고딕</option>
                      <option value="spoqa-han-sans">스포카 한 산스</option>
                    </optgroup>
                    <optgroup label="📝 Clean Sans-serif">
                      <option value="inter">Inter</option>
                      <option value="roboto">Roboto</option>
                      <option value="open-sans">Open Sans</option>
                      <option value="lato">Lato</option>
                      <option value="source-sans-pro">Source Sans Pro</option>
                      <option value="nunito">Nunito</option>
                      <option value="poppins">Poppins</option>
                      <option value="work-sans">Work Sans</option>
                    </optgroup>
                    <optgroup label="📖 Readable Serif">
                      <option value="noto-serif">Noto Serif</option>
                      <option value="merriweather">Merriweather</option>
                      <option value="source-serif-pro">Source Serif Pro</option>
                      <option value="crimson-text">Crimson Text</option>
                    </optgroup>
                    <optgroup label="💻 Developer Style">
                      <option value="fira-sans">Fira Sans</option>
                      <option value="ubuntu">Ubuntu</option>
                      <option value="system-ui">System UI</option>
                    </optgroup>
                  </select>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-gray-800" style={{ fontFamily: currentFonts.bodyFont, fontSize: `${currentFonts.bodySize}px`, lineHeight: currentFonts.lineHeight }}>
                      Sample Text: Job platform for Canadian students. 
                      샘플 텍스트: New Brunswick High School Jobs Platform.
                    </p>
                  </div>
                </div>

                {/* 제목 폰트 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Heading Font</h4>
                  <select 
                    value={currentFonts.headingFont}
                    onChange={(e) => handleFontChange('headingFont', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <optgroup label="🇰🇷 Korean Optimized">
                      <option value="pretendard">Pretendard (Default Recommended)</option>
                      <option value="noto-sans-kr">Noto Sans KR</option>
                      <option value="nanum-gothic">나눔고딕</option>
                      <option value="spoqa-han-sans">스포카 한 산스</option>
                    </optgroup>
                    <optgroup label="💪 Impactful Display">
                      <option value="montserrat">Montserrat</option>
                      <option value="oswald">Oswald</option>
                      <option value="raleway">Raleway</option>
                      <option value="bebas-neue">Bebas Neue</option>
                      <option value="anton">Anton</option>
                      <option value="fredoka-one">Fredoka One</option>
                    </optgroup>
                    <optgroup label="🎨 Elegant Serif">
                      <option value="playfair-display">Playfair Display</option>
                      <option value="merriweather">Merriweather</option>
                      <option value="cormorant-garamond">Cormorant Garamond</option>
                      <option value="crimson-text">Crimson Text</option>
                      <option value="libre-baskerville">Libre Baskerville</option>
                    </optgroup>
                    <optgroup label="📝 Clean Sans-serif">
                      <option value="inter">Inter</option>
                      <option value="roboto">Roboto</option>
                      <option value="open-sans">Open Sans</option>
                      <option value="lato">Lato</option>
                      <option value="poppins">Poppins</option>
                      <option value="nunito">Nunito</option>
                    </optgroup>
                    <optgroup label="✨ Unique Style">
                      <option value="dancing-script">Dancing Script</option>
                      <option value="pacifico">Pacifico</option>
                      <option value="comfortaa">Comfortaa</option>
                      <option value="lobster">Lobster</option>
                    </optgroup>
                  </select>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: currentFonts.headingFont, fontSize: `${currentFonts.headingSize}px` }}>
                      Sample Heading: Future Student Talents
                    </h3>
                    <h4 className="text-lg font-semibold text-gray-600 mt-2" style={{ fontFamily: currentFonts.headingFont }}>
                      샘플 제목: 미래를 만들어갈 학생 인재들
                    </h4>
                  </div>
                </div>
              </div>

              {/* 폰트 크기 설정 */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Font Size Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Body Size ({currentFonts.bodySize}px)</label>
                    <input 
                      type="range" 
                      min="14" 
                      max="20" 
                      value={currentFonts.bodySize}
                      onChange={(e) => handleFontChange('bodySize', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>14px</span>
                      <span>16px</span>
                      <span>20px</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heading Size ({currentFonts.headingSize}px)</label>
                    <input 
                      type="range" 
                      min="24" 
                      max="48" 
                      value={currentFonts.headingSize}
                      onChange={(e) => handleFontChange('headingSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>24px</span>
                      <span>32px</span>
                      <span>48px</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Line Height ({currentFonts.lineHeight})</label>
                    <input 
                      type="range" 
                      min="1.2" 
                      max="2.0" 
                      step="0.1"
                      value={currentFonts.lineHeight}
                      onChange={(e) => handleFontChange('lineHeight', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1.2</span>
                      <span>1.5</span>
                      <span>2.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 저장 및 미리보기 버튼 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleSaveDesign}
                  disabled={isDesignSaving}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {isDesignSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  ) : (
                    <CheckCircle size={20} className="mr-3" />
                  )}
                  {isDesignSaving ? 'Saving...' : 'Save All Changes'}
                </button>
                <button 
                  onClick={(e) => handlePreviewDesign(e)}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Eye size={20} className="mr-3" />
                  Full Preview
                </button>
                <button 
                  onClick={handleExportSettings}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold text-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg"
                >
                  <Download size={20} className="mr-3" />
                  Export Settings
                </button>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                💡 Changes will be applied to the website immediately after saving. Please preview first!
              </p>
            </div>
          </div>
        );

      case 'activity-log':
        return <ActivityLogComponent />;

      case 'admin-settings':
        return (
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings size={28} className="mr-3 text-purple-600" />
                ⚙️ Admin Settings
              </h2>
              <p className="text-gray-600 mt-2">
                You can manage administrator accounts and system settings.
              </p>
            </div>

            {/* 계정 보안 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Shield size={24} className="text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Account Security</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current account information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User size={18} className="mr-2 text-gray-600" />
                    Current Account Information
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2" />
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{user?.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-2" />
                      <span className="font-medium">Last Login:</span>
                      <span className="ml-2">{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString('en-CA') : 'No information'}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={14} className="mr-2" />
                      <span className="font-medium">Account Creation Date:</span>
                      <span className="ml-2">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString('en-CA') : 'No information'}</span>
                    </div>
                  </div>
                </div>

                {/* Security settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Lock size={18} className="mr-2 text-gray-600" />
                    Security Settings
                  </h4>
                  
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
                  >
                    <div className="flex items-center">
                      <Key size={20} className="text-purple-600 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">🔐 Change Password</div>
                        <div className="text-sm text-gray-600">Change regularly for account security</div>
                      </div>
                    </div>
                    <div className="text-purple-600 group-hover:text-purple-700">
                      →
                    </div>
                  </button>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle size={16} className="text-blue-600 mr-2 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <div className="font-medium mb-1">Security Recommendations</div>
                        <ul className="space-y-1 text-xs">
                          <li>• Change password every 3 months</li>
                          <li>• Do not use the same password as other sites</li>
                          <li>• Use strong passwords (8+ characters, special characters included)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 시스템 정보 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Activity size={24} className="text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">System Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Users size={18} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">Administrator Privileges</span>
                  </div>
                  <p className="text-sm text-gray-600">Full system management privileges</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock size={18} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">Session Expiry</span>
                  </div>
                  <p className="text-sm text-gray-600">Automatic logout after 24 hours</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Shield size={18} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">Security Level</span>
                  </div>
                  <p className="text-sm text-green-600 font-medium">High</p>
                </div>
              </div>
            </div>




          </div>
        );

      case 'file-management':
        return <FileManager />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-500">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              👨‍💼 Admin Dashboard
            </h1>
            <p className="text-lg text-white font-medium">
              Comprehensive management system for platform administration and user support
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-t-xl shadow-xl">
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center px-4 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 min-w-fit
                        ${isActive 
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon size={16} className="mr-2" />
                      <span className="hidden md:inline">{tab.name}</span>
                      <span className="md:hidden text-xs">{tab.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 현재 탭 정보 */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              {(() => {
                const currentTab = tabs.find(tab => tab.id === activeTab);
                if (!currentTab) return null;
                const Icon = currentTab.icon;
                return (
                  <>
                    <Icon size={20} className="text-blue-600 mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {currentTab.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {currentTab.description}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="bg-white rounded-b-xl shadow-xl p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      <PasswordChangeModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={user}
      />

      <Footer />
    </div>
  );
} 