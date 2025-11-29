
import React, { useState, useEffect } from 'react';
import { Mail, Send, Loader2, Copy, Check, Inbox, Bot, RefreshCw, Paperclip, Trash2, AlertCircle, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile, EmailMessage } from '../types';
import { generateEmail, analyzeEmails, generateSmartReply } from '../services/geminiService';

// --- CONFIGURATION FOR REAL GMAIL API ---
// To use real Gmail, create a project in Google Cloud Console, enable Gmail API,
// and create an OAuth 2.0 Client ID for a Web Application.
// Set VITE_GOOGLE_CLIENT_ID in your .env file
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose';

interface EmailSectionProps {
  profile: UserProfile;
}

const MOCK_EMAILS: Partial<EmailMessage>[] = [
  {
    id: '1',
    sender: "sarah.jenkins@techcorp.io",
    subject: "Interview Availability - Senior Frontend Engineer",
    body: "Hi there, We reviewed your application and were very impressed with your experience in React and TypeScript. We'd like to schedule a 30-minute technical screen next week. Please let us know your availability.",
    date: "10:30 AM",
    isRead: false
  },
  {
    id: '2',
    sender: "recruiting@startup.inc",
    subject: "Application Status: Full Stack Developer",
    body: "Thank you for applying to Startup Inc. Unfortunately, we have decided to move forward with other candidates who more closely match our current needs. We will keep your resume on file.",
    date: "Yesterday",
    isRead: true
  },
  {
    id: '3',
    sender: "talent@bigdata.com",
    subject: "Job Offer: Data Visualization Specialist",
    body: "We are excited to offer you the position of Data Visualization Specialist! Attached is the offer letter. Please review and let us know if you have any questions.",
    date: "2 days ago",
    isRead: false
  },
  {
    id: '4',
    sender: "newsletter@devweekly.com",
    subject: "Top 10 React Libraries in 2024",
    body: "Here are the trending libraries you need to know about...",
    date: "3 days ago",
    isRead: true
  }
];

