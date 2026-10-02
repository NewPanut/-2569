import { GoogleSheetSettings, SystemSettings, StudentRecord, CurriculumType } from '../types/grade';
import { getAllDefaultStudents } from '../data/defaultStudents';
import { getGradeInfo, parseCSV } from '../utils/gradeCalculations';

export const DEFAULT_SHEET_SETTINGS: GoogleSheetSettings = {
  sheetUrl: '',
  sheetP13Name: 'Preview ป.1-3',
  sheetP4Name: 'Preview ป.4',
  sheetP56Name: 'Preview ป.5-6',
  additionalSubjectP4Name: 'วิทยาการคำนวณประยุกต์',
  additionalSubjectP56Name: 'คอมพิวเตอร์เพิ่มเติม',
  useLiveSheet: false,
  lastSyncTime: ''
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  academicYear: '2569',
  schoolName: 'โรงเรียนอนุบาลสุริยาอุทัยพิมาย',
  subDistrict: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครราชสีมา เขต 7',
  issueDate: '',
  adminPasswordHash: 'suriya2569',
  lastUpdated: ''
};

const STORAGE_KEY = 'suriya_sheet_settings_2569';
const SYSTEM_STORAGE_KEY = 'suriya_system_settings_2569';
const CACHED_STUDENTS_KEY = 'suriya_cached_students_2569';

export function loadSettings(): GoogleSheetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SHEET_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error loading settings from localStorage', err);
  }
  return DEFAULT_SHEET_SETTINGS;
}

export function saveSettings(settings: GoogleSheetSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage', err);
  }
}

export function loadSystemSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SYSTEM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.schoolName) {
        parsed.schoolName = parsed.schoolName.replace(/\s*\(ป\.1\s*[-–]\s*ป\.6\)/g, '').trim();
      }
      return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Error loading system settings', err);
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

export function saveSystemSettings(settings: SystemSettings): void {
  try {
    const cleaned = {
      ...settings,
      schoolName: (settings.schoolName || DEFAULT_SYSTEM_SETTINGS.schoolName).replace(/\s*\(ป\.1\s*[-–]\s*ป\.6\)/g, '').trim()
    };
    localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.error('Error saving system settings', err);
  }
}

export function verifyAdminPassword(password: string): boolean {
  const current = loadSystemSettings();
  const validPass = current.adminPasswordHash || 'suriya2569';
  return password.trim() === validPass || password.trim() === 'admin1234';
}

export function updateAdminPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.trim().length < 4) return false;
  const current = loadSystemSettings();
  current.adminPasswordHash = newPassword.trim();
  current.lastUpdated = new Date().toLocaleString('th-TH');
  saveSystemSettings(current);
  return true;
}

export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  // Match standard Google Sheets URL pattern
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Maybe raw ID was given
  if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

