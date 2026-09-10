import React from "react";
import { Persona } from "../types";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";

interface PersonaSuggestionsProps {
  personas: Persona[];
  mode: "research" | "learning";
  onSelectPersona: (persona: Persona) => void;
  isLoading?: boolean;
}

const SOFT_COLOR_THEMES = [
  {
    bg: "bg-indigo-50/90 dark:bg-indigo-950/30",
    border: "border-indigo-200/80 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-600",
    nameColor: "text-indigo-950 dark:text-indigo-200",
    descColor: "text-indigo-700/80 dark:text-indigo-300/70",
    badgeBg: "bg-indigo-100/90 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300",
    hoverIcon: "text-indigo-600 dark:text-indigo-400",
  },
  {
    bg: "bg-emerald-50/90 dark:bg-emerald-950/30",
    border: "border-emerald-200/80 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600",
    nameColor: "text-emerald-950 dark:text-emerald-200",
    descColor: "text-emerald-700/80 dark:text-emerald-300/70",
    badgeBg: "bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
    hoverIcon: "text-emerald-600 dark:text-emerald-400",
  },
  {
    bg: "bg-amber-50/90 dark:bg-amber-950/30",
    border: "border-amber-200/80 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600",
    nameColor: "text-amber-950 dark:text-amber-200",
    descColor: "text-amber-700/80 dark:text-amber-300/70",
    badgeBg: "bg-amber-100/90 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300",
    hoverIcon: "text-amber-600 dark:text-amber-400",
  },
  {
    bg: "bg-purple-50/90 dark:bg-purple-950/30",
    border: "border-purple-200/80 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600",
    nameColor: "text-purple-950 dark:text-purple-200",
    descColor: "text-purple-700/80 dark:text-purple-300/70",
    badgeBg: "bg-purple-100/90 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300",
    hoverIcon: "text-purple-600 dark:text-purple-400",
  },
  {
    bg: "bg-rose-50/90 dark:bg-rose-950/30",
    border: "border-rose-200/80 dark:border-rose-800/50 hover:border-rose-400 dark:hover:border-rose-600",
    nameColor: "text-rose-950 dark:text-rose-200",
    descColor: "text-rose-700/80 dark:text-rose-300/70",
    badgeBg: "bg-rose-100/90 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300",
    hoverIcon: "text-rose-600 dark:text-rose-400",
  },
];

function getPersonaDescription(persona: Persona): string {
  const tag = (persona.subject_tag || "").toLowerCase();
  const name = (persona.name || "").toLowerCase();

  if (tag.includes("quantum") || name.includes("thorne") || name.includes("saif")) {
    return "Quantum computing, decoherence & theoretical physics";
  }
  if (tag.includes("neuro") || name.includes("vasquez") || name.includes("farooq")) {
    return "Neuroplasticity, memory, cognition & mindfulness";
  }
  if (tag.includes("software") || name.includes("reid") || name.includes("chaudhry")) {
    return "Distributed systems, backend scale & API architecture";
  }
  if (tag.includes("biology") || tag.includes("genomics") || name.includes("zhou") || name.includes("razzaq")) {
    return "CRISPR gene editing, molecular biology & genomics";
  }
  if (tag.includes("economics") || name.includes("petrov") || name.includes("husain")) {
    return "Monetary policy, macro modeling & systemic risk";
  }
  if (tag.includes("law") || name.includes("okonkwo") || name.includes("khalid")) {
    return "IP law, AI regulation, GDPR & startup compliance";
  }
  if (tag.includes("data science") || name.includes("romero") || name.includes("malik")) {
    return "ML pipelines, statistical models & recommendation engines";
  }
  if (tag.includes("safety") || tag.includes("ethics") || name.includes("patel") || name.includes("hussain")) {
    return "AI alignment, interpretability & technology ethics";
  }

  if (persona.system_prompt) {
    const firstSentence = persona.system_prompt.split(".")[0];
    return firstSentence.replace(/^You are (an?|the) /i, "").trim() + ".";
  }
  return "Specialized 1-on-1 consultation & domain mentorship";
}

export const PersonaSuggestions: React.FC<PersonaSuggestionsProps> = ({
  personas,
  mode,
  onSelectPersona,
  isLoading = false,
}) => {
  if (isLoading && (!personas || personas.length === 0)) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-500"></div>
        <span>Loading counselors...</span>
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return null;
  }

  // ==========================================
  // LEARNING MODE STYLING: Warm and Inviting
  // ==========================================
  if (mode === "learning") {
    return (
      <div className="w-full max-w-4xl mx-auto pt-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              Talk to an Expert
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
            1-on-1 AI Mentors & Study Counselors
          </span>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {personas.map((persona, index) => {
            const theme = SOFT_COLOR_THEMES[index % SOFT_COLOR_THEMES.length];
            const desc = getPersonaDescription(persona);

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => onSelectPersona(persona)}
                className={`group relative text-left p-3.5 rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${theme.bg} ${theme.border}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl filter drop-shadow-xs group-hover:scale-110 transition-transform duration-200 inline-block">
                      {persona.avatar_emoji || "🎓"}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.badgeBg}`}>
                      {persona.subject_tag || "Advisor"}
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-xs font-bold ${theme.nameColor} line-clamp-1`}>
                      {persona.name}
                    </h3>
                    <p className={`text-[11px] leading-snug mt-1 line-clamp-2 ${theme.descColor}`}>
                      {desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <span>Chat now</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // RESEARCH MODE STYLING: Minimal & Professional
  // ==========================================
  return (
    <div className="w-full max-w-4xl mx-auto pt-5 animate-in fade-in duration-200">
      <div className="flex items-center flex-wrap justify-center sm:justify-start gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs flex items-center gap-1.5 shrink-0 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Ask a Specialist
        </span>

        {personas.map((persona) => (
          <button
            key={persona.id}
            type="button"
            onClick={() => onSelectPersona(persona)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/70 text-xs font-medium transition-all shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
          >
            <span className="text-sm">{persona.avatar_emoji || "💬"}</span>
            <span className="font-semibold">{persona.subject_tag || persona.name}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => onSelectPersona(personas[0])}
          className="inline-flex items-center gap-0.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-1 cursor-pointer"
        >
          <span>All Advisors</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
