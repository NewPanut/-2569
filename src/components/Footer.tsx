import React from 'react';

interface FooterProps {
  schoolName?: string;
  subDistrict?: string;
}

export const Footer: React.FC<FooterProps> = ({ 
  schoolName = 'โรงเรียนอนุบาลสุริยาอุทัยพิมาย',
  subDistrict = 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครราชสีมา เขต 7'
}) => {
  const cleanSchoolName = schoolName.replace(/\s*\(ป\.1\s*[-–]\s*ป\.6\)/g, '').trim();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs sm:text-sm text-slate-500 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="font-medium text-slate-700">
          © 2026 {cleanSchoolName} | พัฒนาโดย งาน ICT {cleanSchoolName}
        </p>
        <p className="mt-1 text-slate-400 text-xs">
          สังกัด{subDistrict} · จังหวัดนครราชสีมา
        </p>
      </div>
    </footer>
  );
};
