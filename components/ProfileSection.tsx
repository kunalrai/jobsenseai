import React, { useState, useRef } from 'react';
import { User, Briefcase, FileText, Plus, X, Sparkles, Loader2, Upload, FileCheck, Eye, GraduationCap, Building2, Calendar, FolderGit2, Link } from 'lucide-react';
import { UserProfile } from '../types';
import { parseResume } from '../services/geminiService';

interface ProfileSectionProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  onNext: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ profile, onChange, onNext }) => {
  const [newSkill, setNewSkill] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !profile.skills?.includes(newSkill.trim())) {
      onChange({ ...profile, skills: [...(profile.skills || []), newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange({ ...profile, skills: profile.skills?.filter(s => s !== skillToRemove) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalyzing(true);
      const reader = new FileReader();

      reader.onload = async (event) => {
        const result = event.target?.result as string;

        // Basic update first to show file is selected
        const updatedProfile = {
          ...profile,
          resumeName: file.name,
          resumeData: result,
          resumeMimeType: file.type
        };
        onChange(updatedProfile);

        try {
          // Extract base64 content
          const base64Data = result.split(',')[1];
          if (base64Data) {
            const extractedData = await parseResume(base64Data, file.type);

            // Merge extracted data into profile
            onChange({
              ...updatedProfile,
              name: extractedData.name || updatedProfile.name,
              skills: extractedData.skills && extractedData.skills.length > 0 ? extractedData.skills : updatedProfile.skills,
              aboutMe: extractedData.aboutMe || updatedProfile.aboutMe,
              location: extractedData.location || updatedProfile.location,
              experience: extractedData.experience && extractedData.experience.length > 0 ? extractedData.experience : updatedProfile.experience,
              education: extractedData.education && extractedData.education.length > 0 ? extractedData.education : updatedProfile.education
            });
          }
        } catch (error) {
          console.error("Failed to analyze resume", error);
        } finally {
          setAnalyzing(false);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-fade-in-up">
      {/* Header with gradient banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-12 left-8 w-24 h-24 bg-white rounded-full p-2 shadow-lg">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <User className="w-12 h-12" />
            </div>
          </div>

          <div className="pt-16 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-slate-900">{profile.name || 'Your Profile'}</h2>
                {analyzing && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full flex items-center animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Updating Profile...
                  </span>
                )}
              </div>
              <p className="text-slate-500 flex items-center mt-1">
                <Briefcase className="w-4 h-4 mr-1.5" />
                {profile.location || 'Location not set'}
              </p>
            </div>
            <button
              onClick={onNext}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Skills, Education, Resume */}
        <div className="md:col-span-1 space-y-6">

          {/* Resume Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <FileText className="w-4 h-4 text-slate-400 mr-2" />
              Resume
            </h3>

            {profile.resumeName ? (
              <div className="flex flex-col space-y-3">
                <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${analyzing ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center overflow-hidden">
                    {analyzing ? (
                      <Loader2 className="w-5 h-5 text-indigo-600 mr-2 animate-spin flex-shrink-0" />
                    ) : (
                      <FileCheck className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-700 truncate">{profile.resumeName}</span>
                      {analyzing && <span className="text-xs text-indigo-600">Extracting info...</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onChange({ ...profile, resumeName: undefined, resumeData: undefined, resumeMimeType: undefined })}
                    className="ml-2 text-slate-400 hover:text-red-500"
                    disabled={analyzing}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Upload CV/Resume</span>
                <span className="text-xs text-slate-400 mt-1">PDF/Image Auto-fill</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="w-4 h-4 text-amber-500 mr-2" />
                Skills
              </div>
              {analyzing && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills?.map(skill => (
                <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 animate-in zoom-in duration-200">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="ml-1.5 hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddSkill} className="relative">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill..."
                className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Education Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <GraduationCap className="w-4 h-4 text-slate-400 mr-2" />
              Education
            </h3>
            <div className="space-y-4">
              {profile.education?.map((edu, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-slate-100">
                  <div className="text-sm font-semibold text-slate-800">{edu.degree}</div>
                  <div className="text-xs text-slate-600">{edu.school}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{edu.year}</div>
                </div>
              ))}
              {(!profile.education || profile.education.length === 0) && (
                <p className="text-sm text-slate-400 italic">No education listed</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Summary, Work Experience */}
        <div className="md:col-span-2 space-y-6">

          {/* Basic Info Inputs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <User className="w-4 h-4 text-slate-400 mr-2" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500">Full Name</label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => onChange({ ...profile, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500">Location</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => onChange({ ...profile, location: e.target.value })}
                  placeholder="New York, Remote"
                  className="w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 flex items-center">
                <FileText className="w-4 h-4 text-slate-400 mr-2" />
                Professional Summary
              </h3>
            </div>

            <textarea
              value={profile.aboutMe || ''}
              onChange={(e) => onChange({ ...profile, aboutMe: e.target.value })}
              className={`w-full h-40 p-4 rounded-lg bg-slate-50 border-none resize-none text-sm text-slate-700 leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${analyzing ? 'opacity-50' : 'opacity-100'}`}
              placeholder="Write a short summary about yourself..."
              readOnly={analyzing}
            />
          </div>

          {/* Work Experience Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 mr-2" />
              Work Experience
            </h3>

            <div className="space-y-8 relative">
              {/* Continuous Line */}
              {profile.experience && profile.experience.length > 0 && (
                <div className="absolute top-2 bottom-0 left-[9px] w-0.5 bg-slate-200"></div>
              )}

              {profile.experience?.map((exp, idx) => (
                <div key={idx} className="relative pl-8">
                  {/* Dot */}
                  <div className="absolute left-0 top-1 w-5 h-5 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                      <h4 className="text-lg font-bold text-slate-800">{exp.role}</h4>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span className="text-sm font-medium text-indigo-600">{exp.company}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded mt-1 sm:mt-0 w-fit">
                      <Calendar className="w-3 h-3 mr-1" />
                      {exp.duration}
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {exp.description}
                  </p>
                </div>
              ))}
              {(!profile.experience || profile.experience.length === 0) && (
                <div className="text-center py-8 relative z-10 bg-white">
                  <p className="text-slate-400 italic">Upload your resume to auto-fill your experience</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
