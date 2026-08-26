# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Nama Produk: MaventHub
**Versi Dokumen:** 1.0 (Final)  
**Fokus:** Platform Eksplorasi & Uji Coba Model AI Open-Source (Hugging Face Ecosystem)

---

## 1. Ringkasan Produk (Product Overview)
MaventHub adalah platform web yang dirancang untuk menjelajahi, mengklasifikasikan, dan menguji coba model AI *open-source* serta dataset dari Hugging Face. Desainnya menerapkan prinsip "Anti AI-Slop" (tidak generik, tanpa gradien murahan, fokus pada tipografi editorial brutalisme halus dan asimetris). Aplikasi dipisahkan menjadi dua area utama: **Landing Page** (edukasi & visual) dan **Hub Page** (fungsionalitas pencarian & *playground*).

---

## 2. Tech Stack & Arsitektur
- **Framework:** Next.js (App Router) + TypeScript
- **Styling & UI:** Tailwind CSS, Shadcn UI (fungsional), React Bits (animasi *marquee*/*interaktif*)
- **Animasi & 3D:** GSAP (*preloader*, *scroll trigger*), React Three Fiber / Three.js (*hero section*)
- **Fonts:** *Instrument Serif* (Display/Headlines) & *Roboto* (Body/UI/Labels)
- **Data Fetching:** MCP (Model Context Protocol) untuk *fetching* *real-time* dari Hugging Face API.

---

## 3. Design System & Aturan "Anti AI-Slop" (Skill Impeccable)
- **Palet Warna (STRICT):**
  - **Background Utama:** Midnight Blue (`#1E223D`)
  - **Aksen/Penyorot (Tombol, Border, Highlight):** Exotic Orange (`#F54F1B`)
  - **Teks Utama:** Putih (`#FFFFFF`)
  - **Teks Sekunder:** Abu-abu halus (`#E0E0E0`)
  - **LARANGAN:** DILARANG KERAS menggunakan gradien (*linear/radial*). Semua warna harus *solid/flat*.
- **Tipografi:**
  - *Instrument Serif*: Digunakan untuk H1, H2, angka besar, dan kutipan. Bisa di-mix antara *italic* dan *regular* dalam satu kalimat.
  - *Roboto*: Digunakan untuk paragraf, label navigasi, tombol (huruf besar, *letter-spacing* lebar/*tracked-out*).
- **Layout:** Asimetris, *whitespace* yang luas (*breatheable*), *grid* editorial (bukan kartu kotak standar yang berjejer rapi).

---

## 4. Arsitektur Halaman & User Flow
- `/` (Landing Page): Halaman publik berisi 9 section visual & informasi. Terdapat CTA menuju Hub.
- `/hub` (Hub Page): Halaman kerja. Berisi *search engine*, *filter* klasifikasi, dan *list* model/dataset.
- `/hub/model/[id]` (Model Detail & Playground): Halaman detail spesifik model yang berisi metadata dan UI *Inference* (Playground).

---

## 5. Spesifikasi Landing Page (/) - Min 9 Section
Halaman ini fokus pada visualisasi, tidak ada pencarian kompleks di sini.
1. **Preloader Screen:** Layer hitam pekat. Angka 00-100% (*Instrument Serif* raksasa). GSAP menghapus layer ini (*slide-up & fade-out*) saat proses *load* selesai.
2. **Hero Section:** Background R3F (Three.js) berupa geometri *wireframe* Exotic Orange bergerak lambat di atas Midnight Blue. Judul asimetris raksasa: "Explore the Open Source AI Frontier" (*Instrument Serif*). Tombol "Enter Hub" (Solid Exotic Orange).
3. **Manifesto & Stats:** Section minimalis. Teks paragraf besar (*Roboto*) di kiri, angka *stats* (*Instrument Serif*) di kanan (e.g., "500k+ Models", "100k+ Datasets").
4. **What is MaventHub?:** Penjelasan 3 pilar utama (Eksplorasi, Klasifikasi, Uji Coba) menggunakan layout editorial asimetris. Tidak ada ikon generik, gunakan tipografi angka (01, 02, 03) sebagai *bullet points*.
5. **Trending Models Preview (Marquee):** Teks berjalan otomatis (pakai React Bits) menampilkan nama-nama model populer (misal: "Llama-3", "Mistral", "SDXL") dengan font *Instrument Serif* ukuran sangat besar.
6. **Ecosystem & Hugging Face Integration:** Teks penjelasan bahwa seluruh data diambil *real-time* dari Hugging Face via MCP. Layout 2 kolom dengan *border solid* tipis.
7. **Open Source Manifesto:** Section warna solid Exotic Orange (`#F54F1B`) dengan teks hitam pekat. Pernyataan dukungan terhadap *open-source*. Tipografi *Instrument Serif italic* raksasa.
8. **How It Works:** 3 langkah sederhana (Cari -> Klasifikasi -> Tes API). Menggunakan layout *zig-zag* (kiri-kanan-kiri).
9. **Mega Footer:** Teks "MaventHub" seukuran layar (*Instrument Serif*) di bagian paling bawah. Navigasi kecil di bawahnya (*Roboto*, *uppercase*).

---

## 6. Spesifikasi Hub Page (/hub)
Halaman ini adalah tempat *user* berinteraksi dengan data Hugging Face.
- **Header Search Bar:** Bar pencarian melayang (*sticky*) di bagian atas. Menggunakan Shadcn Command atau Input dengan *border* tebal Exotic Orange.
- **Filter Sidebar (Kiri):** Daftar klasifikasi Hugging Face (NLP, Computer Vision, Audio, Reinforcement Learning, Tabular). Dibuat dengan *checkbox/pills* bergaya brutalisme (*border solid*, tidak ada *shadow* lembut).
- **Results Grid (Kanan):** Menampilkan *list* model secara *real-time*.
  - *Style Grid*: Bukan kartu biasa. Gunakan layout *list/grid* editorial. Nama model (*Instrument Serif*), meta info (*downloads, likes*) menggunakan *Roboto* kecil di bawahnya.
  - Ketika di-*hover*, background kartu berubah menjadi Exotic Orange (`#F54F1B`) secara instan (tanpa transisi *ease* yang lambat, tegas).
  - Klik kartu -> Navigasi ke `/hub/model/[id]`.

---

## 7. Spesifikasi Model Detail & Playground (/hub/model/[id])
Halaman ini muncul saat *user* mengklik sebuah model.
- **Layout:** 2 Kolom (Kiri: Info Metadata, Kanan: Playground Form).
- **Kolom Kiri (Metadata):**
  - Judul Model: *Instrument Serif* raksasa.
  - Tags/Klasifikasi: *Pills outline*.
  - Deskripsi singkat, total *downloads*, *likes* (*Roboto*).
- **Kolom Kanan (Playground / Inference API):**
  - *Textarea* untuk input *prompt* (Shadcn UI).
  - Tombol "Run Inference" (Solid Exotic Orange).
  - Area Output: Menampilkan hasil dari API Hugging Face.
  - Jika model adalah tipe *Text-Generation*, tampilkan output secara *typewriter effect* atau *streaming*.
  - Handle state: *Loading* (spinner atau teks "Thinking..."), *Error* (*border* merah, teks error), *Success*.

---

## 8. Integrasi MCP (Model Context Protocol)
- AI Assistant / Environment diharuskan menggunakan MCP untuk mengambil data Hugging Face.
- Jika MCP HF tersedia: *Fetching list models*, *search models*, dan *run inference* harus melalui fungsi MCP.
- Jika belum tersedia: Buat fungsi *fetch* standar ke `huggingface.co/api/models` dan struktur kode agar siap untuk di-*swap* ke MCP nantinya tanpa merusak UI.