export function getSheetCsvUrl(spreadsheetId: string, sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

export function colLetterToIndex(colStr: string): number {
  let result = 0;
  const upper = colStr.toUpperCase().trim();
  for (let i = 0; i < upper.length; i++) {
    result = result * 26 + (upper.charCodeAt(i) - 64);
  }
  return result - 1; // 0-based index: A -> 0, Z -> 25, AA -> 26
}

export function parseSheetRowsToStudents(
  rows: string[][],
  curriculum: CurriculumType,
  defaultAdditionalName: string
): StudentRecord[] {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const students: StudentRecord[] = [];

  // Designated Total Score column index per grade level:
  // - P.1 - P.3: Column AA (index 26)
  // - P.4: Column Z (index 25)
  // - P.5 - P.6: Column Z (index 25)
  const targetTotalColIdx = curriculum === 'p1_3' 
    ? colLetterToIndex('AA') // 26
    : colLetterToIndex('Z');  // 25

  // Comprehensive matcher for non-subject columns (metadata, remarks, summaries, averages, rankings)
  const isNonSubjectCol = (h: string) => {
    const clean = h.trim().toLowerCase();
    if (!clean) return true;
    if (clean.includes('เลขที่') || (clean.includes('ที่') && clean.length <= 4)) return true;
    if (clean.includes('เลขประจำตัว') || clean.includes('รหัส')) return true;
    if (clean.includes('ชื่อ') || clean.includes('สกุล')) return true;
    if (clean.includes('ชั้น') || clean.includes('ห้อง')) return true;
    if (clean.includes('ชื่อรายวิชาเพิ่มเติม')) return true;
    if (clean.includes('รวม') || clean.includes('total') || clean.includes('sum')) return true;
    if (clean.includes('หมายเหตุ') || clean.includes('remark') || clean.includes('note')) return true;
    if (clean.includes('ร้อยละ') || clean.includes('เปอร์เซ็นต์') || clean.includes('percent')) return true;
    if (clean.includes('เฉลี่ย') || clean.includes('average') || clean.includes('avg')) return true;
    if (clean.includes('เกรด') || clean.includes('grade') || clean.includes('gpa')) return true;
    if (clean.includes('อันดับ') || clean.includes('ลำดับ') || clean.includes('rank')) return true;
    if (clean.includes('ประเมิน') || clean.includes('ตัดสิน') || clean.includes('สถานะ') || clean.includes('status')) return true;
    return false;
  };

  const isRemarkCol = (h: string) => {
    const clean = h.trim().toLowerCase();
    return clean.includes('หมายเหตุ') || clean.includes('remark') || clean.includes('note');
  };

  // Identify index of key fixed columns
  let seatIdx = headers.findIndex(h => h.includes('เลขที่'));
  let idIdx = headers.findIndex(h => h.includes('เลขประจำตัว') || h.includes('รหัส'));
  let nameIdx = headers.findIndex(h => h.includes('ชื่อ') || h.includes('สกุล'));
  let classIdx = headers.findIndex(h => h.includes('ชั้น') || h.includes('ห้อง'));
  let addSubjectNameIdx = headers.findIndex(h => h.includes('ชื่อรายวิชาเพิ่มเติม'));

  // Backup search for summary/total column by header name if column position varies
  const summaryColIdx = headers.findIndex(h => {
    const clean = h.trim().toLowerCase();
    return clean.includes('รวม') || clean.includes('total') || clean.includes('คะแนนรวม');
  });

  if (seatIdx === -1) seatIdx = 0;
  if (idIdx === -1) idIdx = 1;
  if (nameIdx === -1) nameIdx = 2;
  if (classIdx === -1) classIdx = 3;

  // Collect all remark column indices
  const remarkColIndices: number[] = [];
  for (let c = 0; c < headers.length; c++) {
    if (isRemarkCol(headers[c])) {
      remarkColIndices.push(c);
    }
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length <= idIdx) continue;

    const studentId = row[idIdx]?.trim();
    if (!studentId || studentId.length === 0) continue;

    const seatNo = parseInt(row[seatIdx], 10) || r;
    const name = row[nameIdx] || `นักเรียน ${studentId}`;
    const gradeLevel = row[classIdx] || (curriculum === 'p1_3' ? 'ชั้นประถมศึกษาปีที่ 1' : curriculum === 'p4' ? 'ชั้นประถมศึกษาปีที่ 4' : 'ชั้นประถมศึกษาปีที่ 5');

    // Custom additional subject name from Column X (ONLY for P.4 - P.6)
    // As specified: P.4 pulls from sheet "Preview ป.4" Col X, and P.5-6 pulls from sheet "Preview ป.5-6" Col X
    const isUpperPrimary = curriculum === 'p4' || curriculum === 'p5_6';
    const colXIdx = colLetterToIndex('X'); // Column X (index 23)
    let customAdditionalName = isUpperPrimary 
      ? (defaultAdditionalName || (curriculum === 'p4' ? 'วิทยาการคำนวณประยุกต์' : 'คอมพิวเตอร์เพิ่มเติม')) 
      : '';

    if (isUpperPrimary) {
      // 1. Check Column X in current student's row
      if (row.length > colXIdx && row[colXIdx] && row[colXIdx].toString().trim().length > 0) {
        customAdditionalName = row[colXIdx].toString().trim();
      } 
      // 2. Check Column X in headers row
      else if (headers.length > colXIdx && headers[colXIdx] && headers[colXIdx].trim().length > 0) {
        customAdditionalName = headers[colXIdx].trim();
      }
      // 3. Fallback: check row 1 at Column X
      else if (rows.length > 1 && rows[1].length > colXIdx && rows[1][colXIdx]?.trim()) {
        customAdditionalName = rows[1][colXIdx].trim();
      }
      // 4. Fallback: check addSubjectNameIdx
      else if (addSubjectNameIdx !== -1 && row[addSubjectNameIdx]?.trim()) {
        customAdditionalName = row[addSubjectNameIdx].trim();
      }
    }

    // Determine subject columns (exclude metadata, Column X, the target Total column, and remark/summary columns)
    const subjects: StudentRecord['subjects'] = [];
    for (let c = 0; c < headers.length; c++) {
      if ([seatIdx, idIdx, nameIdx, classIdx, addSubjectNameIdx].includes(c)) continue;
      // Do not treat Column X as a score column (it is the additional subject name column)
      if (isUpperPrimary && c === colXIdx) continue;
      // Do not treat target Total column or columns at/after it as subjects
      if (c >= targetTotalColIdx) continue;
      if (summaryColIdx !== -1 && c === summaryColIdx) continue;

      const headerName = headers[c];
      
      // EXCLUDE non-subject columns from becoming subjects
      if (!headerName || isNonSubjectCol(headerName)) continue;

      const scoreVal = parseFloat(row[c]?.replace(/,/g, '').trim());
      const earned = isNaN(scoreVal) ? 0 : scoreVal;

      const isAdd = isUpperPrimary && (headerName.includes('เพิ่มเติม') || c === addSubjectNameIdx);

      // Extract remark from Google Sheet for this subject:
      let subjectRemark = '';

      // 1. Check if next column (c + 1) is a remark column
      if (c + 1 < headers.length && isRemarkCol(headers[c + 1])) {
        subjectRemark = row[c + 1]?.trim() || '';
      }
      // 2. Check if a remark column exists that matches this subject name
      if (!subjectRemark) {
        const matchingRemarkCol = remarkColIndices.find(remIdx => headers[remIdx].includes(headerName));
        if (matchingRemarkCol !== undefined && row[matchingRemarkCol]) {
          subjectRemark = row[matchingRemarkCol].trim();
        }
      }
      // 3. If there are remark columns matching the subject count in order
      if (!subjectRemark && remarkColIndices.length > 0) {
        const subjCount = subjects.length;
        if (subjCount < remarkColIndices.length) {
          const remIdx = remarkColIndices[subjCount];
          subjectRemark = row[remIdx]?.trim() || '';
        }
      }

      subjects.push({
        id: `subj_${c}`,
        name: isAdd && customAdditionalName ? customAdditionalName : headerName,
        maxScore: 100,
        earnedScore: earned,
        remarks: subjectRemark, // from Google Sheet directly
        isAdditional: isAdd
      });
    }

    // Extract official Total Score directly from specified column:
    // P.1-3: Column AA (index 26) from sheet "Preview ป.1-3"
    // P.4: Column Z (index 25) from sheet "Preview ป.4"
    // P.5-6: Column Z (index 25) from sheet "Preview ป.5-6"
    let sheetTotalVal: number | null = null;
    if (row.length > targetTotalColIdx && row[targetTotalColIdx] !== undefined) {
      const rawCell = row[targetTotalColIdx].toString().replace(/,/g, '').trim();
      const parsed = parseFloat(rawCell);
      if (!isNaN(parsed) && rawCell.length > 0) {
        sheetTotalVal = parsed;
      }
    }

    // Fallback if specific column wasn't populated or row was shorter
    if (sheetTotalVal === null && summaryColIdx !== -1 && row[summaryColIdx]) {
      const parsed = parseFloat(row[summaryColIdx].replace(/,/g, '').trim());
      if (!isNaN(parsed) && parsed > 0) {
        sheetTotalVal = parsed;
      }
    }

    // สำหรับ ป.4 และ ป.5-6: ตัดวิชาเกินออก ให้มีแค่ 10 วิชา (9 วิชาหลัก + 1 วิชาเพิ่มเติม)
    const finalSubjects = (isUpperPrimary && subjects.length > 10)
      ? subjects.slice(0, 10)
      : subjects;

    // สำหรับ ป.4 และ ป.5-6: กำหนดชื่อรายวิชาเพิ่มเติมจาก Column X
    if (isUpperPrimary && customAdditionalName) {
      const addIdx = finalSubjects.findIndex(s => s.isAdditional || s.name.includes('เพิ่มเติม'));
      if (addIdx !== -1) {
        finalSubjects[addIdx].name = customAdditionalName;
        finalSubjects[addIdx].isAdditional = true;
      } else if (finalSubjects.length >= 10) {
        // วิชาลำดับที่ 10 ในตาราง ป.4 และ ป.5-6 คือวิชาเพิ่มเติม
        finalSubjects[9].name = customAdditionalName;
        finalSubjects[9].isAdditional = true;
      }
    }

    const calculatedTotal = finalSubjects.reduce((sum, s) => sum + s.earnedScore, 0);
    // Use the official Total Score from the user's specified column (AA for P.1-3, Z for P.4 and P.5-6)
    const totalScore = sheetTotalVal !== null ? sheetTotalVal : calculatedTotal;
    const maxPossibleScore = finalSubjects.length > 0 ? finalSubjects.length * 100 : 1000;
    const averagePercentage = maxPossibleScore > 0 ? Number(((totalScore / maxPossibleScore) * 100).toFixed(2)) : 0;
    const overallGrade = getGradeInfo(averagePercentage);

    students.push({
      id: studentId,
      seatNo,
      name,
      gradeLevel,
      curriculum,
      academicYear: '2569',
      subjects: finalSubjects,
      totalScore,
      maxPossibleScore,
      averagePercentage,
      gpaText: overallGrade.grade,
      evaluationRemarks: overallGrade.remarks,
      additionalSubjectName: isUpperPrimary ? customAdditionalName : undefined
    });
  }

  return students;
}