// Mock OAuth HTML for simulation mode
const getMockOAuthHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <title>Sign in with Google</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Roboto', arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; }
    .container { width: 100%; max-width: 450px; padding: 48px 40px 36px; border: 1px solid #dadce0; border-radius: 8px; box-sizing: border-box; text-align: center; }
    .logo { height: 24px; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 400; margin: 0 0 8px; line-height: 1.3333; color: #202124; }
    .user-card { display: flex; align-items: center; border: 1px solid #dadce0; border-radius: 20px; padding: 4px 12px 4px 4px; display: inline-flex; margin-bottom: 30px; cursor: pointer; }
    .avatar { width: 24px; height: 24px; border-radius: 50%; background: #045F5F; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 8px; }
    .email { font-size: 14px; color: #3c4043; font-weight: 500; }
    .btn-primary { background-color: #1a73e8; color: white; padding: 8px 24px; border-radius: 4px; border: none; font-weight: 500; cursor: pointer; }
    .btn-primary:hover { background-color: #1557b0; }
  </style>
</head>
<body>
  <div class="container">
    <svg class="logo" viewBox="0 0 75 24" width="75" height="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    <h1>JobSense AI wants access to your Google Account</h1>
    <div class="user-card">
        <div class="avatar">D</div>
        <div class="email">demo.candidate@gmail.com (MOCK)</div>
    </div>
    <button class="btn-primary" onclick="window.opener.postMessage({ type: 'GMAIL_CONNECTED', email: 'demo.candidate@gmail.com' }, '*'); window.close();">Allow</button>
  </div>
</body>
</html>
`;

export const EmailSection: React.FC<EmailSectionProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'INBOX'>('INBOX');
  
  // Manual Mode State
  const [jobDescription, setJobDescription] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Inbox Agent State
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [draftReply, setDraftReply] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);
  const [isRealApi, setIsRealApi] = useState(false);

  // GAPI State
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);

  // --- REAL GMAIL API SETUP ---
  useEffect(() => {
    // Only attempt to load scripts if we have valid CLIENT_ID
    if (CLIENT_ID === 'YOUR_CLIENT_ID') {
      console.log("Using Mock Gmail Mode (Configure CLIENT_ID to use real API)");
      return;
    }

    const script1 = document.createElement('script');
    script1.src = "https://apis.google.com/js/api.js";
    script1.async = true;
    script1.defer = true;
    script1.onload = () => {
        const gapi = (window as any).gapi;
        gapi.load('client', async () => {
            try {
                // For OAuth flow, we don't need API key - just load the discovery doc
                await gapi.client.init({
                    discoveryDocs: [DISCOVERY_DOC],
                });
                setGapiInited(true);
                console.log("Gmail API client initialized successfully (OAuth mode)");
            } catch (error) {
                console.error("Failed to initialize Gmail API client:", error);
                console.warn("Falling back to Mock Mode.");
            }
        });
    };
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = "https://accounts.google.com/gsi/client";
    script2.async = true;
    script2.defer = true;
    script2.onload = () => {
        const google = (window as any).google;
        const client = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // defined at request time
        });
        setTokenClient(client);
        setGisInited(true);
    };
    document.body.appendChild(script2);

    return () => {
        document.body.removeChild(script1);
        document.body.removeChild(script2);
    };
  }, []);

  // --- CHECK FOR STORED TOKEN ON MOUNT ---
  useEffect(() => {
    const gapi = (window as any).gapi;
    if (gapi && gapi.client) {
      const token = gapi.client.getToken();
      if (token) {
        // Token exists, restore session
        setIsConnected(true);
        setIsRealApi(true);
        const storedEmail = localStorage.getItem('gmail_user_email');
        setUserEmail(storedEmail || 'Connected User');
        console.log('Gmail session restored from token');
      }
    }
  }, [gapiInited]);

  // --- MOCK LISTENER ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GMAIL_CONNECTED' && event.data?.email) {
        setIsScanning(true);
        setTimeout(() => {
            setIsConnected(true);
            setUserEmail(event.data.email);
            localStorage.setItem('gmail_user_email', event.data.email);
            setIsScanning(false);
            setIsRealApi(false);
        }, 800);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-scan
  useEffect(() => {
    if (isConnected && emails.length === 0) {
        scanInbox();
    }
  }, [isConnected]);

  // --- HANDLERS ---

  const handleAuthClick = () => {
    // If keys are placeholders, use Mock
    if (CLIENT_ID === 'YOUR_CLIENT_ID' || !tokenClient) {
        const width = 500;
        const height = 650;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        const popup = window.open('', 'Connect Gmail', `width=${width},height=${height},left=${left},top=${top}`);
        if (popup) {
            popup.document.write(getMockOAuthHtml());
            popup.document.close();
        }
        return;
    }

    // Real Auth Flow
    tokenClient.callback = async (resp: any) => {
        if (resp.error) {
            throw resp;
        }
        setIsConnected(true);
        setIsRealApi(true);

        // Try to get user email from Google
        try {
            const gapi = (window as any).gapi;
            const userInfo = await gapi.client.request({
                path: 'https://www.googleapis.com/oauth2/v2/userinfo'
            });
            const email = userInfo.result.email;
            setUserEmail(email);
            localStorage.setItem('gmail_user_email', email);
        } catch (e) {
            console.warn('Could not fetch user email, using fallback');
            setUserEmail("Connected User");
            localStorage.setItem('gmail_user_email', "Connected User");
        }

        await scanInbox();
    };

    const gapi = (window as any).gapi;
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
  };

  const handleDisconnect = () => {
      setIsConnected(false);
      setUserEmail(null);
      setEmails([]);
      setSelectedEmail(null);

      // Clear localStorage
      localStorage.removeItem('gmail_user_email');

      const gapi = (window as any).gapi;
      if (gapi && gapi.client) {
        const token = gapi.client.getToken();
        if (token !== null) {
            (window as any).google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
        }
      }
  };

  const fetchRealEmails = async (): Promise<Partial<EmailMessage>[]> => {
      const gapi = (window as any).gapi;
      try {
          const response = await gapi.client.gmail.users.messages.list({
              'userId': 'me',
              'maxResults': 10,
              'q': 'subject:(job OR offer OR interview OR application) -category:promotions'
          });
          
          const messages = response.result.messages;
          if (!messages || messages.length === 0) return [];

          const fullEmails = await Promise.all(messages.map(async (msg: any) => {
              const details = await gapi.client.gmail.users.messages.get({
                  'userId': 'me',
                  'id': msg.id
              });
              const payload = details.result.payload;
              const headers = payload.headers;
              const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
              const from = headers.find((h: any) => h.name === 'From')?.value || '(Unknown)';
              const date = headers.find((h: any) => h.name === 'Date')?.value || '';
              const snippet = details.result.snippet;
              
              // Basic isRead check using labels
              const labelIds = details.result.labelIds || [];
              const isRead = !labelIds.includes('UNREAD');

              return {
                  id: msg.id,
                  sender: from,
                  subject: subject,
                  body: snippet, // Using snippet for simplicity in this demo view
                  date: new Date(date).toLocaleDateString(),
                  isRead: isRead
              };
          }));
          return fullEmails;

      } catch (err) {
          console.error("Error fetching real emails", err);
          alert("Failed to fetch emails from Gmail API. Check console.");
          return [];
      }
  };

  const sendRealEmail = async (to: string, subject: string, body: string) => {
    const gapi = (window as any).gapi;
    // Base64Url encode the email
    const emailContent = [
        `To: ${to}`,
        'Subject: ' + subject,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        body
    ].join('\n');

    const base64EncodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    await gapi.client.gmail.users.messages.send({
        'userId': 'me',
        'resource': {
            'raw': base64EncodedEmail
        }
    });
  };

  const scanInbox = async () => {
    setIsScanning(true);
    try {
        let rawEmails;
        if (isRealApi) {
            rawEmails = await fetchRealEmails();
        } else {
            rawEmails = MOCK_EMAILS;
            // Add slight delay for mock feel
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Pass to Gemini for analysis
        const analyzed = await analyzeEmails(rawEmails);
        setEmails(analyzed);
    } catch (e) {
        console.error(e);
    } finally {
        setIsScanning(false);
    }
  };

  const handleSmartReply = async (email: EmailMessage) => {
    setSelectedEmail(email);
    setDraftReply('');
    setIsDrafting(true);
    try {
        const reply = await generateSmartReply(email, profile);
        setDraftReply(reply);
    } catch (e) {
        alert("Failed to draft reply");
    } finally {
        setIsDrafting(false);
    }
  };

  const sendReply = async () => {
    if (!selectedEmail) return;
    
    if (isRealApi) {
        try {
            // Extract actual email from "Name <email@domain.com>" format if needed
            const emailMatch = selectedEmail.sender.match(/<(.+)>/);
            const toEmail = emailMatch ? emailMatch[1] : selectedEmail.sender;
            
            await sendRealEmail(toEmail, `Re: ${selectedEmail.subject}`, draftReply);
            setSentEmails([...sentEmails, selectedEmail.id]);
            setDraftReply('');
            alert("Sent successfully via Gmail API!");
        } catch (err) {
            console.error(err);
            alert("Failed to send email via API.");
        }
    } else {
        // Mock Send
        setSentEmails([...sentEmails, selectedEmail.id]);
        setSelectedEmail(null);
        setDraftReply('');
        alert(`Reply simulated sent to ${selectedEmail.sender}`);
    }
  };

  const autoReplyHighPriority = async () => {
    if(!emails.length) return;
    const highPriority = emails.filter(e => e.priority === 'HIGH' && !sentEmails.includes(e.id));
    
    if(highPriority.length === 0) {
        alert("No pending high priority emails found.");
        return;
    }

    if(!confirm(`Auto-pilot: Found ${highPriority.length} high priority emails. Generate and send replies automatically?`)) return;

    setIsScanning(true); 
    for (const email of highPriority) {
        try {
            const reply = await generateSmartReply(email, profile);
            
            if (isRealApi) {
                const emailMatch = email.sender.match(/<(.+)>/);
                const toEmail = emailMatch ? emailMatch[1] : email.sender;
                await sendRealEmail(toEmail, `Re: ${email.subject}`, reply);
            }
            
            setSentEmails(prev => [...prev, email.id]);
        } catch (e) {
            console.error("Auto-reply failed for", email.id);
        }
    }
    setIsScanning(false);
    alert("Auto-pilot complete! Replies sent.");
  };

  // Manual generation handlers
  const handleGenerate = async (type: 'cover_letter' | 'cold_email') => {
    if (!jobDescription) return alert("Please paste a job description first.");
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const result = await generateEmail(profile, jobDescription, type);
      setGeneratedContent(result);
    } catch (error) {
      alert("Failed to generate email.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="w-full max-w-5xl animate-fade-in-up space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Email Assistant</h2>
                <p className="text-slate-600">Draft responses or let the Agent manage your inbox.</p>
                {CLIENT_ID === 'YOUR_CLIENT_ID' && activeTab === 'INBOX' && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> Running in Mock Mode. Set CLIENT_ID in code to use real Gmail.
                    </p>
                )}
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab('MANUAL')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'MANUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Draft New
                </button>
                <button
                    onClick={() => setActiveTab('INBOX')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'INBOX' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <Bot size={16} />
                    Inbox Agent
                </button>
            </div>
        </div>

        {activeTab === 'MANUAL' ? (
             <div className="grid gap-8 lg:grid-cols-2">
                {/* Input Section */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Job Description / Context
                        </label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job posting here..."
                            className="h-64 w-full resize-none rounded-lg border-slate-200 bg-slate-50 p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleGenerate('cover_letter')}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileTextIcon />}
                            Cover Letter
                        </button>
                        <button
                            onClick={() => handleGenerate('cold_email')}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                            Cold Email
                        </button>
                    </div>
                </div>

                {/* Output Section */}
                <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="font-semibold text-slate-900">Draft</h3>
                        {generatedContent && (
                            <button 
                                onClick={handleCopy}
                                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600"
                            >
                                {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px] prose prose-sm prose-slate max-w-none">
                        {generatedContent ? (
                            <ReactMarkdown>{generatedContent}</ReactMarkdown>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-slate-400">
                                <Send size={48} className="mb-4 text-slate-200" />
                                <p>Your draft will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            // INBOX AGENT VIEW
            <div className="grid gap-6 lg:grid-cols-5 h-[600px]">
                
                {/* Email List Column */}
                <div className="lg:col-span-2 flex flex-col rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <Inbox size={18} /> Inbox
                        </div>
                        {!isConnected ? (
                             <button 
                                onClick={handleAuthClick} 
                                disabled={isScanning} 
                                className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 border border-indigo-200 shadow-sm"
                             >
                                <img src="https://www.google.com/favicon.ico" alt="G" className="w-3 h-3" />
                                {isScanning ? "Connecting..." : "Connect Gmail"}
                             </button>
                        ) : (
                             <div className="flex items-center gap-2">
                                <div title={userEmail || ""} className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-700 text-white text-[10px] font-bold cursor-help">
                                    {userEmail ? userEmail[0].toUpperCase() : 'U'}
                                </div>
                                <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>
                                <button onClick={scanInbox} disabled={isScanning} title="Scan Inbox" className="p-1.5 text-slate-500 hover:bg-white hover:text-indigo-600 rounded-lg transition-colors">
                                    <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
                                </button>
                                <button onClick={autoReplyHighPriority} title="Auto-Pilot High Priority" className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                                    <Bot size={16} />
                                </button>
                                <button onClick={handleDisconnect} title="Disconnect" className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                    <LogOut size={16} />
                                </button>
                             </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50">
                        {!isConnected ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                                <Mail size={40} className="mb-4 opacity-50" />
                                <p className="text-sm">Connect your Gmail to let the AI scan for job opportunities.</p>
                                <button onClick={handleAuthClick} className="mt-4 text-xs font-semibold text-indigo-600 hover:underline">
                                    Launch OAuth Flow
                                </button>
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                                {isScanning ? (
                                    <>
                                        <Loader2 size={32} className="mb-4 animate-spin text-indigo-500" />
                                        <p className="text-sm">Scanning inbox for job emails...</p>
                                    </>
                                ) : (
                                    <>
                                        <Check size={40} className="mb-4 opacity-50" />
                                        <p className="text-sm">Inbox connected. Click refresh to scan.</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {emails.map((email) => (
                                    <div 
                                        key={email.id} 
                                        onClick={() => setSelectedEmail(email)}
                                        className={`p-4 cursor-pointer transition-colors hover:bg-white ${selectedEmail?.id === email.id ? 'bg-white border-l-4 border-l-indigo-500 shadow-sm' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                                email.priority === 'HIGH' ? 'bg-indigo-100 text-indigo-700' : 
                                                email.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                {email.category?.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{email.date}</span>
                                        </div>
                                        <h4 className={`text-sm font-medium mb-1 truncate ${email.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                                            {email.sender}
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate mb-1">{email.subject}</p>
                                        {sentEmails.includes(email.id) && (
                                            <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                                <Check size={10} /> Replied & Sent
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Detail & Reply Column */}
                <div className="lg:col-span-3 flex flex-col rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    {selectedEmail ? (
                        <>
                            {/* Email Header */}
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedEmail.subject}</h3>
                                        <p className="text-sm text-slate-500">From: <span className="font-medium text-slate-700">{selectedEmail.sender}</span></p>
                                    </div>
                                    <span className="text-xs text-slate-400">{selectedEmail.date}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100 mb-4 max-h-40 overflow-y-auto">
                                    {selectedEmail.body}
                                </div>
                                
                                {/* AI Insights */}
                                {selectedEmail.summary && (
                                    <div className="flex items-start gap-2 bg-indigo-50 p-3 rounded-lg text-xs text-indigo-800 border border-indigo-100">
                                        <Bot size={14} className="mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-bold mb-1">AI Insight:</p>
                                            <p>{selectedEmail.summary}</p>
                                            <p className="mt-1 font-medium">Suggested Action: {selectedEmail.suggestedAction}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reply Area */}
                            <div className="flex-1 bg-white p-6 flex flex-col">
                                {sentEmails.includes(selectedEmail.id) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-green-600">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                            <Check size={24} />
                                        </div>
                                        <p className="font-medium">Reply sent successfully!</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 mb-4">
                                            {isDrafting ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                    <Loader2 size={24} className="animate-spin mb-2 text-indigo-600" />
                                                    <p className="text-sm">Drafting smart reply based on your profile...</p>
                                                </div>
                                            ) : draftReply ? (
                                                <div className="relative h-full">
                                                    <textarea 
                                                        className="w-full h-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                                        value={draftReply}
                                                        onChange={(e) => setDraftReply(e.target.value)}
                                                    />
                                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                                            <Paperclip size={12} /> Resume Attached
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center">
                                                    <button 
                                                        onClick={() => handleSmartReply(selectedEmail)}
                                                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                                    >
                                                        <Bot size={20} />
                                                        Generate Smart Reply
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {draftReply && (
                                            <div className="flex justify-end gap-3">
                                                <button 
                                                    onClick={() => setDraftReply('')}
                                                    className="px-4 py-2 text-slate-500 hover:text-red-500 text-sm font-medium"
                                                >
                                                    Discard
                                                </button>
                                                <button 
                                                    onClick={sendReply}
                                                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:bg-indigo-700"
                                                >
                                                    <Send size={16} />
                                                    Send Reply
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                            <Inbox size={48} className="mb-4 opacity-20" />
                            <p>Select an email to view details and draft a reply.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

const FileTextIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
)