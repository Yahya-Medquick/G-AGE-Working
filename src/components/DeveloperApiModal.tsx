import React, { useState } from "react";
import { X, Code2, Terminal, Copy, Check, ExternalLink, ShieldAlert, Cpu } from "lucide-react";
import { DeveloperApiEndpoint } from "../types";

interface DeveloperApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperApiModal: React.FC<DeveloperApiModalProps> = ({ isOpen, onClose }) => {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const endpoints: DeveloperApiEndpoint[] = [
    {
      method: "GET",
      path: "/api/v1/ask?q={question}",
      description: "AI Question Answering and Gemini-powered concept synthesis.",
      parameters: [{ name: "q", type: "string", required: true, description: "Natural language query or concept" }],
      exampleResponse: `{
  "question": "What is gravity?",
  "answer": "Gravity is the fundamental force of attraction...",
  "confidence": 96,
  "sources": [{ "title": "OpenAlex Index", "url": "https://openalex.org" }]
}`
    },
    {
      method: "GET",
      path: "/api/v1/compare?a={topicA}&b={topicB}",
      description: "Side-by-side feature differential and semantic similarity comparison.",
      parameters: [
        { name: "a", type: "string", required: true, description: "First entity slug or topic" },
        { name: "b", type: "string", required: true, description: "Second entity slug or topic" }
      ],
      exampleResponse: `{
  "comparison": {
    "similarityScore": 88,
    "keyTakeaway": "Gravity and Quantum Computing share 6 categories...",
    "differences": [...]
  }
}`
    },
    {
      method: "GET",
      path: "/api/v1/timeline?topic={slug}",
      description: "Chronological milestone timeline for key scientific topics.",
      parameters: [{ name: "topic", type: "string", required: true, description: "Topic slug (e.g. gravity, quantum-computing)" }],
      exampleResponse: `{
  "topic": "Gravity",
  "timeline": [
    { "year": "1687", "title": "Principia Mathematica", "impact": "breakthrough" }
  ]
}`
    },
    {
      method: "GET",
      path: "/api/v1/health",
      description: "Public health check endpoint returning engine status, memory usage, and key statistics.",
      parameters: [],
      exampleResponse: `{
  "status": "healthy",
  "engine": "G-AGE AI Universal Knowledge Engine v2.5",
  "memoryUsageMb": 42.1
}`
    }
  ];

  const handleCopy = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-indigo-400 font-bold flex items-center justify-center border border-slate-700 shadow-md">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                G-AGE AI Public REST API v1
              </h2>
              <p className="text-xs text-slate-500">Developer documentation, endpoints, and cURL snippets</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-purple-50 dark:bg-purple-950/50 border-b border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              Authentication Required: Pass <code className="bg-purple-200/80 dark:bg-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">Authorization: Bearer gage_live_...</code> on all <code className="font-mono">/api/v1/*</code> endpoints.
            </span>
          </div>
          <span className="font-mono text-[10px] bg-purple-200 dark:bg-purple-900 px-2 py-0.5 rounded font-bold shrink-0">
            v2.5.0 (API Key Protected)
          </span>
        </div>

        {/* Endpoints List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          {endpoints.map((ep, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    {ep.method}
                  </span>
                  <span className="text-slate-900 dark:text-white">{ep.path}</span>
                </div>

                <button
                  onClick={() => handleCopy(`curl -H "Authorization: Bearer YOUR_API_KEY" -X GET "${window.location.origin}${ep.path.replace("{question}", "What is gravity").replace("{topicA}", "gravity").replace("{topicB}", "quantum-computing").replace("{slug}", "gravity")}"`, ep.path)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
                >
                  {copiedPath === ep.path ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>Copy cURL</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">{ep.description}</p>

              {ep.parameters.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Parameters:</div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {ep.parameters.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {p.name} ({p.type}) {p.required && <span className="text-rose-500 font-bold">*required</span>} - {p.description}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-slate-900 p-3 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                <pre>{ep.exampleResponse}</pre>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
