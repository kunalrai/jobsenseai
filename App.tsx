
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { ProfileSection } from './components/ProfileSection';
import { JobSearchSection } from './components/JobSearchSection';
import { EmailSection } from './components/EmailSection';
import { ResumeBuilderSection } from './components/ResumeBuilderSection';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './context/AuthContext';
import { AppView, UserProfile } from './types';
import * as profileService from './services/profileService';

function App() {
  const { isAuthenticated, user, login } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.PROFILE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user?.name || '',
    aboutMe: '',
    location: '',
    skills: [],
    experience: [],
    education: []
  });

  // Load user profile from database when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      loadUserProfile();
      // Save user info to database
      profileService.saveUser(user.email, user.name, user.picture).catch(console.error);
    }
  }, [isAuthenticated, user]);

  const loadUserProfile = async () => {
    if (!user?.email) return;

    setIsLoadingProfile(true);
    try {
      const profile = await profileService.getUserProfile(user.email);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleProfileChange = async (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);

    // Auto-save to database
    if (user?.email) {
      try {
        await profileService.saveUserProfile(user.email, updatedProfile);
        console.log('Profile saved to database');
      } catch (error) {
        console.error('Failed to save profile:', error);
      }
    }
  };

  const renderContent = () => {
    if (isLoadingProfile) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-600">Loading your profile...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case AppView.PROFILE:
        return (
          <ProfileSection
            profile={userProfile}
            onChange={handleProfileChange}
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

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

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
