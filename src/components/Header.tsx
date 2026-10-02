import React from 'react';
import { School, LogOut, ShieldCheck, Lock } from 'lucide-react';
import { StudentRecord, SystemSettings } from '../types/grade';

interface HeaderProps {
  currentStudent: StudentRecord | null;
  systemSettings: SystemSettings;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStudent,
  systemSettings,
  isAdminLoggedIn,
  onLogout,
  onOpenAdmin
}) => {
  const schoolName = (systemSettings?.schoolName || 'โรงเรียนอนุบาลสุริยาอุทัยพิมาย')
    .replace(/\s*\(ป\.1\s*[-–]\s*ป\.6\)/g, '')
    .trim();
  const academicYear = systemSettings?.academicYear || '2569';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 shrink-0 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-100 overflow-hidden">
              <img
                src="https://suriya.ac.th/wp-content/uploads/2025/05/logo.png"
                alt="ตราสัญลักษณ์โรงเรียนอนุบาลสุริยาอุทัยพิมาย"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).parentElement?.querySelector('.fallback-icon');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="fallback-icon hidden text-blue-700">
                <School className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-blue-950 font-['Prompt',sans-serif] tracking-tight leading-tight">
                {schoolName}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium">
                ระบบตรวจสอบผลการเรียนออนไลน์ ปีการศึกษา {academicYear}
              </div>
            </div>
          </div>

          {/* Actions Zone */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Console Button */}
            <button
              onClick={onOpenAdmin}
              title={isAdminLoggedIn ? 'จัดการระบบ (ผู้ดูแลระบบ)' : 'เข้าสู่ระบบผู้ดูแลระบบ'}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isAdminLoggedIn ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="hidden md:inline">จัดการระบบ</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="เข้าสู่ระบบผู้ดูแลระบบแล้ว" />
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline">ผู้ดูแลระบบ</span>
                </>
              )}
            </button>

            {currentStudent && (
              <button
                onClick={onLogout}
                title="ออกจากระบบ"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
