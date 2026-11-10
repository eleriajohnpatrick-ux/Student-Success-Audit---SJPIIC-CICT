/**
 * Deterministic Academic Statistical and QA Correlation Calculations
 *
 * All computations are performed strictly in TypeScript code to guarantee
 * arithmetic accuracy without hallucination risk.
 */

import { AnonymizedStudentRecord } from './anonymizer';

export interface ExamPeriodSummary {
  period: 'Prelim' | 'Midterm' | 'Final';
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  passCount: number;
  failCount: number;
  passRate: number;
  distribution: {
    below75: number;
    range75to79: number;
    range80to84: number;
    range85to89: number;
    range90plus: number;
  };
}

export interface CorrelationInsight {
  metricName: string;
  avgForPassed: number;
  avgForFailedOrDropped: number;
  difference: number;
  correlationStrength: 'Strong' | 'Moderate' | 'Weak' | 'Insufficient Data';
  observation: string;
}

export interface ComputedAuditStats {
  totalStudents: number;
  passedCount: number;
  passedRate: number;
  failedCount: number;
  failedRate: number;
  droppedCount: number;
  droppedRate: number;
  incompleteCount: number;
  incompleteRate: number;
  
  examSummaries: {
    prelim: ExamPeriodSummary;
    midterm: ExamPeriodSummary;
    finalExam: ExamPeriodSummary;
  };

  failurePeakPeriod: 'Prelim' | 'Midterm' | 'Final' | 'Uniform';
  prelimPassLaterFailedCount: number;
  prelimPassLaterFailedCodes: string[];
  
  trendSummary: {
    improvedCount: number;
    declinedCount: number;
    stableCount: number;
  };

