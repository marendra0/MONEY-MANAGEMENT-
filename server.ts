import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing json and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lazy initializer for Google Gen AI client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Peringatan: GEMINI_API_KEY tidak ditemukan di environment. Fitur bertenaga AI mungkin mengalami kegagalan.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Global available list of categories for fallback
const CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hobi & Hiburan",
  "Utilitas",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

// 1. API: Parse Expense with Indonesian Natural Language Processing
app.post("/api/ai/parse-expense", async (req, res) => {
  try {
    const { text, referenceDate } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Input teks tidak boleh kosong" });
    }

    const refDate = referenceDate || new Date().toISOString().split("T")[0];
    const apiKey = process.env.GEMINI_API_KEY;

    // Fast fallback offline parsing if API Key is not set or mock
    if (!apiKey) {
      return res.json({
        success: true,
        data: fallbackLocalParse(text, refDate),
        source: "local-fallback",
      });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Catat transaksi keuangan dari teks berikut: "${text}".
Tanggal referensi hari ini adalah: ${refDate}. 
Tafsirkan sapaan penanggalan secara relatif (misal: "kemarin" adalah H-1, "2 hari lalu" H-2, "bulan lalu" H-30).`,
      config: {
        systemInstruction: `Anda adalah asisten keuangan yang menerjemahkan teks bebas bahasa Indonesia menjadi objek data pengeluaran terstruktur.
Kategori yang diperbolehkan hanya: 'Makanan & Minuman', 'Transportasi', 'Belanja', 'Hobi & Hiburan', 'Utilitas', 'Kesehatan', 'Pendidikan', 'Lainnya'.
Analisis teks tersebut untuk mengekstrak detail pengeluaran. Isi 'notes' untuk info tambahan yang relevan. Jika ada unsur tanggal, hitung secara logis berdasarkan tanggal referensi hari ini (format YYYY-MM-DD). Rentang harga nominal yang disingkat seperti 'k' atau 'ribu' wajib dibaca contoh '50k' -> 50000, 'cepek' -> 100000.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "amount", "category", "date"],
          properties: {
            title: {
              type: Type.STRING,
              description: "Nama barang atau aktivitas pengeluaran, diawali huruf kapital. Contoh: 'Kopi Susu Es', 'Ganti Oli Motor', 'Beli Kemeja Kerja'.",
            },
            amount: {
              type: Type.INTEGER,
              description: "Jumlah uang yang dikeluarkan dalam Rupiah sebagai integer bulat positif. Contoh: 25000.",
            },
            category: {
              type: Type.STRING,
              description: "Kategori pengeluaran. Harus salah satu dari: 'Makanan & Minuman', 'Transportasi', 'Belanja', 'Hobi & Hiburan', 'Utilitas', 'Kesehatan', 'Pendidikan', 'Lainnya'.",
            },
            date: {
              type: Type.STRING,
              description: "Tanggal pengeluaran dalam format YYYY-MM-DD secara akurat dihitung dari harinya relatif terhadap tanggal referensi yang diberikan.",
            },
            notes: {
              type: Type.STRING,
              description: "Catatan atau keterangan bebas tambahan jika ada, jika tidak kosongkan.",
            },
          },
        },
      },
    });

    const parsedText = response.text?.trim() || "{}";
    const data = JSON.parse(parsedText);

    return res.json({
      success: true,
      data,
      source: "gemini-ai",
    });
  } catch (error: any) {
    console.error("Gagal melakukan pencatatan pintar via AI:", error);
    // Fallback safely to prevent app crash
    return res.json({
      success: true,
      data: fallbackLocalParse(req.body.text || "", req.body.referenceDate || new Date().toISOString().split("T")[0]),
      source: "local-fallback",
      warning: "Format tidak didukung atau terjadi kegagalan server AI, beralih ke pencatatan cerdas lokal.",
    });
  }
});

