import React from 'react';
import { Award, BookOpen, CheckCircle2, Target, ShieldCheck } from 'lucide-react';
import { CompanyBasis } from '../types';

interface BenchmarksViewProps {
  basis: CompanyBasis | null;
}

export const BenchmarksView: React.FC<BenchmarksViewProps> = ({ basis }) => {
  const passingGrade = basis?.passingGrade ?? 75;
  const targetPassingRate = basis?.qualityTargets?.targetPassingRate ?? 80;
  const maxDropoutRate = basis?.qualityTargets?.maxDropoutRate ?? 10;
  const prelimWeight = basis?.gradeWeights?.prelim ?? 30;
  const midtermWeight = basis?.gradeWeights?.midterm ?? 30;
  const finalWeight = basis?.gradeWeights?.final ?? 40;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Institutional QA Benchmarks & Standards</h2>
            <p className="text-xs text-slate-400">
              St. John Paul II College of Davao • College of Information and Communications Technology
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-2">
          These standards are established by the College Quality Assurance Commission and Super Administration. Your eClass audit evaluates your course outcomes against these explicit criteria.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Institutional Passing Grade</span>
          <div className="text-3xl font-black text-white">{passingGrade}%</div>
          <span className="text-[11px] text-slate-400 mt-1 block">3.0 Grade Equivalent</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Target Passing Rate</span>
          <div className="text-3xl font-black text-emerald-400">&gt;={targetPassingRate}%</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Minimum program threshold</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Max Allowable Dropout Rate</span>
          <div className="text-3xl font-black text-amber-400">&lt;={maxDropoutRate}%</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Attrition control ceiling</span>
        </div>
      </div>

      {/* Grade Weights Breakdown */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Target className="w-4 h-4 text-blue-400" />
          <span>Examination Period Weight Distribution</span>
        </h3>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Prelim Period</span>
            <span className="text-2xl font-black text-blue-400">{prelimWeight}%</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Midterm Period</span>
            <span className="text-2xl font-black text-indigo-400">{midtermWeight}%</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Final Period</span>
            <span className="text-2xl font-black text-purple-400">{finalWeight}%</span>
          </div>
        </div>
      </div>

      {/* Attendance & CHED Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-amber-300 block">Attendance Policy Benchmark</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {basis?.attendancePolicy || 'Maximum allowable absences: 20% of class contact hours. Regular laboratory attendance is required for practical competency certification.'}
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-blue-300 block">CHED CMO 25 s. 2015 OBE Framework</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {basis?.chedObeStandards || 'Constructive alignment between lecture programming concepts and hands-on laboratory software development outputs.'}
          </p>
        </div>
      </div>
    </div>
  );
};
