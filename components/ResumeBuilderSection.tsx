
import React, { useState } from 'react';
import { FileText, Wand2, Loader2, Copy, Check, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile } from '../types';
import { generateTailoredResume } from '../services/geminiService';

interface ResumeBuilderSectionProps {
  profile: UserProfile;
}

export const ResumeBuilderSection: React.FC<ResumeBuilderSectionProps> = ({ profile }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [generatedResume, setGeneratedResume] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription) {
        alert("Please paste the target job description first.");
        return;
    }
    if (!profile.aboutMe && !profile.resumeData) {
        alert("Your profile is empty. Please update your profile first so we have data to work with.");
        return;
    }

    setIsLoading(true);
    setGeneratedResume('');
    
    try {
      const result = await generateTailoredResume(profile, jobDescription);
      setGeneratedResume(result);
    } catch (error) {
      console.error(error);
      alert("Failed to generate resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl space-y-6 lg:space-y-8">
      <div className="text-left md:text-center">
        <h2 className="text-2xl font-bold text-slate-900">AI Resume Tailor</h2>
        <p className="mt-2 text-slate-600">
          Paste a Job Description to get a gap analysis and a tailored version of your resume.
        </p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6 h-auto lg:h-[calc(100vh-200px)] min-h-[600px]">
        {/* Input Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 flex flex-col rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/50">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              Target Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="flex-1 min-h-[200px] w-full resize-none rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>Using Profile:</span>
                    <span className="font-medium truncate max-w-[150px]">
                        {profile.resumeName || "Manual Profile"}
                    </span>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-70"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                    Scan & Build Resume
                </button>
            </div>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200 min-h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600"/>
                Generated Result
            </h3>
            {generatedResume && (
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-indigo-600 hover:ring-indigo-300 transition-all"
                >
                    {copied ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy Markdown"}
                </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {generatedResume ? (
                <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:p-3 prose-td:p-3 prose-td:border-t prose-td:border-slate-100">
                    <ReactMarkdown>{generatedResume}</ReactMarkdown>
                </div>
            ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 p-8">
                    <div className="mb-4 rounded-full bg-slate-100 p-6">
                        <Wand2 size={40} className="text-slate-300" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900">Ready to Build</h4>
                    <p className="max-w-xs mt-2 text-sm text-slate-500">
                        Paste the job description on the left and click "Scan & Build Resume" to generate a tailored version.
                    </p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
