import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  Send,
  User,
  RotateCcw,
  BookOpen,
  Check,
  Brain,
  MessageSquare,
  BookmarkPlus,
  Globe,
  Award,
  ChevronRight
} from "lucide-react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { useNotes } from "../../hooks/useNotes";
import { useUser } from "../../context/UserContext";
import { getAuthHeaders } from "../../services/api";
import {
  ExpertPersona,
  matchExpert,
  getExpertChips
} from "../../data/experts";
import { usePersonas } from "../../hooks/usePersonas";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface CounselingCardProps {
  defaultPersonaId?: string;
  onClearDefaultPersona?: () => void;
  topic?: string;
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem("bifrost_device_id");
  if (!deviceId) {
    deviceId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "dev-" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("bifrost_device_id", deviceId);
  }
  return deviceId;
}

export const CounselingCard: React.FC<CounselingCardProps> = ({
  defaultPersonaId,
  onClearDefaultPersona,
  topic = "General Research"
}) => {
  const { user, mode } = useUser();
  const { addNote } = useNotes();
  const [addedMap, setAddedMap] = useState<Record<string | number, boolean>>({});

  // Region Toggle: Global vs Pakistani Experts
  // Defaults to Pakistani if in learning mode or previously selected
  const [variant, setVariant] = useState<"global" | "pk">(() => {
    const saved = localStorage.getItem("bifrost_expert_variant");
    if (saved === "pk" || saved === "global") return saved;
    return mode === "learning" ? "pk" : "global";
  });

  const { globalExperts, pkExperts } = usePersonas();
  const activeExpertSet = variant === "pk" ? pkExperts : globalExperts;

  // Auto-match expert based on topic
  const initialMatchedExpert = useMemo(() => {
    if (defaultPersonaId && activeExpertSet[defaultPersonaId]) {
      return activeExpertSet[defaultPersonaId];
    }
    return matchExpert(topic, activeExpertSet);
  }, [topic, defaultPersonaId, activeExpertSet]);

  const [selectedExpertId, setSelectedExpertId] = useState<string>(initialMatchedExpert.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentExpert: ExpertPersona =
    activeExpertSet[selectedExpertId] || initialMatchedExpert || activeExpertSet["aisha"];

  // Save variant preference
  const handleToggleVariant = (newVariant: "global" | "pk") => {
    setVariant(newVariant);
    localStorage.setItem("bifrost_expert_variant", newVariant);
  };

  // Storage key for user/guest expert chats
  const storageKey = useMemo(() => {
    const userId = user?.id;
    return userId
      ? `bifrost_expert_chat_${userId}_${variant}_${selectedExpertId}`
      : `bifrost_expert_chat_guest_${getDeviceId()}_${variant}_${selectedExpertId}`;
  }, [user?.id, variant, selectedExpertId]);

  // Load chat session when expert or topic changes
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: ChatMessage[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to load expert session:", e);
      }
    }

    // Default initial greeting using persona's customized opener
    const greetingText = currentExpert.opener(topic || "your topic");

    setMessages([
      {
        role: "assistant",
        content: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      }
    ]);
  }, [storageKey, selectedExpertId, variant, topic, currentExpert]);

  // Save messages to storage
  const saveMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMessages));
    } catch (e) {
      console.error("Failed to persist expert chat:", e);
    }
  };

  // Switch expert handler
  const handleSwitchExpert = (expertId: string) => {
    setSelectedExpertId(expertId);
    setError(null);
    onClearDefaultPersona?.();
  };

  // Clear chat handler
  const handleClearChat = () => {
    const freshGreeting: ChatMessage[] = [
      {
        role: "assistant",
        content: currentExpert.opener(topic || "your topic"),
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      }
    ];
    saveMessages(freshGreeting);
    setError(null);
  };

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const triggerToast = (msg: string) => {
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-24 right-6 z-50 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-1.5 font-medium animate-fade-in";
    toast.innerHTML = `<span>✓</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.5s ease";
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  };

  const handleAddNote = async (key: string | number, title: string, content: string) => {
    try {
      await addNote(title, content, currentExpert.badge);
      setAddedMap((prev) => ({ ...prev, [key]: true }));
      triggerToast("Saved to Notes ✓");
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [key]: false })), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    setInput("");
    setError(null);

    const nowStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const userMsg: ChatMessage = { role: "user", content: textToSend, timestamp: nowStr };
    const updatedMessages = [...messages, userMsg];
    saveMessages(updatedMessages);
    setLoading(true);

    try {
      // Direct call to backend counseling/expert API endpoint
      const response = await fetch("/api/counsel", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          personaId: currentExpert.id,
          systemPrompt: currentExpert.system_prompt,
          topic: topic || currentExpert.badge,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to retrieve expert consultation.");
      }

      const data = await response.json();
      const replyContent =
        data.reply || data.content || "I have analyzed your query and provided my expert assessment.";
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      };

      saveMessages([...updatedMessages, assistantMsg]);
    } catch (err: any) {
      console.error("Expert Chat Error:", err);
      setError(err.message || "An unexpected error occurred during consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const expertChips = useMemo(() => getExpertChips(activeExpertSet), [activeExpertSet]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────
          1. EXPERT PROFILE HERO CARD & STATUS
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        
        {/* Top bar: Region Switcher & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <button
              onClick={() => handleToggleVariant("global")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                variant === "global"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global Experts</span>
            </button>
            <button
              onClick={() => handleToggleVariant("pk")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                variant === "pk"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>🇵🇰</span>
              <span>Pakistani Specialists</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
          </div>
        </div>

        {/* Expert Main Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md select-none"
                style={{ backgroundColor: currentExpert.avatar_color }}
              >
                {currentExpert.initials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentExpert.name}
                </h2>
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: currentExpert.avatar_color,
                    borderColor: `${currentExpert.avatar_color}40`,
                    backgroundColor: `${currentExpert.avatar_color}15`
                  }}
                >
                  {currentExpert.badge}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {currentExpert.status}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {currentExpert.role} &middot;{" "}
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  {currentExpert.affiliation}
                </span>
              </p>

              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {currentExpert.description}
              </p>

              {/* Specialties tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentExpert.specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. EXPERT SWITCHER ROW
            ───────────────────────────────────────────────────────────── */}
        <div className="pt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 shrink-0">
              Specialist:
            </span>
            {expertChips.map((chip) => {
              const isSelected = chip.id === selectedExpertId;
              return (
                <button
                  key={chip.id}
                  onClick={() => handleSwitchExpert(chip.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 font-bold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: chip.avatar_color }}
                  >
                    {chip.initials[0]}
                  </span>
                  <span>{chip.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE CHAT INTERFACE & CONVERSATION STREAM
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[600px] shadow-sm">
        
        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/30">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border select-none text-xs font-bold ${
                    isUser
                      ? "bg-slate-900 border-slate-800 text-white dark:bg-slate-100 dark:border-white dark:text-slate-900"
                      : "text-white shadow-xs"
                  }`}
                  style={!isUser ? { backgroundColor: currentExpert.avatar_color, borderColor: currentExpert.avatar_color } : {}}
                >
                  {isUser ? <User className="w-4 h-4" /> : currentExpert.initials}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group/msg rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-none shadow-xs font-medium"
                      : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-2xs"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      <MarkdownRenderer content={msg.content} />

                      {/* Action Bar for Assistant Messages */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-2 text-[11px] text-slate-400">
                        <span>{msg.timestamp || "Specialist Insight"}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddNote(idx, `Expert: ${currentExpert.name}`, msg.content)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
                        >
                          {addedMap[idx] ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <BookmarkPlus className="w-3 h-3" />
                          )}
                          <span>{addedMap[idx] ? "Saved to Notes" : "Save Note"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center">
              <div
                className="w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ backgroundColor: currentExpert.avatar_color }}
              >
                {currentExpert.initials}
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-1.5">
                <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-xs text-slate-400 ml-2 font-medium">
                  {currentExpert.name} is formulating response...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. SUGGESTION QUESTIONS DERIVED FROM SPECIALTIES
            ───────────────────────────────────────────────────────────── */}
        {currentExpert.specialties && currentExpert.specialties.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
              Specialties:
            </span>
            {currentExpert.specialties.slice(0, 3).map((spec, i) => (
              <button
                key={i}
                onClick={() => handleSend(`Can you explain your perspective on ${spec} regarding ${topic || "this field"}?`)}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
              >
                {spec}
              </button>
            ))}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5. INPUT FORM & SEND CONTROLS
            ───────────────────────────────────────────────────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${currentExpert.name} about ${currentExpert.badge}...`}
            disabled={loading}
            className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-normal"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 sm:px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 shrink-0 font-bold text-xs shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
