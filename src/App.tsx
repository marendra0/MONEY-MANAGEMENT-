import { useState, useEffect, useMemo } from "react";
import {
  Transaction,
  ChatMessage,
  CATEGORIES,
  CATEGORY_LIGHT_COLORS,
  CATEGORY_COLORS,
  MONTH_NAMES,
} from "./types";
import { getInitialTransactions, formatDateIndo, formatRupiah } from "./utils";
import Dashboard from "./components/Dashboard";
import TransactionForm from "./components/TransactionForm";
import BudgetPlanner from "./components/BudgetPlanner";
import AdvisorChat from "./components/AdvisorChat";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Landmark,
  Sparkles,
  Filter,
  Search,
  Trash2,
  Edit2,
  X,
  Check,
  Calendar,
  AlertCircle,
  ArrowUpDown,
  TrendingDown,
  Info,
} from "lucide-react";

export default function App() {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth() + 1; // 1-12

  // --- CORE APP STATES (Synced to LocalStorage for persistence) ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("catatuang_transactions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return getInitialTransactions();
  });

  const [totalBudget, setTotalBudget] = useState<number>(() => {
    const saved = localStorage.getItem("catatuang_total_budget");
    return saved ? parseInt(saved, 10) : 5000000; // Default limit Rp5.000.000
  });

  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("catatuang_category_limits");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default allocations
    return {
      "Makanan & Minuman": 1500000,
      "Transportasi": 500000,
      "Belanja": 1000000,
      "Hobi & Hiburan": 500000,
      "Utilitas": 800000,
      "Kesehatan": 300000,
      "Pendidikan": 400000,
      "Lainnya": 0,
    };
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("catatuang_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: "greet-1",
        role: "assistant",
        content: `Halo Kak! Selamat datang di **CatatUang**. Saya **Kang Catat**, asisten keuangan pribadi Kakak. 

Saya siap menemani Kakak dalam mengelola pengeluaran bulanan agar saku aman terkendali. Berikut yang bisa Kakak lakukan:
*   📝 **Catat Transaksi**: Masukkan transaksi belanja secara manual atau pakai fitur **Input Cepat AI** (Bicara Santai) bertenaga Gemini.
*   📊 **Atur Anggaran**: Batasi pengeluaran bulanan dan kategorinya agar uang tidak cepat habis.
*   💬 **Konsultasikan Keuangan**: Tanyakan analisis dompet Kakak langsung di tab ini.

Bulan ini (${MONTH_NAMES[currentMonthIdx - 1]} ${currentYear}), sudahkah Kakak melacak jajan hari ini? 😉`,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  // --- NAVIGATION TAB STATE ---
  const [activeTab, setActiveTab] = useState<"dashboard" | "add" | "history" | "budget" | "advisor">("dashboard");

  // --- FILTER STATES ---
  const [filterMonth, setFilterMonth] = useState<number>(currentMonthIdx); // 0 representing "Semua Bulan"
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterCategory, setFilterCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Sort Order for Transactions list
  const [sortAsc, setSortAsc] = useState(false); // default latest dates first

  // --- EDITING TRANSACTION STATE ---
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- CUSTOM DIALOG CONFIRM STATE ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // --- LOCAL STORAGE EFFECTS ---
  useEffect(() => {
    localStorage.setItem("catatuang_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("catatuang_total_budget", totalBudget.toString());
  }, [totalBudget]);

  useEffect(() => {
    localStorage.setItem("catatuang_category_limits", JSON.stringify(categoryLimits));
  }, [categoryLimits]);

  useEffect(() => {
    localStorage.setItem("catatuang_chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // --- BUDGET UPDATE ACTIONS ---
  const handleUpdateTotalBudget = (amount: number) => {
    setTotalBudget(amount);
  };

  const handleUpdateCategoryLimit = (category: string, amount: number) => {
    setCategoryLimits((prev) => ({
      ...prev,
      [category]: amount,
    }));
  };

  // --- TRANSACTION CRUD ACTIONS ---
  const handleAddTransaction = (newTx: Omit<Transaction, "id">) => {
    const transactionWithId: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setTransactions((prev) => [transactionWithId, ...prev]);
    setActiveTab("history"); // Redirect user to history listing
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Catatan Pengeluaran",
      message: "Apakah Kakak yakin ingin menghapus catatan pengeluaran ini secara permanen?",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      onConfirm: () => {
        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setTransactions((prev) =>
      prev.map((tx) => (tx.id === editingTransaction.id ? editingTransaction : tx))
    );
    setEditingTransaction(null);
  };

  // --- ADVISOR CHAT ACTIONS ---
  const handleAddChatMessage = (newMsg: ChatMessage) => {
    setChatHistory((prev) => [...prev, newMsg]);
  };

  const handleClearHistory = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Bersihkan Riwayat Obrolan",
      message: "Ingin menghapus seluruh riwayat percakapan dengan asisten secara permanen?",
      confirmText: "Ya, Bersihkan",
      cancelText: "Batal",
      onConfirm: () => {
        setChatHistory([
          {
            id: `greet-${Date.now()}`,
            role: "assistant",
            content: "Riwayat obrolan telah dibersihkan. Bagaimana saya bisa membantu mengoptimalkan anggaran Kakak hari ini?",
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- DERIVED FILTERED TRANSACTIONS ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const txMonth = txDate.getMonth() + 1; // 1-12
      const txYear = txDate.getFullYear();

      // Check month filter
      if (filterMonth !== 0 && txMonth !== filterMonth) {
        return false;
      }
      // Check year filter
      if (txYear !== filterYear) {
        return false;
      }
      // Check category filter
      if (filterCategory !== "Semua" && tx.category !== filterCategory) {
        return false;
      }
      // Check search match (title or notes)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(query);
        const matchNotes = (tx.notes || "").toLowerCase().includes(query);
        if (!matchTitle && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filterMonth, filterYear, filterCategory, searchQuery]);

  // Sorted list of filtered transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
  }, [filteredTransactions, sortAsc]);

  // Aggregate stats over active filters
  const currentTotalExpense = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-805 font-sans antialiased scroll-smooth transition-all" id="root-container">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-6 md:px-8 py-4.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <span>Rp</span>
          </div>
          <div>
            <h1 className="font-sans font-bold text-xl uppercase tracking-tight text-slate-800 leading-none">
              CatatUang
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Asisten Monitor & Anggaran Cerdas</p>
          </div>
        </div>

        {/* Live brief current stats on header */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>{filterMonth === 0 ? "Semua Bulan" : MONTH_NAMES[filterMonth - 1]} {filterYear}</span>
          </div>
          <div className="h-3.5 w-px bg-slate-200" />
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Total Belanja:</span>
            <span className="text-rose-600 font-bold">{formatRupiah(currentTotalExpense)}</span>
          </div>
        </div>
      </header>

      {/* 2. Primary Layout Framework Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* UPPER ROW: Integrated Dropdowns & Filters panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4" id="filters-container-bar">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-500" /> Saring & Pencarian Transaksi
            </span>
            <span className="text-blue-600 cursor-pointer hover:underline normal-case font-semibold text-xs flex items-center gap-1" onClick={() => {
              setFilterMonth(currentMonthIdx);
              setFilterYear(currentYear);
              setFilterCategory("Semua");
              setSearchQuery("");
            }}>
              Reset Filter
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Filter Month */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Bulan</label>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-700 focus:outline-hidden bg-white"
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
              >
                <option value={0}>Semua Bulan (Tahun Aktif)</option>
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Year */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Tahun</label>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-700 focus:outline-hidden bg-white"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
              >
                <option value={currentYear - 1}>{currentYear - 1}</option>
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear + 1}>{currentYear + 1}</option>
              </select>
            </div>

            {/* Filter Category */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Kategori Belanja</label>
              <select
                className="px-3 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-700 focus:outline-hidden bg-white"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="Semua">Semua Kategori</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Search */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Cari Keterangan</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Ketik kata kunci obat, kopi..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-800 focus:outline-hidden font-sans placeholder-slate-450"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>

        {/* 3. Navigation Tabs buttons block */}
        <div className="flex border-b border-slate-250 overflow-x-auto gap-2 md:gap-4 no-scrollbar scroll-smooth" id="nav-tabs-bar">
          <button
            type="button"
            className={`px-4 py-3 font-sans font-semibold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "dashboard"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard className="h-4 w-4" />
            Ringkasan Keuangan
          </button>

          <button
            type="button"
            className={`px-4 py-3 font-sans font-semibold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "add"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setActiveTab("add")}
          >
            <PlusCircle className="h-4 w-4" />
            Catat Pengeluaran
            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-lg font-bold">AI</span>
          </button>

          <button
            type="button"
            className={`px-4 py-3 font-sans font-semibold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "history"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setActiveTab("history")}
          >
            <History className="h-4 w-4" />
            Riwayat Belanja ({filteredTransactions.length})
          </button>

          <button
            type="button"
            className={`px-4 py-3 font-sans font-semibold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "budget"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setActiveTab("budget")}
          >
            <Landmark className="h-4 w-4" />
            Atur Anggaran
          </button>

          <button
            type="button"
            className={`px-4 py-3 font-sans font-semibold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "advisor"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setActiveTab("advisor")}
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            Konsultasi AI
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping inline-block" />
          </button>
        </div>

        {/* 4. Tab Contents View */}
        <div className="mt-4" id="main-tabs-viewport-view">
          
          {/* TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <Dashboard transactions={filteredTransactions} totalBudget={totalBudget} />
          )}

          {/* TAB: ADD NEW EXEPENSE */}
          {activeTab === "add" && <TransactionForm onAddTransaction={handleAddTransaction} />}

          {/* TAB: TRANSACTIONS LIST HISTORY */}
          {activeTab === "history" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="expenses-history-list">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-800 uppercase tracking-tight">Riwayat Terperinci</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menampilkan total {filteredTransactions.length} transaksi di bawah filter aktif
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-xl text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer font-sans"
                    onClick={() => setSortAsc(!sortAsc)}
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-600" />
                    <span>Urutkan Tanggal: {sortAsc ? "Terdahulu" : "Terbaru"}</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              {sortedTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100 font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Tanggal</th>
                        <th className="px-6 py-4 font-semibold">Item Belanja</th>
                        <th className="px-6 py-4 font-semibold">Kategori</th>
                        <th className="px-6 py-4 font-semibold">Catatan Saku</th>
                        <th className="px-6 py-4 font-semibold text-right">Nominal</th>
                        <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-slate-500">
                            {formatDateIndo(tx.date)}
                          </td>
                          <td className="px-6 py-4 font-sans font-semibold text-slate-800">
                            {tx.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${CATEGORY_LIGHT_COLORS[tx.category] || "bg-slate-50 text-slate-600"}`}>
                              {tx.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-serif text-slate-500 truncate max-w-xs">
                            {tx.notes || "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                            - {formatRupiah(tx.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="inline-flex gap-2">
                              <button
                                type="button"
                                className="p-1 px-2 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-md transition-colors"
                                title="Ubah data"
                                onClick={() => setEditingTransaction({ ...tx })}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="p-1 px-2 border border-slate-205 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-md transition-colors"
                                title="Hapus transaksi"
                                onClick={() => handleDeleteTransaction(tx.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium">Belum ada transaksi ditemukan untuk filter ini.</p>
                  <p className="text-xs text-slate-300 mt-1">Coba sesuaikan filter pencarian atau rekam belanja baru!</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: BUDGET PLANNER */}
          {activeTab === "budget" && (
            <BudgetPlanner
              totalBudget={totalBudget}
              onUpdateTotalBudget={handleUpdateTotalBudget}
              categoryLimits={categoryLimits}
              onUpdateCategoryLimit={handleUpdateCategoryLimit}
              monthlyTransactions={filteredTransactions}
            />
          )}

          {/* TAB: ADVISOR CHAT */}
          {activeTab === "advisor" && (
            <AdvisorChat
              transactions={filteredTransactions}
              budgetLimit={totalBudget}
              activeFilters={{ month: filterMonth, year: filterYear }}
              chatHistory={chatHistory}
              onAddChatMessage={handleAddChatMessage}
              onClearChatHistory={handleClearHistory}
            />
          )}

        </div>

      </main>

      {/* 5. GORGEOUS INLINE EDITING MODAL (Pop up drawer layout) */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="edit-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-sans font-bold text-slate-800 text-sm md:text-base uppercase tracking-tight">Ubah Catatan Pengeluaran</h3>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                onClick={() => setEditingTransaction(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTransaction} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Nama Item</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                  value={editingTransaction.title}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-sm font-mono text-slate-750 focus:outline-hidden focus:border-blue-500"
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: Math.round(Number(e.target.value)) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-sm font-sans text-slate-750 focus:outline-hidden focus:border-blue-500"
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Kategori</label>
                <select
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg text-sm font-sans text-slate-755 focus:outline-hidden focus:border-blue-500 bg-white"
                  value={editingTransaction.category}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                  value={editingTransaction.notes || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer text-center"
                  onClick={() => setEditingTransaction(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SYSTEM-WIDE CUSTOM CONFIRMATION DIALOG MODAL (Iframe Safe) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="custom-confirm-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-bold text-slate-800 text-base">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            
            <div className="flex border-t border-slate-100 divide-x divide-slate-100">
              <button
                type="button"
                className="flex-1 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
              >
                {confirmDialog.cancelText || "Batal"}
              </button>
              <button
                type="button"
                className="flex-1 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText || "Ya, Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
