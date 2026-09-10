import React, { useState, useRef } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  X,
  Upload,
  BookOpen,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  GraduationCap,
  Plus,
  Check,
  Lock,
  Crown,
} from "lucide-react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { useNotes } from "../../hooks/useNotes";
import { useUser } from "../../context/UserContext";

interface MCQ {
  question: string;
  options: string[];
  correct: number;
}

interface QAResponse {
  answer: string | Record<string, string>;
  keyPoints: string[];
  mcqs: MCQ[];
  practiceQuestions: string[];
}

export const LearningQACard: React.FC = () => {
  const { addNote } = useNotes();
  const { user } = useUser();
  const isPaid = user?.tier === "paid" || user?.tier === "pro" || user?.tier === "unlimited";
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const triggerToast = (msg: string) => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-24 right-6 z-50 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-1.5 font-medium animate-fade-in";
    toast.innerHTML = `<span>✓</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.5s ease";
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  };

  const handleAddNote = async (key: string, title: string, content: string) => {
    try {
      await addNote(title, content, "Q&A " + board);
      setAddedMap((prev) => ({ ...prev, [key]: true }));
      triggerToast("Added to Notes ✓");
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [key]: false })), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Input Form States
  const [question, setQuestion] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState(5);
  const [grade, setGrade] = useState("Grade 9 (Matric)");
  const [format, setFormat] = useState("Concept Explanation");
  const [board, setBoard] = useState("Punjab Board");

  // App States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QAResponse | null>(null);

  // Drag & Drop / Upload reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Interactive MCQ States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [answeredMCQs, setAnsweredMCQs] = useState<Record<number, boolean>>({});

  // Parse Difficulty Zone Labels
  const getDifficultyZone = (val: number) => {
    if (val <= 3) return { label: "Basic", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200" };
    if (val <= 6) return { label: "Intermediate", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200" };
    return { label: "Advanced", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200" };
  };

  const zone = getDifficultyZone(difficulty);

  // File Upload Handlers
  const handleFileSelect = (file: File) => {
    if (!isPaid) {
      setError("Image Reading & Diagram Analysis is a Pro feature. Please upgrade to G-AGE Pro to upload diagrams and handwritten notes.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() && !imageBase64) {
      setError("Please provide either a question text or upload an image.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAnswers({});
    setAnsweredMCQs({});

    try {
      const response = await fetch("/api/learn/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          imageBase64,
          difficulty,
          grade,
          format,
          board,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to retrieve an answer from the AI tutor.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset/Try Another Handler
  const handleReset = () => {
    setQuestion("");
    setImageBase64(null);
    setDifficulty(5);
    setResult(null);
    setError(null);
    setSelectedAnswers({});
    setAnsweredMCQs({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Interactive MCQ Option Click
  const handleSelectMCQOption = (mcqIndex: number, optionIndex: number) => {
    if (answeredMCQs[mcqIndex]) return; // Only allow one attempt or locked answer per session
    setSelectedAnswers((prev) => ({ ...prev, [mcqIndex]: optionIndex }));
    setAnsweredMCQs((prev) => ({ ...prev, [mcqIndex]: true }));
  };

  // Parse Answer if it can be an object
  const renderAnswerText = (ans: string | Record<string, string>): React.ReactNode => {
    if (typeof ans === "object" && ans !== null) {
      return (
        <div className="space-y-4">
          {Object.entries(ans).map(([subKey, val]) => (
            <div key={subKey} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 tracking-wide uppercase mb-1">
                {subKey}
              </h4>
              <MarkdownRenderer content={String(val)} className="text-xs text-slate-700 dark:text-slate-300" />
            </div>
          ))}
        </div>
      );
    }

    const textVal = String(ans);

    // Attempt to parse string if it was stringified JSON
    if (textVal.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(textVal);
        return renderAnswerText(parsed);
      } catch {
        // Fallback below
      }
    }

    return (
      <MarkdownRenderer content={textVal} className="text-xs text-slate-700 dark:text-slate-300" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* 1. TUTOR SELECTION PANEL (FORM) */}
      {!result && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-6 space-y-6 shadow-xs">
          
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Pakistan Board Board Exam AI Tutor
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                 Punjab/Federal board syllabus study guide & homework helper.
              </p>
            </div>
          </div>

          {/* Form Fields: Grid of selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Grade Level Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Grade Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Grade 9 (Matric)">Grade 9 (Matric)</option>
                <option value="Grade 10 (Matric)">Grade 10 (Matric)</option>
                <option value="FSc Part I (Grade 11)">FSc Part I (Grade 11)</option>
                <option value="FSc Part II (Grade 12)">FSc Part II (Grade 12)</option>
              </select>
            </div>

            {/* 2. Format Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Explanation Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Concept Explanation">Concept Explanation (2-3 Paras)</option>
                <option value="Short Question">Short Question (3-5 Lines)</option>
                <option value="Long Question">Long Question (Detailed w/ Headings)</option>
                <option value="All Three">All Three Formats (Separate Subkeys)</option>
              </select>
            </div>

            {/* 3. Board Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Education Board
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Punjab Board">Punjab Board (BISE Lahore etc.)</option>
                <option value="Federal Board">Federal Board (FBISE)</option>
                <option value="Sindh Board">Sindh Board (BIEK/BSEK)</option>
                <option value="KPK Board">KPK Board (BISE Peshawar etc.)</option>
                <option value="Balochistan Board">Balochistan Board (BISE Quetta)</option>
              </select>
            </div>

          </div>

          {/* Text Area Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Your Question or Topic
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="E.g., Explain the difference between longitudinal and transverse waves with examples..."
              rows={4}
              className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Interactive Drag-and-Drop Image Uploader */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Handwritten or Diagram Image Upload</span>
                {isPaid ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                    PRO ACTIVE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold border border-amber-500/20 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" />
                    <span>PRO ONLY</span>
                  </span>
                )}
              </label>
              {!isPaid && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Upgrade to unlock OCR
                </span>
              )}
            </div>
            
            {!imageBase64 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!isPaid) {
                    setError("Image Reading & Diagram Analysis is a Pro feature. Please upgrade to G-AGE Pro to upload diagrams and handwritten notes.");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 hover:bg-slate-50 dark:hover:bg-slate-950/40 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                    : !isPaid
                    ? "border-amber-200/70 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                {!isPaid ? (
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
                    <Lock className="w-4 h-4" />
                  </div>
                ) : (
                  <Upload className="w-6 h-6 text-slate-400" />
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {!isPaid ? (
                    <span>Unlock <span className="text-amber-600 dark:text-amber-400">Gemini Vision OCR</span> to analyze handwritten exams</span>
                  ) : (
                    <span>Drag and drop your handwritten question, or <span className="text-indigo-600 dark:text-indigo-400">browse file</span></span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400">
                  Supports JPG, PNG, WebP images
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-4">
                <img
                  src={imageBase64}
                  alt="Uploaded thumbnail"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200/50 dark:border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    Attached Board Exam Image
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Will be sent to Gemini Vision model for transcription & analysis
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Difficulty Slider with dynamic zones */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Syllabus Difficulty Level
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${zone.color}`}>
                Level {difficulty} • {zone.label}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
              <span>Basic (1-3)</span>
              <span>Intermediate (4-6)</span>
              <span>Advanced (7-10)</span>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 border border-rose-100 dark:border-rose-900/50">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 select-none shadow-xs"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>AI Board Tutor is formulating answers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Question to AI Tutor</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

      {/* 2. LOADING STATE SKELETON */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Structuring Pakistan Board Response
            </h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Drafting syllabus-aligned explanations, checking marking schemes, generating MCQs, and creating practice materials...
            </p>
          </div>
        </div>
      )}

      {/* 3. RESULTS DISPLAY PANEL */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 p-4 rounded-xl">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Solutions formulated for {board}
                </h4>
                <p className="text-[10px] text-slate-500">
                  Grade Level: {grade} • Difficulty: {difficulty}/10
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const fullContent = `## Topic: ${question || "Board Prep"}\n\n### Explanation\n${typeof result.answer === 'string' ? result.answer : JSON.stringify(result.answer, null, 2)}\n\n### Key Points\n${result.keyPoints?.map(p => `* ${p}`).join('\n') || ''}`;
                  handleAddNote("full", `Study Guide: ${question || "Board Prep"}`, fullContent);
                }}
                className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                {addedMap["full"] ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{addedMap["full"] ? "Added" : "+ Save Full Study Guide"}</span>
              </button>
              
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200/50 dark:border-slate-700 shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Another Question</span>
              </button>
            </div>
          </div>

          {/* Answer segment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Main Solution & Explanation</span>
              </h3>
              <button
                onClick={() => {
                  const content = typeof result.answer === "string" ? result.answer : JSON.stringify(result.answer, null, 2);
                  handleAddNote("answer", `Explanation: ${question || "Board Solution"}`, content);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                {addedMap["answer"] ? <Check className="w-3 h-3 text-emerald-500" /> : <Plus className="w-3 h-3" />}
                <span>{addedMap["answer"] ? "Added" : "+ Notes"}</span>
              </button>
            </div>
            {renderAnswerText(result.answer)}
          </div>

          {/* Key points section */}
          {result.keyPoints && result.keyPoints.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Core Remember-and-Revise Key Points</span>
                </h3>
                <button
                  onClick={() => {
                    const content = result.keyPoints.map((p, idx) => `Point ${idx + 1}: ${p}`).join("\n\n");
                    handleAddNote("keyPoints", `Key Points: ${question || "Board Key Points"}`, content);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  {addedMap["keyPoints"] ? <Check className="w-3 h-3 text-emerald-500" /> : <Plus className="w-3 h-3" />}
                  <span>{addedMap["keyPoints"] ? "Added" : "+ Notes"}</span>
                </button>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium relative overflow-hidden"
                  >
                    <div className="absolute top-3 left-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm uppercase">
                      Point 0{idx + 1}
                    </div>
                    <div className="pt-6 font-semibold">
                      <MarkdownRenderer content={point} className="text-xs" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive MCQs */}
          {result.mcqs && result.mcqs.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-6 space-y-5 shadow-xs">
              
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  <span>Interactive Board MCQ Quiz</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Click on any option to immediately test your understanding. Results lock in immediately.
                </p>
              </div>

              <div className="space-y-6 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                {result.mcqs.map((mcq, mIdx) => {
                  const hasAnswered = answeredMCQs[mIdx];
                  const userSel = selectedAnswers[mIdx];
                  const isCorrectVal = userSel === mcq.correct;

                  return (
                    <div key={mIdx} className="space-y-3 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/30 dark:border-slate-800/30">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-bold text-slate-400 shrink-0 mt-0.5">
                          Q{mIdx + 1}.
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {mcq.question}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                        {mcq.options.map((option, oIdx) => {
                          const optionLabel = String.fromCharCode(65 + oIdx); // A, B, C, D
                          const isSelected = userSel === oIdx;
                          const isRightOption = mcq.correct === oIdx;

                          // Option styling states
                          let optStyle = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800/50";
                          if (hasAnswered) {
                            if (isRightOption) {
                              optStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold";
                            } else if (isSelected) {
                              optStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-semibold";
                            } else {
                              optStyle = "border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectMCQOption(mIdx, oIdx)}
                              disabled={hasAnswered}
                              className={`px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all duration-150 flex items-center gap-2 cursor-pointer select-none ${optStyle}`}
                            >
                              <span className="font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-xs shrink-0 uppercase">
                                {optionLabel}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div className="pl-6 pt-1">
                          {isCorrectVal ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              ✓ Correct! Great job!
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              ✗ Incorrect. The correct option is {String.fromCharCode(65 + mcq.correct)}.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Practice Questions */}
          {result.practiceQuestions && result.practiceQuestions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-500" />
                <span>Subjective Comprehension & Homework Practice Questions</span>
              </h3>
              <div className="space-y-3 pl-2">
                {result.practiceQuestions.map((question, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                      {question}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action bar */}
          <div className="text-center pt-2 pb-6">
            <button
              onClick={handleReset}
              className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer shadow-xs select-none"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Solve/Ask Another Board Question</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