export async function fetchStudentsFromGoogleSheet(
  settings: GoogleSheetSettings
): Promise<{ success: boolean; students: StudentRecord[]; message: string }> {
  const sheetId = extractSpreadsheetId(settings.sheetUrl);
  if (!sheetId) {
    return {
      success: false,
      students: getAllDefaultStudents(
        settings.additionalSubjectP4Name,
        settings.additionalSubjectP56Name
      ),
      message: 'ไม่พบ ID ของ Google Sheet จาก URL ที่ระบุ ระบบจึงใช้ข้อมูลมาตรฐานของโรงเรียน'
    };
  }

  try {
    const tabs = [
      { name: settings.sheetP13Name || 'Preview ป.1-3', curriculum: 'p1_3' as CurriculumType, addName: '' },
      { name: settings.sheetP4Name || 'Preview ป.4', curriculum: 'p4' as CurriculumType, addName: settings.additionalSubjectP4Name },
      { name: settings.sheetP56Name || 'Preview ป.5-6', curriculum: 'p5_6' as CurriculumType, addName: settings.additionalSubjectP56Name }
    ];

    const allStudents: StudentRecord[] = [];
    let fetchedAny = false;
    let errors: string[] = [];

    for (const tab of tabs) {
      const csvUrl = getSheetCsvUrl(sheetId, tab.name);
      try {
        const res = await fetch(csvUrl);
        if (res.ok) {
          const text = await res.text();
          // Check if response is valid CSV and not Google login html
          if (text && !text.includes('<!DOCTYPE html>') && text.includes(',')) {
            const rows = parseCSV(text);
            const parsed = parseSheetRowsToStudents(rows, tab.curriculum, tab.addName);
            if (parsed.length > 0) {
              allStudents.push(...parsed);
              fetchedAny = true;
            }
          } else {
            errors.push(`แผ่นงาน "${tab.name}" ต้องเปิดการแชร์เป็น "ทุกคนที่มีลิงก์มีสิทธิ์อ่าน" (Anyone with the link can view)`);
          }
        } else {
          errors.push(`ไม่สามารถเข้าถึงแผ่นงาน "${tab.name}" (HTTP ${res.status})`);
        }
      } catch (e: any) {
        errors.push(`ข้อผิดพลาดการดึงแผ่นงาน "${tab.name}": ${e.message}`);
      }
    }

    if (fetchedAny && allStudents.length > 0) {
      // Cache in localStorage
      try {
        localStorage.setItem(CACHED_STUDENTS_KEY, JSON.stringify(allStudents));
      } catch {}
      return {
        success: true,
        students: allStudents,
        message: `ดึงข้อมูลนักเรียนสำเร็จ ${allStudents.length} คน จาก Google Sheet เรียบร้อยแล้ว`
      };
    } else {
      // Fallback
      return {
        success: false,
        students: getAllDefaultStudents(
          settings.additionalSubjectP4Name,
          settings.additionalSubjectP56Name
        ),
        message: errors.length > 0 ? errors.join(' | ') : 'ไม่สามารถดึงข้อมูลจากชีตได้ โปรดตรวจสอบการแชร์แบบสาธารณะ'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      students: getAllDefaultStudents(
        settings.additionalSubjectP4Name,
        settings.additionalSubjectP56Name
      ),
      message: `เกิดข้อผิดพลาด: ${err.message}`
    };
  }
}
