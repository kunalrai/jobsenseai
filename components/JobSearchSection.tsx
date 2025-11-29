
import React from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { UserProfile, SearchResult, RequestStatus, AppView } from '../types';
import { JobFeed } from './JobFeed';
import { searchJobs } from '../services/geminiService';

interface JobSearchSectionProps {
  profile: UserProfile;
  onNavigate: (view: AppView) => void;
}

export const JobSearchSection: React.FC<JobSearchSectionProps> = ({ profile, onNavigate }) => {
  const [status, setStatus] = React.useState<RequestStatus>(RequestStatus.IDLE);
  const [result, setResult] = React.useState<SearchResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSearch = async () => {
    setStatus(RequestStatus.LOADING);
    setResult(null);
    setError(null);

    try {
      const data = await searchJobs(profile);
      setResult(data);
      setStatus(RequestStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch job recommendations. Please check your API key and try again.");
      setStatus(RequestStatus.ERROR);
    }
  };

  // Trigger search automatically if we have a profile but no results yet
  React.useEffect(() => {
    if (status === RequestStatus.IDLE && (profile.aboutMe || profile.resumeData)) {
        handleSearch();
    }
  }, []);

  return (
    <div className="w-full max-w-4xl space-y-8">
      
      {/* Search Header / Status */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    {profile.location ? `Jobs in ${profile.location}` : 'Recommended Jobs'}
                </h2>
                <p className="text-sm text-slate-500 truncate max-w-md">
                    Based on: {profile.aboutMe.slice(0, 60)}{profile.aboutMe.length > 60 ? '...' : ''}
                </p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => onNavigate(AppView.PROFILE)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
                >
                    Edit Profile
                </button>
                <button
                    onClick={handleSearch}
                    disabled={status === RequestStatus.LOADING}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70"
                >
                    {status === RequestStatus.LOADING ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                    Refresh Search
                </button>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {status === RequestStatus.LOADING && (
            <div className="flex flex-col items-center justify-center pt-20 space-y-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="text-lg font-medium text-slate-700">Analyzing your profile & scouting the web...</p>
              <p className="text-sm text-slate-400">Powered by Gemini 2.5 Flash</p>
            </div>
        )}

        {status === RequestStatus.ERROR && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
              <p className="font-medium">{error}</p>
              <button onClick={handleSearch} className="mt-4 font-semibold hover:underline">Try Again</button>
            </div>
        )}

        {status === RequestStatus.SUCCESS && result && (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button 
                        onClick={() => onNavigate(AppView.EMAIL)}
                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        Need a cover letter? Use Email Assistant <ArrowRight size={16} />
                    </button>
                </div>
                <JobFeed result={result} />
            </div>
        )}

        {status === RequestStatus.IDLE && !profile.aboutMe && !profile.resumeData && (
             <div className="flex flex-col items-center justify-center pt-20 space-y-4 text-center">
                <p className="text-slate-500">Complete your profile to start searching.</p>
                <button 
                    onClick={() => onNavigate(AppView.PROFILE)} 
                    className="text-indigo-600 font-medium hover:underline"
                >
                    Go to Profile
                </button>
             </div>
        )}
      </div>
    </div>
  );
};
