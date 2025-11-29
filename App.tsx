
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { ProfileSection } from './components/ProfileSection';
import { JobSearchSection } from './components/JobSearchSection';
import { EmailSection } from './components/EmailSection';
import { ResumeBuilderSection } from './components/ResumeBuilderSection';
import { AppView, UserProfile } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PROFILE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    aboutMe: '',
    location: '',
    skills: [],
    experience: [],
    education: []
  });

  const renderContent = () => {
    switch (currentView) {
      case AppView.PROFILE:
        return (
          <ProfileSection 
            profile={userProfile} 
            onChange={setUserProfile} 
            onNext={() => setCurrentView(AppView.JOBS)}
          />
        );
      case AppView.JOBS:
        return (
          <JobSearchSection 
            profile={userProfile}
            onNavigate={setCurrentView}
          />
        );
      case AppView.RESUME_BUILDER:
        return (
          <ResumeBuilderSection profile={userProfile} />
        );
      case AppView.EMAIL:
        return (
          <EmailSection profile={userProfile} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Mobile Header (Visible only on small screens) */}
        <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-7xl animate-fade-in-up">
             {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
