
import React from 'react';
import { AppView, UserProfile } from '../types';
import { Briefcase, ArrowRight, Check } from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: AppView) => void;
  profile: UserProfile;
  onViewResume: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange, profile, onViewResume }) => (
  <div className="space-y-8">
     <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 mb-2">Hello, {profile.name ? profile.name.split(' ')[0] : 'there'} 👋</h1>
           <p className="text-slate-500">Here's what's happening with your job search today.</p>
        </div>
        <button 
           onClick={() => onViewChange(AppView.JOB_SEARCH)}
           className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center shadow-lg shadow-indigo-200"
        >
           Start Search <ArrowRight className="w-4 h-4 ml-2" />
        </button>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              <Briefcase className="w-5 h-5" />
           </div>
           <h3 className="text-2xl font-bold text-slate-900 mb-1">12</h3>
           <p className="text-slate-500 text-sm">New Matches Today</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
              <Check className="w-5 h-5" />
           </div>
           <h3 className="text-2xl font-bold text-slate-900 mb-1">5</h3>
           <p className="text-slate-500 text-sm">Applications Sent</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
           <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Resume Status</h3>
              {profile.resumeName ? (
                <div className="mb-4">
                  <div className="flex items-center text-indigo-100 text-sm mb-2">
                    <Check className="w-4 h-4 mr-1" /> Ready to send
                  </div>
                  <div className="bg-white/10 rounded p-2 flex items-center justify-between backdrop-blur-sm">
                     <span className="text-xs truncate max-w-[120px]">{profile.resumeName}</span>
                     {profile.resumeUrl && (
                        <button 
                          onClick={onViewResume}
                          className="text-xs hover:text-white text-indigo-200 font-medium"
                        >
                           View
                        </button>
                     )}
                  </div>
                </div>
              ) : (
                  <p className="text-indigo-100 text-sm mb-4">Upload your CV to enable auto-attachments.</p>
              )}
              
              <button 
                onClick={() => onViewChange(AppView.PROFILE)}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
              >
                 {profile.resumeName ? 'Update Resume' : 'Upload Resume'}
              </button>
           </div>
           <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
     </div>
     
     <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Suggested Actions</h3>
        <div className="space-y-3">
           <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => onViewChange(AppView.EMAIL_ASSISTANT)}>
              <div className="flex items-center">
                 <div className="w-2 h-2 rounded-full bg-orange-500 mr-3"></div>
                 <span className="text-sm font-medium text-slate-700">Draft follow-up email for Google Interview</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
           </div>
           <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => onViewChange(AppView.JOB_SEARCH)}>
              <div className="flex items-center">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3"></div>
                 <span className="text-sm font-medium text-slate-700">Check new Senior React roles in SF</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
           </div>
        </div>
     </div>
  </div>
);
