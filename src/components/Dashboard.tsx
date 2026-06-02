import React, { useMemo } from "react";
import { Transaction, CATEGORY_COLORS } from "../types";
import { formatRupiah } from "../utils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, Wallet, AlertTriangle, CheckCircle2, Flame, Award } from "lucide-react";

interface DashboardProps {
  transactions: Transaction[];
  totalBudget: number;
}

export default function Dashboard({ transactions, totalBudget }: DashboardProps) {
  // 1. Calculate general numbers
  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, item) => sum + item.amount, 0);
  }, [transactions]);

  const budgetUsagePercent = useMemo(() => {
    if (totalBudget <= 0) return 0;
    return (totalSpent / totalBudget) * 100;
  }, [totalSpent, totalBudget]);

  const remainingBudget = totalBudget - totalSpent;

  // Calculate daily average
  const dailyAverage = useMemo(() => {
    if (transactions.length === 0) return 0;
    // Find unique dates or default to 30 days
    const uniqueDates = new Set(transactions.map((t) => t.date));
    const divisor = Math.max(1, uniqueDates.size);
    return Math.round(totalSpent / divisor);
  }, [transactions, totalSpent]);

  // Group by category for Pie Chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

    return Object.keys(map).map((cat) => ({
      name: cat,
      value: map[cat],
      color: CATEGORY_COLORS[cat] || "#6B7280",
    }));
  }, [transactions]);

  // Group by date for Trend Area Chart
  const dailyTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      // Get short date e.g. "DD" or "MM-DD"
      const shortDate = t.date.substring(5); // e.g. "06-02"
      map[shortDate] = (map[shortDate] || 0) + t.amount;
    });

    return Object.keys(map)
      .sort()
      .map((date) => ({
        date,
        "Jumlah (Rp)": map[date],
      }));
  }, [transactions]);

  // Determine pocket status humorous messages and card styling
  const statusConfig = useMemo(() => {
    if (totalBudget === 0) {
      return {
        text: "Belum menentukan limit anggaran bulanan. Atur di tab 'Atur Anggaran'!",
        color: "bg-slate-50 border-slate-200 text-slate-700",
        icon: <Wallet className="h-5 w-5 text-slate-500" />,
      };
    }
    if (budgetUsagePercent === 0) {
      return {
        text: "Saku kosong raya! Belum ada pengeluaran tercatat bulan ini. Berhematlah!",
        color: "bg-teal-50 border-teal-200 text-teal-800",
        icon: <CheckCircle2 className="h-5 w-5 text-teal-500" />,
      };
    }
    if (budgetUsagePercent < 50) {
      return {
        text: "🟢 Saku Aman Jaya! Isi dompet tebal, masih leluasa buat jajan kopi susu.",
        color: "bg-emerald-50 border-emerald-200 text-emerald-800",
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      };
    }
    if (budgetUsagePercent <= 85) {
      return {
        text: "🟡 Hati-hati Kak! Rem jajan dikit ya biar m-banking gak minta ampun duluan.",
        color: "bg-amber-50 border-amber-200 text-amber-800",
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      };
    }
    if (budgetUsagePercent <= 100) {
      return {
        text: "🟠 Siaga Satu! Anggaran kritis, sisa sedikit lagi jebol totalll.",
        color: "bg-orange-50 border-orange-200 text-orange-800",
        icon: <Flame className="h-5 w-5 text-orange-600" />,
      };
    }
    return {
      text: "🔴 POSISI CRITICAL! Anggaran jebol parah! Gembok kartu sekarang juga!",
      color: "bg-rose-50 border-rose-200 text-rose-800 animate-pulse",
      icon: <Flame className="h-5 w-5 text-rose-600" />,
    };
  }, [budgetUsagePercent, totalBudget]);

  // Find highest category
  const highestCategoryObj = useMemo(() => {
    if (categoryChartData.length === 0) return { name: "-", value: 0 };
    return [...categoryChartData].sort((a, b) => b.value - a.value)[0];
  }, [categoryChartData]);

  // Format tooltip rupiah
  const customTooltipFormatter = (value: any) => {
    return [formatRupiah(Number(value)), "Total"];
  };

  return (
    <div className="space-y-6">
      {/* 1. Interactive Warning / Success Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-2xs transition-all ${statusConfig.color}`} id="saku-status-banner">
        <div className="mt-0.5">{statusConfig.icon}</div>
        <div>
          <h4 className="font-display font-medium text-sm md:text-base">Status Saku Keuangan</h4>
          <p className="text-xs md:text-sm opacity-90 mt-0.5 leading-relaxed">{statusConfig.text}</p>
        </div>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Total Spent */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between" id="kpi-total-spent">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pengeluaran</span>
            <h3 className="font-mono text-2xl font-bold text-slate-800 mt-2">
              {formatRupiah(totalSpent)}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-5">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Dari <strong>{transactions.length}</strong> transaksi</span>
          </div>
        </div>

        {/* KPI: Remaining Budget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between" id="kpi-remaining">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sisa Anggaran Saku</span>
            <h3 className={`font-mono text-xl md:text-2xl font-bold mt-2 ${remainingBudget < 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {formatRupiah(remainingBudget)}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-5">
            <Wallet className="h-4 w-4 text-blue-600" />
            <span>Batas: {formatRupiah(totalBudget)}</span>
          </div>
        </div>

        {/* KPI: Daily Avg */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between" id="kpi-daily-avg">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rerata Pengeluaran Harian</span>
            <h3 className="font-mono text-2xl font-bold text-slate-800 mt-2">
              {formatRupiah(dailyAverage)}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-5">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Pemberatan di hari belanja</span>
          </div>
        </div>

        {/* KPI: Highest Expense Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between" id="kpi-highest-cat">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori Pengeluaran Terbesar</span>
            <h3 className="font-sans text-base md:text-lg font-bold text-slate-800 mt-2 truncate">
              {highestCategoryObj.name}
            </h3>
            <p className="font-mono text-sm font-semibold text-slate-500 mt-1">
              {highestCategoryObj.value > 0 ? formatRupiah(highestCategoryObj.value) : "Rp0"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: highestCategoryObj.value > 0 ? CATEGORY_COLORS[highestCategoryObj.name] : "#cbd5e1" }} />
            <span>Bobot dompet terberat</span>
          </div>
        </div>
      </div>

      {/* 3. Budget Meter / Usage Progress Bar */}
      {totalBudget > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="budget-progress-section">
          <div className="flex justify-between items-center text-xs md:text-sm font-semibold mb-2.5">
            <span className="text-slate-600">Pemakaian Anggaran Bulanan</span>
            <span className={budgetUsagePercent > 100 ? "text-rose-600 font-bold" : budgetUsagePercent > 80 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
              {budgetUsagePercent.toFixed(1)}% ({formatRupiah(totalSpent)} / {formatRupiah(totalBudget)})
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsagePercent > 100 ? "bg-rose-500" : budgetUsagePercent > 80 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* 4. Visual Graphs Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (Pie Chart) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col" id="chart-category-card">
          <h3 className="font-sans font-bold text-base text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
            Alokasi Berdasarkan Kategori
          </h3>
          <div className="h-64 flex-1 flex items-center justify-center relative">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={customTooltipFormatter} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-sm">Belum ada data pengeluaran untuk bagan alokasi.</div>
            )}
            
            {categoryChartData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Terpakai</span>
                <span className="font-sans text-sm md:text-base font-extrabold text-slate-800">
                  {Math.round(budgetUsagePercent)}%
                </span>
              </div>
            )}
          </div>

          {/* Custom Legends list */}
          {categoryChartData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              {categoryChartData.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-600 font-medium truncate">{c.name}</span>
                  <span className="font-mono text-slate-400 ml-auto font-medium">({Math.round((c.value / totalSpent) * 100)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Spending Trend (Area Chart) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col" id="chart-trend-card">
          <h3 className="font-sans font-bold text-base text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
            Tren Pengeluaran Harian
          </h3>
          <div className="h-64 flex-1">
            {dailyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tickLine={false} tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip formatter={customTooltipFormatter} />
                  <Area type="monotone" dataKey="Jumlah (Rp)" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpent)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Belum ada data transaksi harian terdaftar.
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-400">
              *Bagan menampilkan gabungan transaksi per tanggal berurutan dalam periode filter aktif.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
