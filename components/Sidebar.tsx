
import React from 'react';
import { Briefcase, User, Mail, FileText, X, LogOut } from 'lucide-react';
import { AppView } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navItems = [
    { id: AppView.PROFILE, label: 'Profile', icon: User },
    { id: AppView.JOBS, label: 'Find Jobs', icon: Briefcase },
    { id: AppView.RESUME_BUILDER, label: 'Resume Builder', icon: FileText },
    { id: AppView.EMAIL, label: 'Email Assistant', icon: Mail },
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    onClose();
  };

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
    md:translate-x-0 md:static md:shadow-none shadow-2xl
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={sidebarClasses}>
        <div className="flex h-full flex-col">
          {/* Logo Area */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
                <Briefcase size={18} strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">JobSense AI</span>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 px-3 py-6">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-white'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom Footer Area */}
          <div className="border-t border-slate-800 p-4 space-y-4">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut size={20} className="text-slate-500 group-hover:text-red-400" />
              Logout
            </button>

            {/* Powered By */}
            <div className="rounded-xl bg-slate-800/50 p-4">
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Powered By</p>
               <div className="flex items-center gap-2 text-indigo-400">
                  <span className="text-sm font-bold">Gemini 2.5 Flash</span>
               </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
