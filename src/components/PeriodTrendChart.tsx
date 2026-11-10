import React from 'react';
import { ComputedAuditStats } from '../utils/gradeCalculations';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PeriodTrendChartProps {
  stats: ComputedAuditStats;
}

export const PeriodTrendChart: React.FC<PeriodTrendChartProps> = ({ stats }) => {
  const periods = [
    { name: 'Prelim', summary: stats.examSummaries.prelim },
    { name: 'Midterm', summary: stats.examSummaries.midterm },
    { name: 'Final', summary: stats.examSummaries.finalExam }
  ];

  const maxStudents = Math.max(stats.totalStudents, 1);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Pass, Fail & Performance Trajectory (Prelim → Midterm → Final)</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Comparative period progression and grade distribution across examination gateways
          </p>
        </div>

        {stats.failurePeakPeriod !== 'Uniform' && (
          <div className="inline-flex items-center space-x-1.5 bg-rose-950/70 border border-rose-800/80 text-rose-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Highest Failure Gateway: {stats.failurePeakPeriod}</span>
          </div>
        )}
      </div>

      {/* Trajectory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periods.map(({ name, summary }) => {
          const passPct = summary.count > 0 ? Math.round((summary.passCount / summary.count) * 100) : 0;
          const failPct = summary.count > 0 ? 100 - passPct : 0;
          const isPeak = stats.failurePeakPeriod === name;

          return (
            <div
              key={name}
              className={`rounded-xl p-4 border transition-all ${
                isPeak
                  ? 'bg-rose-950/20 border-rose-800/60 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-800/50 border-slate-700/70'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-slate-200">{name} Period</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    passPct >= 80
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : passPct >= 65
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {passPct}% Pass Rate
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex mb-3 border border-slate-800">
                <div
                  style={{ width: `${passPct}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                  title={`Passed: ${summary.passCount}`}
                />
                <div
                  style={{ width: `${failPct}%` }}
                  className="bg-gradient-to-r from-rose-500 to-red-600 h-full transition-all duration-500"
                  title={`Failed: ${summary.failCount}`}
                />
              </div>

              {/* Stats Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Mean / Median</span>
                  <span className="font-bold text-slate-200">
                    {summary.mean} / {summary.median}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Min / Max</span>
                  <span className="font-bold text-slate-200">
                    {summary.min} - {summary.max}
                  </span>
                </div>
              </div>

              {/* Distribution Mini Bars */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Score Distribution
                </span>
                <div className="grid grid-cols-5 gap-1 text-[9px] text-center font-mono">
                  <div>
                    <div
                      className="bg-rose-600/70 rounded-t"
                      style={{
                        height: `${Math.max((summary.distribution.below75 / maxStudents) * 36, 4)}px`
                      }}
                    />
                    <span className="text-rose-400 block mt-0.5">&lt;75</span>
                    <span className="text-slate-400">{summary.distribution.below75}</span>
                  </div>
                  <div>
                    <div
                      className="bg-amber-600/70 rounded-t"
                      style={{
                        height: `${Math.max((summary.distribution.range75to79 / maxStudents) * 36, 4)}px`
                      }}
                    />
                    <span className="text-amber-400 block mt-0.5">75-79</span>
                    <span className="text-slate-400">{summary.distribution.range75to79}</span>
                  </div>
                  <div>
                    <div
                      className="bg-blue-600/70 rounded-t"
                      style={{
                        height: `${Math.max((summary.distribution.range80to84 / maxStudents) * 36, 4)}px`
                      }}
                    />
                    <span className="text-blue-400 block mt-0.5">80-84</span>
                    <span className="text-slate-400">{summary.distribution.range80to84}</span>
                  </div>
                  <div>
                    <div
                      className="bg-indigo-600/70 rounded-t"
                      style={{
                        height: `${Math.max((summary.distribution.range85to89 / maxStudents) * 36, 4)}px`
                      }}
                    />
                    <span className="text-indigo-400 block mt-0.5">85-89</span>
                    <span className="text-slate-400">{summary.distribution.range85to89}</span>
                  </div>
                  <div>
                    <div
                      className="bg-emerald-600/70 rounded-t"
                      style={{
                        height: `${Math.max((summary.distribution.range90plus / maxStudents) * 36, 4)}px`
                      }}
                    />
                    <span className="text-emerald-400 block mt-0.5">90+</span>
                    <span className="text-slate-400">{summary.distribution.range90plus}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trajectory Insights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            ↑
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Prelim → Final Improvement</span>
            <span className="font-bold text-slate-100">
              {stats.trendSummary.improvedCount} students ({Math.round((stats.trendSummary.improvedCount / maxStudents) * 100)}%)
            </span>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
            ↓
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Prelim → Final Decline</span>
            <span className="font-bold text-slate-100">
              {stats.trendSummary.declinedCount} students ({Math.round((stats.trendSummary.declinedCount / maxStudents) * 100)}%)
            </span>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            !
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Passed Prelim But Failed Later</span>
            <span className="font-bold text-amber-300">
              {stats.prelimPassLaterFailedCount} students
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
