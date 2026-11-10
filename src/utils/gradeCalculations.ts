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

export type RiskSeverity = 'Critical' | 'High' | 'Moderate';

export type AtRiskTrajectory = 
  | 'Consistent Drop' 
  | 'Midterm Collapse' 
  | 'Final Plummet' 
  | 'Gradual Decline' 
  | 'Attrition / Dropped';

export interface AtRiskStudent {
  anonymousCode: string;
  prelim: number | null;
  midterm: number | null;
  finalExam: number | null;
  scoreDrop: number;
  dropPercentage: number;
  trajectory: AtRiskTrajectory;
  severity: RiskSeverity;
  status: 'Passed' | 'Failed' | 'Dropped' | 'Incomplete';
  attendance: number | null;
  quizzes: number | null;
  activities: number | null;
  finalGrade: number | null;
  contributingFactors: string[];
  recommendedIntervention: string;
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

  atRiskStudents: AtRiskStudent[];

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
      atRiskStudents: [],
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

  // Identify specific at-risk students showing downward trend from Prelim to Final
  const atRiskStudents: AtRiskStudent[] = [];

  records.forEach((r) => {
    if (r.prelim === null) return;

    let isDownwardTrend = false;
    let scoreDrop = 0;
    let dropPercentage = 0;

    if (r.finalExam !== null) {
      scoreDrop = Math.round((r.prelim - r.finalExam) * 10) / 10;
      dropPercentage = r.prelim > 0 ? Math.round(((r.prelim - r.finalExam) / r.prelim) * 1000) / 10 : 0;
      
      if (scoreDrop >= 3 || (r.prelim >= passingScore && (r.finalExam < passingScore || r.status === 'Failed'))) {
        isDownwardTrend = true;
      }
    } else {
      if (r.status === 'Dropped' || r.status === 'Failed' || r.status === 'Incomplete') {
        isDownwardTrend = true;
        scoreDrop = r.prelim;
        dropPercentage = 100;
      }
    }

    if (!isDownwardTrend) return;

    // Determine trajectory pattern
    let trajectory: AtRiskTrajectory = 'Gradual Decline';
    if (r.status === 'Dropped') {
      trajectory = 'Attrition / Dropped';
    } else if (r.midterm !== null && r.finalExam !== null) {
      if (r.prelim > r.midterm && r.midterm > r.finalExam) {
        trajectory = 'Consistent Drop';
      } else if (r.midterm < r.prelim && r.midterm < r.finalExam) {
        trajectory = 'Midterm Collapse';
      } else if (r.midterm >= r.prelim && r.finalExam < r.midterm) {
        trajectory = 'Final Plummet';
      } else {
        trajectory = 'Gradual Decline';
      }
    }

    // Determine severity rating
    let severity: RiskSeverity = 'Moderate';
    if (
      r.status === 'Dropped' ||
      (r.prelim >= passingScore && r.status === 'Failed') ||
      scoreDrop >= 12 ||
      (r.finalExam !== null && r.finalExam < 60)
    ) {
      severity = 'Critical';
    } else if (
      scoreDrop >= 6 ||
      r.status === 'Failed' ||
      (r.midterm !== null && r.midterm < passingScore && scoreDrop >= 3)
    ) {
      severity = 'High';
    } else {
      severity = 'Moderate';
    }

    // Identify specific contributing factors
    const contributingFactors: string[] = [];
    if (scoreDrop >= 12 && r.finalExam !== null) {
      contributingFactors.push(`Significant ${scoreDrop.toFixed(1)}-point score drop between Prelim (${r.prelim}) and Final (${r.finalExam})`);
    } else if (scoreDrop >= 3 && r.finalExam !== null) {
      contributingFactors.push(`${scoreDrop.toFixed(1)}-point decline from Prelim to Final examination`);
    }

    if (r.attendance !== null && r.attendance < 75) {
      contributingFactors.push(`Low attendance record (${r.attendance}% vs 75% institutional threshold)`);
    }
    if (r.activities !== null && r.activities < 75) {
      contributingFactors.push(`Laboratory and practical exercise deficit (${r.activities}% vs 75% target)`);
    }
    if (r.quizzes !== null && r.quizzes < 75) {
      contributingFactors.push(`Formative quiz retention deficit (${r.quizzes}% vs 75% target)`);
    }
    if (r.midterm !== null && r.midterm < passingScore) {
      contributingFactors.push(`Midterm exam stumbling block (${r.midterm} vs ${passingScore} passing benchmark)`);
    }
    if (r.status === 'Dropped') {
      contributingFactors.push('Uncompleted term requirements / stopped attending following Prelim');
    }
    if (r.prelim >= passingScore && (r.status === 'Failed' || (r.finalExam !== null && r.finalExam < passingScore))) {
      contributingFactors.push(`Gateway failure: Passed Prelim (${r.prelim}) but failed Final assessment (${r.finalExam ?? 'Incomplete'})`);
    }

    if (contributingFactors.length === 0) {
      contributingFactors.push(`Downward trajectory of ${scoreDrop.toFixed(1)} points across examination periods`);
    }

    // Recommended pedagogical intervention
    let recommendedIntervention = '';
    if (r.status === 'Dropped' || (r.attendance !== null && r.attendance < 65)) {
      recommendedIntervention = 'LMS re-engagement protocol, CICT academic guidance referral & attendance recovery plan';
    } else if (r.activities !== null && r.activities < 75) {
      recommendedIntervention = 'Hands-on coding lab remediation, pair programming in CICT lab & practical exercise make-up';
    } else if (r.quizzes !== null && r.quizzes < 75) {
      recommendedIntervention = 'Summative quiz retrieval practice, concept mapping drills & weekly syntax diagnostic review';
    } else if (severity === 'Critical') {
      recommendedIntervention = 'Immediate 1-on-1 faculty code conference, prerequisite diagnostics & formal academic recovery contract';
    } else if (severity === 'High') {
      recommendedIntervention = 'Peer-mentoring pairing in CICT computer lab & structured milestone checkpoint before next period';
    } else {
      recommendedIntervention = 'Targeted post-exam error analysis, revision of weak Final competencies & study schedule alignment';
    }

    atRiskStudents.push({
      anonymousCode: r.anonymousCode,
      prelim: r.prelim,
      midterm: r.midterm,
      finalExam: r.finalExam,
      scoreDrop,
      dropPercentage,
      trajectory,
      severity,
      status: r.status,
      attendance: r.attendance,
      quizzes: r.quizzes,
      activities: r.activities,
      finalGrade: r.finalGrade,
      contributingFactors,
      recommendedIntervention
    });
  });

  const severityRank: Record<RiskSeverity, number> = { Critical: 1, High: 2, Moderate: 3 };
  atRiskStudents.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity];
    }
    return b.scoreDrop - a.scoreDrop;
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
    atRiskStudents,
    correlations: {
      attendance,
      quizzes,
      activities
    }
  };
}
