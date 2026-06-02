import React, { useState } from "react";
import { Transaction, CATEGORIES } from "../types";
import { Sparkles, PlusCircle, Check, Loader2, ArrowRight, HelpCircle } from "lucide-react";
import { formatRupiah } from "../utils";

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
}

export default function TransactionForm({ onAddTransaction }: TransactionFormProps) {
  // Manual Input State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // AI Input State
  const [aiText, setAiText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  
  // Parsed AI Review State
  const [parsedPreview, setParsedPreview] = useState<Omit<Transaction, "id"> | null>(null);

  // Manual Add submit handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return;

    onAddTransaction({
      title: title.trim(),
      amount: Math.round(parseFloat(amount)),
      category,
      date,
      notes: notes.trim() || undefined,
    });

    // Reset input fields
    setTitle("");
    setAmount("");
    setNotes("");
  };

  // call /api/ai/parse-expense
  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setIsAiLoading(true);
    setAiError("");
    setParsedPreview(null);

    try {
      const response = await fetch("/api/ai/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiText,
          referenceDate: new Date().toISOString().split("T")[0],
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setParsedPreview({
          title: resData.data.title || "Pengeluaran Berbasis AI",
          amount: Number(resData.data.amount) || 0,
          category: resData.data.category || CATEGORIES[0],
          date: resData.data.date || new Date().toISOString().split("T")[0],
          notes: resData.data.notes || `Diproses via asisten AI dari: "${aiText}"`,
        });
      } else {
        setAiError(resData.error || "Gagal menguraikan teks pengeluaran.");
      }
    } catch (err) {
      console.error(err);
      setAiError("Terjadi kendala koneksi saat menghubungi asisten AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Add the previewed parsed transaction
  const handleAcceptPreview = () => {
    if (!parsedPreview) return;
    onAddTransaction(parsedPreview);
    
    // Clear states
    setParsedPreview(null);
    setAiText("");
  };

  // Helper template buttons for ease of use
  const aiTemplates = [
    "beli martabak manis keju 45k tadi malam",
    "bensin pertamax 50ribu kemaren sore",
    "shopee baju olahraga bro 185000 besok lusa",
    "bayar kosan 1.5jt tadi siang",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. Manual Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="manual-expense-card">
        <h3 className="font-sans font-bold text-base text-slate-800 uppercase tracking-tight mb-5 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-blue-600" />
          Pencatatan Transaksi Manual
        </h3>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Item Pengeluaran</label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
              placeholder="Contoh: Makan Siang Nasi Padang, Isi Bensin"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nominal (Rupiah)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-450 font-bold">Rp</span>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono text-slate-850 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal</label>
              <input
                type="date"
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-sans text-slate-850 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
              <select
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-sans text-slate-850 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Diskon gojek, urusan kantor, dsb."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs mt-6"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Tambahkan Pengeluaran
          </button>
        </form>
      </div>

      {/* 2. AI Smart Add Card */}
      <div className="bg-gradient-to-br from-blue-50/50 via-slate-50 to-white p-6 rounded-2xl border border-blue-105 shadow-sm flex flex-col justify-between" id="ai-smart-expense-card">
        <div>
          <h3 className="font-sans font-bold text-base text-blue-900 uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Input Cepat AI (Bicara Santai)
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Ketik pengeluaran Anda dengan kalimat santai Indonesia bebas. AI Gemini akan membedah nominal, nama makanan/barang, kategori, hingga tanggal secara otomatis!
          </p>

          <div className="mt-4">
            <textarea
              className="w-full h-24 p-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
              placeholder="Contoh: kemarin sore jajan bakso solo 25 ribu bareng temen m-banking..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAiParse();
                }
              }}
            />
          </div>

          {/* Quick Template Tips */}
          <div className="mt-3">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Coba Template Kalimat:</span>
            <div className="flex flex-wrap gap-1.55">
              {aiTemplates.map((tmpl) => (
                <button
                  key={tmpl}
                  type="button"
                  className="text-[11px] px-3 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-slate-650 hover:text-blue-700 rounded-lg transition-all cursor-pointer font-sans truncate max-w-full"
                  onClick={() => setAiText(tmpl)}
                >
                  "{tmpl}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action button & loading section */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          {isAiLoading ? (
            <div className="flex items-center justify-center py-2 text-blue-600 text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Memproses teks via AI Gemini...</span>
            </div>
          ) : parsedPreview ? (
            /* AI Preview Card block */
            <div className="bg-white p-4.5 rounded-xl border border-blue-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Hasil Analisis AI
                </span>
                <span className="text-[10px] font-mono text-slate-400">{parsedPreview.date}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Judul Item</span>
                  <span className="font-semibold text-slate-800">{parsedPreview.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nominal Uang</span>
                  <span className="font-mono font-bold text-blue-650">{formatRupiah(parsedPreview.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kategori Toko</span>
                  <span className="font-semibold text-slate-800">{parsedPreview.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Catatan Saku</span>
                  <span className="text-slate-600 truncate block text-[11px] italic" title={parsedPreview.notes}>
                    {parsedPreview.notes || "-"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer text-center"
                  onClick={() => setParsedPreview(null)}
                >
                  Ulangi Input
                </button>
                <button
                  type="button"
                  className="flex-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  onClick={handleAcceptPreview}
                >
                  <span>Simpan ke Tabungan</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              {aiError && (
                <p className="text-xs text-rose-600 font-medium mb-3 flex items-center gap-1">
                  ⚠️ {aiError}
                </p>
              )}
              <button
                type="button"
                disabled={!aiText.trim()}
                className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  aiText.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
                onClick={handleAiParse}
              >
                <Sparkles className="h-4 w-4" />
                Proses Pintar via AI Gemini
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
