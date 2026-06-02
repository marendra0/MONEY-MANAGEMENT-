import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Transaction } from "../types";
import { Sparkles, Send, Loader2, RefreshCw, User, HelpCircle, AlertCircle } from "lucide-react";
import Markdown from "react-markdown";

interface AdvisorChatProps {
  transactions: Transaction[]; // Active list of expenses
  budgetLimit: number;
  activeFilters: { month: number; year: number };
  chatHistory: ChatMessage[];
  onAddChatMessage: (msg: ChatMessage) => void;
  onClearChatHistory: () => void;
}

export default function AdvisorChat({
  transactions,
  budgetLimit,
  activeFilters,
  chatHistory,
  onAddChatMessage,
  onClearChatHistory,
}: AdvisorChatProps) {
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  // Handle message submission
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    // 1. Add user message to state
    onAddChatMessage(userMessage);
    setUserInput("");
    setLoading(true);

    try {
      // 2. Query financial advisor API
      const response = await fetch("/api/ai/financial-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: [...chatHistory, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentExpenses: transactions,
          budgetLimit,
          activeFilters,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        const assistantMessage: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: "assistant",
          content: resData.reply,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        };
        onAddChatMessage(assistantMessage);
      } else {
        throw new Error(resData.error || "Gagal mendapatkan saran AI.");
      }
    } catch (err) {
      console.error("Gagal konsultasi:", err);
      // Construct fallback error message
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Maaf Kak, terjadi kendala saat merespon obrolan Anda. Silakan priksa koneksi internet Anda atau coba sesaat lagi.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      onAddChatMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
  };

  // Preset advice prompts
  const PRESET_QUESTIONS = [
    { text: "📝 Analisis Belanjaku", label: "Analisis Pengeluaran" },
    { text: "💡 Beri Tips Hemat Jajan", label: "Cara Hemat Jajan" },
    { text: "📊 Aturan Budget 50-30-20", label: "Aturan 50-30-20" },
    { text: "📈 Bagaimana cara investasi kecil-kecilan?", label: "Mulai Rencana Investasi" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[550px]" id="advisor-chat-panel">
      
      {/* Chat header area */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-display font-bold text-sm">
            KC
          </div>
          <div>
            <h4 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              Kang Catat Asisten Keuangan
              <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
            </h4>
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-sans font-semibold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Siap Menganalisis Saku Keuangan
            </span>
          </div>
        </div>

        {/* Clear chat button */}
        {chatHistory.length > 1 && (
          <button
            type="button"
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
            title="Bersihkan Percakapan"
            onClick={onClearChatHistory}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Chat message history container list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {chatHistory.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Profile icon */}
              <div
                className={`w-7 h-7 rounded-sm shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : "KC"}
              </div>

              {/* Chat bubble body */}
              <div className="space-y-1">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
                <span className={`text-[9px] text-slate-400 block px-1 ${isUser ? "text-right" : ""}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing loading indicators */}
        {loading && (
          <div className="flex items-start gap-2.5 mr-auto max-w-[85%]">
            <div className="w-7 h-7 rounded-sm bg-slate-200 text-slate-600 shrink-0 flex items-center justify-center text-xs font-bold">
              KC
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-2 shadow-xs">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-xs text-slate-500 font-sans italic">Asisten AI sedang menyusun analisis saku...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset interactive cues buttons */}
      {chatHistory.length <= 1 && !loading && (
        <div className="px-5 py-2.5 bg-slate-100/50 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="h-3 w-3 text-blue-400" /> Coba diskusikan budget dengan menekan:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q.text}
                type="button"
                className="text-xs px-3 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 rounded-lg cursor-pointer transition-all"
                onClick={() => handleSendMessage(q.text)}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom input text box form bar */}
      <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-705 placeholder-slate-450 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans bg-slate-50"
            placeholder={loading ? "Mohon tunggu asisten membalas..." : "Diskusikan anggaran keuanganmu di sini..."}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!userInput.trim() || loading}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${
              userInput.trim() && !loading
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
