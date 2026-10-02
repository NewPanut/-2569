import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginPage } from './components/LoginPage';
import { StudentReportCard } from './components/StudentReportCard';
import { AdminModal } from './components/AdminModal';
import { StudentRecord, GoogleSheetSettings, SystemSettings } from './types/grade';
import { getAllDefaultStudents } from './data/defaultStudents';
import { 
  loadSettings, 
  saveSettings, 
  loadSystemSettings,
  saveSystemSettings,
  verifyAdminPassword,
  fetchStudentsFromGoogleSheet, 
  DEFAULT_SHEET_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS
} from './services/googleSheetService';

export default function App() {
  const [settings, setSettings] = useState<GoogleSheetSettings>(DEFAULT_SHEET_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [currentStudent, setCurrentStudent] = useState<StudentRecord | null>(null);

  // Admin state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'info' | 'success' } | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const savedSettings = loadSettings();
    const savedSystem = loadSystemSettings();
    setSettings(savedSettings);
    setSystemSettings(savedSystem);

    // Initial load: start with default dataset with custom additional subject names if any (P.4 - P.6 only)
    const initialList = getAllDefaultStudents(
      savedSettings.additionalSubjectP4Name,
      savedSettings.additionalSubjectP56Name
    );
    setStudents(initialList);

    // If user previously configured a live sheet, attempt background fetch
    if (savedSettings.sheetUrl && savedSettings.useLiveSheet) {
      setIsLoading(true);
      fetchStudentsFromGoogleSheet(savedSettings).then((res) => {
        setIsLoading(false);
        if (res.success && res.students.length > 0) {
          setStudents(res.students);
        }
      });
    }
  }, []);

  // Handle Login
  const handleLogin = (studentId: string): boolean => {
    const found = students.find(s => s.id === studentId.trim());
    if (found) {
      setCurrentStudent(found);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    return false;
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentStudent(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Admin Authentication
  const handleAdminLogin = (password: string): boolean => {
    const isValid = verifyAdminPassword(password);
    if (isValid) {
      setIsAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setNotification({
      text: 'ออกจากระบบผู้ดูแลระบบเรียบร้อยแล้ว',
      type: 'info'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle Save and Sync Google Sheet
  const handleSaveAndSync = async (newSettings: GoogleSheetSettings) => {
    setIsLoading(true);
    setSettings(newSettings);
    saveSettings(newSettings);

    const result = await fetchStudentsFromGoogleSheet(newSettings);
    setIsLoading(false);

    if (result.success && result.students.length > 0) {
      setStudents(result.students);
      // If currently viewing a student, update their view with fresh data
      if (currentStudent) {
        const updatedCurrent = result.students.find(s => s.id === currentStudent.id);
        if (updatedCurrent) {
          setCurrentStudent(updatedCurrent);
        }
      }
      setNotification({
        text: `ซิงค์ข้อมูลจาก Google Sheet สำเร็จ (${result.students.length} คน)`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 4000);
    } else {
      // Re-apply custom additional subjects to local defaults
      const refreshedDefaults = getAllDefaultStudents(
        newSettings.additionalSubjectP4Name,
        newSettings.additionalSubjectP56Name
      );
      setStudents(refreshedDefaults);
      if (currentStudent) {
        const updated = refreshedDefaults.find(s => s.id === currentStudent.id);
        if (updated) setCurrentStudent(updated);
      }
    }

    return result;
  };

  // Handle Save System Settings
  const handleSaveSystemSettings = (newSys: SystemSettings) => {
    setSystemSettings(newSys);
    saveSystemSettings(newSys);
    setNotification({
      text: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว',
      type: 'success'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Reset to Default School Database
  const handleResetToDefault = () => {
    const defaults = DEFAULT_SHEET_SETTINGS;
    setSettings(defaults);
    saveSettings(defaults);
    const defaultList = getAllDefaultStudents();
    setStudents(defaultList);
    if (currentStudent) {
      const resetCurrent = defaultList.find(s => s.id === currentStudent.id);
      if (resetCurrent) setCurrentStudent(resetCurrent);
    }
    setNotification({
      text: 'เปลี่ยนกลับมาใช้ฐานข้อมูลนักเรียนมาตรฐานของโรงเรียนเรียบร้อย',
      type: 'info'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Select student to preview from Admin database browser
  const handleSelectStudentToView = (studentId: string) => {
    handleLogin(studentId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <Header
        currentStudent={currentStudent}
        systemSettings={systemSettings}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogout={handleLogout}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Sync/Source Notification Banner (if any) */}
      {notification && (
        <div className="bg-blue-600 text-white text-xs sm:text-sm py-2 px-4 text-center shadow-xs transition-all print:hidden">
          {notification.text}
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {!currentStudent ? (
          <LoginPage
            onLogin={handleLogin}
            systemSettings={systemSettings}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
          />
        ) : (
          <StudentReportCard
            student={currentStudent}
            systemSettings={systemSettings}
            onBack={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <Footer 
        schoolName={systemSettings.schoolName}
        subDistrict={systemSettings.subDistrict}
      />

      {/* Unified Admin Console Modal (Login + Settings + Database) */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
        settings={settings}
        systemSettings={systemSettings}
        onSaveAndSync={handleSaveAndSync}
        onSaveSystemSettings={handleSaveSystemSettings}
        onResetToDefault={handleResetToDefault}
        isLoading={isLoading}
        students={students}
        onSelectStudentToView={handleSelectStudentToView}
      />
    </div>
  );
}
