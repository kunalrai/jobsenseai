import React, { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Search, MapPin, Building, ExternalLink, Sparkles, Loader2, Mail } from 'lucide-react';
import { UserProfile, Job } from '../types';
import { JOB_DATABASE } from '../data/jobDatabase';
import { SESSION_ID } from '../App';

interface JobSearchProps {
  profile: UserProfile;
}

export const JobSearch: React.FC<JobSearchProps> = ({ profile }) => {
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const searchJobsAction = useAction(api.jobs.searchJobs);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setLoading(true);
    setError(null);
    setSearched(true);

    const q = query.toLowerCase();

    // 1. Filter curated local database (client-side, instant)
    const localMatches = JOB_DATABASE.filter((job) => {
      const content = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
      return q ? content.includes(q) : profile.skills.some(skill => content.includes(skill.toLowerCase()));
    }).map(job => ({ ...job, matchScore: 95, source: 'Curated Database' }));

    setJobs(localMatches);

    // 2. Also fetch from Gemini via Convex action (if profile has skills)
    if (profile.skills.length > 0) {
      try {
        const apiJobs = await searchJobsAction({
          skills: profile.skills,
          experienceLevel: profile.experienceLevel,
          query,
          sessionId: SESSION_ID,
        });
        setJobs([...localMatches, ...(apiJobs as Job[])]);
      } catch (err) {
        // Local results still shown; don't surface the API error if we have results
        if (localMatches.length === 0) setError("Failed to fetch jobs. Please try again.");
      }
    }

    setLoading(false);
  };

  // Auto-search on mount only when profile has skills loaded
  React.useEffect(() => {
    if (profile.skills.length > 0 && !searched) {
      handleSearch();
    }
  }, [profile.skills.length]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Find Your Next Role</h2>
        <p className="text-indigo-100 mb-8 max-w-2xl">
          We use Google Search Grounding and our curated database to find real, active job listings that match your skills:
          {profile.skills.length > 0 && (
            <span className="font-semibold text-white bg-white/20 px-2 py-0.5 rounded ml-2 text-sm">
              {profile.skills.slice(0, 3).join(', ')}...
            </span>
          )}
        </p>

        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Remote Frontend Developer or 'Python'"
            className="w-full pl-11 pr-4 py-4 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 shadow-xl"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center text-slate-500 mb-3 space-x-4">
                    <span className="flex items-center text-sm">
                      <Building className="w-4 h-4 mr-1.5" />
                      {job.company}
                    </span>
                    <span className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      {job.location}
                    </span>
                  </div>
                </div>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {job.url.startsWith('mailto:') ? (
                      <><Mail className="w-4 h-4 mr-1.5" />Apply via Email</>
                    ) : (
                      <><ExternalLink className="w-4 h-4 mr-1.5" />Apply</>
                    )}
                  </a>
                )}
              </div>

              <p className="text-slate-600 text-sm mb-4 leading-relaxed">{job.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.matchScore && job.matchScore > 80 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {job.matchScore ? `${job.matchScore}% Match` : 'Relevant'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {job.source || 'Search'}
                  </span>
                </div>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Analyze Fit &rarr;
                </button>
              </div>
            </div>
          ))
        ) : (
          !loading && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-indigo-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No jobs found yet</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-1">
                Enter your desired role or location above and let Gemini find the best matches for you.
              </p>
            </div>
          )
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full"></div>
                  <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
