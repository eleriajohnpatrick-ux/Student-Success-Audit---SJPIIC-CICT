import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { History, FileSpreadsheet, MessageSquare, ChevronRight, Calendar, UserCheck, Award, Eye } from 'lucide-react';
import { SavedAudit, SavedInteraction } from '../types';

interface AuditHistoryViewProps {
  user: User;
  onSelectAudit: (audit: SavedAudit) => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({ user, onSelectAudit }) => {
  const [audits, setAudits] = useState<SavedAudit[]>([]);
  const [interactions, setInteractions] = useState<SavedInteraction[]>([]);
  const [activeTab, setActiveTab] = useState<'audits' | 'interactions'>('audits');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);
      const auditPath = `users/${user.uid}/audits`;
      const interactionPath = `users/${user.uid}/interactions`;

      try {
        // Fetch Audits
        const auditsQuery = query(collection(db, 'users', user.uid, 'audits'));
        const auditSnap = await getDocs(auditsQuery);
        const loadedAudits: SavedAudit[] = [];
        auditSnap.forEach((doc) => {
          loadedAudits.push(doc.data() as SavedAudit);
        });
        // Sort descending by date
        loadedAudits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAudits(loadedAudits);

        // Fetch Interactions
        const intQuery = query(collection(db, 'users', user.uid, 'interactions'));
        const intSnap = await getDocs(intQuery);
        const loadedInts: SavedInteraction[] = [];
        intSnap.forEach((doc) => {
          loadedInts.push(doc.data() as SavedInteraction);
        });
        loadedInts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setInteractions(loadedInts);
      } catch (err) {
        console.warn('Failed to load user audit history:', err);
        setError('Could not retrieve audit history. Please ensure permissions are verified.');
        try {
          handleFirestoreError(err, OperationType.LIST, auditPath);
        } catch (logErr) {
          // Handled per requirements
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [user.uid]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your Saved Audits & QA Consultation History</h2>
            <p className="text-xs text-slate-400">
              Isolated repository for {user.displayName || user.email}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('audits')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'audits' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Saved Audits ({audits.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('interactions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'interactions' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Consultation Chats ({interactions.length})
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-slate-400 text-xs">
          Loading your private audit repository...
        </div>
      )}

      {error && (
        <div className="bg-rose-950/60 border border-rose-800 p-4 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Audits Tab */}
      {activeTab === 'audits' && !isLoading && (
        <div className="space-y-3">
          {audits.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-10 text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No Audits Saved Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once you generate a quality audit from your eClass gradebook, click "Save to Firestore" to preserve it here.
              </p>
            </div>
          ) : (
            audits.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectAudit(item)}
                className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/80 hover:border-blue-500/50 p-5 rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-blue-400">
                      {item.courseInfo.subjectCode}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-200 font-semibold">{item.courseInfo.section}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${
                      item.qaFindings.strategyScorecard.overallRating === 'Effective'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : item.qaFindings.strategyScorecard.overallRating === 'Partially Effective'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {item.qaFindings.strategyScorecard.overallRating}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    {item.courseInfo.subjectTitle}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>Enrolled: {item.stats.totalStudents}</span>
                    <span>Passed: {item.stats.passedRate}%</span>
                    <span>Failed: {item.stats.failedRate}%</span>
                    <span>Dropout: {item.stats.droppedRate}%</span>
                    <span>Peak Failure: {item.stats.failurePeakPeriod}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div className="text-[11px] text-slate-400 hidden sm:block">
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-900 group-hover:bg-blue-600 text-slate-400 group-hover:text-white transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Interactions Tab */}
      {activeTab === 'interactions' && !isLoading && (
        <div className="space-y-3">
          {interactions.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-10 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No Consultation Logs Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Consultation exchanges with Gemini QA Partner are automatically logged here for reflection.
              </p>
            </div>
          ) : (
            interactions.map((int) => (
              <div
                key={int.id}
                className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-700/70 pb-2">
                  <span className="font-semibold text-blue-300">
                    Audit Consultation Session • {int.auditId}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(int.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Reflection / Inquiry:
                  </span>
                  <p className="text-slate-200 italic">"{int.prompt}"</p>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                    Gemini QA Partner Response:
                  </span>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{int.response}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
