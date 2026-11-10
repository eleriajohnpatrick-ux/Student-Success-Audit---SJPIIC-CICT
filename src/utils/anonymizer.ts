/**
 * RA 10173 (Philippine Data Privacy Act of 2012) Anonymization Engine
 *
 * Ensures all student personally identifiable information (PII) including names,
 * emails, phone numbers, and original institutional IDs are scrubbed or mapped to
 * synthetic pseudonyms (S001, S002, ...) before processing, storage, or transmission.
 */

export interface RawStudentRow {
  studentId?: string | number;
  studentName?: string;
  prelim?: number | string | null;
  midterm?: number | string | null;
  finalExam?: number | string | null;
  quizzes?: number | string | null;
  activities?: number | string | null;
  attendance?: number | string | null;
  finalGrade?: number | string | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface AnonymizedStudentRecord {
  anonymousCode: string; // e.g. S001, S002
  prelim: number | null;
  midterm: number | null;
  finalExam: number | null;
  quizzes: number | null;
  activities: number | null;
  attendance: number | null;
  finalGrade: number | null;
  status: 'Passed' | 'Failed' | 'Dropped' | 'Incomplete';
}

/**
 * Normalizes numerical values, stripping % signs or invalid characters
 */
export function parseGradeValue(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const str = String(val).replace(/%/g, '').trim();
  if (str === '' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'inc' || str.toLowerCase() === 'drp') {
    return null;
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normalizes status strings from LMS eClass exports
 */
export function normalizeStatus(
  explicitStatus: unknown,
  finalGrade: number | null,
  passingThreshold: number = 75
): 'Passed' | 'Failed' | 'Dropped' | 'Incomplete' {
  if (explicitStatus) {
    const s = String(explicitStatus).trim().toUpperCase();
    if (s.includes('DROP') || s === 'DRP' || s === 'D') return 'Dropped';
    if (s.includes('INC') || s.includes('INCOMPLETE') || s === 'I') return 'Incomplete';
    if (s.includes('PASS') || s === 'P') return 'Passed';
    if (s.includes('FAIL') || s === 'F') return 'Failed';
  }

  if (finalGrade === null) {
    return 'Incomplete';
  }

  // Under Philippine CICT grading system, 75.0 (or 3.0 in 1.0-5.0 system) is passing.
  // Standard numerical scale assumed 0-100; if grade <= 5.0 (point scale), <= 3.0 is pass.
  if (passingThreshold <= 5.0) {
    return finalGrade <= passingThreshold ? 'Passed' : 'Failed';
  }

  return finalGrade >= passingThreshold ? 'Passed' : 'Failed';
}

/**
 * Strips PII and returns purely anonymized records
 */
export function anonymizeRecords(
  rows: RawStudentRow[],
  passingThreshold: number = 75
): AnonymizedStudentRecord[] {
  return rows.map((row, index) => {
    const codeNum = String(index + 1).padStart(3, '0');
    const anonymousCode = `S${codeNum}`;

    const prelim = parseGradeValue(row.prelim);
    const midterm = parseGradeValue(row.midterm);
    const finalExam = parseGradeValue(row.finalExam);
    const quizzes = parseGradeValue(row.quizzes);
    const activities = parseGradeValue(row.activities);
    const attendance = parseGradeValue(row.attendance);

    // Compute or extract final grade
    let finalGrade = parseGradeValue(row.finalGrade);
    if (finalGrade === null && prelim !== null && midterm !== null && finalExam !== null) {
      // Standard CHED default: 30% Prelim + 30% Midterm + 40% Final if no explicit final
      finalGrade = Math.round((prelim * 0.3 + midterm * 0.3 + finalExam * 0.4) * 100) / 100;
    }

    const status = normalizeStatus(row.status, finalGrade, passingThreshold);

    return {
      anonymousCode,
      prelim,
      midterm,
      finalExam,
      quizzes,
      activities,
      attendance,
      finalGrade,
      status
    };
  });
}
