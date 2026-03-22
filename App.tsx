import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from './convex/_generated/api';
import { Layout } from './components/Layout';
import { JobSearch } from './components/JobSearch';
import { EmailAssistant } from './components/EmailAssistant';
import { Profile } from './components/Profile';
import { Dashboard } from './components/Dashboard';
import { SignInPage } from './components/SignInPage';
import { AppView, UserProfile } from './types';
import { X, Loader2 } from 'lucide-react';

const EMPTY_PROFILE: UserProfile = {
  name: '',
  skills: [],
  experienceLevel: '',
  resumeSummary: '',
  workExperience: [],
  education: [],
  projects: [],
};

const ResumeModal = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white">
        <h3 className="font-bold text-slate-700 text-lg">Resume Preview</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 bg-slate-100">
        <iframe src={url} className="w-full h-full border-none" title="Resume Preview" />
      </div>
    </div>
  </div>
);

function App() {
  const { isLoaded, isSignedIn } = useUser();
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const profileData = useQuery(api.users.getProfile);
  const resumeUrl = useQuery(api.users.getResumeUrl);
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (isSignedIn && profileData === null) {
      ensureUser();
    }
  }, [isSignedIn, profileData]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInPage />;
  }

  // Still loading profile from Convex
  if (profileData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const profile: UserProfile = {
    ...EMPTY_PROFILE,
    ...profileData,
    resumeUrl: resumeUrl ?? undefined,
  };

  const handleViewResume = () => {
    if (resumeUrl) setIsResumeOpen(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} profile={profile} onViewResume={handleViewResume} />;
      case AppView.JOB_SEARCH:
        return <JobSearch profile={profile} />;
      case AppView.EMAIL_ASSISTANT:
        return <EmailAssistant profile={profile} onViewResume={handleViewResume} />;
      case AppView.PROFILE:
        return <Profile profile={profile} onViewResume={handleViewResume} />;
      default:
        return <Dashboard onViewChange={setCurrentView} profile={profile} onViewResume={handleViewResume} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
      {isResumeOpen && resumeUrl && (
        <ResumeModal url={resumeUrl} onClose={() => setIsResumeOpen(false)} />
      )}
    </Layout>
  );
}

export default App;
