
import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Save, MapPin, UserCircle, Briefcase, GraduationCap, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { UserProfile, ExperienceItem, EducationItem } from '../types';
import { parseResume } from '../services/geminiService';

interface ProfileSectionProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  onNext: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ profile, onChange, onNext }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be under 5MB");
        return;
      }
      
      setIsParsing(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const extractedData = await parseResume(base64, file.type);
        
        onChange({
          ...profile,
          ...extractedData,
          resumeData: base64,
          resumeMimeType: file.type,
          resumeName: file.name
        });
      } catch (err) {
        console.error("Error reading/parsing file", err);
        alert("Failed to parse the file. Please try manual entry.");
      } finally {
        setIsParsing(false);
      }
    }
  };

  const addSkill = () => {
    if (newSkill && !profile.skills?.includes(newSkill)) {
      onChange({
        ...profile,
        skills: [...(profile.skills || []), newSkill]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange({
      ...profile,
      skills: profile.skills?.filter(s => s !== skillToRemove)
    });
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    const newExp = [...(profile.experience || [])];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...profile, experience: newExp });
  };

  const addExperience = () => {
    onChange({
        ...profile,
        experience: [{ role: '', company: '', duration: '', description: '' }, ...(profile.experience || [])]
    });
  };
  
  const removeExperience = (index: number) => {
      const newExp = [...(profile.experience || [])];
      newExp.splice(index, 1);
      onChange({ ...profile, experience: newExp });
  };

  const clearFile = () => {
    if (window.confirm("This will remove the attached resume file. Your profile data will remain.")) {
        onChange({
        ...profile,
        resumeData: undefined,
        resumeMimeType: undefined,
        resumeName: undefined
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  return (
    <div className="w-full max-w-5xl animate-fade-in-up space-y-8 pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-900">Your Profile</h2>
            <p className="mt-1 text-slate-600">
            Upload your resume to auto-fill, or enter details manually.
            </p>
        </div>
        <button
            onClick={onNext}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300"
        >
            <Save size={18} />
            Save & Find Jobs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Resume Upload & Basic Info */}
        <div className="space-y-6 lg:col-span-1">
            {/* Resume Upload Card */}
            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-indigo-600"/> Resume
                </h3>
                
                {isParsing ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                        <span className="text-sm font-medium text-indigo-900">Extracting details...</span>
                        <span className="text-xs text-indigo-500">This uses Gemini AI</span>
                    </div>
                ) : !profile.resumeData ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 px-4 text-center cursor-pointer transition-colors hover:border-indigo-400 hover:bg-indigo-50"
                    >
                        <div className="mb-3 rounded-full bg-indigo-100 p-3 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Upload size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-900">Upload Resume</p>
                        <p className="text-xs text-slate-500 mt-1">PDF or Image (Max 5MB)</p>
                        <p className="mt-2 text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles size={10} /> Auto-Fill Enabled
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                                <FileText size={20} />
                            </div>
                            <div className="truncate">
                                <p className="truncate text-sm font-medium text-indigo-900">{profile.resumeName}</p>
                                <p className="text-xs text-indigo-600">Attached</p>
                            </div>
                        </div>
                        <button onClick={clearFile} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    className="hidden"
                />
            </div>

            {/* Basic Info */}
            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50 space-y-4">
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
                    <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            value={profile.location || ''}
                            onChange={(e) => onChange({ ...profile, location: e.target.value })}
                            placeholder="e.g. New York, Remote"
                            className="w-full rounded-lg border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-slate-500">Skills</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {profile.skills?.map((skill, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                {skill}
                                <button onClick={() => removeSkill(skill)} className="text-indigo-400 hover:text-indigo-900"><X size={12}/></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                            placeholder="Add a skill..."
                            className="flex-1 rounded-lg border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button onClick={addSkill} className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><Plus size={16}/></button>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="space-y-6 lg:col-span-2">
            
            {/* About Me */}
            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50">
                <label className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                    <UserCircle size={20} className="text-indigo-600"/> Professional Summary
                </label>
                <textarea
                    value={profile.aboutMe}
                    onChange={(e) => onChange({ ...profile, aboutMe: e.target.value })}
                    placeholder="Tell us about your professional background..."
                    className="w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                    rows={4}
                />
            </div>

            {/* Experience */}
            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Briefcase size={20} className="text-indigo-600"/> Experience
                    </h3>
                    <button onClick={addExperience} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        <Plus size={14} /> Add Role
                    </button>
                </div>
                
                <div className="space-y-4">
                    {profile.experience?.map((exp, idx) => (
                        <div key={idx} className="group relative rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-200 hover:shadow-md">
                            <button onClick={() => removeExperience(idx)} className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                                <input
                                    placeholder="Job Title"
                                    value={exp.role}
                                    onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                                    className="font-medium text-slate-900 placeholder-slate-400 border-none bg-transparent p-0 focus:ring-0"
                                />
                                <input
                                    placeholder="Company Name"
                                    value={exp.company}
                                    onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                                    className="text-slate-600 placeholder-slate-400 border-none bg-transparent p-0 focus:ring-0 sm:text-right"
                                />
                            </div>
                            <input
                                placeholder="Duration (e.g. 2020 - Present)"
                                value={exp.duration}
                                onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                                className="block w-full text-xs text-slate-500 placeholder-slate-400 border-none bg-transparent p-0 focus:ring-0 mb-2"
                            />
                            <textarea
                                placeholder="Description of responsibilities..."
                                value={exp.description}
                                onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                                rows={2}
                                className="w-full resize-none rounded-lg bg-slate-50 p-2 text-sm text-slate-700 placeholder-slate-400 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-indigo-200"
                            />
                        </div>
                    ))}
                    {(!profile.experience || profile.experience.length === 0) && (
                        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                            No experience added yet. Upload resume or add manually.
                        </div>
                    )}
                </div>
            </div>

             {/* Education Display (Read Only for now to save space, or simple list) */}
             <div className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50">
                 <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <GraduationCap size={20} className="text-indigo-600"/> Education
                </h3>
                <div className="space-y-3">
                    {profile.education?.map((edu, idx) => (
                        <div key={idx} className="flex justify-between items-start border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-slate-900 text-sm">{edu.school}</p>
                                <p className="text-xs text-slate-500">{edu.degree}</p>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{edu.year}</span>
                        </div>
                    ))}
                    {(!profile.education || profile.education.length === 0) && (
                        <p className="text-sm text-slate-400 italic">No education details.</p>
                    )}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};
