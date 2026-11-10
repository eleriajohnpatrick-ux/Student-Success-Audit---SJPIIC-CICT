import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Printer, 
  Save, 
  Sparkles, 
  MessageSquare, 
  TrendingUp, 
  ChevronRight, 
  ShieldCheck,
  UserCheck,
  Clock,
  Target
} from 'lucide-react';
import { CourseInfo, InstructorProfile, QaAuditResult, CompanyBasis, SavedAudit } from '../types';
import { ComputedAuditStats, CorrelationInsight } from '../utils/gradeCalculations';
import { PeriodTrendChart } from './PeriodTrendChart';
import { PeriodProgressionRecharts } from './PeriodProgressionRecharts';
import { StudentAtRiskModule } from './StudentAtRiskModule';

interface AuditReportViewProps {
  user: User | null;
  courseInfo: CourseInfo;
  instructorProfile: InstructorProfile;
  stats: ComputedAuditStats;
  qaResult: QaAuditResult;
  companyBasis: CompanyBasis | null;
  onOpenConsultation: () => void;
  onAuditSaved?: (saved: SavedAudit) => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  user,
  courseInfo,
  instructorProfile,
  stats,
  qaResult,
  companyBasis,
  onOpenConsultation,
  onAuditSaved
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const passingTarget = companyBasis?.qualityTargets?.targetPassingRate ?? 80;
  const maxDropoutTarget = companyBasis?.qualityTargets?.maxDropoutRate ?? 10;

  const meetsPassingTarget = stats.passedRate >= passingTarget;
  const meetsDropoutTarget = stats.droppedRate <= maxDropoutTarget;

