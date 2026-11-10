import test from 'node:test';
import assert from 'node:assert/strict';
import { anonymizeRecords, parseGradeValue, normalizeStatus, RawStudentRow } from './anonymizer';
import { computeGradeAuditStats } from './gradeCalculations';

test('parseGradeValue handles various formats cleanly', () => {
  assert.equal(parseGradeValue(85.5), 85.5);
  assert.equal(parseGradeValue('90%'), 90);
  assert.equal(parseGradeValue(' 78.2 '), 78.2);
  assert.equal(parseGradeValue('N/A'), null);
  assert.equal(parseGradeValue(''), null);
  assert.equal(parseGradeValue(null), null);
});

test('anonymizeRecords replaces raw identities with S001..S00N', () => {
  const sampleRows: RawStudentRow[] = [
    { studentId: '2021-00123', studentName: 'Juan Dela Cruz', prelim: 80, midterm: 82, finalExam: 85, status: 'Passed' },
    { studentId: '2021-00456', studentName: 'Maria Santos', prelim: 70, midterm: 65, finalExam: 60, status: 'Failed' },
    { studentId: '2021-00789', studentName: 'Pedro Penduko', prelim: 76, midterm: 0, finalExam: null, status: 'Dropped' }
  ];

  const anonymized = anonymizeRecords(sampleRows, 75);
  assert.equal(anonymized.length, 3);
  assert.equal(anonymized[0].anonymousCode, 'S001');
  assert.equal(anonymized[1].anonymousCode, 'S002');
  assert.equal(anonymized[2].anonymousCode, 'S003');

  // Verify no original names or raw student IDs leak into output
  assert.equal((anonymized[0] as unknown as Record<string, unknown>).studentName, undefined);
  assert.equal((anonymized[0] as unknown as Record<string, unknown>).studentId, undefined);

  assert.equal(anonymized[0].status, 'Passed');
  assert.equal(anonymized[1].status, 'Failed');
  assert.equal(anonymized[2].status, 'Dropped');
});

test('computeGradeAuditStats calculates exact pass/fail/drop rates and peak failure period', () => {
  const sampleRecords = anonymizeRecords([
    { prelim: 88, midterm: 85, finalExam: 90, quizzes: 88, activities: 92, attendance: 95, finalGrade: 88, status: 'Passed' },
    { prelim: 78, midterm: 79, finalExam: 82, quizzes: 80, activities: 85, attendance: 90, finalGrade: 80, status: 'Passed' },
    { prelim: 80, midterm: 60, finalExam: 62, quizzes: 65, activities: 70, attendance: 60, finalGrade: 67, status: 'Failed' },
    { prelim: 60, midterm: 55, finalExam: 50, quizzes: 50, activities: 55, attendance: 45, finalGrade: 55, status: 'Failed' },
    { prelim: 76, midterm: null, finalExam: null, quizzes: 40, activities: 30, attendance: 20, finalGrade: null, status: 'Dropped' }
  ], 75);

  const stats = computeGradeAuditStats(sampleRecords, 75);

  assert.equal(stats.totalStudents, 5);
  assert.equal(stats.passedCount, 2);
  assert.equal(stats.passedRate, 40);
  assert.equal(stats.failedCount, 2);
  assert.equal(stats.failedRate, 40);
  assert.equal(stats.droppedCount, 1);
  assert.equal(stats.droppedRate, 20);

  // Peak failure check
  // Prelim failures: score < 75 -> 1 student (score 60)
  // Midterm failures: score < 75 -> 2 students (score 60, 55)
  // FinalExam failures: score < 75 -> 2 students (score 62, 50)
  assert.equal(stats.failurePeakPeriod, 'Midterm');

  // Prelim passed but failed later:
  // S003 had prelim 80, but failed (finalGrade 67)
  // S005 had prelim 76, but dropped
  assert.equal(stats.prelimPassLaterFailedCount, 2);
  assert.deepEqual(stats.prelimPassLaterFailedCodes, ['S003', 'S005']);

  // Attendance correlation
  assert.equal(stats.correlations.attendance.correlationStrength, 'Strong');
  assert.ok(stats.correlations.attendance.avgForPassed > stats.correlations.attendance.avgForFailedOrDropped);
});
