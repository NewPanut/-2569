import React from 'react';
import { ArrowLeft, School } from 'lucide-react';
import { StudentRecord, SystemSettings } from '../types/grade';

interface StudentReportCardProps {
  student: StudentRecord;
  systemSettings?: SystemSettings;
  onBack: () => void;
}

export const StudentReportCard: React.FC<StudentReportCardProps> = ({
  student,
  systemSettings,
  onBack
}) => {
  // Filter out any summary rows ("รวมคะแนน", "รวม") and remark rows ("หมายเหตุ") from subject list
  let visibleSubjects = student.subjects.filter(subj => {
    const n = subj.name.trim().toLowerCase();
    return (
      n !== '' &&
      !n.includes('หมายเหตุ') &&
      !n.includes('remark') &&
      !n.includes('note') &&
      !n.includes('รวม') &&
      !n.includes('total') &&
      !n.includes('ผลรวม') &&
      !n.includes('ร้อยละ') &&
      !n.includes('เปอร์เซ็นต์') &&
      !n.includes('เฉลี่ย') &&
      !n.includes('เกรด') &&
      !n.includes('อันดับ') &&
      !n.includes('ลำดับ')
    );
  });

  // สำหรับ ป.4 และ ป.5 - ป.6: ให้แสดงเฉพาะ 10 วิชา (9 วิชาหลัก + 1 วิชาเพิ่มเติม)
  const isUpperPrimaryStudent = student.curriculum === 'p4' || 
                               student.curriculum === 'p5_6' ||
                               student.gradeLevel.includes('4') ||
                               student.gradeLevel.includes('5') ||
                               student.gradeLevel.includes('6');
  if (isUpperPrimaryStudent && visibleSubjects.length > 10) {
    visibleSubjects = visibleSubjects.slice(0, 10);
  }

  const calculatedTotal = visibleSubjects.reduce((sum, s) => sum + s.earnedScore, 0);
  const totalEarned = (student.totalScore !== undefined && student.totalScore !== null && !isNaN(student.totalScore) && student.totalScore > 0)
    ? student.totalScore
    : calculatedTotal;
  const totalMaxPossible = student.maxPossibleScore > 0 ? student.maxPossibleScore : visibleSubjects.length * 100;
  const avgPercentage = totalMaxPossible > 0 
    ? Number(((totalEarned / totalMaxPossible) * 100).toFixed(2)) 
    : (student.averagePercentage || 0);

  const displaySchool = (systemSettings?.schoolName || 'โรงเรียนอนุบาลสุริยาอุทัยพิมาย')
    .replace(/\s*\(ป\.1\s*[-–]\s*ป\.6\)/g, '')
    .trim();
  const displayYear = systemSettings?.academicYear || '2569';
  const displaySubDistrict = systemSettings?.subDistrict || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครราชสีมา เขต 7';
  const displayIssueDate = systemSettings?.issueDate?.trim() 
    ? systemSettings.issueDate.trim() 
    : new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Action Toolbar: Back to Login (Only individual view, no print button, no student switcher) */}
      <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าเข้าสู่ระบบ</span>
        </button>
      </div>

      {/* Official Student Academic Report Card Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Certificate Decorative Top Border (School Royal Blue / Gold) */}
        <div className="h-3 bg-gradient-to-r from-blue-900 via-blue-700 to-amber-500 print:hidden" />

        <div className="p-6 sm:p-10 print:p-4">
          {/* Document Header with School Emblem */}
          <div className="text-center border-b border-slate-200 pb-6 mb-6">
            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-1 bg-white rounded-full">
                <img
                  src="https://suriya.ac.th/wp-content/uploads/2025/05/logo.png"
                  alt="ตราสัญลักษณ์โรงเรียนอนุบาลสุริยาอุทัยพิมาย"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).parentElement?.querySelector('.report-fallback-icon');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="report-fallback-icon hidden text-blue-900">
                  <School className="w-16 h-16" />
                </div>
              </div>
            </div>

            <div className="text-lg sm:text-xl font-bold text-slate-900 font-['Prompt',sans-serif] tracking-tight">
              {displaySchool}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {displaySubDistrict}
            </div>

            {/* Official Report Title */}
            <div className="mt-3 inline-block">
              <h1 className="text-base sm:text-xl font-bold text-blue-950 font-['Prompt',sans-serif] px-4 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100/80 leading-normal">
                รายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล(การวัดผลระหว่างปี)
                <br className="sm:hidden" />
                <span className="sm:ml-2">ปีการศึกษา {displayYear}</span>
              </h1>
            </div>
          </div>

          {/* Section 1: ข้อมูลนักเรียน (Student Information) */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-5 bg-blue-700 rounded-full" />
              <h2 className="text-base font-bold text-slate-900 font-['Prompt',sans-serif]">
                ส่วนที่ 1 ข้อมูลนักเรียน
              </h2>
            </div>

            <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-4 sm:p-5 print:bg-white print:border print:p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-slate-500">รหัสนักเรียน</div>
                  <div className="text-base font-bold font-mono text-blue-900 mt-0.5 tracking-wide">
                    {student.id}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs font-medium text-slate-500">ชื่อ - สกุล นักเรียน</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {student.name}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500">เลขที่ (Seat No.)</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {student.seatNo}
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-4">
                  <div className="text-xs font-medium text-slate-500">ระดับชั้น / ห้องเรียน</div>
                  <div className="text-base font-semibold text-slate-800 mt-0.5">
                    {student.gradeLevel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: ข้อมูลผลการเรียน (Academic Evaluation Table) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-700 rounded-full" />
                <h2 className="text-base font-bold text-slate-900 font-['Prompt',sans-serif]">
                  ส่วนที่ 2 ข้อมูลผลการเรียน
                </h2>
              </div>
              <div className="text-xs text-slate-500 hidden sm:block">
                คะแนนเต็มวิชาละ 100 คะแนน
              </div>
            </div>

            {/* Academic Evaluation Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs print:border-slate-400 print:shadow-none">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-200 print:bg-slate-200">
                    <th scope="col" className="py-3 px-3 sm:px-4 text-center w-12 sm:w-16 font-semibold">
                      ที่
                    </th>
                    <th scope="col" className="py-3 px-3 sm:px-4 font-semibold">
                      รายวิชา
                    </th>
                    <th scope="col" className="py-3 px-3 sm:px-4 text-center font-semibold w-24 sm:w-32">
                      คะแนนเต็ม (100)
                    </th>
                    <th scope="col" className="py-3 px-3 sm:px-4 text-center font-semibold w-28 sm:w-36">
                      คะแนนที่ได้
                    </th>
                    <th scope="col" className="py-3 px-3 sm:px-4 text-center font-semibold w-28 sm:w-36">
                      หมายเหตุ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {visibleSubjects.map((subj, index) => {
                    const isUpperPrimaryStudent = student.curriculum === 'p4' || 
                                                 student.curriculum === 'p5_6' ||
                                                 student.gradeLevel.includes('4') ||
                                                 student.gradeLevel.includes('5') ||
                                                 student.gradeLevel.includes('6');
                    const isAdditionalRow = subj.isAdditional || (isUpperPrimaryStudent && index === 9);
                    const displayName = (isAdditionalRow && student.additionalSubjectName)
                      ? student.additionalSubjectName
                      : subj.name;

                    return (
                      <tr 
                        key={subj.id || index}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-2.5 px-3 sm:px-4 text-center font-mono text-xs text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 font-medium text-slate-900">
                          <span>{displayName}</span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center font-mono tabular-nums text-slate-600">
                          {subj.maxScore}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center font-mono font-bold tabular-nums text-blue-950">
                          {subj.earnedScore}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-center text-xs font-medium text-slate-700">
                          {subj.remarks ? (
                            <span>{subj.remarks}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footer: รวมคะแนน และ คะแนนเฉลี่ยเป็นร้อยละ */}
                <tfoot>
                  <tr className="bg-slate-100/95 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={2} className="py-3 px-3 sm:px-4 text-right">
                      รวมคะแนน
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-mono tabular-nums">
                      {totalMaxPossible}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-mono tabular-nums text-base text-blue-900">
                      {totalEarned}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center text-slate-300 font-mono">
                      -
                    </td>
                  </tr>
                  <tr className="bg-blue-50/80 font-bold border-t border-blue-200 text-blue-950">
                    <td colSpan={2} className="py-3 px-3 sm:px-4 text-right text-sm sm:text-base">
                      คะแนนเฉลี่ยเป็นร้อยละ
                    </td>
                    <td colSpan={2} className="py-3 px-3 sm:px-4 text-center font-mono tabular-nums text-lg text-blue-900">
                      {avgPercentage.toFixed(2)} %
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center text-slate-300 font-mono">
                      -
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Certificate Seal Bar */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 text-2xs sm:text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 print:border-none print:bg-white">
          <span>เอกสารทางการ: {displaySchool}</span>
          <span>ออกเอกสาร ณ วันที่ {displayIssueDate}</span>
        </div>
      </div>
    </div>
  );
};
