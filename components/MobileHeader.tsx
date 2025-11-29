
import React from 'react';
import { Menu, Briefcase } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, title = "JobSense AI" }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Briefcase size={16} strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold text-slate-900">{title}</span>
      </div>
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
      >
        <Menu size={20} />
      </button>
    </header>
  );
};
