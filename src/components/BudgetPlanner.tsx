import React, { useState, useMemo } from "react";
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_LIGHT_COLORS } from "../types";
import { formatRupiah } from "../utils";
import { Wallet, Settings, ShieldAlert, Check, Plus, Minus } from "lucide-react";

interface BudgetPlannerProps {
  totalBudget: number;
  onUpdateTotalBudget: (amount: number) => void;
  categoryLimits: Record<string, number>;
  onUpdateCategoryLimit: (category: string, amount: number) => void;
  monthlyTransactions: any[]; // Already filtered by active month and year
}

export default function BudgetPlanner({
  totalBudget,
  onUpdateTotalBudget,
  categoryLimits,
  onUpdateCategoryLimit,
  monthlyTransactions,
}: BudgetPlannerProps) {
  const [editingBase, setEditingBase] = useState(false);
  const [tempBaseBudget, setTempBaseBudget] = useState(totalBudget.toString());

  // Calculate actual spending per category for this month
  const categorySpendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      map[cat] = 0;
    });
    monthlyTransactions.forEach((t) => {
      if (map[t.category] !== undefined) {
        map[t.category] += t.amount;
      } else {
        map[t.category] = t.amount;
      }
    });
    return map;
  }, [monthlyTransactions]);

  // Aggregate category limit amounts
  const totalAllocated = useMemo(() => {
    return Object.values(categoryLimits).reduce((sum, val) => sum + val, 0);
  }, [categoryLimits]);

  // Handle total budget update
  const handleSaveBaseBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(tempBaseBudget, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateTotalBudget(val);
      setEditingBase(false);
    }
  };

  // Adjust category budget limit
  const handleCategoryLimitChange = (cat: string, valueStr: string) => {
    const val = parseInt(valueStr, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateCategoryLimit(cat, val);
    } else if (valueStr === "") {
      onUpdateCategoryLimit(cat, 0);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Base Budget configuration layout */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-6" id="base-budget-card">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-blue-400" /> Batas Anggaran Utama Bulanan
          </span>
          {editingBase ? (
            <form onSubmit={handleSaveBaseBudget} className="flex items-center gap-2 mt-2">
              <span className="text-xl font-mono font-bold text-white">Rp</span>
              <input
                type="number"
                className="bg-slate-950 border border-slate-750 text-white font-mono font-bold text-xl px-2.5 py-1.5 rounded-lg w-44 focus:outline-hidden focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                value={tempBaseBudget}
                onChange={(e) => setTempBaseBudget(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold flex items-center justify-center cursor-pointer"
              >
                <Check className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-mono text-3xl font-bold tracking-tight text-white mb-1.5">
                {formatRupiah(totalBudget)}
              </h2>
              <button
                type="button"
                className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 cursor-pointer text-slate-100 flex items-center gap-1 font-sans font-semibold transition-colors"
                onClick={() => {
                  setTempBaseBudget(totalBudget.toString());
                  setEditingBase(true);
                }}
              >
                <Settings className="h-3 w-3" /> Ubah Limit
              </button>
            </div>
          )}
          <p className="text-xs text-slate-400">
            *Ini adalah batas alokasi pengeluaran total Anda sebelum saku dinyatakan defisit.
          </p>
        </div>

        {/* Info stats widgets */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-800 md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-sm">
          <div>
            <span className="text-slate-400 block text-xs font-semibold">Total Alokasi Kategori</span>
            <span className="font-mono font-bold text-base md:text-lg">
              {formatRupiah(totalAllocated)}
            </span>
            <span className="text-[10px] text-blue-300 block font-medium">
              {totalBudget > 0 ? `${((totalAllocated / totalBudget) * 100).toFixed(0)}%` : "0%"} dari batas utama
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs font-semibold">Uang Belum Dialokasikan</span>
            <span className={`font-mono font-bold text-base md:text-lg ${totalBudget - totalAllocated < 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {formatRupiah(totalBudget - totalAllocated)}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">Sisa dana cadangan</span>
          </div>
        </div>
      </div>

      {/* 2. Categorywise Limits Grid list */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-3xs">
          <h3 className="font-sans font-bold text-sm md:text-base text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Settings className="h-4.5 w-4.5 text-blue-600" /> Batas Alokasi Anggaran per Kategori
          </h3>
          <span className="text-xs text-slate-500 font-sans font-medium">Ubah limit per kategori di bawah</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="category-budgets-grid">
          {CATEGORIES.map((cat) => {
            const limit = categoryLimits[cat] || 0;
            const spent = categorySpendingMap[cat] || 0;
            const remaining = limit - spent;
            const usagePercent = limit > 0 ? (spent / limit) * 100 : 0;
            const themeColor = CATEGORY_COLORS[cat];
            const badgeClasses = CATEGORY_LIGHT_COLORS[cat];

            return (
              <div
                key={cat}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${badgeClasses}`}>
                      {cat}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Limit:</span>
                      <div className="relative flex items-center">
                        <span className="text-xs text-slate-400 font-mono absolute left-2 font-semibold">Rp</span>
                        <input
                          type="number"
                          className="w-28 pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-right focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50"
                          value={limit === 0 ? "" : limit}
                          onChange={(e) => handleCategoryLimitChange(cat, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meter graph values */}
                  <div className="flex justify-between items-baseline text-xs font-semibold mb-1.5">
                    <span className="text-slate-450 uppercase text-[10px] tracking-wider">Realisasi Belanja</span>
                    <span className={remaining < 0 ? "text-rose-600 font-bold font-mono text-xs md:text-sm" : "text-slate-700 font-mono"}>
                      {formatRupiah(spent)} / {limit > 0 ? formatRupiah(limit) : "Belum diatur"}
                    </span>
                  </div>

                  {/* Horizontal visual progress meter */}
                  {limit > 0 ? (
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, usagePercent)}%`,
                          backgroundColor: usagePercent > 100 ? "#EF4444" : usagePercent > 80 ? "#F59E0B" : themeColor,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-dashed border border-slate-200 rounded-lg py-2.5 text-center text-[10px] text-slate-400 mb-3 font-semibold">
                      Batas pengeluaran belum dialokasikan untuk kategori ini.
                    </div>
                  )}
                </div>

                {/* Foot indicators for safety limit */}
                {limit > 0 && (
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 mt-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Budget</span>
                    {remaining < 0 ? (
                      <span className="text-rose-600 font-bold text-xs flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4" /> Defisit {formatRupiah(Math.abs(remaining))}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1.5">
                        Aman {formatRupiah(remaining)} ({Math.round(100 - usagePercent)}% sisa)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
