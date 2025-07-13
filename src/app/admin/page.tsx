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
import EmailTest from '@/components/EmailTest';
import { authService } from '@/lib/auth-service';
import { jobSeekerService, eventService, contentService, logService, volunteerService, designService } from '@/lib/firebase-services';
// import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email-service'; // 제거됨
import { User as FirebaseUser, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

type TabType = 'user-approval' | 'volunteer-management' | 'content-edit' | 'activity-log' | 'admin-settings' | 'design-editor';

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
    try {
      console.log('🔄 PDF 내보내기 시작...');
      
      if (filteredLogs.length === 0) {
        alert('내보낼 로그 데이터가 없습니다.');
        return;
      }

      const pdf = new jsPDF('l', 'mm', 'a4'); // 가로 방향
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // 한국어 폰트 설정을 위한 대체 방법 (기본 폰트 사용)
      pdf.setFont('helvetica', 'normal');
      
      // 헤더 추가
      pdf.setFontSize(16);
      pdf.text('Activity Log Report', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString('ko-KR')}`, pageWidth / 2, 25, { align: 'center' });
      pdf.text(`Total Records: ${filteredLogs.length}`, pageWidth / 2, 35, { align: 'center' });
      
      // 테이블 헤더
      const startY = 50;
      let currentY = startY;
      const rowHeight = 8;
      const colWidths = [30, 50, 40, 60, 50, 60]; // 컬럼 너비
      const headers = ['Time', 'Admin', 'Type', 'Action', 'Target', 'Details'];
      
      // 헤더 그리기
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      let currentX = 10;
      headers.forEach((header, index) => {
        pdf.text(header, currentX, currentY);
        currentX += colWidths[index];
      });
      
      currentY += rowHeight;
      pdf.line(10, currentY - 2, pageWidth - 10, currentY - 2); // 헤더 하단 라인
      
      // 데이터 행 추가
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      filteredLogs.forEach((log, index) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        currentX = 10;
        const rowData = [
          formatTimestamp(log.timestamp).substring(0, 16), // 시간 줄임
          (log.adminEmail || 'System').substring(0, 20), // 관리자 이메일 줄임
          getActionTypeText(log.type).substring(0, 15), // 타입 줄임
          (log.action || log.description || '').substring(0, 25), // 액션 줄임
          (log.targetUserEmail || log.contentId || '').substring(0, 20), // 대상 줄임
          (log.reason || JSON.stringify(log.changes) || '').substring(0, 25) // 세부사항 줄임
        ];
        
        rowData.forEach((data, colIndex) => {
          pdf.text(data, currentX, currentY);
          currentX += colWidths[colIndex];
        });
        
        currentY += rowHeight;
        
        // 격자 라인 추가
        if (index % 5 === 0) {
          pdf.line(10, currentY - 2, pageWidth - 10, currentY - 2);
        }
      });
      
      // 푸터 추가
      pdf.setFontSize(8);
      pdf.text(`Page ${pdf.getNumberOfPages()}`, pageWidth - 30, pageHeight - 10);
      
      pdf.save(`activity_log_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ PDF 내보내기가 완료되었습니다! 📄');
      
    } catch (error) {
      console.error('❌ PDF 내보내기 오류:', error);
      alert('PDF 내보내기 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const exportToCSV = () => {
    try {
      console.log('🔄 CSV 내보내기 시작...');
      
      if (filteredLogs.length === 0) {
        alert('내보낼 로그 데이터가 없습니다.');
        return;
      }

      const csvData = filteredLogs.map(log => ({
        '작업시간': formatTimestamp(log.timestamp),
        '관리자 이메일': log.adminEmail || '시스템',
        '작업 유형': getActionTypeText(log.type),
        '작업 내용': log.action || log.description || '상세 정보 없음',
        '대상': log.targetUserEmail || log.contentId || '',
        '사유/변경사항': log.reason || (log.changes ? JSON.stringify(log.changes) : '') || '',
        '세부정보': log.details ? JSON.stringify(log.details) : ''
      }));

      const csv = Papa.unparse(csvData, {
        header: true
      });

      // UTF-8 BOM 추가로 한글 인코딩 문제 해결
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // URL 정리
      URL.revokeObjectURL(url);
      
      alert('✅ CSV 내보내기가 완료되었습니다! 📊');
      
    } catch (error) {
      console.error('❌ CSV 내보내기 오류:', error);
      alert('CSV 내보내기 중 오류가 발생했습니다. 다시 시도해주세요.');
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
      console.error('❌ 봉사자 모집 공고 로드 오류:', error);
    } finally {
      setVolunteerLoading(false);
    }
  };



  const handleVolunteerPostingApprove = async (postingId: string) => {
    try {
      setVolunteerUpdating(postingId);
      await volunteerService.approveVolunteerPosting(postingId);
      await loadPendingVolunteerPostings();
      alert('✅ 봉사자 모집 공고가 승인되었습니다.');
    } catch (error) {
      console.error('❌ 봉사자 모집 공고 승인 오류:', error);
      alert('❌ 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setVolunteerUpdating(null);
    }
  };

  const handleVolunteerPostingReject = async (postingId: string) => {
    const reason = prompt('거절 사유를 입력해주세요:');
    if (!reason) return;

    try {
      setVolunteerUpdating(postingId);
      await volunteerService.rejectVolunteerPosting(postingId, reason);
      await loadPendingVolunteerPostings();
      alert('✅ 봉사자 모집 공고가 거절되었습니다.');
    } catch (error) {
      console.error('❌ 봉사자 모집 공고 거절 오류:', error);
      alert('❌ 거절 처리 중 오류가 발생했습니다.');
    } finally {
      setVolunteerUpdating(null);
    }
  };

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

  // 디자인 설정 로드
  const loadDesignSettings = async () => {
    try {
      console.log('🎨 디자인 설정 로드...');
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

  // 이미지 업로드 처리
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
        
        // Firebase Storage에 업로드
        const result = await designService.uploadImage(file, category, imageName);
        
        if (result.success) {
          // 활성 이미지 URL 업데이트
          await designService.updateActiveImage(category, imageName, result.url);
          
          // 디자인 설정 다시 로드
          await loadDesignSettings();
          
          alert('✅ 이미지가 성공적으로 업로드되었습니다!');
        }
      } catch (error) {
        console.error('❌ 이미지 업로드 오류:', error);
        alert('❌ 이미지 업로드 중 오류가 발생했습니다.');
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
      alert(`✅ ${themeName} 테마가 적용되었습니다!`);
    } catch (error) {
      console.error('❌ 테마 적용 오류:', error);
      alert('❌ 테마 적용 중 오류가 발생했습니다.');
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
      
      // 활동 로그 기록
      await logService.createLog({
        type: 'admin',
        action: 'design_update',
        adminEmail: user.email,
        description: '디자인 설정을 변경하였습니다',
        details: {
          colors: currentColors,
          fonts: currentFonts,
          changeTime: new Date().toISOString()
        }
      });
      
      alert('✅ 모든 디자인 변경사항이 저장되었습니다!');
      
      // 설정 다시 로드
      await loadDesignSettings();
      
    } catch (error) {
      console.error('❌ 디자인 저장 오류:', error);
      alert('❌ 디자인 저장 중 오류가 발생했습니다.');
    } finally {
      setIsDesignSaving(false);
    }
  };

  // 전체 미리보기 (새 탭에서 홈페이지 열기)
  const handlePreviewDesign = () => {
    window.open('/', '_blank');
    alert('💡 새 탭에서 홈페이지를 확인하세요. 변경사항을 저장한 후 새로고침하면 반영됩니다.');
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

  // 탭 정의
  const tabs = [
    {
      id: 'user-approval' as TabType,
      name: '사용자 승인/거절',
      icon: Users,
      description: '구직 신청 검토 및 승인/거절'
    },
    {
      id: 'volunteer-management' as TabType,
      name: '봉사자 관리',
      icon: Heart,
      description: '봉사자 모집 공고 승인/거절'
    },
    {
      id: 'content-edit' as TabType,
      name: '콘텐츠 수정',
      icon: Edit,
      description: '홈페이지 텍스트 및 섹션 수정'
    },
    {
      id: 'design-editor' as TabType,
      name: '디자인 편집',
      icon: Palette,
      description: '이미지, 색상, 폰트 변경'
    },
    {
      id: 'activity-log' as TabType,
      name: '활동 로그 열람',
      icon: Activity,
      description: '사용자 활동 기록 조회'
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

      case 'volunteer-management':
        return (
          <div className="space-y-6">
            {/* 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <Clock size={28} className="text-orange-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">승인 대기</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingVolunteerPostings.length}</p>
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
                  <Heart size={28} className="text-pink-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 지원자</p>
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
                    placeholder="기관명, 봉사 제목으로 검색..."
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
                  ❤️ 승인 대기 중인 봉사자 모집 ({pendingVolunteerPostings.filter(posting => 
                    posting.title?.toLowerCase().includes(volunteerSearchTerm.toLowerCase()) ||
                    posting.organizationName?.toLowerCase().includes(volunteerSearchTerm.toLowerCase())
                  ).length}개)
                </h2>
              </div>

              {volunteerLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">봉사자 모집 공고를 불러오는 중...</p>
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
                              검토 중
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
                              <strong className="text-gray-800">설명:</strong> <span className="font-medium">{posting.description}</span>
                            </div>
                            <div className="col-span-full text-xs text-gray-500 font-medium">
                              등록일: {formatDate(posting.createdAt)}
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
                            <span className="font-semibold">승인</span>
                          </button>
                          <button
                            onClick={() => handleVolunteerPostingReject(posting.id)}
                            disabled={volunteerUpdating === posting.id}
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
                  <Heart size={64} className="text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    🎉 승인 대기 중인 봉사자 모집 공고가 없습니다
                  </h3>
                  <p className="text-gray-600 text-lg font-medium">
                    {volunteerSearchTerm ? '검색 결과가 없습니다.' : '모든 봉사자 모집 공고가 처리되었습니다!'}
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

      case 'design-editor':
        return (
          <div className="space-y-8">
            {/* 헤더 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Palette size={28} className="mr-3 text-purple-600" />
                🎨 디자인 편집
              </h2>
              <p className="text-gray-600 mt-2">
                이미지 업로드, 색상 변경, 폰트 설정으로 홈페이지를 커스터마이징하세요.
              </p>
            </div>

            {/* 이미지 편집 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <ImageIcon size={24} className="mr-3 text-blue-600" />
                📸 이미지 관리
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 히어로 슬라이드 이미지들 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">메인 히어로 슬라이드</h4>
                  {[1, 2, 3].map((slideNum) => (
                    <div key={slideNum} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">슬라이드 {slideNum}</span>
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
                            {isImageUploading === `heroSlides-slide${slideNum}` ? '업로드중...' : '변경'}
                          </button>
                          <button 
                            onClick={() => window.open('/#hero-section', '_blank')}
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                          >
                            <Eye size={14} className="mr-1" />
                            미리보기
                          </button>
                        </div>
                      </div>
                      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={`/images/메인홈${slideNum}.${slideNum === 2 ? 'jpg' : 'png'}`}
                          alt={`메인 슬라이드 ${slideNum}`}
                          className="w-full h-full object-cover"
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
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">기능 카드 이미지</h4>
                  {[
                    { name: '학생 구직', file: '7번.png', key: 'student' },
                    { name: '추천서 지원', file: '4번.png', key: 'reference' },
                    { name: '기업 채용', file: '3번.png', key: 'company' },
                    { name: '교육 이벤트', file: '교육이벤트.png', key: 'events' }
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
                            {isImageUploading === `featureCards-${card.key}` ? '업로드중...' : '변경'}
                          </button>
                          <button 
                            onClick={() => window.open(`/#card-${card.key}`, '_blank')}
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                          >
                            <Eye size={14} className="mr-1" />
                            미리보기
                          </button>
                        </div>
                      </div>
                      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={`/images/${card.file}`}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 이미지 업로드 안내 */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-2">📌 이미지 업로드 가이드</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 권장 해상도: 1920x1080 (히어로 이미지), 800x600 (카드 이미지)</li>
                  <li>• 지원 형식: JPG, PNG, WebP</li>
                  <li>• 최대 파일 크기: 5MB</li>
                  <li>• 변경 후 즉시 홈페이지에 반영됩니다</li>
                </ul>
              </div>
            </div>

            {/* 색상 편집 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Palette size={24} className="mr-3 text-purple-600" />
                🎨 색상 테마
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 주요 색상 */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">주요 색상 (Primary)</label>
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

                {/* 보조 색상 */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">보조 색상 (Secondary)</label>
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

                {/* 강조 색상 */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">강조 색상 (Accent)</label>
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

                {/* 배경 색상 */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">배경 색상</label>
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
                <h4 className="text-lg font-semibold text-gray-800 mb-4">🎨 미리 정의된 테마</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: '현재 (스카이)', key: 'sky', colors: ['#0ea5e9', '#7dd3fc', '#0369a1', '#dbeafe'] },
                    { name: '보라색', key: 'purple', colors: ['#8b5cf6', '#c4b5fd', '#6d28d9', '#ede9fe'] },
                    { name: '초록색', key: 'green', colors: ['#10b981', '#6ee7b7', '#047857', '#d1fae5'] },
                    { name: '오렌지', key: 'orange', colors: ['#f59e0b', '#fcd34d', '#d97706', '#fef3c7'] }
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
                ✍️ 폰트 설정
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 본문 폰트 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">본문 폰트</h4>
                  <select 
                    value={currentFonts.bodyFont}
                    onChange={(e) => handleFontChange('bodyFont', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="inter">Inter</option>
                    <option value="noto-sans-kr">Noto Sans KR</option>
                    <option value="pretendard">Pretendard</option>
                    <option value="malgun-gothic">Malgun Gothic</option>
                    <option value="roboto">Roboto</option>
                  </select>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-gray-800" style={{ fontFamily: currentFonts.bodyFont, fontSize: `${currentFonts.bodySize}px`, lineHeight: currentFonts.lineHeight }}>
                      샘플 텍스트: 캐나다 학생들을 위한 취업 플랫폼입니다. 
                      Sample Text: New Brunswick High School Jobs Platform.
                    </p>
                  </div>
                </div>

                {/* 제목 폰트 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">제목 폰트</h4>
                  <select 
                    value={currentFonts.headingFont}
                    onChange={(e) => handleFontChange('headingFont', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="inter">Inter</option>
                    <option value="noto-sans-kr">Noto Sans KR</option>
                    <option value="pretendard">Pretendard</option>
                    <option value="playfair-display">Playfair Display</option>
                    <option value="montserrat">Montserrat</option>
                  </select>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: currentFonts.headingFont, fontSize: `${currentFonts.headingSize}px` }}>
                      샘플 제목: 미래를 만들어갈 학생 인재들
                    </h3>
                    <h4 className="text-lg font-semibold text-gray-600 mt-2" style={{ fontFamily: currentFonts.headingFont }}>
                      Sample Heading: Future Talents
                    </h4>
                  </div>
                </div>
              </div>

              {/* 폰트 크기 설정 */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">폰트 크기 설정</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">본문 크기 ({currentFonts.bodySize}px)</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">제목 크기 ({currentFonts.headingSize}px)</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">줄 간격 ({currentFonts.lineHeight})</label>
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
                  {isDesignSaving ? '저장 중...' : '모든 변경사항 저장'}
                </button>
                <button 
                  onClick={handlePreviewDesign}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Eye size={20} className="mr-3" />
                  전체 미리보기
                </button>
                <button 
                  onClick={handleExportSettings}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold text-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg"
                >
                  <Download size={20} className="mr-3" />
                  설정 내보내기
                </button>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                💡 변경사항은 저장 후 즉시 홈페이지에 반영됩니다. 미리보기로 먼저 확인해보세요!
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