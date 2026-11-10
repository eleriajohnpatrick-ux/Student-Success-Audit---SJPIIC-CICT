import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { InstructorProfile } from '../types';
import { Save, AlertCircle, CheckCircle2, UserCheck, BookOpen, Layers, Sparkles } from 'lucide-react';

interface InstructorProfileFormProps {
  user: User;
  onProfileUpdated?: (profile: InstructorProfile) => void;
}

const CICT_PROGRAMS = [
  'BS in Information Technology (BSIT)',
  'BS in Computer Science (BSCS)',
  'BS in Information Systems (BSIS)',
  'Associate in Computer Technology (ACT)'
];

const TEACHING_STRATEGY_OPTIONS = [
  'Interactive Lectures & Theory Discussions',
  'Hands-on Computer Laboratory Exercises',
  'Project-Based Learning (PBL) / Capstone Sprints',
  'Flipped Classroom with Pre-Recorded Video Modules',
  'Frequent Formative Quizzes & Knowledge Checks',
  'Pair Programming & Collaborative Code Reviews',
  'Case Studies & Problem-Solving Workshops'
];

export const InstructorProfileForm: React.FC<InstructorProfileFormProps> = ({
  user,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<InstructorProfile>({
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    department: 'College of Information and Communications Technology (CICT)',
    program: 'BS in Information Technology (BSIT)',
    subjectsTaught: 'CC102 - Fundamentals of Programming, IT201 - Data Structures & Algorithms',
    teachingStrategies: 'Hands-on Computer Laboratory Exercises, Interactive Lectures & Theory Discussions, Project-Based Learning (PBL) / Capstone Sprints',
    assessmentStrategy: 'Prelim: 50% Lab Exercises + 50% Written/Coding Exam; Midterm: 40% Lab + 60% Exam; Final: 30% Major Project + 70% Comprehensive Final Exam.'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<InstructorProfile>;
          setProfile((prev) => ({
            ...prev,
            ...data,
            uid: user.uid,
            email: user.email || prev.email
          }));
        }
      } catch (err) {
        // If profile doesn't exist yet or permission error, handle gracefully
        console.warn('Initial profile load notice:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user.uid, user.email]);

  const handleStrategyToggle = (strategy: string) => {
    const current = profile.teachingStrategies
      ? profile.teachingStrategies.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const exists = current.includes(strategy);
    const updated = exists ? current.filter((s) => s !== strategy) : [...current, strategy];
    setProfile({ ...profile, teachingStrategies: updated.join(', ') });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    const docPath = `users/${user.uid}`;
    try {
      const dataToSave: InstructorProfile = {
        ...profile,
        uid: user.uid,
        email: user.email || profile.email,
        displayName: profile.displayName || user.displayName || 'Instructor',
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), dataToSave, { merge: true });
      setSaveSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(dataToSave);
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMessage(
        'Failed to save instructor profile to Firestore. Please check permissions or retry.'
      );
      try {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      } catch (logErr) {
        // Error logged to console per Firestore requirements
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Instructor Professional Background</h2>
            <p className="text-xs text-slate-400">
              St. John Paul II College of Davao • College of Information and Communications Technology
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-2">
          This profile establishes the institutional baseline for your course audits. Gemini evaluates whether your declared teaching and assessment strategies effectively align with student performance.
        </p>
      </div>

      {/* Error Banner with Retry */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-700/80 p-4 rounded-xl flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            className="bg-rose-800 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-700/80 p-3 rounded-xl flex items-center space-x-2 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile saved successfully to user-isolated Firestore!</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Faculty Name
            </label>
            <input
              type="text"
              required
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              placeholder="e.g. Engr. Maria Santos, MIT"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Institutional Email
            </label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Department / College
            </label>
            <input
              type="text"
              disabled
              value={profile.department}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Academic Program
            </label>
            <select
              value={profile.program}
              onChange={(e) => setProfile({ ...profile, program: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {CICT_PROGRAMS.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Subjects Regularly Taught (Course Codes & Titles)
          </label>
          <input
            type="text"
            value={profile.subjectsTaught}
            onChange={(e) => setProfile({ ...profile, subjectsTaught: e.target.value })}
            placeholder="e.g. CC102 - Fundamentals of Programming, IT201 - Data Structures & Algorithms, IT301 - Web Development"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Teaching Strategies Multi-select Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Pedagogical & Teaching Strategies Employed
          </label>
          <div className="flex flex-wrap gap-2">
            {TEACHING_STRATEGY_OPTIONS.map((strategy) => {
              const selected = profile.teachingStrategies?.includes(strategy);
              return (
                <button
                  type="button"
                  key={strategy}
                  onClick={() => handleStrategyToggle(strategy)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
                    selected
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200 font-medium'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {strategy}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Click to toggle active strategies. You can also specify custom strategies below.
          </p>
        </div>

        {/* Assessment Strategy */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Assessment Strategy Across Prelim, Midterm, and Final
          </label>
          <textarea
            rows={3}
            value={profile.assessmentStrategy}
            onChange={(e) => setProfile({ ...profile, assessmentStrategy: e.target.value })}
            placeholder="Explain how each exam period is assessed (e.g., practical coding exams vs multiple-choice quizzes, group projects, lab rubrics)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Profile...' : 'Save Instructor Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
