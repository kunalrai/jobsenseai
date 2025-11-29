import React from 'react';
import ReactMarkdown from 'react-markdown';
import { GroundingMetadata, SearchResult } from '../types';
import { ExternalLink, Globe } from 'lucide-react';

interface JobFeedProps {
  result: SearchResult | null;
}

export const JobFeed: React.FC<JobFeedProps> = ({ result }) => {
  if (!result) return null;

  const { text, groundingMetadata } = result;

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in-up space-y-8 pb-20">
      
      {/* Main Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-indigo-50/50">
          <h3 className="text-lg font-semibold text-indigo-900">Recommended Positions</h3>
        </div>
        <div className="prose prose-slate max-w-none p-6 sm:p-8 prose-headings:text-slate-800 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:marker:text-indigo-400">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-800">
                  {props.children}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              ),
              li: ({ node, ...props }) => (
                <li {...props} className="mb-2" />
              )
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>

      {/* Sources / Grounding */}
      {groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-700">Verified Sources</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groundingMetadata.groundingChunks.map((chunk, idx) => {
              if (chunk.web?.uri) {
                return (
                  <a
                    key={idx}
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm transition-all hover:border-indigo-300 hover:shadow-md"
                  >
                    <span className="line-clamp-2 font-medium text-slate-700 group-hover:text-indigo-700">
                      {chunk.web.title || "Source Link"}
                    </span>
                    <span className="mt-2 truncate text-xs text-slate-400 group-hover:text-indigo-400">
                      {new URL(chunk.web.uri).hostname}
                    </span>
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};