import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { ComputedAuditStats } from '../utils/gradeCalculations';
import { TrendingUp, AlertTriangle, CheckCircle2, Award, Users } from 'lucide-react';

interface PeriodProgressionRechartsProps {
  stats: ComputedAuditStats;
  passingThreshold?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-[200px]">
        <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span className="font-bold text-white text-sm">{label} Grading Period</span>
          <span className="text-[10px] bg-blue-950 text-blue-300 font-mono px-1.5 py-0.5 rounded border border-blue-800">
            {data.totalCount} Students
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-sky-400 font-medium">Average Score (Mean):</span>
            <span className="font-bold text-sky-300 font-mono">{data.avgScore}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Median Score:</span>
            <span className="font-mono text-slate-300">{data.medianScore}%</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span className="text-emerald-400 font-medium">Passed Count:</span>
            <span className="font-bold text-emerald-300 font-mono">
              {data.passCount} ({data.passRate}%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-rose-400 font-medium">Failed Count:</span>
            <span className="font-bold text-rose-300 font-mono">
              {data.failCount} ({Math.round(100 - data.passRate)}%)
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const PeriodProgressionRecharts: React.FC<PeriodProgressionRechartsProps> = ({
  stats,
  passingThreshold = 75
}) => {
  const [visibleLines, setVisibleLines] = useState<{
    avgScore: boolean;
    passCount: boolean;
    failCount: boolean;
  }>({
    avgScore: true,
    passCount: true,
    failCount: true
  });

  const chartData = [
    {
      period: 'Prelim',
      avgScore: stats.examSummaries.prelim.mean,
      medianScore: stats.examSummaries.prelim.median,
      passCount: stats.examSummaries.prelim.passCount,
      failCount: stats.examSummaries.prelim.failCount,
      passRate: stats.examSummaries.prelim.passRate,
      totalCount: stats.examSummaries.prelim.count
    },
    {
      period: 'Midterm',
      avgScore: stats.examSummaries.midterm.mean,
      medianScore: stats.examSummaries.midterm.median,
      passCount: stats.examSummaries.midterm.passCount,
      failCount: stats.examSummaries.midterm.failCount,
      passRate: stats.examSummaries.midterm.passRate,
      totalCount: stats.examSummaries.midterm.count
    },
    {
      period: 'Final',
      avgScore: stats.examSummaries.finalExam.mean,
      medianScore: stats.examSummaries.finalExam.median,
      passCount: stats.examSummaries.finalExam.passCount,
      failCount: stats.examSummaries.finalExam.failCount,
      passRate: stats.examSummaries.finalExam.passRate,
      totalCount: stats.examSummaries.finalExam.count
    }
  ];

  const maxStudentCount = Math.max(
    ...chartData.map((d) => Math.max(d.passCount, d.failCount, d.totalCount)),
    10
  );

  const toggleLine = (key: 'avgScore' | 'passCount' | 'failCount') => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              RECHARTS VISUALIZATION
            </span>
            <span className="text-xs text-slate-400">Progression Trajectory</span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2 mt-1">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            <span>Average Scores & Pass / Fail Progression Across Grading Periods</span>
          </h3>
          <p className="text-xs text-slate-400">
            Tracking academic momentum and student retention from Prelim through Midterm to Final examinations
          </p>
        </div>

        {/* Legend Filters / Toggles */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => toggleLine('avgScore')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              visibleLines.avgScore
                ? 'bg-sky-950/80 text-sky-300 border-sky-600/80 shadow-sm'
                : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
            <span>Avg Score</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLine('passCount')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              visibleLines.passCount
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 shadow-sm'
                : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Passed</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLine('failCount')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              visibleLines.failCount
                ? 'bg-rose-950/80 text-rose-300 border-rose-600/80 shadow-sm'
                : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
            <span>Failed</span>
          </button>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="w-full h-[320px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />

            <XAxis
              dataKey="period"
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
            />

            {/* Left Y-Axis: Average Score (%) */}
            <YAxis
              yAxisId="score"
              domain={[0, 100]}
              stroke="#38bdf8"
              tick={{ fill: '#7dd3fc', fontSize: 11 }}
              axisLine={{ stroke: '#0284c7' }}
              tickLine={{ stroke: '#0284c7' }}
              unit="%"
              label={{
                value: 'Average Score (%)',
                angle: -90,
                position: 'insideLeft',
                fill: '#38bdf8',
                fontSize: 11,
                offset: 10
              }}
            />

            {/* Right Y-Axis: Student Count */}
            <YAxis
              yAxisId="students"
              orientation="right"
              domain={[0, Math.ceil(maxStudentCount * 1.15)]}
              stroke="#a78bfa"
              tick={{ fill: '#c4b5fd', fontSize: 11 }}
              axisLine={{ stroke: '#7c3aed' }}
              tickLine={{ stroke: '#7c3aed' }}
              label={{
                value: 'Student Count',
                angle: 90,
                position: 'insideRight',
                fill: '#a78bfa',
                fontSize: 11,
                offset: 10
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Institutional Passing Threshold Reference Line */}
            <ReferenceLine
              yAxisId="score"
              y={passingThreshold}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Passing Target (${passingThreshold}%)`,
                position: 'insideTopRight',
                fill: '#fbbf24',
                fontSize: 10,
                fontWeight: 600
              }}
            />

            {/* Average Score Line */}
            {visibleLines.avgScore && (
              <Line
                yAxisId="score"
                type="monotone"
                dataKey="avgScore"
                name="Average Score (%)"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ stroke: '#0284c7', strokeWidth: 2, r: 5, fill: '#38bdf8' }}
                activeDot={{ r: 7, stroke: '#e0f2fe', strokeWidth: 2 }}
              />
            )}

            {/* Passed Count Line */}
            {visibleLines.passCount && (
              <Line
                yAxisId="students"
                type="monotone"
                dataKey="passCount"
                name="Passed Students"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ stroke: '#047857', strokeWidth: 2, r: 4, fill: '#10b981' }}
                activeDot={{ r: 6, stroke: '#d1fae5', strokeWidth: 2 }}
              />
            )}

            {/* Failed Count Line */}
            {visibleLines.failCount && (
              <Line
                yAxisId="students"
                type="monotone"
                dataKey="failCount"
                name="Failed Students"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ stroke: '#be123c', strokeWidth: 2, r: 4, fill: '#f43f5e' }}
                activeDot={{ r: 6, stroke: '#ffe4e6', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary KPI Progression Footnotes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-slate-300 font-semibold">Prelim Mean</span>
          </div>
          <span className="font-mono font-bold text-sky-300">
            {stats.examSummaries.prelim.mean}% ({stats.examSummaries.prelim.passRate}% Pass)
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-semibold">Midterm Mean</span>
          </div>
          <span className="font-mono font-bold text-amber-300">
            {stats.examSummaries.midterm.mean}% ({stats.examSummaries.midterm.passRate}% Pass)
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-semibold">Final Mean</span>
          </div>
          <span className="font-mono font-bold text-emerald-300">
            {stats.examSummaries.finalExam.mean}% ({stats.examSummaries.finalExam.passRate}% Pass)
          </span>
        </div>
      </div>
    </div>
  );
};
