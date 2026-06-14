import React from 'react';
import { Sparkles, GraduationCap, Award, ShieldAlert, Languages, UserCheck, Database, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  language: 'english' | 'tamil';
  onLanguageChange: (lang: 'english' | 'tamil') => void;
  studentName: string;
  onLogout?: () => void;
  allowRoleSwitch?: boolean;
}

export default function Header({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  studentName,
  onLogout,
  allowRoleSwitch = true
}: HeaderProps) {
  const isTamil = language === 'tamil';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-md shadow-blue-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
              CrackIt
            </span>
            <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              Unified Career & Placement Hub
            </div>
          </div>
        </div>

        {/* MIDDLE ACTIONS: LANGUAGE & ROLE SWITCHERS */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => onLanguageChange(language === 'english' ? 'tamil' : 'english')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span>{isTamil ? 'English' : 'தமிழ்'}</span>
          </button>

          {/* Role Switcher Dropdown */}
          {allowRoleSwitch && (
            <div className="flex items-center gap-1.5">
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                <option value="student">{isTamil ? 'மாணவர் பக்கம்' : 'Student View'}</option>
                <option value="tpo">{isTamil ? 'TPO அதிகாரி' : 'TPO Admin View'}</option>
                <option value="superadmin">{isTamil ? 'அட்மின் பக்கம்' : 'Superadmin View'}</option>
              </select>
            </div>
          )}

          {/* Student Portal Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-150 text-blue-700 text-xs font-extrabold shadow-sm">
            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{isTamil ? 'மாணவர் போர்டல்' : 'Student Portal'}</span>
          </div>
        </div>

        {/* RIGHT METADATA: ACTIVE STATE */}
        <div className="flex items-center gap-3 md:border-l md:border-slate-100 md:pl-4">
          <div className="hidden md:block text-right">
            <div className="text-xs text-slate-400 font-medium">{isTamil ? 'தற்போதைய பயனர்' : 'Logged in as'}</div>
            <div className="text-sm font-bold text-slate-700">
              {currentRole === 'superadmin'
                ? 'Madhan Kumar (Super)'
                : studentName}
            </div>
          </div>
          <div className="hidden md:flex bg-green-50 text-green-700 border border-green-200 p-2 rounded-lg items-center justify-center">
            <Database className="w-4 h-4" />
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-all shadow-xs cursor-pointer text-xs font-bold shrink-0 ml-1"
              id="header-logout-button"
              title={isTamil ? 'வெளியேறு' : 'Logout'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTamil ? 'வெளியேறு' : 'Logout'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
