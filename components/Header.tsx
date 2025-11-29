
import React from 'react';
import { Briefcase, User, Mail, Search, FileText } from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: AppView.PROFILE, label: 'Profile', icon: User },
    { id: AppView.JOBS, label: 'Find Jobs', icon: Search },
    { id: AppView.RESUME_BUILDER, label: 'Resume Builder', icon: FileText },
    { id: AppView.EMAIL, label: 'Email Assistant', icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.JOBS)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Briefcase size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">JobSense AI</h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-600">Powered by Gemini</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-full">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon size={16} />
                <span className="inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Navigation Icon Only */}
        <nav className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-full">
           {navItems.map((item) => {
             const isActive = currentView === item.id;
             const Icon = item.icon;
             return (
               <button
                 key={item.id}
                 onClick={() => onNavigate(item.id)}
                 className={`flex items-center justify-center rounded-full w-9 h-9 transition-all ${
                   isActive
                     ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                     : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                 }`}
                 title={item.label}
               >
                 <Icon size={18} />
               </button>
             );
           })}
        </nav>
      </div>
    </header>
  );
};
