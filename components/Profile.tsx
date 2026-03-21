import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { User, Briefcase, FileText, Plus, X, Sparkles, Loader2, Upload, FileCheck, Eye, GraduationCap, Building2, Calendar, FolderGit2, Link } from 'lucide-react';
import { UserProfile } from '../types';


interface ProfileProps {
  profile: UserProfile;
  onViewResume: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ profile, onViewResume }) => {
  const [newSkill, setNewSkill] = useState('');
  const [improving, setImproving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Local copy so edits feel instant; debounced save to Convex
  const [local, setLocal] = useState<UserProfile>(profile);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upsertProfile = useMutation(api.users.upsertProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const setResume = useMutation(api.users.setResume);
  const clearResume = useMutation(api.users.clearResume);
  const improveSummary = useAction(api.resume.improveSummary);
  const parseUploadedResume = useAction(api.resume.parseUploadedResume);

  // Sync from server when profile changes (e.g., after resume parse)
  useEffect(() => {
    setLocal(profile);
  }, [profile.resumeName, profile.skills.length, profile.workExperience.length]);

  // Debounced auto-save: any local change triggers a save after 800ms of inactivity
  const scheduleSave = (updated: UserProfile) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      upsertProfile({
        name: updated.name,
        skills: updated.skills,
        experienceLevel: updated.experienceLevel,
        resumeSummary: updated.resumeSummary,
        workExperience: updated.workExperience.map(w => ({
          ...w,
          description: w.description ?? '',
        })),
        education: updated.education.map(e => ({
          ...e,
          year: e.year ?? '',
        })),
        projects: updated.projects,
        resumeName: updated.resumeName,
      });
    }, 800);
  };

  const update = (patch: Partial<UserProfile>) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    scheduleSave(updated);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !local.skills.includes(trimmed)) {
      update({ skills: [...local.skills, trimmed] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    update({ skills: local.skills.filter(s => s !== skillToRemove) });
  };

  const handleImproveSummary = async () => {
    setImproving(true);
    try {
      const improved = await improveSummary({
        currentSummary: local.resumeSummary,
        skills: local.skills,
      });
      update({ resumeSummary: improved });
    } catch (e) {
      console.error(e);
    } finally {
      setImproving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      // 1. Get a presigned upload URL from Convex
      const uploadUrl = await generateUploadUrl({});

      // 2. Upload the PDF directly to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await uploadResponse.json();

      // 3. Save the storageId + name on the user record
      await setResume({ resumeName: file.name, resumeStorageId: storageId });

      // 4. Parse the resume via Convex action (Gemini on the server)
      const extracted = await parseUploadedResume({ storageId });

      // 5. Merge extracted data and save
      const merged: UserProfile = {
        ...local,
        resumeName: file.name,
        name: extracted.name || local.name,
        skills: extracted.skills?.length ? extracted.skills : local.skills,
        resumeSummary: extracted.resumeSummary || local.resumeSummary,
        experienceLevel: extracted.experienceLevel || local.experienceLevel,
        workExperience: extracted.workExperience?.length ? extracted.workExperience : local.workExperience,
        education: extracted.education?.length ? extracted.education : local.education,
        projects: extracted.projects?.length ? extracted.projects : local.projects,
      };
      setLocal(merged);
      await upsertProfile({
        name: merged.name,
        skills: merged.skills,
        experienceLevel: merged.experienceLevel,
        resumeSummary: merged.resumeSummary,
        workExperience: merged.workExperience.map(w => ({ ...w, description: w.description ?? '' })),
        education: merged.education.map(ed => ({ ...ed, year: ed.year ?? '' })),
        projects: merged.projects,
        resumeName: merged.resumeName,
      });
    } catch (error) {
      console.error("Failed to analyze resume", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClearResume = () => {
    clearResume({});
    update({ resumeName: undefined, resumeUrl: undefined });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
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
                <h2 className="text-2xl font-bold text-slate-900">{local.name || 'Your Name'}</h2>
                {analyzing && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full flex items-center animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Updating Profile...
                  </span>
                )}
              </div>
              <p className="text-slate-500 flex items-center mt-1">
                <Briefcase className="w-4 h-4 mr-1.5" />
                {local.experienceLevel || 'Add your experience level'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Resume, Skills, Education */}
        <div className="md:col-span-1 space-y-6">

          {/* Resume Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <FileText className="w-4 h-4 text-slate-400 mr-2" />
              Resume
            </h3>

            {local.resumeName ? (
              <div className="flex flex-col space-y-3">
                <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${analyzing ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center overflow-hidden">
                    {analyzing ? (
                      <Loader2 className="w-5 h-5 text-indigo-600 mr-2 animate-spin flex-shrink-0" />
                    ) : (
                      <FileCheck className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-700 truncate">{local.resumeName}</span>
                      {analyzing && <span className="text-xs text-indigo-600">Extracting info...</span>}
                    </div>
                  </div>
                  <button
                    onClick={handleClearResume}
                    className="ml-2 text-slate-400 hover:text-red-500"
                    disabled={analyzing}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {local.resumeUrl && !analyzing && (
                  <button
                    onClick={onViewResume}
                    className="w-full flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Resume
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Upload CV/Resume</span>
                <span className="text-xs text-slate-400 mt-1">PDF — Auto-fill profile</span>
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
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
              {local.skills.map(skill => (
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
              <button type="submit" className="absolute right-2 top-2 text-indigo-600 hover:text-indigo-800">
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
              {local.education.map((edu) => (
                <div key={edu.id} className="relative pl-4 border-l-2 border-slate-100">
                  <div className="text-sm font-semibold text-slate-800">{edu.degree}</div>
                  <div className="text-xs text-slate-600">{edu.institution}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{edu.year}</div>
                </div>
              ))}
              {local.education.length === 0 && (
                <p className="text-sm text-slate-400 italic">No education listed</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Summary, Work Experience, Projects */}
        <div className="md:col-span-2 space-y-6">

          {/* Resume Summary Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 flex items-center">
                <FileText className="w-4 h-4 text-slate-400 mr-2" />
                Professional Summary
              </h3>
              <button
                onClick={handleImproveSummary}
                disabled={improving || analyzing}
                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-100 transition-colors flex items-center"
              >
                {(improving || analyzing) ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                AI Enhance
              </button>
            </div>

            <textarea
              value={local.resumeSummary}
              onChange={(e) => update({ resumeSummary: e.target.value })}
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
              <div className="absolute top-2 bottom-0 left-[9px] w-0.5 bg-slate-200"></div>

              {local.workExperience.map((exp) => (
                <div key={exp.id} className="relative pl-8">
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
                  <p className="text-slate-600 text-sm leading-relaxed">{exp.description}</p>
                </div>
              ))}

              {local.workExperience.length === 0 && (
                <div className="text-center py-8 relative z-10 bg-white">
                  <p className="text-slate-400 italic">Upload your resume to auto-fill your experience</p>
                </div>
              )}
            </div>
          </div>

          {/* Projects Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center">
              <FolderGit2 className="w-4 h-4 text-slate-400 mr-2" />
              Projects
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {local.projects && local.projects.length > 0 ? (
                local.projects.map((project) => (
                  <div key={project.id} className="p-4 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">{project.name}</h4>
                      {project.link && (
                        <a
                          href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          <Link className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.technologies.map((tech, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-400 italic">No projects added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
