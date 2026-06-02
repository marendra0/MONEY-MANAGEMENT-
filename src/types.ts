export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  notes?: string;
}

export interface CategoryBudget {
  category: string;
  limitAmount: number;
}

export interface MonthlyBudget {
  month: number; // 1 - 12
  year: number;
  totalLimit: number;
  categoryLimits: Record<string, number>; // Map: Category -> Limit Rupiah
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ActiveFilters {
  month: number; // 0 for All, otherwise 1 - 12
  year: number; // e.g. 2026
  category: string; // "Semua" or Category Name
  searchQuery: string;
}

export const CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hobi & Hiburan",
  "Utilitas",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Makanan & Minuman": "#F59E0B", // Amber
  "Transportasi": "#3B82F6", // Blue
  "Belanja": "#EC4899", // Pink
  "Hobi & Hiburan": "#8B5CF6", // Purple
  "Utilitas": "#10B981", // Emerald
  "Kesehatan": "#EF4444", // Red
  "Pendidikan": "#06B6D4", // Cyan
  "Lainnya": "#6B7280", // Gray
};

export const CATEGORY_LIGHT_COLORS: Record<string, string> = {
  "Makanan & Minuman": "bg-amber-50 text-amber-700 border-amber-200",
  "Transportasi": "bg-blue-50 text-blue-700 border-blue-200",
  "Belanja": "bg-pink-50 text-pink-700 border-pink-200",
  "Hobi & Hiburan": "bg-purple-50 text-purple-700 border-purple-200",
  "Utilitas": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Kesehatan": "bg-red-50 text-red-700 border-red-200",
  "Pendidikan": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Lainnya": "bg-slate-50 text-slate-700 border-slate-200",
};

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
