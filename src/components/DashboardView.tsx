import React from 'react';
import { User } from 'firebase/auth';
import { 
  FileSpreadsheet, 
  History, 
  Award, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  BarChart3, 
  Cpu, 
  Layers,
  GraduationCap,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { InstructorProfile, CompanyBasis, CourseInfo } from '../types';
import { isUserSuperAdmin } from '../firebase';

interface DashboardViewProps {
  user: User | null;
  profile: InstructorProfile;
  companyBasis: CompanyBasis | null;
  onNavigate: (tab: 'dashboard' | 'new-audit' | 'history' | 'profile' | 'benchmarks' | 'admin') => void;
  onStartAudit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  profile,
  companyBasis,
  onNavigate,
  onStartAudit
}) => {
  const isSuperAdmin = isUserSuperAdmin(user);
  const displayName = profile.displayName || user?.displayName || user?.email?.split('@')[0] || 'Faculty Member';
  const email = user?.email || profile.email;

  const passingScore = companyBasis?.passingGrade ?? 75;
  const targetPassingRate = companyBasis?.qualityTargets?.targetPassingRate ?? 80;
  const maxDropoutRate = companyBasis?.qualityTargets?.maxDropoutRate ?? 10;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-blue-900/40 p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                <span>SJPIIC • CICT Quality Assurance</span>
              </span>
              {isSuperAdmin ? (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Super Admin Account</span>
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Faculty Instructor</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Mabuhay, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{displayName}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Welcome to the <strong>Student Success Audit Dashboard</strong> for St. John Paul II College of Davao, College of Information and Communications Technology. Upload eClass gradebooks to audit exam progression and student retention.
            </p>
            <p className="text-[11px] text-slate-400">
              Authenticated via Google SSO: <span className="font-mono text-slate-200">{email}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              type="button"
              onClick={onStartAudit}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>Start New eClass Audit</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="flex items-center justify-center space-x-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold px-4 py-3 rounded-xl transition-all text-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Super Admin Console</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Institutional Benchmarks Quick Glance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Institutional Passing Grade</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{passingScore}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">SJPIIC Academic Policy</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Target Passing Rate</div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 mt-1">≥ {targetPassingRate}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">CHED CMO 25 Benchmark</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Max Allowable Dropout</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">≤ {maxDropoutRate}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">CICT Quality Target</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Privacy Compliance</div>
          <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">RA 10173</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero PII Storage Airgap</div>
        </div>
      </div>

      {/* Main Action Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Audit Workspace & Navigation</span>
          </h2>
          <span className="text-xs text-slate-400">Select a module to continue</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: New Audit */}
          <div 
            onClick={onStartAudit}
            className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 p-5 rounded-2xl shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors flex items-center space-x-1.5">
                  <span>eClass Gradebook Audit</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-blue-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Upload raw LMS grade records (CSV/XLSX), map columns, and generate deterministic pass/fail statistics with Gemini root-cause insights.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400 font-semibold">
              <span>Prelim • Midterm • Final</span>
              <span>Launch Ingestion →</span>
            </div>
          </div>

          {/* Card 2: Audit History */}
          <div 
            onClick={() => onNavigate('history')}
            className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 p-5 rounded-2xl shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <History className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center space-x-1.5">
                  <span>Audit History & Consultations</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Access previously audited subjects, reviewed root causes, strategy scorecards, and multi-turn QA dialogue transcripts stored in Firestore.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
              <span>Saved in Cloud Firestore</span>
              <span>View Past Audits →</span>
            </div>
          </div>

          {/* Card 3: Institutional Benchmarks */}
          <div 
            onClick={() => onNavigate('benchmarks')}
            className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 p-5 rounded-2xl shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center space-x-1.5">
                  <span>QA Policies & Benchmarks</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Institutional grading weights (Prelim 30%, Midterm 30%, Final 40%), CHED CMO 25 OBE criteria, and attendance benchmarks.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
              <span>CHED OBE Standards</span>
              <span>Inspect Benchmarks →</span>
            </div>
          </div>

          {/* Card 4: Instructor Profile */}
          <div 
            onClick={() => onNavigate('profile')}
            className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 p-5 rounded-2xl shadow-lg hover:shadow-sky-500/10 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <UserCheck className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors flex items-center space-x-1.5">
                  <span>Professional Teaching Profile</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-sky-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Update your CICT department, program, subjects taught, pedagogical approaches (lecture/lab/PBL), and exam period assessment breakdown.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-sky-400 font-semibold">
              <span>Teaching & Assessment Strategy</span>
              <span>Edit Profile →</span>
            </div>
          </div>

          {/* Card 5: Super Admin Console (Visible to Super Admin or preview) */}
          {isSuperAdmin && (
            <div 
              onClick={() => onNavigate('admin')}
              className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-600/50 hover:border-amber-400 p-5 rounded-2xl shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer group flex flex-col justify-between md:col-span-2"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center space-x-1.5">
                      <span>Super Administrator Console</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-amber-400" />
                    </h3>
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/40">
                      SUPER ADMIN ACCESS
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Institutional control center for <strong className="text-amber-200">jeleria_250000000106@uic.edu.ph</strong>: Upload institutional policies (PDF/DOCX/CSV), inspect all instructor audits, review cross-faculty trends, and configure passing benchmarks.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-300 font-semibold">
                <span>Institutional Governance & Quality Assurance</span>
                <span>Open Admin Console →</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructor's Current Pedagogical Background Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Configured Pedagogical & Assessment Strategy</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>Update Profile & Strategy</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program & Department</div>
            <div className="font-semibold text-white">{profile.program}</div>
            <div className="text-slate-400 text-[11px]">{profile.department}</div>
          </div>

          <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Subjects</div>
            <div className="font-semibold text-white line-clamp-2">{profile.subjectsTaught}</div>
          </div>

          <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teaching Strategies</div>
            <div className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{profile.teachingStrategies}</div>
          </div>

          <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Breakdown (Prelim/Midterm/Final)</div>
            <div className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{profile.assessmentStrategy}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
