import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Zap } from 'lucide-react';

export const SignInPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
    <div className="flex items-center mb-8">
      <div className="bg-indigo-600 p-2.5 rounded-xl mr-3 shadow-lg shadow-indigo-200">
        <Zap className="w-7 h-7 text-white" />
      </div>
      <span className="text-2xl font-bold text-slate-900 tracking-tight">JobSense AI</span>
    </div>
    <SignIn routing="hash" />
  </div>
);
