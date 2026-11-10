import { AnonymizedStudentRecord } from './utils/anonymizer';
import { ComputedAuditStats } from './utils/gradeCalculations';

export interface InstructorProfile {
  uid: string;
  email: string;
  displayName: string;
  department: string;
  program: string;
  subjectsTaught: string;
  teachingStrategies: string;
  assessmentStrategy: string;
  updatedAt?: string;
}

export interface CourseInfo {
  subjectCode: string;
  subjectTitle: string;
  section: string;
  schoolYear: string;
  semester: string;
}

export interface RootCauseItem {
  cause: string;
  evidence: string;
  contributingFactor?: string;
  preventionOpportunity?: string;
}

export interface StrategyScorecard {
  overallRating: 'Effective' | 'Partially Effective' | 'Not Yet Effective' | 'Insufficient Data';
  rationale: string;
  teachingEffectiveness: {
    rating: 'Effective' | 'Partially Effective' | 'Not Yet Effective';
    evidence: string;
  };
  assessmentEffectiveness: {
    rating: 'Effective' | 'Partially Effective' | 'Not Yet Effective';
    evidence: string;
  };
}

export interface CapaActionItem {
  action: string;
  rootCause?: string;
  targetRisk?: string;
  owner: string;
  timeline: string;
  successMeasure: string;
}

export interface PdcaCapaPlan {
  correctiveActions: CapaActionItem[];
  preventiveActions: CapaActionItem[];
}

export interface QaAuditResult {
  executiveSummary: string;
  rootCausesFailure: RootCauseItem[];
  rootCausesDrop: RootCauseItem[];
  strategyScorecard: StrategyScorecard;
  pdcaCapaPlan: PdcaCapaPlan;
  chedObeAlignment?: {
    iloAttainmentStatus: 'Attained' | 'Partially Attained' | 'At Risk';
    observations: string;
  };
}

export interface SavedAudit {
  id: string;
  userId: string;
  instructorName: string;
  instructorEmail: string;
  courseInfo: CourseInfo;
  stats: ComputedAuditStats;
  qaFindings: QaAuditResult;
  createdAt: string;
}

export interface InteractionMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SavedInteraction {
  id: string;
  userId: string;
  auditId: string;
  prompt: string;
  response: string;
  timestamp: string;
  instructorEmail?: string;
}

export interface CompanyBasis {
  id: string;
  title: string;
  passingGrade: number;
  gradingSystem: string;
  gradeWeights: {
    prelim: number;
    midterm: number;
    final: number;
  };
  attendancePolicy: string;
  chedObeStandards: string;
  qualityTargets: {
    targetPassingRate: number;
    maxDropoutRate: number;
  };
  extractedDocText?: string;
  uploadedBy?: string;
  updatedAt?: string;
}
