import React, { ReactNode } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { AppView } from '../types';
import { Briefcase, Mail, User, Search, Menu, X, Zap } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
          onChangeView(view);
          setIsMobileMenuOpen(false);
        }}
        className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-all duration-200 group ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
      >
        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-200' : 'text-slate-400 group-hover:text-indigo-500'}`} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm z-10">
        <div className="flex items-center px-6 py-8">
          <div className="bg-indigo-600 p-2 rounded-lg mr-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">JobSense AI</span>
        </div>
        
        <nav className="flex-1 px-4 py-4">
          <NavItem view={AppView.DASHBOARD} icon={Menu} label="Dashboard" />
          <NavItem view={AppView.JOB_SEARCH} icon={Search} label="Find Jobs" />
          <NavItem view={AppView.EMAIL_ASSISTANT} icon={Mail} label="Email Assistant" />
          <NavItem view={AppView.PROFILE} icon={User} label="My Profile" />
        </nav>

        <div className="p-4 border-t border-slate-100 flex items-center space-x-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-slate-500">Account</span>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-20 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
             <div className="bg-indigo-600 p-1.5 rounded-lg mr-2">
                <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">JobSense</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-10 pt-20 px-4 md:hidden">
           <nav className="flex flex-col space-y-2">
            <NavItem view={AppView.DASHBOARD} icon={Menu} label="Dashboard" />
            <NavItem view={AppView.JOB_SEARCH} icon={Search} label="Find Jobs" />
            <NavItem view={AppView.EMAIL_ASSISTANT} icon={Mail} label="Email Assistant" />
            <NavItem view={AppView.PROFILE} icon={User} label="My Profile" />
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto md:p-8 pt-20 md:pt-8 relative">
        <div className="max-w-5xl mx-auto px-4 md:px-0 pb-10">
          {children}
        </div>
      </main>
    </div>
  );
};