  correlations: {
    attendance: CorrelationInsight;
    quizzes: CorrelationInsight;
    activities: CorrelationInsight;
  };
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function summarizePeriod(
  records: AnonymizedStudentRecord[],
  field: 'prelim' | 'midterm' | 'finalExam',
  periodName: 'Prelim' | 'Midterm' | 'Final',
  passingScore: number = 75
): ExamPeriodSummary {
  const scores: number[] = [];
  records.forEach((r) => {
    const val = r[field];
    if (val !== null && typeof val === 'number') {
      scores.push(val);
    }
  });

  const count = scores.length;
  if (count === 0) {
    return {
      period: periodName,
      count: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      passCount: 0,
      failCount: 0,
      passRate: 0,
      distribution: {
        below75: 0,
        range75to79: 0,
        range80to84: 0,
        range85to89: 0,
        range90plus: 0
      }
    };
  }

  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const mean = Math.round((sum / count) * 100) / 100;
  const median = Math.round(calculateMedian(scores) * 100) / 100;
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  const passCount = scores.filter((s) => s >= passingScore).length;
  const failCount = count - passCount;
  const passRate = Math.round((passCount / count) * 1000) / 10;

  const distribution = {
    below75: scores.filter((s) => s < 75).length,
    range75to79: scores.filter((s) => s >= 75 && s < 80).length,
    range80to84: scores.filter((s) => s >= 80 && s < 85).length,
    range85to89: scores.filter((s) => s >= 85 && s < 90).length,
    range90plus: scores.filter((s) => s >= 90).length
  };

  return {
    period: periodName,
    count,
    mean,
    median,
    min,
    max,
    passCount,
    failCount,
    passRate,
    distribution
  };
}

function computeMetricCorrelation(
  records: AnonymizedStudentRecord[],
  field: 'attendance' | 'quizzes' | 'activities',
  metricName: string
): CorrelationInsight {
  const passedScores: number[] = [];
  const nonPassedScores: number[] = [];

  records.forEach((r) => {
    const val = r[field];
    if (val !== null && typeof val === 'number') {
      if (r.status === 'Passed') {
        passedScores.push(val);
      } else {
        nonPassedScores.push(val);
      }
    }
  });

  if (passedScores.length === 0 && nonPassedScores.length === 0) {
    return {
      metricName,
      avgForPassed: 0,
      avgForFailedOrDropped: 0,
      difference: 0,
      correlationStrength: 'Insufficient Data',
      observation: `No recorded ${metricName.toLowerCase()} data found in eClass import.`
    };
  }

  const avgPassed = passedScores.length > 0
    ? Math.round((passedScores.reduce((a, b) => a + b, 0) / passedScores.length) * 10) / 10
    : 0;

  const avgNonPassed = nonPassedScores.length > 0
    ? Math.round((nonPassedScores.reduce((a, b) => a + b, 0) / nonPassedScores.length) * 10) / 10
    : 0;

  const difference = Math.round((avgPassed - avgNonPassed) * 10) / 10;

  let correlationStrength: 'Strong' | 'Moderate' | 'Weak' | 'Insufficient Data' = 'Weak';
  let observation = '';

  if (Math.abs(difference) >= 15) {
    correlationStrength = 'Strong';
    observation = `Strong correlation: Passing students averaged ${avgPassed}% in ${metricName.toLowerCase()} compared to ${avgNonPassed}% for failed/dropped students (delta of ${difference} points).`;
  } else if (Math.abs(difference) >= 8) {
    correlationStrength = 'Moderate';
    observation = `Moderate correlation: ${metricName} shows an 8-15 point performance gap between successful and non-successful students.`;
  } else {
    correlationStrength = 'Weak';
    observation = `${metricName} had minimal divergence (${difference} points) between passed and non-passed students.`;
  }

  return {
    metricName,
    avgForPassed: avgPassed,
    avgForFailedOrDropped: avgNonPassed,
    difference,
    correlationStrength,
    observation
  };
}

export function computeGradeAuditStats(
  records: AnonymizedStudentRecord[],
  passingScore: number = 75
): ComputedAuditStats {
  const totalStudents = records.length;
  if (totalStudents === 0) {
    const emptySummary = (name: 'Prelim' | 'Midterm' | 'Final'): ExamPeriodSummary => ({
      period: name,
      count: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      passCount: 0,
      failCount: 0,
      passRate: 0,
      distribution: { below75: 0, range75to79: 0, range80to84: 0, range85to89: 0, range90plus: 0 }
    });
    return {
      totalStudents: 0,
      passedCount: 0,
      passedRate: 0,
      failedCount: 0,
      failedRate: 0,
      droppedCount: 0,
      droppedRate: 0,
      incompleteCount: 0,
      incompleteRate: 0,
      examSummaries: {
        prelim: emptySummary('Prelim'),
        midterm: emptySummary('Midterm'),
        finalExam: emptySummary('Final')
      },
      failurePeakPeriod: 'Uniform',
      prelimPassLaterFailedCount: 0,
      prelimPassLaterFailedCodes: [],
      trendSummary: { improvedCount: 0, declinedCount: 0, stableCount: 0 },
      correlations: {
        attendance: { metricName: 'Attendance', avgForPassed: 0, avgForFailedOrDropped: 0, difference: 0, correlationStrength: 'Insufficient Data', observation: 'No data' },
        quizzes: { metricName: 'Quizzes', avgForPassed: 0, avgForFailedOrDropped: 0, difference: 0, correlationStrength: 'Insufficient Data', observation: 'No data' },
        activities: { metricName: 'Laboratory / Activities', avgForPassed: 0, avgForFailedOrDropped: 0, difference: 0, correlationStrength: 'Insufficient Data', observation: 'No data' }
      }
    };
  }

  const passedCount = records.filter((r) => r.status === 'Passed').length;
  const failedCount = records.filter((r) => r.status === 'Failed').length;
  const droppedCount = records.filter((r) => r.status === 'Dropped').length;
  const incompleteCount = records.filter((r) => r.status === 'Incomplete').length;

  const passedRate = Math.round((passedCount / totalStudents) * 1000) / 10;
  const failedRate = Math.round((failedCount / totalStudents) * 1000) / 10;
  const droppedRate = Math.round((droppedCount / totalStudents) * 1000) / 10;
  const incompleteRate = Math.round((incompleteCount / totalStudents) * 1000) / 10;

  const prelimSummary = summarizePeriod(records, 'prelim', 'Prelim', passingScore);
  const midtermSummary = summarizePeriod(records, 'midterm', 'Midterm', passingScore);
  const finalSummary = summarizePeriod(records, 'finalExam', 'Final', passingScore);

  // Failure peak period
  const prelimFail = prelimSummary.failCount;
  const midFail = midtermSummary.failCount;
  const finFail = finalSummary.failCount;

  let failurePeakPeriod: 'Prelim' | 'Midterm' | 'Final' | 'Uniform' = 'Prelim';
  if (midFail > prelimFail && midFail >= finFail) {
    failurePeakPeriod = 'Midterm';
  } else if (finFail > prelimFail && finFail > midFail) {
    failurePeakPeriod = 'Final';
  } else if (prelimFail === midFail && midFail === finFail) {
    failurePeakPeriod = 'Uniform';
  }

  // Students who passed Prelim but failed later (Midterm, Final, or overall)
  const prelimPassLaterFailedCodes: string[] = [];
  records.forEach((r) => {
    if (r.prelim !== null && r.prelim >= passingScore) {
      if (
        r.status === 'Failed' ||
        r.status === 'Dropped' ||
        (r.finalExam !== null && r.finalExam < passingScore) ||
        (r.midterm !== null && r.midterm < passingScore)
      ) {
        prelimPassLaterFailedCodes.push(r.anonymousCode);
      }
    }
  });

  // Prelim to Final trajectory (for students with both scores)
  let improvedCount = 0;
  let declinedCount = 0;
  let stableCount = 0;

  records.forEach((r) => {
    if (r.prelim !== null && r.finalExam !== null) {
      const diff = r.finalExam - r.prelim;
      if (diff >= 3) {
        improvedCount++;
      } else if (diff <= -3) {
        declinedCount++;
      } else {
        stableCount++;
      }
    }
  });

  // Metric correlations
  const attendance = computeMetricCorrelation(records, 'attendance', 'Attendance');
  const quizzes = computeMetricCorrelation(records, 'quizzes', 'Quizzes');
  const activities = computeMetricCorrelation(records, 'activities', 'Laboratory & Activities');

  return {
    totalStudents,
    passedCount,
    passedRate,
    failedCount,
    failedRate,
    droppedCount,
    droppedRate,
    incompleteCount,
    incompleteRate,
    examSummaries: {
      prelim: prelimSummary,
      midterm: midtermSummary,
      finalExam: finalSummary
    },
    failurePeakPeriod,
    prelimPassLaterFailedCount: prelimPassLaterFailedCodes.length,
    prelimPassLaterFailedCodes,
    trendSummary: {
      improvedCount,
      declinedCount,
      stableCount
    },
    correlations: {
      attendance,
      quizzes,
      activities
    }
  };
}
