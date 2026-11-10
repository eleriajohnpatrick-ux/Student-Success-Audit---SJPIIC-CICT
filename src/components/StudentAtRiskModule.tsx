import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  TrendingDown, 
  ArrowRight, 
  Check, 
  Copy, 
  Search, 
  Filter, 
  UserCheck, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  BookOpen,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { AtRiskStudent, RiskSeverity } from '../utils/gradeCalculations';

interface StudentAtRiskModuleProps {
  atRiskStudents: AtRiskStudent[];
  totalStudents: number;
  passingThreshold: number;
  courseCode?: string;
  courseTitle?: string;
}

export const StudentAtRiskModule: React.FC<StudentAtRiskModuleProps> = ({
  atRiskStudents = [],
  totalStudents,
  passingThreshold = 75,
  courseCode = 'Course',
  courseTitle
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'drop' | 'severity' | 'grade' | 'id'>('drop');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copied, setCopied] = useState(false);
  const [loggedInterventions, setLoggedInterventions] = useState<Record<string, boolean>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Summary counts
  const totalFlagged = atRiskStudents.length;
  const flaggedRate = totalStudents > 0 ? Math.round((totalFlagged / totalStudents) * 1000) / 10 : 0;
  
  const criticalCount = atRiskStudents.filter((s) => s.severity === 'Critical').length;
  const highCount = atRiskStudents.filter((s) => s.severity === 'High').length;
  const moderateCount = atRiskStudents.filter((s) => s.severity === 'Moderate').length;

  const avgDrop = totalFlagged > 0 
    ? Math.round((atRiskStudents.reduce((acc, s) => acc + s.scoreDrop, 0) / totalFlagged) * 10) / 10
    : 0;

  // Filtered & Sorted list
  const filteredStudents = useMemo(() => {
    let result = [...atRiskStudents];

    // Filter by severity
    if (selectedSeverity !== 'ALL') {
      result = result.filter((s) => s.severity.toUpperCase() === selectedSeverity);
    }

    // Filter by search query (Anonymous ID)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      result = result.filter((s) => s.anonymousCode.toUpperCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'drop') {
        return b.scoreDrop - a.scoreDrop;
      }
      if (sortBy === 'severity') {
        const rank: Record<RiskSeverity, number> = { Critical: 1, High: 2, Moderate: 3 };
        return rank[a.severity] - rank[b.severity];
      }
      if (sortBy === 'grade') {
        return (a.finalGrade ?? 0) - (b.finalGrade ?? 0);
      }
      if (sortBy === 'id') {
        return a.anonymousCode.localeCompare(b.anonymousCode);
      }
      return 0;
    });

    return result;
  }, [atRiskStudents, selectedSeverity, searchQuery, sortBy]);

  const handleCopyIds = () => {
    const ids = filteredStudents.map((s) => s.anonymousCode).join(', ');
    navigator.clipboard.writeText(ids);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleInterventionLogged = (code: string) => {
    setLoggedInterventions((prev) => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const toggleExpand = (code: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const getSeverityBadge = (severity: RiskSeverity) => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-600/70',
          dot: 'bg-rose-500 animate-pulse',
          label: 'CRITICAL RISK'
        };
      case 'High':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-600/70',
          dot: 'bg-amber-500',
          label: 'HIGH RISK'
        };
      case 'Moderate':
        return {
          bg: 'bg-yellow-950/70 text-yellow-300 border-yellow-600/60',
          dot: 'bg-yellow-500',
          label: 'MODERATE RISK'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-500',
          label: 'AT-RISK'
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'Failed':
        return 'bg-rose-950 text-rose-400 border-rose-800';
      case 'Dropped':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-800/60 print:bg-slate-50 border border-slate-700/80 print:border-slate-300 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-700/80 print:border-slate-300 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 print:text-rose-900 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>QUALITY ASSURANCE • EARLY INTERVENTION ENGINE</span>
            <span className="hidden sm:inline-block bg-slate-800 print:bg-slate-200 text-slate-300 print:text-slate-800 text-[10px] px-2 py-0.5 rounded font-mono border border-slate-700">
              RA 10173 COMPLIANT
            </span>
          </div>
          <h3 className="text-lg font-black text-white print:text-black flex items-center space-x-2">
            <span>Student At-Risk Module: Downward Trajectory Flag</span>
          </h3>
          <p className="text-xs text-slate-400 print:text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Identifies specific anonymized students exhibiting a downward performance trajectory from Prelim to Final examination period. Flags high-priority academic dropouts and provides targeted pedagogical intervention plans to prevent term attrition.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center space-x-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleCopyIds}
            disabled={filteredStudents.length === 0}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            title="Copy anonymized IDs of flagged students to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">IDs Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Flagged IDs</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            title="Print intervention roster"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Print Roster</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 print:bg-white border border-slate-800 print:border-slate-300 p-4 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Flagged At-Risk</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {totalFlagged} <span className="text-xs font-normal text-slate-400">({flaggedRate}% of class)</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Downward trend from Prelim to Final
          </div>
        </div>

        <div className="bg-slate-900/80 print:bg-white border border-slate-800 print:border-slate-300 p-4 rounded-xl">
          <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider flex items-center justify-between">
            <span>Critical Severity</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-white print:text-black mt-1">
            {criticalCount} <span className="text-xs font-normal text-slate-400">students</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Drop ≥12 pts, Failed or Dropped
          </div>
        </div>

        <div className="bg-slate-900/80 print:bg-white border border-slate-800 print:border-slate-300 p-4 rounded-xl">
          <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>High Priority</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white print:text-black mt-1">
            {highCount} <span className="text-xs font-normal text-slate-400">students</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Drop ≥6 pts or Midterm failure
          </div>
        </div>

        <div className="bg-slate-900/80 print:bg-white border border-slate-800 print:border-slate-300 p-4 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Average Score Drop</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            -{avgDrop} <span className="text-xs font-normal text-slate-400">points</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Across flagged student cohort
          </div>
        </div>
      </div>

      {/* Filter, Search, and Sort Toolbar */}
      <div className="bg-slate-900/80 print:hidden border border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        {/* Severity filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Severity:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedSeverity('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              selectedSeverity === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Flagged ({totalFlagged})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeverity('CRITICAL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              selectedSeverity === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-rose-300'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeverity('HIGH')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              selectedSeverity === 'HIGH'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-amber-300'
            }`}
          >
            High ({highCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeverity('MODERATE')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              selectedSeverity === 'MODERATE'
                ? 'bg-yellow-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-yellow-300'
            }`}
          >
            Moderate ({moderateCount})
          </button>
        </div>

        {/* Search, Sort, and View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search by Anonymous ID */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ID (e.g. S004)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 pl-8 pr-3 py-1.5 rounded-lg text-slate-200 placeholder-slate-500 text-xs w-44 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="drop">Largest Score Drop</option>
              <option value="severity">Highest Severity</option>
              <option value="grade">Lowest Final Grade</option>
              <option value="id">Anonymous ID</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Cards View or Matrix Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-slate-900/60 print:bg-white border border-slate-800 print:border-slate-300 rounded-xl p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto">
            <Check className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white print:text-black">
            {atRiskStudents.length === 0
              ? 'No Downward Trajectory Detected'
              : 'No Students Match Current Filter Criteria'}
          </h4>
          <p className="text-xs text-slate-400 print:text-slate-600 max-w-md mx-auto">
            {atRiskStudents.length === 0
              ? 'All enrolled students either maintained stable scores or showed academic progress from Prelim to Final examination period.'
              : 'Try clearing the search query or selecting "All Flagged" to inspect at-risk students.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Detailed Cards View */
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const badge = getSeverityBadge(student.severity);
            const isLogged = loggedInterventions[student.anonymousCode];
            const isExpanded = expandedIds[student.anonymousCode];

            return (
              <div
                key={student.anonymousCode}
                className="bg-slate-900/90 print:bg-white border border-slate-800 print:border-slate-300 hover:border-slate-700 rounded-xl p-4 sm:p-5 space-y-3.5 transition-all shadow-md"
              >
                {/* Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex items-center space-x-3">
                    {/* Anonymous Student Identifier Badge */}
                    <div className="bg-blue-950/80 border border-blue-600/70 text-blue-300 font-mono font-black text-sm px-3 py-1 rounded-lg tracking-wider flex items-center space-x-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      <span>{student.anonymousCode}</span>
                    </div>

                    {/* Severity Pill */}
                    <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider flex items-center space-x-1.5 ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </div>

                    {/* Trajectory Pattern */}
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {student.trajectory}
                    </span>

                    {/* Final Status */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(student.status)}`}>
                      {student.status}
                    </span>
                  </div>

                  {/* Right side: Log Action Checkbox Button */}
                  <div className="flex items-center space-x-2 shrink-0 print:hidden">
                    <button
                      type="button"
                      onClick={() => toggleInterventionLogged(student.anonymousCode)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isLogged
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
                      }`}
                      title="Mark whether intervention protocol has been initiated"
                    >
                      <UserCheck className={`w-3.5 h-3.5 ${isLogged ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{isLogged ? 'Intervention Logged' : 'Log Intervention'}</span>
                    </button>
                  </div>
                </div>

                {/* Score Trajectory Pipeline */}
                <div className="bg-slate-950/70 print:bg-slate-100 p-3 rounded-xl border border-slate-800/80 print:border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Prelim Period */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Prelim Period</div>
                    <div className="text-base font-bold text-white print:text-black mt-0.5 flex items-center space-x-1.5">
                      <span>{student.prelim ?? 'N/A'}%</span>
                      {student.prelim !== null && (
                        <span className={`text-[10px] font-semibold ${student.prelim >= passingThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({student.prelim >= passingThreshold ? 'Pass' : 'Fail'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Midterm Period */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Midterm Period</div>
                    <div className="text-base font-bold text-white print:text-black mt-0.5 flex items-center space-x-1.5">
                      <span>{student.midterm ?? 'N/A'}%</span>
                      {student.midterm !== null && (
                        <span className={`text-[10px] font-semibold ${student.midterm >= passingThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({student.midterm >= passingThreshold ? 'Pass' : 'Fail'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Final Exam */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Final Exam</div>
                    <div className="text-base font-bold text-white print:text-black mt-0.5 flex items-center space-x-1.5">
                      <span>{student.finalExam ?? 'N/A'}%</span>
                      {student.finalExam !== null && (
                        <span className={`text-[10px] font-semibold ${student.finalExam >= passingThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({student.finalExam >= passingThreshold ? 'Pass' : 'Fail'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Net Drop Delta */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Net Trajectory Delta</div>
                    <div className="text-base font-black text-rose-400 mt-0.5 flex items-center space-x-1">
                      <TrendingDown className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>-{student.scoreDrop.toFixed(1)} pts</span>
                      {student.dropPercentage > 0 && (
                        <span className="text-[10px] font-normal text-slate-400">
                          (↓ {student.dropPercentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formative Metric Indicators */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-slate-400 font-medium">Formative Records:</span>
                  
                  <span className={`px-2 py-0.5 rounded border ${
                    student.attendance !== null && student.attendance >= 75
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800'
                  }`}>
                    Attendance: <strong>{student.attendance ?? 'N/A'}%</strong>
                  </span>

                  <span className={`px-2 py-0.5 rounded border ${
                    student.quizzes !== null && student.quizzes >= 75
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800'
                  }`}>
                    Quizzes: <strong>{student.quizzes ?? 'N/A'}%</strong>
                  </span>

                  <span className={`px-2 py-0.5 rounded border ${
                    student.activities !== null && student.activities >= 75
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800'
                  }`}>
                    Lab / Practical: <strong>{student.activities ?? 'N/A'}%</strong>
                  </span>

                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Final Computed Grade: <strong>{student.finalGrade ?? 'N/A'}%</strong>
                  </span>
                </div>

                {/* Contributing Risk Factors */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-amber-300 print:text-amber-900 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Contributing Risk Factors:</span>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-slate-300 print:text-slate-700">
                    {student.contributingFactors.map((factor, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-1.5 bg-slate-950/40 print:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-800/80 print:border-slate-200">
                        <span className="text-rose-400 font-bold shrink-0">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Pedagogical Intervention Box */}
                <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/20 print:bg-blue-50 border border-blue-800/60 print:border-blue-300 p-3.5 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-blue-300 print:text-blue-900 flex items-center space-x-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Recommended Pedagogical Intervention Directive:</span>
                  </div>
                  <p className="text-xs text-slate-200 print:text-slate-800 font-medium leading-relaxed">
                    {student.recommendedIntervention}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Matrix Table View */
        <div className="overflow-x-auto rounded-xl border border-slate-700 print:border-slate-300">
          <table className="w-full text-left text-xs text-slate-300 print:text-black">
            <thead className="bg-slate-900/90 print:bg-slate-200 text-slate-400 print:text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Anonymous ID</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Prelim → Final</th>
                <th className="p-3">Score Drop</th>
                <th className="p-3">Status</th>
                <th className="p-3">Formative (Att/Quiz/Lab)</th>
                <th className="p-3">Recommended Intervention</th>
                <th className="p-3 print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-xs">
              {filteredStudents.map((s) => {
                const badge = getSeverityBadge(s.severity);
                const isLogged = loggedInterventions[s.anonymousCode];

                return (
                  <tr key={s.anonymousCode} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-blue-400 print:text-blue-900">{s.anonymousCode}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                        {s.severity}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      {s.prelim ?? 'N/A'}% → {s.finalExam ?? 'N/A'}%
                    </td>
                    <td className="p-3 font-bold text-rose-400">
                      -{s.scoreDrop.toFixed(1)} pts
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">
                      {s.attendance ?? '-'}% / {s.quizzes ?? '-'}% / {s.activities ?? '-'}%
                    </td>
                    <td className="p-3 text-slate-200 print:text-slate-800 max-w-xs">
                      {s.recommendedIntervention}
                    </td>
                    <td className="p-3 print:hidden">
                      <button
                        type="button"
                        onClick={() => toggleInterventionLogged(s.anonymousCode)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                          isLogged
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                            : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                        }`}
                      >
                        {isLogged ? '✓ Logged' : 'Log'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
