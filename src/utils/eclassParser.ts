/**
 * In-browser eClass / LMS Gradebook parser and schema validator
 * Supports CSV and XLSX parsing via SheetJS (xlsx)
 */

import * as XLSX from 'xlsx';
import { RawStudentRow } from './anonymizer';

export interface ColumnMapping {
  studentIdCol: string;
  studentNameCol: string;
  prelimCol: string;
  midtermCol: string;
  finalExamCol: string;
  quizzesCol: string;
  activitiesCol: string;
  attendanceCol: string;
  finalGradeCol: string;
  statusCol: string;
}

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, unknown>[];
  detectedMapping: ColumnMapping;
  sampleRows: Record<string, unknown>[];
  totalRawRows: number;
}

/**
 * Fuzzy matches column headers to probable eClass gradebook fields
 */
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const cand of candidates) {
      const match = headers.find((h) => {
        const clean = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return clean.includes(cand);
      });
      if (match) return match;
    }
    return '';
  };

  return {
    studentIdCol: findMatch(['studentid', 'idnumber', 'studentno', 'idno', 'id']),
    studentNameCol: findMatch(['studentname', 'fullname', 'name', 'student', 'lastfirst']),
    prelimCol: findMatch(['prelimexam', 'prelimgrade', 'prelim', 'prelims']),
    midtermCol: findMatch(['midtermexam', 'midtermgrade', 'midterm', 'midterms']),
    finalExamCol: findMatch(['finalexam', 'finalsgrade', 'finalgradeexam', 'finalexamgrade', 'finals', 'final']),
    quizzesCol: findMatch(['quizzes', 'quiz', 'quiztotal', 'quizaverage']),
    activitiesCol: findMatch(['activities', 'laboratory', 'activity', 'lab', 'labs', 'projects']),
    attendanceCol: findMatch(['attendance', 'att', 'attendancepct', 'attendancescore']),
    finalGradeCol: findMatch(['finalgrade', 'semestralgrade', 'semgrade', 'computedgrade', 'overall']),
    statusCol: findMatch(['status', 'remarks', 'remark', 'gradeevaluation', 'eval'])
  };
}

/**
 * Parses file binary into raw rows and detected columns
 */
export async function parseEClassFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to 2D array to accurately detect the header row (skipping school header lines if any)
  const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rows.length === 0) {
    throw new Error('The uploaded file appears to be completely empty.');
  }

  // Find the header row (row containing most identifiable columns like student, prelim, id, etc.)
  let headerRowIndex = 0;
  let maxScore = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    let score = 0;
    for (const cell of row) {
      const str = String(cell).toLowerCase();
      if (str.includes('id') || str.includes('student') || str.includes('name') || 
          str.includes('prelim') || str.includes('grade') || str.includes('final') || str.includes('midterm')) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  const rawHeaderRow = rows[headerRowIndex] || [];
  const headers = rawHeaderRow.map((h, idx) => (h ? String(h).trim() : `Column_${idx + 1}`));

  const dataRows: Record<string, unknown>[] = [];
  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    // Check if row is not completely empty
    const hasData = row.some((c) => c !== '' && c !== null && c !== undefined);
    if (!hasData) continue;

    const rowObj: Record<string, unknown> = {};
    headers.forEach((hdr, colIdx) => {
      rowObj[hdr] = row[colIdx] ?? '';
    });
    dataRows.push(rowObj);
  }

  const detectedMapping = autoDetectColumns(headers);

  return {
    headers,
    rawRows: dataRows,
    detectedMapping,
    sampleRows: dataRows.slice(0, 5),
    totalRawRows: dataRows.length
  };
}

/**
 * Transforms raw parsed rows into normalized RawStudentRow based on user's column mapping
 */
