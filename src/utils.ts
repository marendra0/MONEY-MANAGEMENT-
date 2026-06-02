import { Transaction } from "./types";

// Helper to format currency into Indonesian Rupiah (Rp)
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Convert YYYY-MM-DD to Indonesian format e.g. "02 Juni 2026"
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  
  const MONTHS_INDO = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  return `${parseInt(day, 10)} ${MONTHS_INDO[monthIdx] || parts[1]} ${year}`;
}

// Generate starting transactions relative to current time
export function getInitialTransactions(): Transaction[] {
  const now = new Date();
  const currentYearStr = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevMonthYear = currentMonth === 1 ? currentYearStr - 1 : currentYearStr;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return [
    {
      id: "t1",
      title: "Kopi Susu Gula Aren",
      amount: 28000,
      category: "Makanan & Minuman",
      date: `${currentYearStr}-${pad(currentMonth)}-02`,
      notes: "Beli di kedai kopi favorit dekat kantor",
    },
    {
      id: "t2",
      title: "Masi Padang Lauk Rendang",
      amount: 35000,
      category: "Makanan & Minuman",
      date: `${currentYearStr}-${pad(currentMonth)}-01`,
      notes: "Makan siang hari pertama bulan ini",
    },
    {
      id: "t3",
      title: "Isi Bensin Pertamax",
      amount: 60000,
      category: "Transportasi",
      date: `${prevMonthYear}-${pad(prevMonth)}-28`,
      notes: "Bensin untuk seminggu",
    },
    {
      id: "t4",
      title: "Uang Bulanan Belanja Mingguan",
      amount: 345000,
      category: "Belanja",
      date: `${prevMonthYear}-${pad(prevMonth)}-26`,
      notes: "Beli bahan pokok di Supermarket",
    },
    {
      id: "t5",
      title: "Langganan Netflix Bulanan",
      amount: 186000,
      category: "Hobi & Hiburan",
      date: `${prevMonthYear}-${pad(prevMonth)}-24`,
      notes: "Sewa hiburan keluarga otomatis terpotong debit",
    },
    {
      id: "t6",
      title: "Token Listrik PLN Rumah",
      amount: 250000,
      category: "Utilitas",
      date: `${prevMonthYear}-${pad(prevMonth)}-20`,
      notes: "Listrik rumah bulanan",
    },
    {
      id: "t7",
      title: "Beli Obat Flu & Parasetamol",
      amount: 45000,
      category: "Kesehatan",
      date: `${prevMonthYear}-${pad(prevMonth)}-15`,
      notes: "Beli di apotek Kimia Farma",
    },
    {
      id: "t8",
      title: "Buku Belajar Manajemen Keuangan",
      amount: 120000,
      category: "Pendidikan",
      date: `${prevMonthYear}-${pad(prevMonth)}-10`,
      notes: "Membaca buku investasi cerdas",
    },
    {
      id: "t9",
      title: "Isi Paket Data Internet",
      amount: 150000,
      category: "Utilitas",
      date: `${prevMonthYear}-${pad(prevMonth)}-05`,
      notes: "Kuota internet seluler bulanan",
    }
  ];
}
