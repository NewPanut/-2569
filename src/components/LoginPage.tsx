import React, { useState } from 'react';
import { Search, AlertCircle, ArrowRight, School, Lock } from 'lucide-react';
import { SystemSettings } from '../types/grade';

interface LoginPageProps {
  onLogin: (studentId: string) => boolean;
  systemSettings: SystemSettings;
  onOpenAdmin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLogin, 
  systemSettings, 
  onOpenAdmin 
}) => {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const schoolName = (systemSettings?.schoolName || 'โรงเรียนอนุบาลสุริยาอุทัยพิมาย')
    .replace(/\s*\(ป\.1\s*[-–]\s*ป\.6\)/g, '')
    .trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentId.trim();

    if (!cleanId) {
      setError('กรุณากรอกรหัสนักเรียน 5 หลัก');
      return;
    }

    if (cleanId.length < 5) {
      setError('รหัสนักเรียนต้องประกอบด้วยตัวเลข 5 หลัก');
      return;
    }

    const success = onLogin(cleanId);
    if (!success) {
      setError(`ไม่พบข้อมูลนักเรียนรหัส "${cleanId}" ในระบบ กรุณาตรวจสอบรหัสอีกครั้ง`);
    } else {
      setError(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl shadow-md p-2 mb-4 border border-blue-100 flex items-center justify-center">
                <img
                  src="https://suriya.ac.th/wp-content/uploads/2025/05/logo.png"
                  alt="ตราสัญลักษณ์โรงเรียนอนุบาลสุริยาอุทัยพิมาย"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).parentElement?.querySelector('.login-fallback-icon');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="login-fallback-icon hidden text-blue-800">
                  <School className="w-12 h-12" />
                </div>
              </div>

              <div className="text-sm font-semibold tracking-wide text-blue-200 mb-1">
                {schoolName}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-['Prompt',sans-serif] tracking-tight leading-snug">
                ระบบตรวจสอบผลการเรียนออนไลน์ ปีการศึกษา {systemSettings.academicYear || '2569'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-2 max-w-md font-light">
                รายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (การวัดผลระหว่างปี)
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="studentIdInput" className="block text-sm font-semibold text-slate-800 mb-2">
                  รหัสนักเรียน 5 หลัก (Student ID)
                </label>
                <div className="relative">
                  <input
                    id="studentIdInput"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value.replace(/\D/g, ''));
                      if (error) setError(null);
                    }}
                    placeholder="กรอกรหัสนักเรียน 5 หลัก..."
                    className="w-full px-4 py-3.5 pl-11 text-base sm:text-lg font-mono tracking-wider text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-inner"
                    autoFocus
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  กรอกเลขประจำตัวนักเรียน 5 หลักที่ระบุในบัตรนักเรียน หรือเอกสารรายงานผลการเรียน
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">เกิดข้อผิดพลาด: </span>
                    {error}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 text-base font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>เข้าสู่ระบบเพื่อดูผลการเรียน</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Quiet Admin Access Link */}
            <div className="mt-8 pt-4 border-t border-slate-150 flex items-center justify-center">
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-700 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>สำหรับผู้ดูแลระบบ (Admin Console)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