// 2. API: Financial Advisor chat and analyst
app.post("/api/ai/financial-advisor", async (req, res) => {
  try {
    const { history, currentExpenses, budgetLimit, activeFilters } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const expensesSummary = summarizeExpenses(currentExpenses || []);
    const filterInfo = activeFilters ? `Bulan: ${activeFilters.month}, Tahun: ${activeFilters.year}` : "Bulan ini";

    const promptText = `Limit Anggaran saat ini: Rp${budgetLimit || 0}.
Detail filter aktif: ${filterInfo}.
Statistik pengeluaran pengguna saat ini:
- Total Pengeluaran: Rp${expensesSummary.total}
- Kategori dengan Biaya Terbesar: ${expensesSummary.highestCategory} (Rp${expensesSummary.highestAmount})
- Riwayat Transaksi: ${JSON.stringify(currentExpenses || [])}

Pesanan/Pesan Pengguna baru: "${history[history.length - 1]?.content || "Tolong beri analisis pengeluaran saya."}"`;

    if (!apiKey) {
      return res.json({
        success: true,
        reply: getMockAdvisorReply(expensesSummary, budgetLimit),
        source: "local-mock",
      });
    }

    const ai = getGeminiClient();

    // Map high level conversation structure
    const systemPrompt = `Anda adalah "Kang Catat", penasihat keuangan dan asisten saku pribadi yang asyik, komunikatif, dan sangat peduli terhadap kesehatan dompet pengguna.
Anda berbicara dalam bahasa Indonesia yang santai tapi profesional, informatif, dan menyemangati (gunakan istilah lokal yang sopan seperti Kak, Bro, Anda, dll jika cocok).
Berikan analisis mendalam berdasarkan data pengeluaran yang diberikan:
1. Hitung rasio total pengeluaran terhadap limit anggaran pengguna. Berikan evaluasi (hemat, waspada, atau kritis).
2. Temukan anomali atau kategori boros (misalnya terlalu sering jajan kopi/kuliner atau belanja hobi).
3. Berikan saran taktis konkrit yang realistis untuk memotong pengeluaran agar tetap hemat.
4. Jawab pertanyaan spesifik dari user dengan cermat dan ramah.
Gunakan markdown indah dengan daftar bullet, tabel yang tepat, atau teks cetak tebal untuk poin penting. Gunakan emoji yang ramah keuangan seperti 💸, 💰, 📉, 🎯, atau 👍 secara bijaksana.`;

    // Process user chat conversation directly with generateContent
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Mohon maaf Kak, terjadi kendala saat menganalisis anggaran Anda. Coba lagi beberapa saat lagi ya!";
    return res.json({
      success: true,
      reply,
      source: "gemini-ai",
    });
  } catch (error: any) {
    console.error("Gagal berkonsultasi dengan asisten keuangan AI:", error);
    return res.json({
      success: true,
      reply: "Maaf Kak, asisten keuangan AI sedang beristirahat sebentar. Berikut saran otomatis:\n\n*   **Evaluasi Anggaran**: Pastikan total belanja tidak melewati limit bulanan Anda!\n*   **Prioritas**: Coba saring kembali belanja kebutuhan esensial dan kurangi pengeluaran hobi/belanja implusif.\n*   **Saran**: Simpan sisa uang bulanan di tabungan darurat.",
      source: "local-fallback",
    });
  }
});

// Helper function to synthesize summaries
interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

function summarizeExpenses(expenses: Expense[]) {
  let total = 0;
  const categoryMap: Record<string, number> = {};

  for (const exp of expenses) {
    total += exp.amount;
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  }

  let highestCategory = "Belum Ada";
  let highestAmount = 0;

  for (const cat in categoryMap) {
    if (categoryMap[cat] > highestAmount) {
      highestAmount = categoryMap[cat];
      highestCategory = cat;
    }
  }

  return { total, highestCategory, highestAmount, categoryMap };
}

