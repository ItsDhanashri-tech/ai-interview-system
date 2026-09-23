import React from 'react';
import { Bot, User, LogOut, History, PlayCircle } from 'lucide-react';

export default function Navbar({ user, onLogout, onNavigate, currentTab, onOpenAuth, onQuickDemo }) {
  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">AI Interview</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Prep System
            </span>
          </div>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <PlayCircle className="w-4 h-4" />
                <span>New Interview</span>
              </button>

              <button
                onClick={() => onNavigate('history')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>My History</span>
              </button>

              <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

              <div className="flex items-center gap-3 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">
                  {user.name}
                </span>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="text-slate-400 hover:text-red-400 transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={onQuickDemo}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Quick Demo Login</span>
              </button>

              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Sign Up</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
