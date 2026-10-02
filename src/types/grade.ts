export type CurriculumType = 'p1_3' | 'p4' | 'p5_6';

export interface SubjectItem {
  id: string;
  name: string;
  maxScore: number;
  earnedScore: number;
  remarks?: string;
  isAdditional?: boolean;
}

export interface StudentRecord {
  id: string; // 5-digit student ID e.g. "13518"
  seatNo: number; // เลขที่
  name: string; // ชื่อ-สกุล
  gradeLevel: string; // e.g. "ชั้นประถมศึกษาปีที่ 1/1"
  curriculum: CurriculumType;
  academicYear: string; // "2569"
  subjects: SubjectItem[];
  totalScore: number;
  maxPossibleScore: number;
  averagePercentage: number;
  gpaText?: string;
  evaluationRemarks?: string;
  additionalSubjectName?: string;
  additionalSubjectScore?: number;
  // Holistic development
  readingAnalysisEvaluation?: 'ดีเยี่ยม' | 'ดี' | 'ผ่าน' | 'ไม่ผ่าน';
  desiredCharacteristicsEvaluation?: 'ดีเยี่ยม' | 'ดี' | 'ผ่าน' | 'ไม่ผ่าน';
  activitiesEvaluation?: 'ผ่าน' | 'ไม่ผ่าน';
  teacherRemarks?: string;
}

export interface GoogleSheetSettings {
  sheetUrl: string;
  sheetP13Name: string;
  sheetP4Name: string;
  sheetP56Name: string;
  additionalSubjectP4Name: string;
  additionalSubjectP56Name: string;
  useLiveSheet: boolean;
  lastSyncTime?: string;
}

export interface SystemSettings {
  academicYear: string;
  schoolName: string;
  subDistrict: string;
  issueDate?: string; // วันที่ออกเอกสาร e.g. "31 มีนาคม 2569"
  adminPasswordHash?: string; // stored or default password
  lastUpdated?: string;
}

