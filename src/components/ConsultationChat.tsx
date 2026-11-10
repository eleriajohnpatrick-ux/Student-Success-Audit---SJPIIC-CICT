import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Send, 
  Sparkles, 
  User as UserIcon, 
  Bot, 
  HelpCircle, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  X,
  MessageSquare
} from 'lucide-react';
import { InteractionMessage, QaAuditResult, CourseInfo, SavedInteraction } from '../types';

interface ConsultationChatProps {
  user: User | null;
  courseInfo: CourseInfo;
  auditSummary: QaAuditResult;
  onClose: () => void;
}

export const ConsultationChat: React.FC<ConsultationChatProps> = ({
  user,
  courseInfo,
  auditSummary,
  onClose
}) => {
  const [messages, setMessages] = useState<InteractionMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I have reviewed your course audit for ${courseInfo.subjectCode} (${courseInfo.subjectTitle}). I see that the ${auditSummary.strategyScorecard.overallRating.toLowerCase()} rating reflects notable strengths as well as specific gateway challenges. Please share your perspective—what work processes, student difficulties, or lab logistics did you encounter during this term?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [clarifyingQuestionCount, setClarifyingQuestionCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userText = input.trim();
    const newMsg: InteractionMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsSending(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          auditSummary,
          questionCount: clarifyingQuestionCount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to receive consultation response');
      }

      const botReply = data.reply;
      const botMsg: InteractionMessage = {
        role: 'assistant',
        content: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setClarifyingQuestionCount((prev) => prev + 1);

      // Persist interaction to Firestore under /users/{userId}/interactions if user signed in
      if (user) {
        const interactionId = `int_${Date.now()}`;
        const docPath = `users/${user.uid}/interactions/${interactionId}`;
        const interactionDoc: SavedInteraction = {
          id: interactionId,
          userId: user.uid,
          auditId: `audit_${courseInfo.subjectCode}`,
          prompt: userText,
          response: botReply,
          timestamp: new Date().toISOString(),
          instructorEmail: user.email || ''
        };

        try {
          await setDoc(doc(db, 'users', user.uid, 'interactions', interactionId), interactionDoc);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } catch (dbErr) {
          console.warn('Could not save interaction:', dbErr);
          setSaveError('Notice: Could not automatically save interaction to Firestore.');
          try {
            handleFirestoreError(dbErr, OperationType.WRITE, docPath);
          } catch (logErr) {
            // Error captured per requirements
          }
        }
      }
    } catch (err: any) {
      setSaveError(err.message || 'Consultation exchange failed. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[650px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <span>Gemini QA Consultation Partner</span>
                <span className="bg-indigo-950 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-800">
                  {clarifyingQuestionCount}/2 Questions Asked
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {courseInfo.subjectCode}: {courseInfo.subjectTitle} • Multi-turn pedagogical reflection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close consultation modal"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner */}
        {saveError && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 p-2.5 px-4 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-950/60 border-b border-emerald-800/60 p-2 px-4 flex items-center space-x-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interaction saved to Firestore (/users/{user?.uid}/interactions)</span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                {msg.role === 'user' ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-amber-300" />
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800/80 border border-slate-700/80 text-slate-200'
                }`}
              >
                {msg.content}
                <span
                  className={`block text-[9px] mt-1.5 ${
                    msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4 text-amber-300" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-xs text-slate-400 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>Gemini is synthesizing QA reflections...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-800/90 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Discuss your difficulties, student complaints, lab challenges, or suggestions..."
              disabled={isSending}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 px-1">
            Exchange is isolated to your instructor profile. Gemini asks at most 2–3 targeted clarifying questions before delivering an institutional reflection synthesis.
          </p>
        </form>
      </div>
    </div>
  );
};
