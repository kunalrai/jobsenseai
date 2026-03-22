import React, { useState, useEffect, useRef } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Mail, Send, Wand2, Copy, CheckCircle2, RotateCcw, Inbox, Loader2, Paperclip, ChevronRight } from 'lucide-react';
import { UserProfile, EmailDraft } from '../types';

declare const google: any;

// Strip HTML tags (including style/script content) and decode entities to plain text
function htmlToPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('style, script, img, [style*="display:none"], [style*="display: none"]').forEach(el => el.remove());
  // Convert block-level elements and <br> to newlines before extracting text
  div.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
  div.querySelectorAll('p, div, tr, li, h1, h2, h3, h4, h5, h6, blockquote').forEach(el => {
    el.prepend('\n');
    el.append('\n');
  });
  div.querySelectorAll('li').forEach(el => el.prepend('• '));
  div.querySelectorAll('td, th').forEach(el => el.append('  '));
  return (div.textContent || div.innerText || '')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Decode HTML entities only (no tag stripping) for snippets
function decodeEntities(text: string): string {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || div.innerText || text;
}

interface GmailEmail {
  _id: string;
  gmailId: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  priority: string;
}

interface EmailAssistantProps {
  profile: UserProfile;
  onViewResume: () => void;
}

export const EmailAssistant: React.FC<EmailAssistantProps> = ({ profile, onViewResume }) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [incomingText, setIncomingText] = useState('');
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [tone, setTone] = useState('professional');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);

  const generateDraft = useAction(api.emails.generateDraft);
  const fetchGmailEmails = useAction(api.emails.fetchGmailEmails);
  const gmailEmailsQuery = useQuery(api.emails.getGmailEmails) as GmailEmail[] | null | undefined;

  // Stabilise display: only update when we get a real authenticated result.
  // - undefined = query still in flight (initial load)
  // - null      = auth momentarily unavailable (Convex reconnect / JWT refresh)
  // - []        = authenticated, genuinely no emails
  // - [...]     = authenticated, emails present
  // We ignore undefined and null so the inbox never flashes during reconnects.
  const [displayEmails, setDisplayEmails] = useState<GmailEmail[] | null>(null);
  useEffect(() => {
    if (gmailEmailsQuery !== undefined && gmailEmailsQuery !== null) {
      setDisplayEmails(gmailEmailsQuery);
    }
  }, [gmailEmailsQuery]);

  const gmailEmails = displayEmails;

  const handleConnectGmail = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setGmailError('Google Client ID not configured.');
      return;
    }
    setGmailError(null);
    const client = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: async (response: any) => {
        if (response.error) {
          setGmailError('Gmail access denied.');
          return;
        }
        setFetching(true);
        try {
          await fetchGmailEmails({ accessToken: response.access_token });
        } catch (e) {
          console.error(e);
          setGmailError('Failed to fetch emails. Please try again.');
        } finally {
          setFetching(false);
        }
      },
    });
    client.requestAccessToken();
  };

  const handleAnalyzeEmail = (email: GmailEmail) => {
    const plain = email.body ? htmlToPlainText(email.body) : decodeEntities(email.snippet);
    setIncomingText(plain);
    setActiveTab('compose');
    setDraft(null);
  };

  const handleGenerate = async () => {
    if (!incomingText.trim()) return;
    setLoading(true);
    setSentSuccess(false);
    try {
      const result = await generateDraft({
        incomingEmailText: incomingText,
        name: profile.name,
        skills: profile.skills,
        experienceLevel: profile.experienceLevel,
        resumeSummary: profile.resumeSummary,
        hasResume: !!profile.resumeName,
        tone,
      });
      setDraft(result as EmailDraft);
      setCopied(false);
    } catch (e) {
      console.error(e);
      alert('Failed to generate draft.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    setSentSuccess(true);
    setDraft(null);
    setIncomingText('');
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const copyToClipboard = () => {
    if (!draft) return;
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left Panel */}
      <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Tab Header */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors ${activeTab === 'inbox' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Inbox className="w-4 h-4 mr-2" />
            Smart Inbox
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors ${activeTab === 'compose' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Mail className="w-4 h-4 mr-2" />
            Input / Paste
          </button>
        </div>

        {activeTab === 'inbox' ? (
          <div className="p-4">
            {fetching || gmailEmails === null ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">{fetching ? 'Reading your Gmail for job emails...' : 'Loading...'}</p>
              </div>
            ) : gmailEmails.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top {gmailEmails.length} job emails</span>
                  <button onClick={handleConnectGmail} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center">
                    <RotateCcw className="w-3 h-3 mr-1" /> Refresh
                  </button>
                </div>

                {gmailEmails.map(email => (
                  <div
                    key={email._id}
                    className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => handleAnalyzeEmail(email)}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${email.priority === 'High' ? 'bg-indigo-500' : email.priority === 'Medium' ? 'bg-yellow-400' : 'bg-slate-300'}`}></div>
                    <div className="pl-3">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-slate-900 text-sm truncate pr-2">{email.from}</h4>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(email.date).toLocaleDateString()}</span>
                      </div>
                      <h5 className="text-sm font-medium text-slate-800 mb-1">{email.subject}</h5>
                      <p className="text-xs text-slate-500 line-clamp-2">{decodeEntities(email.snippet)}</p>
                      <div className="mt-3 flex items-center text-indigo-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Analyze & Reply <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : profile.gmailConnectedAt ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No job emails found</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-xs">
                  No job-related emails were found in your Gmail. Try refreshing or check back later.
                </p>
                {gmailError && <p className="text-xs text-red-500 mb-3">{gmailError}</p>}
                <button
                  onClick={handleConnectGmail}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-all flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Refresh Gmail
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Connect your Gmail</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-xs">
                  JobSense will read your top 5 job-related emails for drafting smart replies.
                </p>
                {gmailError && <p className="text-xs text-red-500 mb-3">{gmailError}</p>}
                <button
                  onClick={handleConnectGmail}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-all flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                  </svg>
                  Connect Gmail
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">Message Content</span>
              <button onClick={() => setIncomingText('')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center">
                <RotateCcw className="w-3 h-3 mr-1" /> Clear
              </button>
            </div>
            <textarea
              className="w-full min-h-[280px] p-5 resize-y focus:outline-none text-slate-700 leading-relaxed text-sm bg-white"
              placeholder="Paste the email from the recruiter or hiring manager here..."
              value={incomingText}
              onChange={(e) => setIncomingText(e.target.value)}
            />

            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="text-sm bg-white border border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="enthusiastic">High Energy</option>
                  <option value="negotiation">Negotiation (Firm)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">
                {profile.resumeName ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Attaching: <span className="font-medium text-slate-700">{profile.resumeName}</span></span>
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4" />
                    <span>No resume uploaded in profile.</span>
                  </>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!incomingText.trim() || loading}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${!incomingText.trim() || loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
              >
                {loading ? (
                  <span className="flex items-center"><Wand2 className="animate-spin w-4 h-4 mr-2" /> Drafting...</span>
                ) : (
                  <span className="flex items-center"><Wand2 className="w-4 h-4 mr-2" /> Generate Response</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right Panel: Output */}
      <div className="flex flex-col bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-slate-300 relative min-h-[500px]">
        {sentSuccess && (
          <div className="absolute inset-0 z-10 bg-slate-900/90 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in">
            <div className="bg-green-500 rounded-full p-4 mb-4 shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Email Sent!</h3>
            <p className="text-slate-400">Your response (with CV) is on its way.</p>
          </div>
        )}

        <div className="p-5 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">AI Draft</h3>
          </div>
          {draft && (
            <button
              onClick={copyToClipboard}
              className="text-xs flex items-center bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-500/30 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          )}
        </div>

        <div className="p-6">
          {draft ? (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Subject Line</label>
                <div className="text-white font-medium text-lg border-b border-slate-700 pb-2">{draft.subject}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Message Body</label>
                <div className="text-slate-300 leading-7 whitespace-pre-wrap">{draft.body}</div>
              </div>

              {profile.resumeName && (
                <div className="flex items-center p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                  <Paperclip className="w-4 h-4 text-indigo-400 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">Attachment</p>
                    <div className="flex items-center">
                      <p className="text-xs text-slate-500 truncate mr-2">{profile.resumeName}</p>
                      {profile.resumeUrl && (
                        <button onClick={onViewResume} className="text-xs text-indigo-400 hover:text-indigo-300 underline">
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center space-x-2 text-xs text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Context from your profile included automatically.</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600 py-20 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-lg font-medium text-slate-500">Ready to draft</p>
              <p className="text-sm mt-2 max-w-xs">
                Select an email from your Smart Inbox or paste one to generate a response.
              </p>
            </div>
          )}
        </div>

        {draft && (
          <div className="p-4 bg-slate-800 border-t border-slate-700">
            <button
              onClick={handleSend}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Response {profile.resumeName ? '& CV' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
