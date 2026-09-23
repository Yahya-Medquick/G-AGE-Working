import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Home, MessageCircle } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

type PublicQA = {
  slug: string;
  question_text: string;
  answer_text: string;
  persona_slug: string;
  persona_name: string;
  persona_group?: string | null;
  view_count?: number;
};

export const PublicQAPage: React.FC = () => {
  const [page, setPage] = useState<PublicQA | null>(null);
  const [notFound, setNotFound] = useState(false);
  const slug = window.location.pathname.split("/").filter(Boolean).pop() || "";

  useEffect(() => {
    let active = true;
    fetch(`/q/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        if (response.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!response.ok) throw new Error("Failed to load question");
        return response.json();
      })
      .then((data) => {
        if (active && data) setPage(data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!page) return;
    document.title = `${page.question_text} — ${page.persona_name} | G-AGE AI`;
    const description = page.answer_text.slice(0, 155);
    const setMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };
    setMeta("description", description);

    let canonical = document.querySelector<HTMLLinkElement>("link[rel=canonical]");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://gageai.org/q/${encodeURIComponent(page.slug)}`;

    const schemaId = "qa-page-jsonld";
    document.getElementById(schemaId)?.remove();
    const script = document.createElement("script");
    script.id = schemaId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "QAPage",
      name: page.question_text,
      mainEntity: {
        "@type": "Question",
        name: page.question_text,
        answerCount: 1,
        acceptedAnswer: {
          "@type": "Answer",
          text: page.answer_text,
          author: { "@type": "Person", name: page.persona_name },
        },
      },
    });
    document.head.appendChild(script);
    return () => document.getElementById(schemaId)?.remove();
  }, [page]);

  if (notFound) {
    return <EmptyState title="Question not found" />;
  }
  if (!page) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm text-slate-500">Loading question...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-5 py-8 sm:px-8">
      <article className="max-w-3xl mx-auto">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-8" aria-label="Breadcrumb">
          <a href="/" className="hover:text-indigo-500 inline-flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Home</a>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{page.persona_group || "Expert answers"}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 dark:text-slate-200">{page.persona_name}</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5">{page.question_text}</h1>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">{page.persona_name.slice(0, 1)}</div>
          <span className="text-sm text-slate-600 dark:text-slate-300">Answered by <strong>{page.persona_name}</strong></span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-8 shadow-sm">
          <MarkdownRenderer content={page.answer_text} />
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <a href={`/?persona=${encodeURIComponent(page.persona_slug)}`} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors"><MessageCircle className="w-4 h-4" /> Ask {page.persona_name} a question</a>
          <span className="text-xs text-slate-500 dark:text-slate-400">{page.view_count || 0} students found this helpful</span>
        </div>
      </article>
    </main>
  );
};

const EmptyState: React.FC<{ title: string }> = ({ title }) => (
  <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-5 text-center">
    <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{title}</h1><a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"><ArrowLeft className="w-4 h-4" /> Back home</a></div>
  </main>
);