// Local regex parser when offline/no API key detected
function fallbackLocalParse(text: string, refDate: string): Partial<Expense> {
  const clean = text.toLowerCase();
  let amount = 0;

  // Try extracting number
  const matchK = clean.match(/(\d+)\s*k\b/);
  const matchRibu = clean.match(/(\d+)\s*ribu\b/);
  const matchDigits = clean.match(/\b(\d+[\d\.,]*)\b/);

  if (matchK) {
    amount = parseInt(matchK[1], 10) * 1000;
  } else if (matchRibu) {
    amount = parseInt(matchRibu[1], 10) * 1000;
  } else if (matchDigits) {
    const rawNum = matchDigits[1].replace(/[\.,]/g, "");
    const parsedNum = parseInt(rawNum, 10);
    if (!isNaN(parsedNum) && parsedNum > 100) {
      amount = parsedNum;
    }
  }

  // Try finding category
  let category = "Lainnya";
  if (clean.includes("makan") || clean.includes("minum") || clean.includes("kopi") || clean.includes("cafe") || clean.includes("bakso") || clean.includes("nasi")) {
    category = "Makanan & Minuman";
  } else if (clean.includes("bensin") || clean.includes("gojek") || clean.includes("grab") || clean.includes("parkir") || clean.includes("oli") || clean.includes("bus")) {
    category = "Transportasi";
  } else if (clean.includes("belanja") || clean.includes("baju") || clean.includes("sepatu") || clean.includes("online") || clean.includes("shopee") || clean.includes("tokopedia")) {
    category = "Belanja";
  } else if (clean.includes("nonton") || clean.includes("game") || clean.includes("bioskop") || clean.includes("liburan") || clean.includes("hobi")) {
    category = "Hobi & Hiburan";
  } else if (clean.includes("listrik") || clean.includes("air") || clean.includes("wifi") || clean.includes("pulsa") || clean.includes("paket data") || clean.includes("kos")) {
    category = "Utilitas";
  } else if (clean.includes("obat") || clean.includes("dokter") || clean.includes("sakit") || clean.includes("klinik") || clean.includes("vitamin")) {
    category = "Kesehatan";
  } else if (clean.includes("buku") || clean.includes("kursus") || clean.includes("kuliah") || clean.includes("sekolah") || clean.includes("spp")) {
    category = "Pendidikan";
  }

  // Try parsing date relatively
  let transactionDate = refDate;
  if (clean.includes("kemarin")) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - 1);
    transactionDate = d.toISOString().split("T")[0];
  } else if (clean.includes("lusa") || clean.includes("2 hari lalu")) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - 2);
    transactionDate = d.toISOString().split("T")[0];
  }

  // Title extraction (take first few words, omitting amount cues)
  let title = "Pengeluaran Manual";
  const words = text.split(/\s+/).filter(w => {
    const wl = w.toLowerCase();
    return !wl.match(/\d+/) && !["ribu", "k", "kemarin", "lusa", "beli", "bayar", "untuk"].includes(wl);
  });
  if (words.length > 0) {
    title = words.slice(0, 3).join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else {
    title = "Belanja " + category;
  }

  return {
    title,
    amount: amount || 15000,
    category,
    date: transactionDate,
    notes: `Pencatatan lokal dari teks: "${text}"`,
  };
}

function getMockAdvisorReply(summary: any, budget: number) {
  const percentage = budget > 0 ? (summary.total / budget) * 100 : 0;
  let status = "Hemat dan aman! Mantap dompetmu tebal.";
  if (percentage > 90) {
    status = "🚨 KRITIS! Dompetmu sedang mogok dan terengah-engah. Segera gembok kartumu!";
  } else if (percentage > 70) {
    status = "⚠️ WASPADA! Pengeluaranmu sudah mendekati limit. Rem dulu kegiatan jajanmu ya.";
  }

  return `### 🪙 Analisis Dashboard Keuangan oleh Kang Catat (Lokal)

Halo Kak! Berikut adalah rangkuman dari pengeluaran Anda saat ini:

*   **Total Belanja**: Rp${summary.total.toLocaleString("id-ID")}
*   **Limit Anggaran**: Rp${budget.toLocaleString("id-ID")} (Telah terpakai **${percentage.toFixed(1)}%**)
*   **Status Keuangan**: **${status}**

#### 📊 Kategori Terbesar
Sejauh ini, porsi pengeluaran paling dominan dihabiskan pada kategori **${summary.highestCategory}** sebesar **Rp${summary.highestAmount.toLocaleString("id-ID")}**.

#### 💡 Rekomendasi Pintar Dompet Sehat:
1.  **Grup Belanja No-Buy**: Coba tentukan beberapa hari beruntun tanpa pengeluaran non-esensial sama sekali.
2.  **Lacak Uang Kecil**: Seringkali pengeluaran kecil seperti parkir, bensin, jajanan ringan, atau biaya admin bank justru menumpuk jadi bukit. Tetap catat ya!
3.  **Buat Saku Anggaran**: Alokasikan budget pengeluaran harian statis (misal Rp50.000/hari) agar pengeluaran huni bulanan Anda tertata rapi.`;
}

// Vite integration middleware
async function startServer() {
  // Integrate Vite for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static compiled output in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Keuangan berjalan di port http://localhost:${PORT}`);
  });
}

startServer();
