import React from 'react';
import { User } from 'firebase/auth';
import { 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  FileSpreadsheet, 
  History, 
  Award, 
  BookOpen, 
  UserCheck,
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { isUserSuperAdmin } from '../firebase';

interface NavbarProps {
  user: User | null;
  activeTab: 'dashboard' | 'new-audit' | 'history' | 'profile' | 'benchmarks' | 'admin';
  onSelectTab: (tab: 'dashboard' | 'new-audit' | 'history' | 'profile' | 'benchmarks' | 'admin') => void;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onSignIn,
  onSignOut,
  isSigningIn = false
}) => {
  const isSuperAdmin = isUserSuperAdmin(user);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => onSelectTab(user ? 'dashboard' : 'new-audit')}
            title="SJPIIC Student Success Audit"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-extrabold text-lg">
              JP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">
                  Student Success Audit
                </span>
                <span className="bg-blue-950/80 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-800/60 uppercase tracking-wider">
                  CICT QA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                St. John Paul II College of Davao • College of Information and Communications Technology
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('new-audit')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'new-audit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>eClass Audit</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('history')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit History</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('benchmarks')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'benchmarks'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>QA Benchmarks</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('profile')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Instructor Profile</span>
              </button>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectTab('admin')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'text-amber-400 border-amber-600/40 hover:bg-amber-950/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin Console</span>
                </button>
              )}
            </nav>
          )}

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    {isSuperAdmin ? (
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        SUPER ADMIN
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.2 rounded">
                        INSTRUCTOR
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>

                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white">
                    {user.displayName ? user.displayName[0] : 'U'}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                disabled={isSigningIn}
                title="Sign In with Google SSO"
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {user && (
          <div className="md:hidden flex items-center space-x-1 py-2 overflow-x-auto border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('new-audit')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
                activeTab === 'new-audit' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              eClass Audit
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('history')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
                activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('benchmarks')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
                activeTab === 'benchmarks' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Benchmarks
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
                activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Profile
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => onSelectTab('admin')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded whitespace-nowrap border ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'text-amber-400 border-amber-500/40'
                }`}
              >
                Super Admin
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
