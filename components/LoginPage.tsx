import React, { useEffect, useState } from 'react';
import { Briefcase, Sparkles, Mail, FileText, TrendingUp } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: { name: string; email: string; picture: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      setIsGoogleLoaded(true);
      initializeGoogleSignIn();
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    const google = (window as any).google;
    if (!google) return;

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(
      document.getElementById('googleSignInButton'),
      {
        theme: 'filled_blue',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 280,
      }
    );
  };

  const handleCredentialResponse = (response: any) => {
    // Decode JWT token to get user info
    const credential = response.credential;
    const payload = JSON.parse(atob(credential.split('.')[1]));

    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };

    // Store user info in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('google_token', credential);

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Side - Branding & Features */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
                <Briefcase className="text-white" size={32} />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                JobSense AI
              </h1>
            </div>
            <p className="text-xl text-slate-600 max-w-md mx-auto lg:mx-0">
              Your intelligent assistant for job search, resume building, and career management
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Sparkles className="text-indigo-600" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">AI Job Search</h3>
                  <p className="text-xs text-slate-500">Smart recommendations</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FileText className="text-purple-600" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">Resume Builder</h3>
                  <p className="text-xs text-slate-500">AI-powered creation</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Mail className="text-blue-600" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">Email Assistant</h3>
                  <p className="text-xs text-slate-500">Smart replies & tracking</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">Career Insights</h3>
                  <p className="text-xs text-slate-500">Track your progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="flex justify-center lg:justify-end">
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md border border-slate-100">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Welcome</h2>
                <p className="text-slate-600">Sign in to get started with JobSense AI</p>
              </div>

              <div className="space-y-4">
                {/* Google Sign-In Button */}
                <div className="flex justify-center">
                  <div id="googleSignInButton"></div>
                </div>

                {isGoogleLoaded ? null : (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-slate-500 mt-2">Loading Google Sign-In...</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-200">
                <p className="text-xs text-center text-slate-500">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
