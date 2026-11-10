import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collectionGroup, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  query,
  collection
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, SUPER_ADMIN_EMAIL } from '../firebase';
import { 
  ShieldCheck, 
  Upload, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  Users, 
  BookOpen, 
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { CompanyBasis, SavedAudit, SavedInteraction } from '../types';

interface SuperAdminConsoleProps {
  user: User;
  onCompanyBasisUpdated?: (basis: CompanyBasis) => void;
}

export const SuperAdminConsole: React.FC<SuperAdminConsoleProps> = ({
  user,
  onCompanyBasisUpdated
}) => {
  const isAuthorized = user.email === SUPER_ADMIN_EMAIL && Boolean(user.emailVerified);

  const [activeTab, setActiveTab] = useState<'benchmarks' | 'consolidated' | 'all-audits' | 'all-interactions'>('consolidated');

  // Company Basis State
  const [basis, setBasis] = useState<CompanyBasis>({
    id: 'main',
    title: 'SJPIIC CICT Quality Assurance Standard & Benchmark Framework',
    passingGrade: 75,
    gradingSystem: 'Numerical (0-100%, passing 75.0% / 3.0 equivalent)',
    gradeWeights: {
      prelim: 30,
      midterm: 30,
      final: 40
    },
    attendancePolicy: 'Attendance required minimum 80% per CHED policy. Unexcused absences exceeding 20% of contact hours require dropped or failing evaluation.',
    chedObeStandards: 'CHED CMO 25 s. 2015: Intended Learning Outcomes in programming logic, algorithms, databases, systems analysis and software development.',
    qualityTargets: {
      targetPassingRate: 80,
      maxDropoutRate: 10
    },
    extractedDocText: 'Institutional Quality Policy: All CICT laboratory components mandate 50% practical hands-on assessments to assure genuine skill acquisition.'
  });

  const [allAudits, setAllAudits] = useState<SavedAudit[]>([]);
  const [allInteractions, setAllInteractions] = useState<SavedInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingBasis, setIsSavingBasis] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [docUploadStatus, setDocUploadStatus] = useState<string | null>(null);

  // Load existing company basis and collection group queries
  useEffect(() => {
    async function loadAdminData() {
      if (!isAuthorized) return;
      setIsLoading(true);

      // Load Company Basis
      try {
        const basisRef = doc(db, 'companyBasis', 'main');
        const snap = await getDoc(basisRef);
        if (snap.exists()) {
          setBasis(snap.data() as CompanyBasis);
        }
      } catch (err) {
        console.warn('Notice reading companyBasis:', err);
      }

      // Load all audits across all users via Collection Group
      try {
        const auditsGroupSnap = await getDocs(collectionGroup(db, 'audits'));
        const loaded: SavedAudit[] = [];
        auditsGroupSnap.forEach((d) => {
          loaded.push(d.data() as SavedAudit);
        });
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllAudits(loaded);
      } catch (err) {
        console.warn('Notice reading collectionGroup audits:', err);
      }

      // Load all interactions
      try {
        const intGroupSnap = await getDocs(collectionGroup(db, 'interactions'));
        const loadedInts: SavedInteraction[] = [];
        intGroupSnap.forEach((d) => {
          loadedInts.push(d.data() as SavedInteraction);
        });
        loadedInts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllInteractions(loadedInts);
      } catch (err) {
        console.warn('Notice reading collectionGroup interactions:', err);
      }

      setIsLoading(false);
    }

    loadAdminData();
  }, [isAuthorized]);

  // Handle uploading policy documents (PDF, DOCX, CSV, TXT)
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocUploadStatus('Extracting document text safely on server...');
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = (reader.result as string).split(',')[1];
        const res = await fetch('/api/extract-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            base64Content
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to extract text from document');
        }

        setBasis((prev) => ({
          ...prev,
          extractedDocText: data.text
        }));
        setDocUploadStatus(`Document "${file.name}" extracted and sanitized as QA data.`);
        setTimeout(() => setDocUploadStatus(null), 5000);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'Document upload failed.');
      setDocUploadStatus(null);
    }
  };

  // Save company basis to Firestore
  const handleSaveBasis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBasis(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    const docPath = 'companyBasis/main';
    try {
      const dataToSave: CompanyBasis = {
        ...basis,
        id: 'main',
        uploadedBy: user.email || 'Super Admin',
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'companyBasis', 'main'), dataToSave);
      setSaveSuccess(true);
      if (onCompanyBasisUpdated) {
        onCompanyBasisUpdated(dataToSave);
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMessage('Failed to save Company Basis. Verify Firestore super admin rules.');
      try {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      } catch (logErr) {
        // Logged per requirements
      }
    } finally {
      setIsSavingBasis(false);
    }
  };

  // Calculate Consolidated Metrics across all loaded audits
  const totalAuditsCount = allAudits.length;
  const overallAvgPassRate = totalAuditsCount > 0
    ? Math.round(allAudits.reduce((acc, a) => acc + a.stats.passedRate, 0) / totalAuditsCount * 10) / 10
    : 0;
  const overallAvgDropoutRate = totalAuditsCount > 0
    ? Math.round(allAudits.reduce((acc, a) => acc + a.stats.droppedRate, 0) / totalAuditsCount * 10) / 10
    : 0;

  const failurePeriods = allAudits.map((a) => a.stats.failurePeakPeriod);
  const failurePeriodCounts = {
    Prelim: failurePeriods.filter((p) => p === 'Prelim').length,
    Midterm: failurePeriods.filter((p) => p === 'Midterm').length,
    Final: failurePeriods.filter((p) => p === 'Final').length,
    Uniform: failurePeriods.filter((p) => p === 'Uniform').length
  };

  const strategyRatings = allAudits.map((a) => a.qaFindings.strategyScorecard.overallRating);
  const ratingCounts = {
    Effective: strategyRatings.filter((r) => r === 'Effective').length,
    PartiallyEffective: strategyRatings.filter((r) => r === 'Partially Effective').length,
    NotYetEffective: strategyRatings.filter((r) => r === 'Not Yet Effective').length,
    InsufficientData: strategyRatings.filter((r) => r === 'Insufficient Data').length
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-slate-900 border border-rose-800/80 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-700 mx-auto flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Super Admin Access Denied</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Access to this institutional portal is strictly restricted to the verified Super Administrator account:
        </p>
        <div className="font-mono text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs inline-block">
          {SUPER_ADMIN_EMAIL}
        </div>
        <p className="text-[11px] text-slate-500">
          Your signed-in email: {user.email} (Email Verified: {String(user.emailVerified)})
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-blue-950/40 border border-amber-500/40 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">CICT Super Admin Console</h2>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                Verified Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              St. John Paul II College of Davao • Authorized to set institutional QA policy and view cross-instructor audits
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('consolidated')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'consolidated'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Consolidated QA View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('benchmarks')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'benchmarks'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Company Basis Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all-audits')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'all-audits'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Audits ({allAudits.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all-interactions')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'all-interactions'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Interactions ({allInteractions.length})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-700 p-4 rounded-xl flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-700 p-3 rounded-xl flex items-center space-x-2 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Company Basis & Institutional QA Benchmarks saved successfully to /companyBasis/main!</span>
        </div>
      )}

      {/* 1. CONSOLIDATED QA VIEW */}
      {activeTab === 'consolidated' && (
        <div className="space-y-6">
          {/* Institutional Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1">Total Course Audits</span>
              <div className="text-3xl font-black text-white">{totalAuditsCount}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Cross-faculty CICT courses</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1">Average Passing Rate</span>
              <div className="text-3xl font-black text-emerald-400">{overallAvgPassRate}%</div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Target: &gt;={basis.qualityTargets.targetPassingRate}%
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1">Average Dropout Rate</span>
              <div className="text-3xl font-black text-amber-400">{overallAvgDropoutRate}%</div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Max Allowable: &lt;={basis.qualityTargets.maxDropoutRate}%
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1">Consultation Exchanges</span>
              <div className="text-3xl font-black text-blue-400">{allInteractions.length}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Instructor QA dialogues</span>
            </div>
          </div>

          {/* Exam Period Failure Peak Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Primary Failure Period Across All Subjects</span>
              </h3>
              <p className="text-xs text-slate-400">
                Number of CICT subject sections where each examination period had the highest failure count:
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Prelim Exam Peak Failures</span>
                    <span className="text-amber-400">{failurePeriodCounts.Prelim} courses</span>
                  </div>
                  <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${totalAuditsCount ? (failurePeriodCounts.Prelim / totalAuditsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Midterm Exam Peak Failures</span>
                    <span className="text-rose-400">{failurePeriodCounts.Midterm} courses</span>
                  </div>
                  <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${totalAuditsCount ? (failurePeriodCounts.Midterm / totalAuditsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Final Exam Peak Failures</span>
                    <span className="text-purple-400">{failurePeriodCounts.Final} courses</span>
                  </div>
                  <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${totalAuditsCount ? (failurePeriodCounts.Final / totalAuditsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Effectiveness Rating Distribution */}
            <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span>Strategy Effectiveness Across All Faculty</span>
              </h3>
              <p className="text-xs text-slate-400">
                Quality Assurance distribution of teaching & assessment strategy ratings:
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="bg-emerald-950/40 border border-emerald-800 p-3 rounded-xl">
                  <span className="text-emerald-400 block font-bold text-lg">{ratingCounts.Effective}</span>
                  <span className="text-slate-300 text-[10px] font-medium">Effective</span>
                </div>
                <div className="bg-amber-950/40 border border-amber-800 p-3 rounded-xl">
                  <span className="text-amber-400 block font-bold text-lg">{ratingCounts.PartiallyEffective}</span>
                  <span className="text-slate-300 text-[10px] font-medium">Partially Effective</span>
                </div>
                <div className="bg-rose-950/40 border border-rose-800 p-3 rounded-xl">
                  <span className="text-rose-400 block font-bold text-lg">{ratingCounts.NotYetEffective}</span>
                  <span className="text-slate-300 text-[10px] font-medium">Not Yet Effective</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs text-slate-300">
                <strong className="text-blue-300 block mb-1">Top QA Priority for CICT:</strong>
                Scaffold laboratory programming tasks earlier in the term before Midterm exam gates to prevent sharp attrition slopes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPANY BASIS MANAGEMENT */}
      {activeTab === 'benchmarks' && (
        <form onSubmit={handleSaveBasis} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-700/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Institutional QA Criteria & Benchmark Policy</h3>
              <p className="text-xs text-slate-400">
                All instructor audits will query these institutional standards as the audit baseline
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingBasis}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingBasis ? 'Saving Basis...' : 'Save Institutional Policy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Institutional Passing Grade
              </label>
              <input
                type="number"
                step="0.1"
                value={basis.passingGrade}
                onChange={(e) => setBasis({ ...basis, passingGrade: parseFloat(e.target.value) || 75 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Passing Rate (%)
              </label>
              <input
                type="number"
                value={basis.qualityTargets.targetPassingRate}
                onChange={(e) => setBasis({
                  ...basis,
                  qualityTargets: { ...basis.qualityTargets, targetPassingRate: parseInt(e.target.value) || 80 }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maximum Allowable Dropout Rate (%)
              </label>
              <input
                type="number"
                value={basis.qualityTargets.maxDropoutRate}
                onChange={(e) => setBasis({
                  ...basis,
                  qualityTargets: { ...basis.qualityTargets, maxDropoutRate: parseInt(e.target.value) || 10 }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500"
              />
            </div>
          </div>

          {/* Grade Weights */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Period Grade Weights (Must Total 100%)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Prelim Weight (%)</span>
                <input
                  type="number"
                  value={basis.gradeWeights.prelim}
                  onChange={(e) => setBasis({
                    ...basis,
                    gradeWeights: { ...basis.gradeWeights, prelim: parseInt(e.target.value) || 30 }
                  })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Midterm Weight (%)</span>
                <input
                  type="number"
                  value={basis.gradeWeights.midterm}
                  onChange={(e) => setBasis({
                    ...basis,
                    gradeWeights: { ...basis.gradeWeights, midterm: parseInt(e.target.value) || 30 }
                  })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Final Weight (%)</span>
                <input
                  type="number"
                  value={basis.gradeWeights.final}
                  onChange={(e) => setBasis({
                    ...basis,
                    gradeWeights: { ...basis.gradeWeights, final: parseInt(e.target.value) || 40 }
                  })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Attendance Policy */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Institutional Attendance Policy Benchmark
            </label>
            <textarea
              rows={2}
              value={basis.attendancePolicy}
              onChange={(e) => setBasis({ ...basis, attendancePolicy: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* CHED OBE Standards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              CHED OBE / Intended Learning Outcomes (ILO) Framework
            </label>
            <textarea
              rows={2}
              value={basis.chedObeStandards}
              onChange={(e) => setBasis({ ...basis, chedObeStandards: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Document Upload for Policy Extraction */}
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <Upload className="w-4 h-4" />
                <span>Upload Institutional Benchmark Documents (PDF, DOCX, CSV, TXT)</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">
                Treated strictly as untrusted data
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Prompt Injection Defense: All text extracted from uploaded files is isolated strictly as benchmark data in XML/JSON blocks, never executed as prompts.
            </p>

            <input
              type="file"
              accept=".pdf,.docx,.csv,.txt"
              onChange={handleDocumentUpload}
              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
            />

            {docUploadStatus && (
              <div className="text-xs text-amber-300 animate-pulse">{docUploadStatus}</div>
            )}

            <div>
              <span className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase tracking-wider">
                Extracted Institutional Benchmark Content:
              </span>
              <textarea
                rows={4}
                value={basis.extractedDocText || ''}
                onChange={(e) => setBasis({ ...basis, extractedDocText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono leading-relaxed"
              />
            </div>
          </div>
        </form>
      )}

      {/* 3. ALL AUDITS (CROSS-FACULTY LIST) */}
      {activeTab === 'all-audits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Read-only consolidated audits from all authenticated instructors</span>
            <span>{allAudits.length} Audits Logged</span>
          </div>

          {allAudits.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 p-8 rounded-2xl text-center text-xs text-slate-400">
              No audits have been submitted yet. When instructors analyze and save their eClass gradebooks, their records will display here.
            </div>
          ) : (
            allAudits.map((audit) => (
              <div
                key={audit.id}
                className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-700/60 pb-2 text-xs">
                  <div>
                    <span className="font-bold text-white text-sm">
                      {audit.courseInfo.subjectCode} - {audit.courseInfo.subjectTitle}
                    </span>
                    <span className="text-slate-400 ml-2">({audit.courseInfo.section})</span>
                  </div>
                  <div className="text-slate-400">
                    Faculty: <strong className="text-amber-300">{audit.instructorName}</strong> ({audit.instructorEmail})
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Enrolled</span>
                    <span className="font-bold text-white">{audit.stats.totalStudents}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Passed</span>
                    <span className="font-bold text-emerald-400">{audit.stats.passedRate}%</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Failed</span>
                    <span className="font-bold text-rose-400">{audit.stats.failedRate}%</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Dropout</span>
                    <span className="font-bold text-amber-400">{audit.stats.droppedRate}%</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Peak Failure</span>
                    <span className="font-bold text-purple-300">{audit.stats.failurePeakPeriod}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic">
                  "{audit.qaFindings.executiveSummary}"
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. ALL INTERACTIONS (READ-ONLY) */}
      {activeTab === 'all-interactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Read-only log of instructor consultations with Gemini QA Partner</span>
            <span>{allInteractions.length} Sessions Logged</span>
          </div>

          {allInteractions.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 p-8 rounded-2xl text-center text-xs text-slate-400">
              No instructor consultations have been recorded yet.
            </div>
          ) : (
            allInteractions.map((int) => (
              <div
                key={int.id}
                className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2 text-xs"
              >
                <div className="flex justify-between text-slate-400 border-b border-slate-700 pb-1.5">
                  <span className="font-semibold text-amber-300">
                    Instructor: {int.instructorEmail || int.userId}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(int.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-300">
                  <strong className="text-blue-300 block mb-0.5">Faculty Reflection:</strong>
                  "{int.prompt}"
                </div>
                <div className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <strong className="text-indigo-300 block mb-0.5">Gemini Response:</strong>
                  {int.response}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