export function applyColumnMapping(
  rawRows: Record<string, unknown>[],
  mapping: ColumnMapping
): RawStudentRow[] {
  return rawRows.map((row) => ({
    studentId: mapping.studentIdCol ? (row[mapping.studentIdCol] as string) : undefined,
    studentName: mapping.studentNameCol ? (row[mapping.studentNameCol] as string) : undefined,
    prelim: mapping.prelimCol ? (row[mapping.prelimCol] as number | string) : null,
    midterm: mapping.midtermCol ? (row[mapping.midtermCol] as number | string) : null,
    finalExam: mapping.finalExamCol ? (row[mapping.finalExamCol] as number | string) : null,
    quizzes: mapping.quizzesCol ? (row[mapping.quizzesCol] as number | string) : null,
    activities: mapping.activitiesCol ? (row[mapping.activitiesCol] as number | string) : null,
    attendance: mapping.attendanceCol ? (row[mapping.attendanceCol] as number | string) : null,
    finalGrade: mapping.finalGradeCol ? (row[mapping.finalGradeCol] as number | string) : null,
    status: mapping.statusCol ? (row[mapping.statusCol] as string) : null
  }));
}

/**
 * Realistic SJPIIC CICT Sample Gradebook Datasets for instant auditing & demonstration
 */
