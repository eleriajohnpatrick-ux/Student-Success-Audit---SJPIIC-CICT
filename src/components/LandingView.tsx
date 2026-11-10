import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, Cpu, Sparkles, BookOpen, BarChart3, ArrowRight, Award } from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => void;
  onExploreDemo: () => void;
  onExploreAdminDemo?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignIn, onExploreDemo, onExploreAdminDemo }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto text-center space-y-6 pt-4">
        {/* Institutional Pill */}
        <div className="inline-flex items-center space-x-2 bg-blue-950/70 border border-blue-800/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-300 shadow-inner">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>St. John Paul II College of Davao • CICT Quality Assurance</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Institutional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">Student Success Audit</span>
        </h1>

        <p className="max-w-3xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
          Empowering College of Information and Communications Technology instructors to conduct rigorous, automated quality audits on student pass, failure, and dropout rates across <strong className="text-blue-300">Prelim</strong>, <strong className="text-blue-300">Midterm</strong>, and <strong className="text-blue-300">Final</strong> examinations using eClass LMS gradebook records.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onSignIn}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Sign In with Google SSO</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            type="button"
            onClick={onExploreDemo}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold px-5 py-3 rounded-xl transition-all text-sm"
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Try Faculty eClass Audit</span>
          </button>

          {onExploreAdminDemo && (
            <button
              type="button"
              onClick={onExploreAdminDemo}
              className="flex items-center space-x-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold px-4 py-3 rounded-xl transition-all text-xs"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Inspect Super Admin Console</span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 pt-1">
          Designated Super Administrator: <span className="font-mono text-amber-300 font-semibold">jeleria_250000000106@uic.edu.ph</span> (Google SSO Verified)
        </p>
      </div>

      {/* 4 Core Architectural Pillars */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-10">
        <div className="bg-slate-800/60 border border-slate-700/70 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3 text-blue-400">
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm mb-1.5 flex items-center space-x-1.5">
            <span>RA 10173 Privacy Airgap</span>
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Client-side parser removes real student names and replaces institutional IDs with anonymous codes (S001, S002). No student PII or raw files are ever stored.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/70 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm mb-1.5">
            Deterministic Statistics
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Zero math hallucinations. Pass/fail/drop counts, period means, medians, failure peaks, and quiz/lab/attendance correlations are computed in native code.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/70 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-3 text-indigo-400">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm mb-1.5">
            Gemini 3.6 Flash QA Engine
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Synthesizes computed statistics with institutional policies to audit why students failed or dropped and evaluate teaching & assessment strategy efficacy.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/70 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm mb-1.5">
            PDCA / CAPA Action Plan
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Automates corrective actions for the active term and preventive actions for the next term, each with clear ownership, timelines, and measurable targets.
          </p>
        </div>
      </div>

      {/* Institutional Footer note */}
      <div className="max-w-4xl mx-auto text-center border-t border-slate-800/80 pt-4 pb-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <span>St. John Paul II College of Davao</span>
          <span>•</span>
          <span>CHED CMO 25 s. 2015 Outcomes-Based Education</span>
          <span>•</span>
          <span>ISO 9001:2015 Academic Quality Assurance Framework</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">Philippine RA 10173 Compliant</span>
        </div>
      </div>
    </div>
  );
};
