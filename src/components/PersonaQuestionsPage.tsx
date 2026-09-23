import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";

type Question = {
  id: number;
  slug: string;
  question_text: string;
  persona_name: string;
  view_count?: number;
};

export const PersonaQuestionsPage: React.FC = () => {
  const personaSlug = window.location.pathname.split("/").filter(Boolean)[1] || "";
  const [questions, setQuestions] = useState<Question[]>([]);
  const [personaName, setPersonaName] = useState("this expert");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/persona/${encodeURIComponent(personaSlug)}/questions`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        const rows = Array.isArray(data.questions) ? data.questions : [];
        setQuestions(rows);
        if (rows[0]?.persona_name) setPersonaName(rows[0].persona_name);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [personaSlug]);

  useEffect(() => {
    document.title = `Questions answered by ${personaName} | G-AGE AI`;
  }, [personaName]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-5 py-8 sm:px-8">
      <section className="max-w-3xl mx-auto">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-8" aria-label="Breadcrumb">
          <a href="/" className="hover:text-indigo-500 inline-flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Home</a>
          <ChevronRight className="w-3.5 h-3.5" /><span>{personaName}</span><ChevronRight className="w-3.5 h-3.5" /><span>Questions</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Questions answered by {personaName}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Explore public answers from this G-AGE expert.</p>
        {loading ? <p className="text-sm text-slate-500">Loading questions...</p> : questions.length === 0 ? <p className="text-sm text-slate-500">No public questions yet.</p> : (
          <div className="space-y-3">
            {questions.map((question) => (
              <a key={question.id || question.slug} href={`/q/${encodeURIComponent(question.slug)}`} className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                <div className="flex items-start justify-between gap-4"><span className="font-semibold leading-relaxed">{question.question_text.slice(0, 100)}{question.question_text.length > 100 ? "..." : ""}</span><span className="shrink-0 text-xs text-slate-500">{question.view_count || 0} views</span></div>
              </a>
            ))}
          </div>
        )}
        <a href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"><ArrowLeft className="w-4 h-4" /> Back home</a>
      </section>
    </main>
  );
};
