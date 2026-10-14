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
    <main className="min-h-screen bg-[#F3F6F1] dark:bg-[#0B1612] text-[#10231C] dark:text-[#E8F2EC] px-5 py-8 sm:px-8">
      <section className="max-w-3xl mx-auto">
        <nav className="flex items-center gap-1.5 text-xs text-[#4F6359] dark:text-[#9DB5A8] mb-8" aria-label="Breadcrumb">
          <a href="/" className="hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] inline-flex items-center gap-1 min-h-[44px]"><Home className="w-4 h-4" /> Home</a>
          <ChevronRight className="w-3.5 h-3.5" /><span>{personaName}</span><ChevronRight className="w-3.5 h-3.5" /><span>Questions</span>
        </nav>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-[#10231C] dark:text-[#E8F2EC]">Questions answered by {personaName}</h1>
        <p className="text-[#4F6359] dark:text-[#9DB5A8] mb-8 text-base">Explore public answers from this G-AGE expert.</p>
        {loading ? <p className="text-sm text-[#4F6359] dark:text-[#9DB5A8]">Loading questions...</p> : questions.length === 0 ? <p className="text-sm text-[#4F6359] dark:text-[#9DB5A8]">No public questions yet.</p> : (
          <div className="space-y-3">
            {questions.map((question) => (
              <a key={question.id || question.slug} href={`/q/${encodeURIComponent(question.slug)}`} className="block min-h-[44px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] rounded-[20px] px-5 py-4 hover:border-[#0A5C45] dark:hover:border-[#5BE0A5] transition-colors">
                <div className="flex items-start justify-between gap-4"><span className="font-semibold leading-relaxed text-[#10231C] dark:text-[#E8F2EC]">{question.question_text.slice(0, 100)}{question.question_text.length > 100 ? "..." : ""}</span><span className="shrink-0 text-xs text-[#4F6359] dark:text-[#9DB5A8]">{question.view_count || 0} views</span></div>
              </a>
            ))}
          </div>
        )}
        <a href="/" className="mt-8 inline-flex items-center gap-2 text-base font-bold text-[#0A5C45] dark:text-[#5BE0A5] hover:underline min-h-[44px]"><ArrowLeft className="w-4 h-4" /> Back home</a>
      </section>
    </main>
  );
};
