# SMART - HUT - Sistem Informasi Data Kehutanan

Aplikasi **SMART-HUT** adalah sistem informasi berbasis web yang dibangun untuk mengelola dan memonitor data kehutanan secara terintegrasi. Sistem ini mencakup berbagai modul mulai dari rehabilitasi lahan, perhutanan sosial, hasil hutan, hingga nilai transaksi ekonomi.

Dibangun dengan teknologi modern menggunakan **Laravel 10** dan **Inertia.js (React)** untuk memberikan pengalaman pengguna yang responsif dan interaktif.

## 🚀 Teknologi yang Digunakan

- **Backend:** [Laravel 10](https://laravel.com)
- **Frontend:** [Inertia.js](https://inertiajs.com) dengan [React](https://react.dev)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Database:** MySQL
- **Charts:** Chart.js (React Chartjs 2)
- **Excel:** Maatwebsite Laravel Excel

## 🔥 Fitur Utama

Sistem ini memiliki berbagai modul pengelolaan data, antara lain:

### 1. Rehabilitasi & Lingkungan
- **Rehabilitasi Lahan (RHL):** Monitoring kegiatan rehabilitasi lahan kritis.
- **Penghijauan Lingkungan:** Data kegiatan penghijauan di lingkungan masyarakat.
- **Rehabilitasi Mangrove:** Program pemulihan ekosistem mangrove.
- **RHL Teknis & Reboisasi PS:** Pengelolaan teknis dan reboisasi di area Perhutanan Sosial.

### 2. Perhutanan Sosial & Kelompok Tani
- **Perkembangan KTH:** Data Kelompok Tani Hutan.
- **Perkembangan KUPS:** Monitoring Kelompok Usaha Perhutanan Sosial.
- **SK Perhutanan Sosial (SKPS):** Administrasi SK Perhutanan Sosial.

### 3. Hasil Hutan & Ekonomi
- **Hasil Hutan Kayu & Bukan Kayu:** Pencatatan produksi hasil hutan.
- **Nilai Ekonomi (NEKON):** Analisis nilai ekonomi sumber daya hutan.
- **Nilai Transaksi Ekonomi:** Monitoring transaksi ekonomi dari produk kehutanan.
- **Realisasi PNBP:** Penerimaan Negara Bukan Pajak sektor kehutanan.

### 4. Lainnya
- **Kebakaran Hutan:** Data kejadian dan penanganan kebakaran hutan.
- **Pengunjung Wisata:** Data kunjungan ke objek wisata alam.
- **Master Data:** Pengelolaan data wilayah, komoditas, sumber dana, dll.

### 5. Utilitas
- **Dashboard Interaktif:** Statistik visual (Grafik & Peta).
- **Import/Export Excel:** Kemudahan input dan laporan data massal.
- **Manajemen User:** Role-based access control.

## 🛠️ Instalasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di lingkungan lokal Anda (disarankan menggunakan **Laragon** atau **Laravel Herd** di Windows).

### Prasyarat
- PHP >= 8.1
- Composer
- Node.js & NPM
- MySQL

### Langkah-langkah

1. **Clone Repository**
   ```bash
   git clone https://github.com/username/kda.git
   cd kda
   ```

2. **Install Dependencies PHP**
   ```bash
   composer install
   ```

3. **Install Dependencies JavaScript**
   ```bash
   npm install
   ```

4. **Konfigurasi Environment**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Atur konfigurasi database di file `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=nama_database_kda
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Generate Application Key**
   ```bash
   php artisan key:generate
   ```

6. **Migrasi Database**
   ```bash
   php artisan migrate --seed
   ```

7. **Jalankan Aplikasi**
   Buka dua terminal berbeda untuk menjalankan server PHP dan Vite:

   *Terminal 1 (Laravel Server):*
   ```bash
   php artisan serve
   ```

   *Terminal 2 (Vite Dev Server):*
   ```bash
   npm run dev
   ```

8. **Akses Aplikasi**
   Buka browser dan kunjungi `http://localhost:8000`.

## 📄 Lisensi

Aplikasi ini adalah perangkat lunak propertari. Hak cipta dilindungi undang-undang.
