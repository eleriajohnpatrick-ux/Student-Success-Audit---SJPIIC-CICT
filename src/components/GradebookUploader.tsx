import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  HelpCircle,
  Eye,
  FileText
} from 'lucide-react';
import { 
  parseEClassFile, 
  applyColumnMapping, 
  ColumnMapping, 
  ParseResult, 
  SAMPLE_DATASETS 
} from '../utils/eclassParser';
import { anonymizeRecords, AnonymizedStudentRecord, RawStudentRow } from '../utils/anonymizer';
import { CourseInfo } from '../types';

interface GradebookUploaderProps {
  onDataReady: (data: {
    courseInfo: CourseInfo;
    anonymizedRecords: AnonymizedStudentRecord[];
    rawRowsCount: number;
  }) => void;
  passingThreshold?: number;
}

export const GradebookUploader: React.FC<GradebookUploaderProps> = ({
  onDataReady,
  passingThreshold = 75
}) => {
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    subjectCode: 'CC102',
    subjectTitle: 'Fundamentals of Programming',
    section: 'BSIT-1A',
    schoolYear: '2025-2026',
    semester: '1st Semester'
  });

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    studentIdCol: '',
    studentNameCol: '',
    prelimCol: '',
    midtermCol: '',
    finalExamCol: '',
    quizzesCol: '',
    activitiesCol: '',
    attendanceCol: '',
    finalGradeCol: '',
    statusCol: ''
  });

  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // Handle file drop or input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setErrorMessage(null);
    setSelectedPresetId('');

    try {
      const res = await parseEClassFile(file);
      setParseResult(res);
      setMapping(res.detectedMapping);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse the gradebook file.');
    } finally {
      setIsParsing(false);
    }
  };

  // Load realistic preset dataset
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (!sample) return;

    setSelectedPresetId(sampleId);
    setCourseInfo({
      subjectCode: sample.courseCode,
      subjectTitle: sample.courseTitle,
      section: sample.section,
      schoolYear: sample.schoolYear,
      semester: sample.semester
    });

    const headers = [
      'studentId',
      'studentName',
      'prelim',
      'midterm',
      'finalExam',
      'quizzes',
      'activities',
      'attendance',
      'finalGrade',
      'status'
    ];

    const rawRows = sample.data as unknown as Record<string, unknown>[];

    setParseResult({
      headers,
      rawRows,
      detectedMapping: {
        studentIdCol: 'studentId',
        studentNameCol: 'studentName',
        prelimCol: 'prelim',
        midtermCol: 'midterm',
        finalExamCol: 'finalExam',
        quizzesCol: 'quizzes',
        activitiesCol: 'activities',
        attendanceCol: 'attendance',
        finalGradeCol: 'finalGrade',
        statusCol: 'status'
      },
      sampleRows: rawRows.slice(0, 5),
      totalRawRows: rawRows.length
    });

    setMapping({
      studentIdCol: 'studentId',
      studentNameCol: 'studentName',
      prelimCol: 'prelim',
      midtermCol: 'midterm',
      finalExamCol: 'finalExam',
      quizzesCol: 'quizzes',
      activitiesCol: 'activities',
      attendanceCol: 'attendance',
      finalGradeCol: 'finalGrade',
      statusCol: 'status'
    });

    setErrorMessage(null);
  };

  // Compute preview records
  const previewAnonymizedRecords: AnonymizedStudentRecord[] = parseResult
    ? anonymizeRecords(
        applyColumnMapping(parseResult.rawRows.slice(0, 5), mapping),
        passingThreshold
      )
    : [];

  const handleProceed = () => {
    if (!parseResult) {
      setErrorMessage('Please upload an eClass gradebook or load a sample dataset first.');
      return;
    }

    if (!mapping.prelimCol && !mapping.finalExamCol) {
      setErrorMessage(
        'Please map at least one exam period (Prelim, Midterm, or Final) to run the quality audit.'
      );
      return;
    }

    const rawStudentRows: RawStudentRow[] = applyColumnMapping(parseResult.rawRows, mapping);
    const anonymized = anonymizeRecords(rawStudentRows, passingThreshold);

    if (anonymized.length === 0) {
      setErrorMessage('No valid student rows were found after column mapping.');
      return;
    }

    onDataReady({
      courseInfo,
      anonymizedRecords: anonymized,
      rawRowsCount: parseResult.totalRawRows
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">eClass Gradebook Ingestion & Column Mapping</h2>
              <p className="text-xs text-slate-400">
                St. John Paul II College of Davao • College of Information and Communications Technology
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 hidden lg:inline">Quick Test:</span>
            {SAMPLE_DATASETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleLoadSample(s.id)}
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                  selectedPresetId === s.id
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-blue-300 border-blue-900/80'
                }`}
              >
                {s.courseCode} Sample
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RA 10173 Privacy Notice */}
      <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-start space-x-3 text-xs text-emerald-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-emerald-200 block mb-0.5">
            Philippine Data Privacy Act of 2012 (RA 10173) Client-Side Guarantee
          </strong>
          <span>
            Parsing occurs strictly inside your browser session. Student names are discarded instantly, and student ID numbers are translated to anonymous tokens (e.g., <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-100 font-mono">S001</code>, <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-100 font-mono">S002</code>). The raw file is never uploaded or saved to Firestore.
          </span>
        </div>
      </div>

      {/* Course Context Information */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          1. Course & Section Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Code</label>
            <input
              type="text"
              value={courseInfo.subjectCode}
              onChange={(e) => setCourseInfo({ ...courseInfo, subjectCode: e.target.value })}
              placeholder="e.g. CC102"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title</label>
            <input
              type="text"
              value={courseInfo.subjectTitle}
              onChange={(e) => setCourseInfo({ ...courseInfo, subjectTitle: e.target.value })}
              placeholder="e.g. Fundamentals of Programming"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
            <input
              type="text"
              value={courseInfo.section}
              onChange={(e) => setCourseInfo({ ...courseInfo, section: e.target.value })}
              placeholder="e.g. BSIT-1A"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year</label>
            <input
              type="text"
              value={courseInfo.schoolYear}
              onChange={(e) => setCourseInfo({ ...courseInfo, schoolYear: e.target.value })}
              placeholder="e.g. 2025-2026"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Term / Semester</label>
            <select
              value={courseInfo.semester}
              onChange={(e) => setCourseInfo({ ...courseInfo, semester: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer / Midyear">Summer / Midyear</option>
            </select>
          </div>
        </div>
      </div>

      {/* File Ingestion Dropzone */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          2. Upload eClass Gradebook (CSV or XLSX)
        </h3>

        <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-xl p-8 text-center transition-all bg-slate-900/40 cursor-pointer relative">
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            disabled={isParsing}
          />
          <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
            <Upload className="w-8 h-8 text-blue-400" />
            <span className="text-xs font-semibold text-slate-200">
              {isParsing ? 'Parsing eClass Sheet...' : 'Drag and drop your eClass export or click to browse'}
            </span>
            <span className="text-[11px] text-slate-400">
              Compatible with SJPIIC eClass LMS grade export files (.xlsx, .csv)
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-700/80 p-3 rounded-xl flex items-center space-x-2 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {parseResult && (
          <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Detected <strong>{parseResult.totalRawRows} student rows</strong> across{' '}
                <strong>{parseResult.headers.length} columns</strong>
              </span>
            </div>
            <span className="text-[11px] text-blue-400 font-mono">
              Headers Auto-Mapped
            </span>
          </div>
        )}
      </div>

      {/* Column Mapping Section */}
      {parseResult && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Column Mapping & Schema Verification
            </h3>
            <span className="text-[11px] text-slate-400">
              Ensure Prelim, Midterm, and Final columns match your sheet
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Student ID */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Student ID / Number <span className="text-emerald-400 font-mono text-[10px]">(Anonymized)</span>
              </label>
              <select
                value={mapping.studentIdCol}
                onChange={(e) => setMapping({ ...mapping, studentIdCol: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- None / Auto-Generate --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Student Name <span className="text-rose-400 font-mono text-[10px]">(Scrubbed Client-Side)</span>
              </label>
              <select
                value={mapping.studentNameCol}
                onChange={(e) => setMapping({ ...mapping, studentNameCol: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Ignored / Not Mapped --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Prelim Exam */}
            <div>
              <label className="block text-blue-300 mb-1 font-semibold">
                Prelim Period Grade / Exam *
              </label>
              <select
                value={mapping.prelimCol}
                onChange={(e) => setMapping({ ...mapping, prelimCol: e.target.value })}
                className="w-full bg-slate-900 border border-blue-600/60 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Select Column --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Midterm Exam */}
            <div>
              <label className="block text-blue-300 mb-1 font-semibold">
                Midterm Period Grade / Exam *
              </label>
              <select
                value={mapping.midtermCol}
                onChange={(e) => setMapping({ ...mapping, midtermCol: e.target.value })}
                className="w-full bg-slate-900 border border-blue-600/60 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Select Column --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Final Exam */}
            <div>
              <label className="block text-blue-300 mb-1 font-semibold">
                Final Period Grade / Exam *
              </label>
              <select
                value={mapping.finalExamCol}
                onChange={(e) => setMapping({ ...mapping, finalExamCol: e.target.value })}
                className="w-full bg-slate-900 border border-blue-600/60 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Select Column --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Quizzes */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Quizzes / Summative Assessments</label>
              <select
                value={mapping.quizzesCol}
                onChange={(e) => setMapping({ ...mapping, quizzesCol: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Optional / Not in Export --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Activities / Lab */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Laboratory & Practical Exercises</label>
              <select
                value={mapping.activitiesCol}
                onChange={(e) => setMapping({ ...mapping, activitiesCol: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Optional / Not in Export --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Attendance */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Attendance Records</label>
              <select
                value={mapping.attendanceCol}
                onChange={(e) => setMapping({ ...mapping, attendanceCol: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Optional / Not in Export --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Final Semestral Grade */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Final Computed Grade</label>
              <select
                value={mapping.finalGradeCol}
                onChange={(e) => setMapping({ ...mapping, finalGradeCol: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Auto-Compute (30/30/40) --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Status / Remarks */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Remarks / Status (Passed/Failed/Drop)</label>
              <select
                value={mapping.statusCol}
                onChange={(e) => setMapping({ ...mapping, statusCol: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500"
              >
                <option value="">-- Determine from Grade Threshold --</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Anonymized Data Preview */}
      {previewAnonymizedRecords.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>4. Anonymized Data Preview (First 5 Students)</span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium">
              ✓ Compliant with RA 10173 Anonymization Standard
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
                <tr>
                  <th className="p-2.5">Anonymous ID</th>
                  <th className="p-2.5">Prelim</th>
                  <th className="p-2.5">Midterm</th>
                  <th className="p-2.5">Final</th>
                  <th className="p-2.5">Quizzes</th>
                  <th className="p-2.5">Lab / Acts</th>
                  <th className="p-2.5">Attendance</th>
                  <th className="p-2.5">Final Grade</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {previewAnonymizedRecords.map((rec) => (
                  <tr key={rec.anonymousCode} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-amber-300">{rec.anonymousCode}</td>
                    <td className="p-2.5">{rec.prelim ?? '-'}</td>
                    <td className="p-2.5">{rec.midterm ?? '-'}</td>
                    <td className="p-2.5">{rec.finalExam ?? '-'}</td>
                    <td className="p-2.5">{rec.quizzes ?? '-'}</td>
                    <td className="p-2.5">{rec.activities ?? '-'}</td>
                    <td className="p-2.5">{rec.attendance ?? '-'}</td>
                    <td className="p-2.5 font-bold text-white">{rec.finalGrade ?? '-'}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          rec.status === 'Passed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : rec.status === 'Dropped'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Button */}
      {parseResult && (
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={handleProceed}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <span>Proceed to Quality Audit</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};
