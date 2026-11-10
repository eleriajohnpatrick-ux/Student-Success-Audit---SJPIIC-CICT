import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  UserCheck, 
  Globe, 
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { FIREBASE_PROJECT_ID, FIREBASE_AUTH_SETTINGS_URL } from '../firebase';

export interface AuthErrorInfo {
  code?: string;
  message: string;
  domain?: string;
}

interface AuthErrorModalProps {
  error: AuthErrorInfo;
  onClose: () => void;
  onRetryWithPopup: () => void;
  onRetryWithRedirect: () => void;
  onEnterFacultyDemo: () => void;
  onEnterAdminDemo: () => void;
}

export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  error,
  onClose,
  onRetryWithPopup,
  onRetryWithRedirect,
  onEnterFacultyDemo,
  onEnterAdminDemo
}) => {
  const [copied, setCopied] = useState(false);
  const currentDomain = error.domain || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const isUnauthorizedDomain = error.code === 'auth/unauthorized-domain' || error.message.toLowerCase().includes('unauthorized domain');
  const isPopupBlocked = error.code === 'auth/popup-blocked' || error.message.toLowerCase().includes('popup');

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/60 p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                {isUnauthorizedDomain ? 'Vercel Deployment Notice' : 'Sign-In Assistance'}
              </div>
              <h3 className="text-base font-extrabold text-white">
                {isUnauthorizedDomain 
                  ? 'Authorize Your Vercel Domain in Firebase' 
                  : isPopupBlocked
                  ? 'Browser Popup Was Blocked'
                  : 'Google SSO Authentication Notice'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300 max-h-[75vh] overflow-y-auto">
          {/* Explanation */}
          {isUnauthorizedDomain ? (
            <div className="space-y-3">
              <p className="leading-relaxed">
                Google SSO requires that any hosting domain (such as <strong className="text-white">{currentDomain}</strong> on Vercel) be added to the <strong className="text-amber-300">Authorized Domains</strong> list in the Firebase project console (<code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded">{FIREBASE_PROJECT_ID}</code>).
              </p>

              {/* Current Domain Box with Copy Button */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-mono text-white text-xs truncate">{currentDomain}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ml-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Domain</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2.5">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>How to fix in 30 seconds:</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    Click <strong className="text-white">Copy Domain</strong> above to copy <code className="text-amber-300 font-mono text-[11px]">{currentDomain}</code>.
                  </li>
                  <li>
                    Open the Firebase Console Settings page:
                    <div className="mt-1.5">
                      <a
                        href={FIREBASE_AUTH_SETTINGS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-950 text-blue-400 hover:text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                      >
                        <span>Open Firebase Auth Settings</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </li>
                  <li>
                    Under the <strong className="text-white">Authorized domains</strong> tab, click <strong className="text-amber-300">Add domain</strong>.
                  </li>
                  <li>
                    Paste <code className="text-amber-300 font-mono text-[11px]">{currentDomain}</code> and click <strong className="text-emerald-400">Save</strong>.
                  </li>
                  <li>
                    Return to this tab and click <strong className="text-white">Retry Sign-In</strong> below.
                  </li>
                </ol>
              </div>
            </div>
          ) : isPopupBlocked ? (
            <div className="space-y-3">
              <p className="leading-relaxed">
                Your browser or device blocked the Google Sign-In popup window. You can sign in using full-page redirect mode instead.
              </p>
              <button
                type="button"
                onClick={onRetryWithRedirect}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Continue with Google Redirect</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-rose-300 leading-relaxed">
                {error.message || 'An error occurred during authentication.'}
              </p>
              {error.code && (
                <div className="text-[11px] font-mono text-slate-400">
                  Error Code: <span className="text-amber-400">{error.code}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Instant-Access Section */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Immediate Demo Access (No Firebase Config Needed):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onEnterFacultyDemo();
                  onClose();
                }}
                className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2.5 rounded-xl font-semibold transition-all hover:border-blue-500 text-xs"
              >
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>Faculty Demo Session</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onEnterAdminDemo();
                  onClose();
                }}
                className="flex items-center justify-center space-x-2 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-600/50 px-3 py-2.5 rounded-xl font-semibold transition-all text-xs"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Super Admin (J. Eleria)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 transition-colors order-2 sm:order-1"
          >
            Dismiss
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onRetryWithRedirect}
              className="flex-1 sm:flex-initial text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl font-semibold border border-slate-700 transition-colors"
            >
              Sign In with Redirect
            </button>
            <button
              type="button"
              onClick={onRetryWithPopup}
              className="flex-1 sm:flex-initial text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Sign-In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
