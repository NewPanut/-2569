import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  RotateCcw,
  Lock,
  Layers,
  Settings,
  Users,
  Search,
  ShieldCheck,
  LogOut,
  Eye,
  KeyRound
} from 'lucide-react';
import { GoogleSheetSettings, SystemSettings, StudentRecord } from '../types/grade';
import { 
  verifyAdminPassword,
  updateAdminPassword, 
  DEFAULT_SHEET_SETTINGS 
} from '../services/googleSheetService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  onAdminLogin: (pass: string) => boolean;
  onAdminLogout: () => void;
  settings: GoogleSheetSettings;
  systemSettings: SystemSettings;
  onSaveAndSync: (newSettings: GoogleSheetSettings) => Promise<{ success: boolean; message: string }>;
  onSaveSystemSettings: (newSys: SystemSettings) => void;
  onResetToDefault: () => void;
  isLoading: boolean;
  students: StudentRecord[];
  onSelectStudentToView: (studentId: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdminLoggedIn,
  onAdminLogin,
  onAdminLogout,
  settings,
  systemSettings,
  onSaveAndSync,
  onSaveSystemSettings,
  onResetToDefault,
  isLoading,
  students,
  onSelectStudentToView
}) => {
  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active admin tab: 'sheet' | 'system' | 'students'
  const [activeTab, setActiveTab] = useState<'sheet' | 'system' | 'students'>('sheet');

  // Sheet settings form (custom additional subjects removed per instructions)
  const [sheetUrl, setSheetUrl] = useState(settings.sheetUrl);
  const [sheetP13Name, setSheetP13Name] = useState(settings.sheetP13Name);
  const [sheetP4Name, setSheetP4Name] = useState(settings.sheetP4Name);
  const [sheetP56Name, setSheetP56Name] = useState(settings.sheetP56Name);

  // System settings form
  const [academicYear, setAcademicYear] = useState(systemSettings.academicYear || '2569');
  const [schoolName, setSchoolName] = useState(
    (systemSettings.schoolName || 'โรงเรียนอนุบาลสุริยาอุทัยพิมาย').replace(/\s*\(ป\.1\s*[-–]\s*ป\.6\)/g, '').trim()
  );
  const [subDistrict, setSubDistrict] = useState(systemSettings.subDistrict || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครราชสีมา เขต 7');
  const [issueDate, setIssueDate] = useState(systemSettings.issueDate || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Search filter for student list
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');

  // Status banner
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  // Handle Admin Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setLoginError('กรุณากรอกรหัสผ่านผู้ดูแลระบบ');
      return;
    }
    const success = onAdminLogin(passwordInput);
    if (success) {
      setLoginError(null);
      setPasswordInput('');
      setStatusMessage({ type: 'info', text: 'เข้าสู่ระบบผู้ดูแลระบบเรียบร้อยแล้ว' });
    } else {
      setLoginError('รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้น: suriya2569)');
    }
  };

  // Handle Google Sheet sync
  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const updatedSettings: GoogleSheetSettings = {
      sheetUrl: sheetUrl.trim(),
      sheetP13Name: sheetP13Name.trim() || 'Preview ป.1-3',
      sheetP4Name: sheetP4Name.trim() || 'Preview ป.4',
      sheetP56Name: sheetP56Name.trim() || 'Preview ป.5-6',
      additionalSubjectP4Name: settings.additionalSubjectP4Name || 'วิทยาการคำนวณประยุกต์',
      additionalSubjectP56Name: settings.additionalSubjectP56Name || 'คอมพิวเตอร์เพิ่มเติม',
      useLiveSheet: !!sheetUrl.trim(),
      lastSyncTime: new Date().toLocaleTimeString('th-TH')
    };

    const res = await onSaveAndSync(updatedSettings);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Handle Dedicated Change Password
  const handleChangePassword = () => {
    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตนก่อนเปลี่ยนรหัสผ่าน' });
      return;
    }
    if (!verifyAdminPassword(currentPassword)) {
      setStatusMessage({ type: 'error', text: 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setStatusMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    const success = updateAdminPassword(newPassword);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage({ 
        type: 'success', 
        text: 'เปลี่ยนรหัสผ่านผู้ดูแลระบบสำเร็จแล้ว สามารถใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไปได้ทันที' 
      });
    } else {
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกรหัสผ่านใหม่' });
    }
  };

  // Handle System Settings Save
  const handleSystemSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    let passwordChanged = false;
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        setStatusMessage({ type: 'error', text: 'กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน' });
        return;
      }
      if (!verifyAdminPassword(currentPassword)) {
        setStatusMessage({ type: 'error', text: 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
        return;
      }
      if (!newPassword || newPassword.length < 4) {
        setStatusMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusMessage({ type: 'error', text: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
        return;
      }

      updateAdminPassword(newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      passwordChanged = true;
    }

    const cleanedSchoolName = (schoolName.trim() || 'โรงเรียนอนุบาลสุริยาอุทัยพิมาย')
      .replace(/\s*\(ป\.1\s*[-–]\s*ป\.6\)/g, '')
      .trim();

    const updatedSys: SystemSettings = {
      academicYear: academicYear.trim() || '2569',
      schoolName: cleanedSchoolName,
      subDistrict: subDistrict.trim() || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครราชสีมา เขต 7',
      issueDate: issueDate.trim(),
      lastUpdated: new Date().toLocaleTimeString('th-TH')
    };

    onSaveSystemSettings(updatedSys);
    setStatusMessage({ 
      type: 'success', 
      text: passwordChanged 
        ? 'บันทึกการตั้งค่าระบบและเปลี่ยนรหัสผ่านผู้ดูแลระบบเรียบร้อยแล้ว' 
        : 'บันทึกการตั้งค่าระบบและวันที่ออกเอกสารเรียบร้อยแล้ว' 
    });
  };

  const handleReset = () => {
    setSheetUrl(DEFAULT_SHEET_SETTINGS.sheetUrl);
    setSheetP13Name(DEFAULT_SHEET_SETTINGS.sheetP13Name);
    setSheetP4Name(DEFAULT_SHEET_SETTINGS.sheetP4Name);
    setSheetP56Name(DEFAULT_SHEET_SETTINGS.sheetP56Name);
    setIssueDate('');
    onResetToDefault();
    setStatusMessage({ type: 'info', text: 'รีเซ็ตกลับไปใช้ฐานข้อมูลมาตรฐานของโรงเรียนเรียบร้อยแล้ว' });
  };

  // Filter students for database browser
  const filteredStudents = students.filter(st => {
    const matchesSearch = 
      st.id.includes(searchStudent.trim()) || 
      st.name.includes(searchStudent.trim()) ||
      st.gradeLevel.includes(searchStudent.trim());

    if (selectedGradeFilter === 'all') return matchesSearch;
    if (selectedGradeFilter === 'p1_3') return matchesSearch && st.curriculum === 'p1_3';
    if (selectedGradeFilter === 'p4') return matchesSearch && st.curriculum === 'p4';
    if (selectedGradeFilter === 'p5_6') return matchesSearch && st.curriculum === 'p5_6';
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Prompt',sans-serif]">
                ระบบจัดการสำหรับผู้ดูแลระบบ (Admin Console)
              </h2>
              <p className="text-xs text-slate-300 font-light">
                {schoolName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={onAdminLogout}
                title="ออกจากระบบ Admin"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ออกจากระบบ Admin</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Logged In View: Admin Login Form */}
        {!isAdminLoggedIn ? (
          <div className="p-6 sm:p-8 overflow-y-auto">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Prompt',sans-serif]">
                ลงชื่อเข้าใช้งานสำหรับผู้ดูแลระบบ
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
                กรุณาระบุรหัสผ่านผู้ดูแลระบบ (Admin) เพื่อเข้าถึงการตั้งค่า Google Sheet และระบบ
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    รหัสผ่านผู้ดูแลระบบ (Admin Password)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      placeholder="กรอกรหัสผ่านผู้ดูแลระบบ..."
                      className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900"
                      autoFocus
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>เข้าสู่ระบบ Admin</span>
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-2xs text-slate-400">
                หากลืมรหัสผ่าน กรุณาติดต่อทีมงาน ICT {schoolName}
              </div>
            </div>
          </div>
        ) : (
          /* Logged In Admin View: Full Control Panel with Tabs */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tabs Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => { setActiveTab('sheet'); setStatusMessage(null); }}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'sheet'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>ตั้งค่า Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('system'); setStatusMessage(null); }}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'system'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-blue-600" />
                <span>ตั้งค่าระบบและรหัสผ่าน</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('students'); setStatusMessage(null); }}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'students'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span>ฐานข้อมูลนักเรียน ({students.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {/* Notification Banner */}
              {statusMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 mb-5 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : statusMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-relaxed">{statusMessage.text}</div>
                </div>
              )}

              {/* TAB 1: GOOGLE SHEETS */}
              {activeTab === 'sheet' && (
                <form onSubmit={handleSyncSubmit} className="space-y-5">
                  {/* Google Sheet URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Google Sheet URL
                      </label>
                      {settings.lastSyncTime && (
                        <span className="text-2xs text-slate-500 font-mono">
                          ซิงค์ล่าสุด: {settings.lastSyncTime}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="วางลิงก์ Google Sheet ที่นี่ เช่น https://docs.google.com/spreadsheets/d/.../edit"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900"
                    />
                    <p className="text-2xs sm:text-xs text-slate-500 mt-1.5">
                      * ต้องตั้งค่าสิทธิ์การแชร์ของ Google Sheet ให้เป็น <strong className="text-slate-700">"ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view)</strong>
                    </p>
                  </div>

                  {/* Sheet Names */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>ชื่อแท็บแผ่นงาน (Sheet Names)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-2xs font-medium text-slate-600">
                            ระดับชั้น ป.1 - ป.3
                          </label>
                          <span className="text-3xs font-mono font-semibold px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                            รวม: คอลัมน์ AA
                          </span>
                        </div>
                        <input
                          type="text"
                          value={sheetP13Name}
                          onChange={(e) => setSheetP13Name(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-2xs font-medium text-slate-600">
                            ระดับชั้น ป.4
                          </label>
                          <span className="text-3xs font-mono font-semibold px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                            วิชาเพิ่มเติม: X | รวม: Z
                          </span>
                        </div>
                        <input
                          type="text"
                          value={sheetP4Name}
                          onChange={(e) => setSheetP4Name(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-2xs font-medium text-slate-600">
                            ระดับชั้น ป.5 - ป.6
                          </label>
                          <span className="text-3xs font-mono font-semibold px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                            วิชาเพิ่มเติม: X | รวม: Z
                          </span>
                        </div>
                        <input
                          type="text"
                          value={sheetP56Name}
                          onChange={(e) => setSheetP56Name(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ใช้ข้อมูลมาตรฐานโรงเรียน</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>{isLoading ? 'กำลังดึงข้อมูล...' : 'บันทึกและซิงค์ข้อมูล Google Sheet'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: SYSTEM SETTINGS & PASSWORD */}
              {activeTab === 'system' && (
                <form onSubmit={handleSystemSettingsSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ปีการศึกษา
                      </label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="เช่น 2569"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อสถานศึกษา
                      </label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        หน่วยงานต้นสังกัด
                      </label>
                      <input
                        type="text"
                        value={subDistrict}
                        onChange={(e) => setSubDistrict(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                      />
                    </div>

                    {/* Manage Document Issue Date */}
                    <div className="sm:col-span-2 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-blue-950">
                          วันที่ออกเอกสาร (Document Issue Date)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIssueDate(new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }))}
                          className="text-2xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                        >
                          + ใส่วันที่ปัจจุบัน
                        </button>
                      </div>
                      <input
                        type="text"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        placeholder="เช่น 31 มีนาคม 2569 (หรือเว้นว่างไว้เพื่อใช้วันที่ปัจจุบันตามจริง)"
                        className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                      />
                      <p className="text-2xs text-slate-500 mt-1.5">
                        * วันที่นี้จะแสดงที่แถบท้ายเอกสารรายงานผลการเรียนของนักเรียนทุกคน หากเว้นว่างไว้จะแสดงวันที่ปัจจุบันตามปฏิทินจริง
                      </p>
                    </div>
                  </div>

                  {/* Change Admin Password */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                        <KeyRound className="w-4 h-4 text-blue-600" />
                        <span>เปลี่ยนรหัสผ่านผู้ดูแลระบบ (Admin Password)</span>
                      </div>
                      <span className="text-2xs text-slate-400">
                        สำหรับเปลี่ยนรหัสผ่านของตนเอง
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-2xs font-medium text-slate-600 mb-1">
                          รหัสผ่านปัจจุบัน
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="กรอกรหัสผ่านปัจจุบัน"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-medium text-slate-600 mb-1">
                          รหัสผ่านใหม่ (อย่างน้อย 4 ตัว)
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="รหัสผ่านใหม่"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-medium text-slate-600 mb-1">
                          ยืนยันรหัสผ่านใหม่
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleChangePassword}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                      >
                        ยืนยันเปลี่ยนรหัสผ่าน
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-200">
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      บันทึกการตั้งค่าระบบ
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: STUDENT DATABASE BROWSER */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={searchStudent}
                        onChange={(e) => setSearchStudent(e.target.value)}
                        placeholder="ค้นหาตามรหัส 5 หลัก, ชื่อ-สกุล หรือห้องเรียน..."
                        className="w-full px-3 py-1.5 pl-9 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 text-slate-800"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedGradeFilter('all')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          selectedGradeFilter === 'all'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ทั้งหมด ({students.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGradeFilter('p1_3')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          selectedGradeFilter === 'p1_3'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ป.1-3
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGradeFilter('p4')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          selectedGradeFilter === 'p4'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ป.4
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGradeFilter('p5_6')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          selectedGradeFilter === 'p5_6'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ป.5-6
                      </button>
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12">เลขที่</th>
                          <th className="py-2.5 px-3 w-20">รหัส</th>
                          <th className="py-2.5 px-3">ชื่อ - สกุล</th>
                          <th className="py-2.5 px-3">ระดับชั้น</th>
                          <th className="py-2.5 px-3 text-center">คะแนนรวม</th>
                          <th className="py-2.5 px-3 text-center">ร้อยละ</th>
                          <th className="py-2.5 px-3 text-center w-16">ตรวจสอบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400">
                              ไม่พบข้อมูลนักเรียนที่ค้นหา
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map(st => (
                            <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 text-center font-mono text-slate-500">{st.seatNo}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-blue-900">{st.id}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{st.name}</td>
                              <td className="py-2 px-3 text-slate-600">{st.gradeLevel}</td>
                              <td className="py-2 px-3 text-center font-mono tabular-nums font-semibold text-slate-800">
                                {(() => {
                                  const val = (st.totalScore !== undefined && st.totalScore !== null && !isNaN(st.totalScore))
                                    ? st.totalScore
                                    : st.subjects.reduce((sum, s) => sum + s.earnedScore, 0);
                                  return Number.isInteger(val) ? val : Number(val.toFixed(2));
                                })()}
                              </td>
                              <td className="py-2 px-3 text-center font-mono tabular-nums font-semibold text-blue-900">
                                {(() => {
                                  const val = (st.averagePercentage !== undefined && st.averagePercentage !== null && !isNaN(st.averagePercentage))
                                    ? st.averagePercentage
                                    : (st.maxPossibleScore > 0 ? Number(((st.totalScore / st.maxPossibleScore) * 100).toFixed(2)) : 0);
                                  return `${Number(val.toFixed(2))}%`;
                                })()}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectStudentToView(st.id);
                                    onClose();
                                  }}
                                  title="ดูผลการเรียนของนักเรียนคนนี้"
                                  className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-2xs text-slate-500 text-right">
                    แสดง {filteredStudents.length} จากทั้งหมด {students.length} รายการ
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
