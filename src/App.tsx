import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  isUserSuperAdmin
} from './firebase';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { InstructorProfileForm } from './components/InstructorProfileForm';
import { GradebookUploader } from './components/GradebookUploader';
import { AuditReportView } from './components/AuditReportView';
import { ConsultationChat } from './components/ConsultationChat';
import { AuditHistoryView } from './components/AuditHistoryView';
import { SuperAdminConsole } from './components/SuperAdminConsole';
import { BenchmarksView } from './components/BenchmarksView';
import { 
  CourseInfo, 
  InstructorProfile, 
  QaAuditResult, 
  CompanyBasis, 
  SavedAudit 
} from './types';
import { AnonymizedStudentRecord } from './utils/anonymizer';
import { computeGradeAuditStats, ComputedAuditStats } from './utils/gradeCalculations';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new-audit' | 'history' | 'profile' | 'benchmarks' | 'admin'>('new-audit');
  
  // App State
  const [instructorProfile, setInstructorProfile] = useState<InstructorProfile>({
    uid: '',
    email: '',
    displayName: 'Faculty Member',
    department: 'College of Information and Communications Technology (CICT)',
    program: 'BS in Information Technology (BSIT)',
    subjectsTaught: 'CC102 - Fundamentals of Programming, IT201 - Data Structures & Algorithms',
    teachingStrategies: 'Hands-on Computer Laboratory Exercises, Interactive Lectures & Theory Discussions, Project-Based Learning (PBL) / Capstone Sprints',
    assessmentStrategy: 'Prelim: 50% Lab Exercises + 50% Written/Coding Exam; Midterm: 40% Lab + 60% Exam; Final: 30% Major Project + 70% Comprehensive Final Exam.'
  });

  const [companyBasis, setCompanyBasis] = useState<CompanyBasis | null>(null);

  // Active Audit State
  const [auditStep, setAuditStep] = useState<'upload' | 'analyzing' | 'report'>('upload');
  const [activeCourseInfo, setActiveCourseInfo] = useState<CourseInfo | null>(null);
  const [activeStats, setActiveStats] = useState<ComputedAuditStats | null>(null);
  const [activeQaResult, setActiveQaResult] = useState<QaAuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Consultation Modal
  const [showConsultation, setShowConsultation] = useState(false);

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setInstructorProfile((prev) => ({
          ...prev,
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || prev.displayName
        }));

        // Try loading instructor profile from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as InstructorProfile;
            setInstructorProfile(data);
          }
        } catch (err) {
          console.warn('Initial profile load notice:', err);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load institutional company basis
  useEffect(() => {
    async function loadCompanyBasis() {
      try {
        const basisRef = doc(db, 'companyBasis', 'main');
        const snap = await getDoc(basisRef);
        if (snap.exists()) {
          setCompanyBasis(snap.data() as CompanyBasis);
        }
      } catch (err) {
        console.warn('Initial company basis load notice:', err);
      }
    }
    loadCompanyBasis();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google SSO Sign-In error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setActiveTab('new-audit');
      setAuditStep('upload');
      setActiveCourseInfo(null);
      setActiveStats(null);
      setActiveQaResult(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Run Quality Audit
  const handleDataReadyForAudit = async ({
    courseInfo,
    anonymizedRecords
  }: {
    courseInfo: CourseInfo;
    anonymizedRecords: AnonymizedStudentRecord[];
    rawRowsCount: number;
  }) => {
    setAuditStep('analyzing');
    setAuditError(null);
    setActiveCourseInfo(courseInfo);

    try {
      // 1. Calculate deterministic statistics in TypeScript code (not LLM)
      const passingScore = companyBasis?.passingGrade ?? 75;
      const stats = computeGradeAuditStats(anonymizedRecords, passingScore);
      setActiveStats(stats);

      // 2. Send verified statistics, instructor profile, and company basis to Gemini API
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorProfile,
          courseInfo,
          computedStats: stats,
          companyBasis
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete academic quality audit.');
      }

      setActiveQaResult(data.audit);
      setAuditStep('report');
    } catch (err: any) {
      console.error('Audit processing error:', err);
      setAuditError(err.message || 'An unexpected error occurred during audit generation.');
      setAuditStep('upload');
    }
  };

  const handleSelectPastAudit = (saved: SavedAudit) => {
    setActiveCourseInfo(saved.courseInfo);
    setActiveStats(saved.stats);
    setActiveQaResult(saved.qaFindings);
    setAuditStep('report');
    setActiveTab('new-audit');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4 text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Loading SJPIIC CICT Student Success Audit...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'new-audit' && auditStep === 'report') {
            // Keep current report view or let user reset
          }
        }}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          // Landing Page for unauthenticated visitors
          <LandingView
            onSignIn={handleSignIn}
            onExploreDemo={() => {
              // Create demo faculty session so anyone can test immediately
              setActiveTab('new-audit');
              setUser({
                uid: 'demo_faculty_01',
                email: 'instructor.demo@sjpiicdavao.edu.ph',
                displayName: 'Prof. Reynaldo D. Santos, MIT',
                emailVerified: true
              } as User);
            }}
            onExploreAdminDemo={() => {
              // Create verified Super Admin session for designated account
              setActiveTab('admin');
              setUser({
                uid: 'super_admin_jeleria',
                email: 'jeleria_250000000106@uic.edu.ph',
                displayName: 'J. Eleria (Super Admin)',
                emailVerified: true
              } as User);
            }}
          />
        ) : (
          // Authenticated Application Views
          <>
            {/* New Audit View */}
            {activeTab === 'new-audit' && (
              <div className="space-y-6">
                {auditError && (
                  <div className="bg-rose-950/80 border border-rose-700 p-4 rounded-xl flex items-center justify-between text-xs text-rose-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>{auditError}</span>
                    </div>
                  </div>
                )}

                {auditStep === 'upload' && (
                  <GradebookUploader
                    onDataReady={handleDataReadyForAudit}
                    passingThreshold={companyBasis?.passingGrade ?? 75}
                  />
                )}

                {auditStep === 'analyzing' && (
                  <div className="max-w-xl mx-auto my-16 bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto animate-bounce">
                      <Sparkles className="w-7 h-7 text-amber-300" />
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Conducting Quality Assurance Audit...
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Computing verified descriptive statistics across Prelim, Midterm, and Final examination periods, comparing outcomes against CHED OBE targets, and prompting Gemini 3.6 Flash for root-cause synthesis.
                    </p>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 h-full w-2/3 animate-pulse" />
                    </div>
                  </div>
                )}

                {auditStep === 'report' && activeCourseInfo && activeStats && activeQaResult && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center print:hidden">
                      <button
                        type="button"
                        onClick={() => setAuditStep('upload')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                      >
                        <span>← Audit Another Course</span>
                      </button>
                    </div>

                    <AuditReportView
                      user={user}
                      courseInfo={activeCourseInfo}
                      instructorProfile={instructorProfile}
                      stats={activeStats}
                      qaResult={activeQaResult}
                      companyBasis={companyBasis}
                      onOpenConsultation={() => setShowConsultation(true)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Audit History View */}
            {activeTab === 'history' && (
              <AuditHistoryView
                user={user}
                onSelectAudit={handleSelectPastAudit}
              />
            )}

            {/* Institutional Benchmarks View */}
            {activeTab === 'benchmarks' && (
              <BenchmarksView basis={companyBasis} />
            )}

            {/* Instructor Profile View */}
            {activeTab === 'profile' && (
              <InstructorProfileForm
                user={user}
                onProfileUpdated={(updated) => setInstructorProfile(updated)}
              />
            )}

            {/* Super Admin Console */}
            {activeTab === 'admin' && (
              <SuperAdminConsole
                user={user}
                onCompanyBasisUpdated={(newBasis) => setCompanyBasis(newBasis)}
              />
            )}
          </>
        )}
      </main>

      {/* Multi-Turn Consultation Modal */}
      {showConsultation && activeCourseInfo && activeQaResult && (
        <ConsultationChat
          user={user}
          courseInfo={activeCourseInfo}
          auditSummary={activeQaResult}
          onClose={() => setShowConsultation(false)}
        />
      )}
    </div>
  );
}
