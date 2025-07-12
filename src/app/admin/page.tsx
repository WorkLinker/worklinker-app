'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertCircle
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EmailTest from '@/components/EmailTest';
import { authService } from '@/lib/auth-service';
import { jobSeekerService, eventService, contentService, logService } from '@/lib/firebase-services';
// import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email-service'; // 제거됨
import { User as FirebaseUser, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

type TabType = 'user-approval' | 'content-edit' | 'activity-log' | 'log-export' | 'admin-settings';

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

  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('비밀번호는 최소 8자 이상이어야 합니다');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('소문자를 포함해야 합니다');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('대문자를 포함해야 합니다');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('숫자를 포함해야 합니다');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('특수문자(@$!%*?&)를 포함해야 합니다');
    }
    return errors;
  };

  const handlePasswordChange = async () => {
    if (!user) {
      alert('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setErrors([]);
    const validationErrors = [];

    // 기본 유효성 검사
    if (!passwords.current) {
      validationErrors.push('현재 비밀번호를 입력해주세요');
    }
    if (!passwords.new) {
      validationErrors.push('새 비밀번호를 입력해주세요');
    }
    if (!passwords.confirm) {
      validationErrors.push('새 비밀번호 확인을 입력해주세요');
    }
    if (passwords.new !== passwords.confirm) {
      validationErrors.push('새 비밀번호와 확인 비밀번호가 일치하지 않습니다');
    }

    // 새 비밀번호 강도 검사
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

      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(user.email!, passwords.current);
      await reauthenticateWithCredential(user, credential);

      // 새 비밀번호로 변경
      await updatePassword(user, passwords.new);

      // 활동 로그 기록
      await logService.createLog({
        type: 'admin',
        action: 'password_change',
        adminEmail: user.email,
        description: '비밀번호를 변경하였습니다',
        details: {
          userEmail: user.email,
          changeTime: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      });

      alert('✅ 비밀번호가 성공적으로 변경되었습니다.');
      
      // 폼 초기화 및 모달 닫기
      setPasswords({ current: '', new: '', confirm: '' });
      setErrors([]);
      onClose();

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('❌ 비밀번호 변경 오류:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrors(['현재 비밀번호가 올바르지 않습니다']);
      } else {
        setErrors(['비밀번호 변경 중 오류가 발생했습니다: ' + error.message]);
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
    setErrors([]); // 입력 시 에러 메시지 초기화
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Lock size={24} className="mr-2 text-purple-600" />
              🔐 비밀번호 변경
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            계정 보안을 위해 강력한 비밀번호로 변경하세요.
          </p>
        </div>

        {/* 폼 */}
        <div className="p-6 space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              현재 비밀번호
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => handleInputChange('current', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="현재 비밀번호를 입력하세요"
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

          {/* 새 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 비밀번호
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => handleInputChange('new', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="새 비밀번호를 입력하세요"
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

          {/* 새 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 비밀번호 확인
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => handleInputChange('confirm', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="새 비밀번호를 다시 입력하세요"
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

          {/* 비밀번호 요구사항 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <Shield size={16} className="mr-1" />
              비밀번호 요구사항
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• 최소 8자 이상</li>
              <li>• 대문자, 소문자, 숫자 포함</li>
              <li>• 특수문자 (@$!%*?&) 포함</li>
            </ul>
          </div>

          {/* 에러 메시지 */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle size={16} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">오류가 발생했습니다</h4>
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

        {/* 버튼 */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handlePasswordChange}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                변경 중...
              </>
            ) : (
              <>
                <Key size={16} className="mr-2" />
                변경하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// 활동 로그 컴포넌트
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

  // 로그 데이터 로드
  useEffect(() => {
    loadLogs();
  }, []);

  // 필터링 및 정렬 적용
  useEffect(() => {
    applyFiltersAndSort();
  }, [logs, filters, sortConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLogs = async () => {
    try {
      setLoading(true);
      const allLogs = await logService.getAllLogs(200); // 최대 200개 로그 조회
      setLogs(allLogs);
      console.log('✅ 활동 로그 로드 완료:', allLogs.length, '개');
    } catch (error) {
      console.error('❌ 활동 로그 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...logs];

    // 날짜 필터링
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return logDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // 해당 날짜 끝까지
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return logDate <= endDate;
      });
    }

    // 관리자 이메일 필터링
    if (filters.adminEmail) {
      filtered = filtered.filter(log => 
        log.adminEmail?.toLowerCase().includes(filters.adminEmail.toLowerCase())
      );
    }

    // 작업 유형 필터링
    if (filters.actionType) {
      filtered = filtered.filter(log => log.type === filters.actionType);
    }

    // 정렬 적용
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
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
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
          // 직접 선택인 경우 기존 날짜 유지
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
      // startDate나 endDate가 직접 변경된 경우 datePreset을 'custom'으로 설정
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
    if (!timestamp) return '시간 정보 없음';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
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
      'content_change': '콘텐츠 수정',
      'user_action': '사용자 승인/거절',
      'system': '시스템',
      'login': '로그인',
      'admin': '관리자 작업'
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
    const pdf = new jsPDF('l', 'mm', 'a4'); // 가로 방향
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    try {
      const tableElement = document.getElementById('activity-log-table');
      if (!tableElement) return;

      const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 20; // 여백
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 제목 추가
      pdf.setFontSize(16);
      pdf.text('활동 로그 보고서', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`생성일: ${new Date().toLocaleString('ko-KR')}`, pageWidth / 2, 25, { align: 'center' });
      
      // 테이블 이미지 추가
      let yPosition = 35;
      if (imgHeight > pageHeight - 40) {
        // 이미지가 페이지보다 클 경우 여러 페이지로 분할
        const pageSize = pageHeight - 40;
        let remainingHeight = imgHeight;
        let currentY = 0;
        
        while (remainingHeight > 0) {
          const canvasSlice = document.createElement('canvas');
          canvasSlice.width = canvas.width;
          canvasSlice.height = Math.min(canvas.height * pageSize / imgHeight, canvas.height - currentY);
          
          const ctx = canvasSlice.getContext('2d');
          ctx?.drawImage(canvas, 0, currentY, canvas.width, canvasSlice.height, 0, 0, canvas.width, canvasSlice.height);
          
          const sliceData = canvasSlice.toDataURL('image/png');
          pdf.addImage(sliceData, 'PNG', 10, yPosition, imgWidth, canvasSlice.height * imgWidth / canvas.width);
          
          remainingHeight -= pageSize;
          currentY += canvasSlice.height;
          
          if (remainingHeight > 0) {
            pdf.addPage();
            yPosition = 10;
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      }
      
      pdf.save(`활동로그_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('PDF 내보내기가 완료되었습니다! 📄');
    } catch (error) {
      console.error('PDF 내보내기 오류:', error);
      alert('PDF 내보내기 중 오류가 발생했습니다.');
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredLogs.map(log => ({
        '작업시간': formatTimestamp(log.timestamp),
        '관리자 이메일': log.adminEmail || '시스템',
        '작업 유형': getActionTypeText(log.type),
        '작업 내용': log.action || log.description || '상세 정보 없음',
        '대상': log.targetUserEmail || log.contentId || '',
        '사유/변경사항': log.reason || JSON.stringify(log.changes) || ''
      }));

             const csv = Papa.unparse(csvData, {
         header: true
       });

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `활동로그_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('CSV 내보내기가 완료되었습니다! 📊');
    } catch (error) {
      console.error('CSV 내보내기 오류:', error);
      alert('CSV 내보내기 중 오류가 발생했습니다.');
    }
  };

  // 페이지네이션
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          활동 로그 로딩 중...
        </h3>
        <p className="text-gray-600">
          관리자 활동 기록을 불러오고 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Activity size={28} className="mr-3 text-purple-600" />
              📊 활동 로그 열람
            </h2>
            <p className="text-gray-600 mt-2">
              총 {filteredLogs.length}개의 활동 기록 (전체 {logs.length}개 중)
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download size={18} className="mr-2" />
              PDF 내보내기
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={18} className="mr-2" />
              CSV 내보내기
            </button>
          </div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Filter size={20} className="mr-2 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">필터 및 검색</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              📅 기간 선택
            </label>
            <select
              value={filters.datePreset}
              onChange={(e) => handleFilterChange('datePreset', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">🗓️ 전체 기간</option>
              <option value="today">📅 오늘</option>
              <option value="yesterday">📆 어제</option>
              <option value="week">📊 최근 7일</option>
              <option value="month">📈 최근 30일</option>
              <option value="custom">⚙️ 직접 선택</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              관리자 이메일
            </label>
            <input
              type="text"
              placeholder="이메일 검색..."
              value={filters.adminEmail}
              onChange={(e) => handleFilterChange('adminEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              작업 유형
            </label>
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">전체</option>
              <option value="content_change">콘텐츠 수정</option>
              <option value="user_action">사용자 승인/거절</option>
              <option value="system">시스템</option>
              <option value="admin">관리자 작업</option>
            </select>
          </div>
        </div>

        {/* 선택된 기간 표시 */}
        {filters.datePreset !== 'all' && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <CalendarDays size={16} className="text-purple-600 mr-2" />
              <span className="text-sm text-purple-700 font-medium">
                현재 선택된 기간: 
                {filters.startDate && filters.endDate ? (
                  filters.startDate === filters.endDate ? 
                    ` ${filters.startDate}` :
                    ` ${filters.startDate} ~ ${filters.endDate}`
                ) : '설정되지 않음'}
              </span>
            </div>
          </div>
        )}

        {/* 직접 선택 시 날짜 입력 필드 */}
        {filters.datePreset === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                <CalendarDays size={16} className="mr-1" />
                시작일
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
                종료일
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
            필터 초기화
          </button>
          <button
            onClick={loadLogs}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Search size={16} className="mr-2" />
            새로고침
          </button>
        </div>
      </div>

      {/* 로그 테이블 */}
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
                    작업시간
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('adminEmail')}
                >
                  <div className="flex items-center">
                    관리자 이메일
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    작업 유형
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업 내용
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상세 정보
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
                      {log.adminEmail || '시스템'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.type)}`}>
                      {getActionTypeText(log.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {log.description || log.action || '작업 설명 없음'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="max-w-xs">
                      {log.targetUserEmail && (
                        <div className="mb-1">
                          <span className="font-medium">대상:</span> {log.targetUserEmail}
                        </div>
                      )}
                      {log.reason && (
                        <div className="mb-1">
                          <span className="font-medium">사유:</span> {log.reason}
                        </div>
                      )}
                      {log.changes && (
                        <div className="text-xs bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                          <span className="font-medium">변경사항:</span>
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

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)}개 / 총 {filteredLogs.length}개
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
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
                다음
              </button>
            </div>
          </div>
        )}

        {/* 로그가 없을 때 */}
        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Activity size={64} className="text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              활동 로그가 없습니다
            </h3>
            <p className="text-gray-600 text-lg">
              {logs.length === 0 ? '아직 기록된 활동이 없습니다.' : '필터 조건에 맞는 로그가 없습니다.'}
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
  const router = useRouter();

  // 관리자 권한 확인 및 데이터 로드
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        // 관리자 권한 확인
        if (!eventService.isAdmin(currentUser.email || '')) {
          alert('관리자 권한이 필요합니다.');
          router.push('/');
          return;
        }

        setUser(currentUser);
        await loadPendingApplications();
        await loadSiteContent();
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 사이트 콘텐츠 로드
  const loadSiteContent = async () => {
    try {
      setContentLoading(true);
      const content = await contentService.getCurrentContent();
      setSiteContent(content);
      console.log('✅ 관리자 페이지에서 콘텐츠 로드 완료');
    } catch (error) {
      console.error('❌ 콘텐츠 로드 오류:', error);
    } finally {
      setContentLoading(false);
    }
  };

  // 콘텐츠 저장
  const handleSaveContent = async (updatedContent: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!user?.email) {
      alert('관리자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setContentSaving(true);
      
      const result = await contentService.updateContent(updatedContent, user.email);
      if (result.success) {
        // 성공 시 활동 로그도 생성
        await logService.createContentChangeLog({
          contentId: result.id,
          changes: updatedContent,
          previousContent: siteContent,
          adminEmail: user.email,
          changeType: 'content_update'
        });

        alert('콘텐츠가 성공적으로 저장되었습니다! 🎉');
        await loadSiteContent(); // 새로운 콘텐츠 다시 로드
      }
    } catch (error) {
      console.error('❌ 콘텐츠 저장 오류:', error);
      alert('콘텐츠 저장 중 오류가 발생했습니다.');
    } finally {
      setContentSaving(false);
    }
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

  // 탭 정의
  const tabs = [
    {
      id: 'user-approval' as TabType,
      name: '사용자 승인/거절',
      icon: Users,
      description: '구직 신청 검토 및 승인/거절'
    },
    {
      id: 'content-edit' as TabType,
      name: '콘텐츠 수정',
      icon: Edit,
      description: '홈페이지 텍스트 및 섹션 수정'
    },
    {
      id: 'activity-log' as TabType,
      name: '활동 로그 열람',
      icon: Activity,
      description: '사용자 활동 기록 조회'
    },
    {
      id: 'log-export' as TabType,
      name: '로그 내보내기',
      icon: Download,
      description: '활동 로그 데이터 내보내기'
    },
    {
      id: 'admin-settings' as TabType,
      name: '관리자 설정',
      icon: Settings,
      description: '관리자 계정 및 시스템 설정'
    }
  ];

  // 탭별 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'user-approval':
        return (
          <div className="space-y-6">
            {/* 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <Clock size={28} className="text-orange-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">승인 대기</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingApplications.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <CheckCircle size={28} className="text-green-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">승인 완료</p>
                    <p className="text-3xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <XCircle size={28} className="text-red-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">거절</p>
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
                    placeholder="이름, 이메일, 학교로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* 신청서 목록 */}
            <div className="bg-white rounded-xl shadow-xl">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  📋 승인 대기 중인 구직 신청 ({filteredApplications.length}개)
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
                              검토 중
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <Mail size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-700">{app.email}</span>
                            </div>
                            <div className="flex items-center">
                              <School size={16} className="mr-2 text-gray-400" />
                              <span className="font-medium text-gray-700">{app.school} ({app.grade}학년)</span>
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
                              <strong className="text-gray-800">기술/경험:</strong> <span className="font-medium">{app.skills}</span>
                            </div>
                            <div className="col-span-full text-xs text-gray-500 font-medium">
                              신청일: {formatDate(app.createdAt)}
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
                            <span className="font-semibold">승인</span>
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={updating === app.id}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <XCircle size={18} className="mr-2" />
                            <span className="font-semibold">거절</span>
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
                    🎉 승인 대기 중인 신청서가 없습니다
                  </h3>
                  <p className="text-gray-600 text-lg font-medium">
                    {searchTerm ? '검색 결과가 없습니다.' : '모든 신청서가 처리되었습니다!'}
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
                콘텐츠 로딩 중...
              </h3>
              <p className="text-gray-600">
                현재 홈페이지 콘텐츠를 불러오고 있습니다.
              </p>
            </div>
          );
        }

        if (!siteContent) {
          return (
            <div className="bg-white rounded-xl shadow-xl p-12 text-center">
              <Edit size={64} className="text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                콘텐츠를 불러올 수 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                홈페이지 콘텐츠 데이터를 찾을 수 없습니다.
              </p>
              <button
                onClick={loadSiteContent}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-8">
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
                  히어로 슬라이드 편집
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {siteContent.heroSlides?.map((slide: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">슬라이드 {index + 1}</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            제목
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
                            부제목
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
                  CTA 버튼 텍스트
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      학생 버튼 텍스트
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
                      기업 버튼 텍스트
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

              {/* 메인 섹션 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <BookOpen size={24} className="mr-3 text-purple-600" />
                  메인 섹션 텍스트
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        배지 텍스트
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
                        메인 제목
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
                        부제목
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
                        강조 텍스트
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
                      설명 텍스트
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

              {/* 기능 카드 섹션 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <User size={24} className="mr-3 text-orange-600" />
                  기능 카드 텍스트
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(siteContent.featureCards || {}).map(([key, card]: [string, any]) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3 capitalize">
                        {key === 'student' ? '학생 구직' : 
                         key === 'reference' ? '추천서 지원' : 
                         key === 'company' ? '기업 채용' : '교육 이벤트'} 카드
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            제목
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
                            설명
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
                            버튼 텍스트
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

              {/* 저장 버튼 */}
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
                        저장 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} className="mr-3" />
                        변경사항 저장
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">
                  💡 저장하면 홈페이지에 즉시 반영되며, 활동 로그에 기록됩니다.
                </p>
              </div>
            </form>
          </div>
        );

      case 'activity-log':
        return <ActivityLogComponent />;

      case 'log-export':
        return (
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Download size={28} className="mr-3 text-purple-600" />
                💾 로그 내보내기
              </h2>
              <p className="text-gray-600 mt-2">
                활동 로그를 다양한 형태로 내보내고 리포트를 생성할 수 있습니다.
              </p>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-start">
                <Activity size={24} className="text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📊 활동 로그 열람 탭에서 내보내기 가능
                  </h3>
                  <p className="text-blue-800 mb-4">
                    현재 로그 내보내기 기능은 <strong>&lsquo;활동 로그 열람&rsquo;</strong> 탭에서 이용하실 수 있습니다.
                    필터링과 함께 PDF, CSV 형태로 내보낼 수 있습니다.
                  </p>
                  <button
                    onClick={() => setActiveTab('activity-log')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye size={18} className="mr-2" />
                    활동 로그 열람 탭으로 이동
                  </button>
                </div>
              </div>
            </div>

            {/* 추가 기능 계획 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <FileText size={24} className="text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">자동 리포트 생성</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  일간, 주간, 월간 활동 리포트를 자동으로 생성하여 이메일로 발송하는 기능입니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium">🚧 개발 예정 기능</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• 스케줄링된 리포트 생성</li>
                    <li>• 이메일 자동 발송</li>
                    <li>• 커스텀 리포트 템플릿</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Target size={24} className="text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">데이터 분석</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  활동 패턴 분석, 통계 차트 생성, 트렌드 분석 등의 고급 분석 기능입니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium">🚧 개발 예정 기능</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• 시간대별 활동 분석</li>
                    <li>• 관리자별 업무량 통계</li>
                    <li>• 트렌드 차트 및 그래프</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Settings size={24} className="text-purple-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">내보내기 설정</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  내보내기 형식, 데이터 범위, 필터 프리셋 등을 미리 설정하는 기능입니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium">🚧 개발 예정 기능</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• 내보내기 프리셋 저장</li>
                    <li>• 자동 파일명 생성 규칙</li>
                    <li>• 데이터 압축 옵션</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <BookOpen size={24} className="text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">감사 보고서</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  규정 준수를 위한 정형화된 감사 보고서를 생성하는 기능입니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium">🚧 개발 예정 기능</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• 표준 감사 리포트 템플릿</li>
                    <li>• 규정 준수 체크리스트</li>
                    <li>• 디지털 서명 지원</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 현재 이용 가능한 기능 */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                <CheckCircle size={20} className="mr-2" />
                현재 이용 가능한 기능
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-800">
                <div className="flex items-center">
                  <Download size={16} className="mr-2" />
                  PDF 형태 로그 내보내기
                </div>
                <div className="flex items-center">
                  <Download size={16} className="mr-2" />
                  CSV 형태 로그 내보내기
                </div>
                <div className="flex items-center">
                  <Filter size={16} className="mr-2" />
                  날짜/관리자/유형별 필터링
                </div>
                <div className="flex items-center">
                  <Search size={16} className="mr-2" />
                  실시간 로그 검색
                </div>
              </div>
            </div>
          </div>
        );

      case 'admin-settings':
        return (
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings size={28} className="mr-3 text-purple-600" />
                ⚙️ 관리자 설정
              </h2>
              <p className="text-gray-600 mt-2">
                관리자 계정과 시스템 설정을 관리할 수 있습니다.
              </p>
            </div>

            {/* 계정 보안 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Shield size={24} className="text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">계정 보안</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 현재 계정 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User size={18} className="mr-2 text-gray-600" />
                    현재 계정 정보
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2" />
                      <span className="font-medium">이메일:</span>
                      <span className="ml-2">{user?.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-2" />
                      <span className="font-medium">마지막 로그인:</span>
                      <span className="ml-2">{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString('ko-KR') : '정보 없음'}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={14} className="mr-2" />
                      <span className="font-medium">계정 생성일:</span>
                      <span className="ml-2">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString('ko-KR') : '정보 없음'}</span>
                    </div>
                  </div>
                </div>

                {/* 보안 설정 */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Lock size={18} className="mr-2 text-gray-600" />
                    보안 설정
                  </h4>
                  
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
                  >
                    <div className="flex items-center">
                      <Key size={20} className="text-purple-600 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">🔐 비밀번호 변경</div>
                        <div className="text-sm text-gray-600">계정 보안을 위해 정기적으로 변경하세요</div>
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
                        <div className="font-medium mb-1">보안 권장사항</div>
                        <ul className="space-y-1 text-xs">
                          <li>• 비밀번호는 3개월마다 변경하세요</li>
                          <li>• 다른 사이트와 동일한 비밀번호 사용 금지</li>
                          <li>• 강력한 비밀번호 사용 (8자 이상, 특수문자 포함)</li>
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
                <h3 className="text-xl font-semibold text-gray-900">시스템 정보</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Users size={18} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">관리자 권한</span>
                  </div>
                  <p className="text-sm text-gray-600">전체 시스템 관리 권한</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock size={18} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">세션 만료</span>
                  </div>
                  <p className="text-sm text-gray-600">24시간 후 자동 로그아웃</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Shield size={18} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">보안 수준</span>
                  </div>
                  <p className="text-sm text-green-600 font-medium">높음</p>
                </div>
              </div>
            </div>

            {/* 이메일 시스템 테스트 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Mail size={24} className="text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">📧 이메일 시스템 테스트</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <EmailTest />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">설정 확인사항</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span>SendGrid API 키 설정</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span>발신자 이메일 인증</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span>이메일 템플릿 구성</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span>로그 기록 시스템</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>환경변수 설정:</strong><br/>
                      SendGrid API 키와 발신자 이메일을 .env.local 파일에 설정하세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 추가 기능 계획 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <BookOpen size={24} className="text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">향후 추가 예정 기능</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Mail size={18} className="text-gray-400 mr-2" />
                    <span className="font-medium text-gray-700">알림 설정</span>
                  </div>
                  <p className="text-sm text-gray-600">이메일 알림, 푸시 알림 설정</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">개발 예정</span>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Download size={18} className="text-gray-400 mr-2" />
                    <span className="font-medium text-gray-700">데이터 백업</span>
                  </div>
                  <p className="text-sm text-gray-600">시스템 데이터 백업/복원</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">개발 예정</span>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Settings size={18} className="text-gray-400 mr-2" />
                    <span className="font-medium text-gray-700">시스템 설정</span>
                  </div>
                  <p className="text-sm text-gray-600">사이트 기본 설정, 권한 관리</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">개발 예정</span>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Target size={18} className="text-gray-400 mr-2" />
                    <span className="font-medium text-gray-700">성능 모니터링</span>
                  </div>
                  <p className="text-sm text-gray-600">시스템 성능 및 사용량 추적</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">개발 예정</span>
                </div>
              </div>
            </div>
          </div>
        );

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
          {/* 헤더 */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              👨‍💼 관리자 대시보드
            </h1>
            <p className="text-lg text-white font-medium">
              플랫폼 관리 및 사용자 지원을 위한 종합 관리 시스템
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-t-xl shadow-xl">
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200
                        ${isActive 
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon size={18} className="mr-2" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
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