  const handleSaveAudit = async () => {
    if (!user) {
      setSaveError('You must be signed in with your verified Google account to persist audits to Firestore.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const auditId = `audit_${courseInfo.subjectCode}_${Date.now()}`;
    const docPath = `users/${user.uid}/audits/${auditId}`;

    const auditToSave: SavedAudit = {
      id: auditId,
      userId: user.uid,
      instructorName: instructorProfile.displayName || user.displayName || 'Instructor',
      instructorEmail: user.email || '',
      courseInfo,
      stats,
      qaFindings: qaResult,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'audits', auditId), auditToSave);
      setSaveSuccess(true);
      if (onAuditSaved) {
        onAuditSaved(auditToSave);
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError('Failed to persist quality audit to Firestore. Please verify permissions or retry.');
      try {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      } catch (logErr) {
        // error logged to console per requirements
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getScorecardColor = (rating: string) => {
    switch (rating) {
      case 'Effective':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
      case 'Partially Effective':
        return 'bg-amber-950/80 text-amber-300 border-amber-600/60';
      case 'Not Yet Effective':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 print:m-0 print:p-0">
      {/* Top Header / Print & Save Toolbar */}
      <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
              FORMAL QA AUDIT REPORT
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {courseInfo.subjectCode} • {courseInfo.section}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {courseInfo.subjectTitle}
          </h2>
          <p className="text-xs text-slate-400">
            Instructor: {instructorProfile.displayName} ({instructorProfile.program}) • {courseInfo.schoolYear}, {courseInfo.semester}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenConsultation}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <MessageSquare className="w-4 h-4 text-amber-300" />
            <span>Consult with Gemini QA Partner</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Download PDF / Print</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAudit}
            disabled={isSaving}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Audit...' : 'Save to Firestore'}</span>
          </button>
        </div>
      </div>

      {/* Save Error Banner with Retry Option */}
      {saveError && (
        <div className="bg-rose-950/80 border border-rose-700/80 p-4 rounded-xl flex items-center justify-between text-xs text-rose-200 print:hidden">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            type="button"
            onClick={handleSaveAudit}
            className="bg-rose-800 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors shrink-0"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-700/80 p-3 rounded-xl flex items-center space-x-2 text-xs text-emerald-200 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Audit report saved to your private Firestore repository (/users/{user?.uid}/audits)!</span>
        </div>
      )}

      {/* Formal Printable Document Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-2">
        {/* Institutional Letterhead */}
        <div className="border-b border-slate-800 pb-6 print:border-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 print:text-blue-900 text-xs font-bold uppercase tracking-widest">
              <span>St. John Paul II College of Davao</span>
              <span>•</span>
              <span>CICT QA Commission</span>
            </div>
            <h1 className="text-2xl font-black text-white print:text-black tracking-tight mt-1">
              Course Learning Outcome & Student Success Audit
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Conducted pursuant to CHED CMO 25 s. 2015 OBE Standards and SJPIIC Academic Quality Assurance Policy
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-700 font-mono">
            <div>Subject: <strong>{courseInfo.subjectCode}</strong> ({courseInfo.section})</div>
            <div>Term: {courseInfo.schoolYear} • {courseInfo.semester}</div>
            <div>Audit Timestamp: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-blue-950/30 border border-blue-900/60 print:bg-slate-50 print:border-slate-300 p-5 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 print:text-blue-900 font-bold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Executive Quality Assurance Summary</span>
          </div>
          <p className="text-sm text-slate-200 print:text-slate-800 leading-relaxed font-medium">
            {qaResult.executiveSummary}
          </p>
        </div>

        {/* 4 High-Level KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Passed */}
          <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/70 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Passed Students</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white print:text-black">
              {stats.passedCount} <span className="text-sm font-normal text-emerald-400">({stats.passedRate}%)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>Target: &gt;={passingTarget}%</span>
              {meetsPassingTarget ? (
                <span className="text-emerald-400 font-bold">✓ Met</span>
              ) : (
                <span className="text-rose-400 font-bold">✗ Below</span>
              )}
            </div>
          </div>

          {/* Failed */}
          <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/70 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Failed Students</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white print:text-black">
              {stats.failedCount} <span className="text-sm font-normal text-rose-400">({stats.failedRate}%)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Passing threshold: &gt;={companyBasis?.passingGrade ?? 75}%
            </div>
          </div>

          {/* Dropped */}
          <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/70 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Dropped / Attrition</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white print:text-black">
              {stats.droppedCount} <span className="text-sm font-normal text-amber-400">({stats.droppedRate}%)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>Max Cap: &lt;={maxDropoutTarget}%</span>
              {meetsDropoutTarget ? (
                <span className="text-emerald-400 font-bold">✓ Compliant</span>
              ) : (
                <span className="text-rose-400 font-bold">✗ Exceeded</span>
              )}
            </div>
          </div>

          {/* Total Enrolled */}
          <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/70 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Enrolled</span>
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white print:text-black">
              {stats.totalStudents} <span className="text-xs font-normal text-slate-400">students</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Incomplete: {stats.incompleteCount} ({stats.incompleteRate}%)
            </div>
          </div>
        </div>

        {/* Recharts Line Chart Visualization: Average Scores & Pass/Fail Progression */}
        <PeriodProgressionRecharts
          stats={stats}
          passingThreshold={companyBasis?.passingGrade ?? 75}
        />

        {/* Examination Periods Trajectory & Distribution Chart */}
        <PeriodTrendChart stats={stats} />

        {/* Student At-Risk & Early Intervention Module */}
        <StudentAtRiskModule
          atRiskStudents={stats.atRiskStudents ?? []}
          totalStudents={stats.totalStudents}
          passingThreshold={companyBasis?.passingGrade ?? 75}
          courseCode={courseInfo.subjectCode}
          courseTitle={courseInfo.subjectTitle}
        />

        {/* Strategy Effectiveness Scorecard */}
        <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/80 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-white print:text-black flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span>Strategy Effectiveness Scorecard</span>
              </h3>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Evaluating pedagogical delivery and assessment alignment based on eClass records
              </p>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center space-x-2 ${getScorecardColor(qaResult.strategyScorecard.overallRating)}`}>
              <span>Overall Rating:</span>
              <span className="uppercase tracking-wider">{qaResult.strategyScorecard.overallRating}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
            <strong className="text-white print:text-black">Evidence-Based Rationale:</strong> {qaResult.strategyScorecard.rationale}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Teaching Strategy */}
            <div className="bg-slate-900/60 print:bg-white p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 print:text-black">
                  Teaching Strategy Alignment
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getScorecardColor(qaResult.strategyScorecard.teachingEffectiveness.rating)}`}>
                  {qaResult.strategyScorecard.teachingEffectiveness.rating}
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed">
                {qaResult.strategyScorecard.teachingEffectiveness.evidence}
              </p>
              <div className="text-[10px] text-slate-400">
                Instructor Methods: {instructorProfile.teachingStrategies}
              </div>
            </div>

            {/* Assessment Strategy */}
            <div className="bg-slate-900/60 print:bg-white p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 print:text-black">
                  Assessment Strategy Alignment
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getScorecardColor(qaResult.strategyScorecard.assessmentEffectiveness.rating)}`}>
                  {qaResult.strategyScorecard.assessmentEffectiveness.rating}
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed">
                {qaResult.strategyScorecard.assessmentEffectiveness.evidence}
              </p>
              <div className="text-[10px] text-slate-400">
                Assessment Policy: {instructorProfile.assessmentStrategy}
              </div>
            </div>
          </div>
        </div>

        {/* Root Causes Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Why Students Failed */}
          <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/80 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-rose-300 print:text-rose-900 flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Root Causes: Why Students Failed</span>
            </h3>

            <div className="space-y-3 text-xs">
              {qaResult.rootCausesFailure.map((item, idx) => (
                <div key={idx} className="bg-slate-900/60 print:bg-white p-3.5 rounded-xl border border-slate-800 print:border-slate-300 space-y-1">
                  <div className="font-bold text-slate-200 print:text-black">{item.cause}</div>
                  <div className="text-slate-400 print:text-slate-600">
                    <strong className="text-blue-300 print:text-blue-800">Evidence:</strong> {item.evidence}
                  </div>
                  {item.contributingFactor && (
                    <div className="text-slate-400 print:text-slate-600 text-[11px]">
                      <strong className="text-amber-400 print:text-amber-700">Contributing Factor:</strong> {item.contributingFactor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Why Students Dropped */}
          <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/80 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-amber-300 print:text-amber-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Root Causes: Why Students Dropped</span>
            </h3>

            <div className="space-y-3 text-xs">
              {qaResult.rootCausesDrop.map((item, idx) => (
                <div key={idx} className="bg-slate-900/60 print:bg-white p-3.5 rounded-xl border border-slate-800 print:border-slate-300 space-y-1">
                  <div className="font-bold text-slate-200 print:text-black">{item.cause}</div>
                  <div className="text-slate-400 print:text-slate-600">
                    <strong className="text-blue-300 print:text-blue-800">Evidence:</strong> {item.evidence}
                  </div>
                  {item.preventionOpportunity && (
                    <div className="text-slate-400 print:text-slate-600 text-[11px]">
                      <strong className="text-emerald-400 print:text-emerald-700">Early Warning Indicator:</strong> {item.preventionOpportunity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Correlations Breakdown */}
        <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-black flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Formative Engagement vs Final Outcome Correlations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {(Object.entries(stats.correlations) as [string, CorrelationInsight][]).map(([key, corr]) => (
              <div key={key} className="bg-slate-900/60 print:bg-white p-3.5 rounded-xl border border-slate-800 print:border-slate-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 print:text-black">{corr.metricName}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                    corr.correlationStrength === 'Strong'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : corr.correlationStrength === 'Moderate'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {corr.correlationStrength}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 print:text-slate-700">
                  Passed Avg: <strong className="text-emerald-400">{corr.avgForPassed}%</strong> | Failed/Drop Avg: <strong className="text-rose-400">{corr.avgForFailedOrDropped}%</strong>
                </div>
                <p className="text-[11px] text-slate-400 print:text-slate-600 leading-normal">
                  {corr.observation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PDCA / CAPA Action Plan Generator */}
        <div className="bg-slate-800/60 print:bg-slate-100 border border-slate-700/80 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-700/80 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PDCA / CAPA Quality Assurance Action Plan</span>
            </div>
            <h3 className="text-base font-bold text-white print:text-black mt-1">
              Corrective and Preventive Actions Matrix
            </h3>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Assigned owners, implementation timelines, and measurable success targets for academic quality closure
            </p>
          </div>

          {/* Corrective Actions (Current Term) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-blue-300 print:text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Part A: Immediate Corrective Actions (Current Term)</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-700 print:border-slate-300">
              <table className="w-full text-left text-xs text-slate-300 print:text-black">
                <thead className="bg-slate-900/90 print:bg-slate-200 text-slate-400 print:text-slate-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Corrective Intervention</th>
                    <th className="p-3">Root Cause Addressed</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Timeline</th>
                    <th className="p-3">Success Target Measure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-xs">
                  {qaResult.pdcaCapaPlan.correctiveActions.map((action, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium text-white print:text-black">{action.action}</td>
                      <td className="p-3 text-slate-400 print:text-slate-600">{action.rootCause || '-'}</td>
                      <td className="p-3 text-amber-300 print:text-amber-900 font-semibold">{action.owner}</td>
                      <td className="p-3 text-slate-400 print:text-slate-600">{action.timeline}</td>
                      <td className="p-3 text-emerald-300 print:text-emerald-900 font-medium">{action.successMeasure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preventive Actions (Next Term) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-indigo-300 print:text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Part B: Systemic Preventive Actions (Upcoming Semester)</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-700 print:border-slate-300">
              <table className="w-full text-left text-xs text-slate-300 print:text-black">
                <thead className="bg-slate-900/90 print:bg-slate-200 text-slate-400 print:text-slate-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Preventive Intervention</th>
                    <th className="p-3">Target Risk Mitigated</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Timeline</th>
                    <th className="p-3">Success Target Measure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-xs">
                  {qaResult.pdcaCapaPlan.preventiveActions.map((action, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium text-white print:text-black">{action.action}</td>
                      <td className="p-3 text-slate-400 print:text-slate-600">{action.targetRisk || '-'}</td>
                      <td className="p-3 text-indigo-300 print:text-indigo-900 font-semibold">{action.owner}</td>
                      <td className="p-3 text-slate-400 print:text-slate-600">{action.timeline}</td>
                      <td className="p-3 text-emerald-300 print:text-emerald-900 font-medium">{action.successMeasure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CHED OBE / Intended Learning Outcomes Attainment */}
        {qaResult.chedObeAlignment && (
          <div className="bg-slate-800/40 print:bg-slate-50 border border-slate-700/60 p-4 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 print:text-black">
                CHED OBE Intended Learning Outcomes (ILO) Alignment
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Status: {qaResult.chedObeAlignment.iloAttainmentStatus}
              </span>
            </div>
            <p className="text-slate-400 print:text-slate-600 leading-relaxed">
              {qaResult.chedObeAlignment.observations}
            </p>
          </div>
        )}

        {/* Formal Institutional Signatures */}
        <div className="pt-8 border-t border-slate-800 print:border-black grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-center">
          <div>
            <div className="border-b border-slate-700 print:border-black pb-1 mb-1 font-bold text-white print:text-black">
              {instructorProfile.displayName}
            </div>
            <div className="text-[10px] text-slate-400 print:text-slate-600">Course Faculty / Instructor</div>
          </div>
          <div>
            <div className="border-b border-slate-700 print:border-black pb-1 mb-1 font-bold text-white print:text-black">
              Dean / CICT Program Head
            </div>
            <div className="text-[10px] text-slate-400 print:text-slate-600">College of ICT Endorsement</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="border-b border-slate-700 print:border-black pb-1 mb-1 font-bold text-white print:text-black">
              Institutional QA Director
            </div>
            <div className="text-[10px] text-slate-400 print:text-slate-600">SJPIIC Quality Assurance Center</div>
          </div>
        </div>
      </div>
    </div>
  );
};
