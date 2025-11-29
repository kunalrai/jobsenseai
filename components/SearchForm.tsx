import React, { useState, useRef } from 'react';
import { Upload, MapPin, FileText, X, Search, Loader2 } from 'lucide-react';
import { JobSearchParams, SearchStatus } from '../types';

interface SearchFormProps {
  onSearch: (params: JobSearchParams) => void;
  status: SearchStatus;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, status }) => {
  const [profileText, setProfileText] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file (PNG, JPG, JPEG) of your resume for best analysis.");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileText && !selectedFile) {
      alert("Please enter your profile details or upload a resume image.");
      return;
    }

    let resumeImage: string | undefined;
    let resumeMimeType: string | undefined;

    if (selectedFile) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        resumeImage = base64;
        resumeMimeType = selectedFile.type;
      } catch (err) {
        console.error("Error reading file", err);
        alert("Failed to process the image. Please try again.");
        return;
      }
    }

    onSearch({
      profileText,
      location,
      resumeImage,
      resumeMimeType
    });
  };

  const isLoading = status === SearchStatus.LOADING;

  return (
    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Find your next role</h2>
          <p className="mt-1 text-slate-500">
            Describe your skills or upload a screenshot of your resume. We'll scour the web for matches.
          </p>
        </div>

        {/* Profile Input */}
        <div className="space-y-2">
          <label htmlFor="profile" className="block text-sm font-medium text-slate-700">
            Your Profile / Skills / Experience
          </label>
          <div className="relative">
            <textarea
              id="profile"
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer with 5 years experience in React, TypeScript, and Node.js. Looking for roles in FinTech..."
              className="block w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              rows={4}
            />
            <div className="absolute right-3 bottom-3 text-xs text-slate-400">
              {profileText.length} chars
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Location Input */}
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-medium text-slate-700">
              Preferred Location
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MapPin className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Remote, New York, London..."
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Resume (Image Only)
            </label>
            
            {!selectedFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
              >
                <div className="space-y-1 text-center">
                  <div className="flex items-center justify-center text-sm text-slate-600">
                    <Upload className="mr-2 h-5 w-5 text-indigo-500 group-hover:text-indigo-600" />
                    <span className="font-medium text-indigo-600 group-hover:text-indigo-500">Upload a file</span>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <div className="flex items-center space-x-3 overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <FileText size={20} />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="truncate text-sm font-medium text-indigo-900">{selectedFile.name}</p>
                    <p className="text-xs text-indigo-600">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="ml-2 rounded-full p-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Searching Opportunities...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Find Relevant Jobs
            </>
          )}
        </button>
      </form>
    </div>
  );
};