export const SAMPLE_DATASETS: {
  id: string;
  name: string;
  courseCode: string;
  courseTitle: string;
  section: string;
  schoolYear: string;
  semester: string;
  description: string;
  data: RawStudentRow[];
}[] = [
  {
    id: 'cc102-prog1',
    name: 'CC102 - Fundamentals of Programming (Section BSIT-1A)',
    courseCode: 'CC102',
    courseTitle: 'Fundamentals of Programming (Java/Python)',
    section: 'BSIT-1A',
    schoolYear: '2025-2026',
    semester: '1st Semester',
    description: 'High midterm dropout rate due to steep jump in logic syntax and pointer/OOP complexity; lab practice attendance proved decisive.',
    data: [
      { studentId: '2025-0101', studentName: 'Aldrin A.', prelim: 88, midterm: 84, finalExam: 89, quizzes: 85, activities: 90, attendance: 96, finalGrade: 87.4, status: 'Passed' },
      { studentId: '2025-0102', studentName: 'Bea B.', prelim: 91, midterm: 92, finalExam: 94, quizzes: 90, activities: 95, attendance: 98, finalGrade: 92.5, status: 'Passed' },
      { studentId: '2025-0103', studentName: 'Carlo C.', prelim: 79, midterm: 76, finalExam: 82, quizzes: 75, activities: 80, attendance: 90, finalGrade: 79.1, status: 'Passed' },
      { studentId: '2025-0104', studentName: 'Danilo D.', prelim: 82, midterm: 68, finalExam: 72, quizzes: 70, activities: 65, attendance: 82, finalGrade: 73.8, status: 'Failed' },
      { studentId: '2025-0105', studentName: 'Elena E.', prelim: 76, midterm: 58, finalExam: 62, quizzes: 60, activities: 55, attendance: 70, finalGrade: 65.0, status: 'Failed' },
      { studentId: '2025-0106', studentName: 'Francis F.', prelim: 74, midterm: 0, finalExam: null, quizzes: 30, activities: 20, attendance: 40, finalGrade: null, status: 'Dropped' },
      { studentId: '2025-0107', studentName: 'Grace G.', prelim: 85, midterm: 80, finalExam: 84, quizzes: 82, activities: 88, attendance: 94, finalGrade: 83.1, status: 'Passed' },
      { studentId: '2025-0108', studentName: 'Henry H.', prelim: 70, midterm: 60, finalExam: 65, quizzes: 62, activities: 60, attendance: 75, finalGrade: 65.0, status: 'Failed' },
      { studentId: '2025-0109', studentName: 'Ivy I.', prelim: 95, midterm: 96, finalExam: 98, quizzes: 94, activities: 98, attendance: 100, finalGrade: 96.5, status: 'Passed' },
      { studentId: '2025-0110', studentName: 'John J.', prelim: 77, midterm: null, finalExam: null, quizzes: 25, activities: 15, attendance: 35, finalGrade: null, status: 'Dropped' },
      { studentId: '2025-0111', studentName: 'Kyla K.', prelim: 84, midterm: 78, finalExam: 80, quizzes: 79, activities: 82, attendance: 91, finalGrade: 80.6, status: 'Passed' },
      { studentId: '2025-0112', studentName: 'Leo L.', prelim: 68, midterm: 54, finalExam: 50, quizzes: 48, activities: 50, attendance: 60, finalGrade: 56.6, status: 'Failed' },
      { studentId: '2025-0113', studentName: 'Mia M.', prelim: 89, midterm: 86, finalExam: 90, quizzes: 88, activities: 92, attendance: 95, finalGrade: 88.5, status: 'Passed' },
      { studentId: '2025-0114', studentName: 'Neil N.', prelim: 78, midterm: 75, finalExam: 77, quizzes: 76, activities: 78, attendance: 88, finalGrade: 76.7, status: 'Passed' },
      { studentId: '2025-0115', studentName: 'Olivia O.', prelim: 75, midterm: 62, finalExam: 70, quizzes: 68, activities: 64, attendance: 78, finalGrade: 69.1, status: 'Failed' },
      { studentId: '2025-0116', studentName: 'Patrick P.', prelim: 86, midterm: 88, finalExam: 91, quizzes: 85, activities: 89, attendance: 92, finalGrade: 88.6, status: 'Passed' },
      { studentId: '2025-0117', studentName: 'Queen Q.', prelim: 71, midterm: 0, finalExam: null, quizzes: 20, activities: 10, attendance: 25, finalGrade: null, status: 'Dropped' },
      { studentId: '2025-0118', studentName: 'Ronnie R.', prelim: 80, midterm: 81, finalExam: 83, quizzes: 80, activities: 84, attendance: 90, finalGrade: 81.5, status: 'Passed' },
      { studentId: '2025-0119', studentName: 'Sarah S.', prelim: 93, midterm: 90, finalExam: 95, quizzes: 92, activities: 96, attendance: 97, finalGrade: 92.9, status: 'Passed' },
      { studentId: '2025-0120', studentName: 'Tom T.', prelim: 65, midterm: 58, finalExam: 60, quizzes: 55, activities: 58, attendance: 65, finalGrade: 60.9, status: 'Failed' }
    ]
  },
  {
    id: 'it201-dsa',
    name: 'IT201 - Data Structures & Algorithms (Section BSCS-2A)',
    courseCode: 'IT201',
    courseTitle: 'Data Structures and Algorithms',
    section: 'BSCS-2A',
    schoolYear: '2025-2026',
    semester: '1st Semester',
    description: 'Final exam bottleneck on dynamic programming and graph trees; high laboratory quiz alignment.',
    data: [
      { studentId: '2024-0201', studentName: 'Alice A.', prelim: 90, midterm: 88, finalExam: 82, quizzes: 88, activities: 90, attendance: 96, finalGrade: 86.2, status: 'Passed' },
      { studentId: '2024-0202', studentName: 'Bob B.', prelim: 85, midterm: 80, finalExam: 71, quizzes: 74, activities: 78, attendance: 88, finalGrade: 77.9, status: 'Passed' },
      { studentId: '2024-0203', studentName: 'Charlie C.', prelim: 88, midterm: 82, finalExam: 68, quizzes: 70, activities: 72, attendance: 85, finalGrade: 78.2, status: 'Passed' },
      { studentId: '2024-0204', studentName: 'Diana D.', prelim: 76, midterm: 70, finalExam: 58, quizzes: 60, activities: 65, attendance: 75, finalGrade: 67.0, status: 'Failed' },
      { studentId: '2024-0205', studentName: 'Edward E.', prelim: 94, midterm: 95, finalExam: 92, quizzes: 93, activities: 96, attendance: 98, finalGrade: 93.5, status: 'Passed' },
      { studentId: '2024-0206', studentName: 'Fiona F.', prelim: 82, midterm: 65, finalExam: 55, quizzes: 58, activities: 60, attendance: 72, finalGrade: 66.1, status: 'Failed' },
      { studentId: '2024-0207', studentName: 'George G.', prelim: 72, midterm: 0, finalExam: null, quizzes: 35, activities: 20, attendance: 30, finalGrade: null, status: 'Dropped' },
      { studentId: '2024-0208', studentName: 'Hannah H.', prelim: 86, midterm: 84, finalExam: 80, quizzes: 82, activities: 85, attendance: 92, finalGrade: 83.0, status: 'Passed' },
      { studentId: '2024-0209', studentName: 'Ian I.', prelim: 78, midterm: 75, finalExam: 76, quizzes: 75, activities: 78, attendance: 89, finalGrade: 76.3, status: 'Passed' },
      { studentId: '2024-0210', studentName: 'Jane J.', prelim: 64, midterm: 52, finalExam: 48, quizzes: 45, activities: 50, attendance: 60, finalGrade: 54.0, status: 'Failed' }
    ]
  }
];
