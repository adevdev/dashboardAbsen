# Dashboard Absensi

Aplikasi Node.js sederhana untuk input dan penyimpanan data absensi pegawai.

## Instalasi

1. Install dependencies:
```bash
npm install
```

## Menjalankan Aplikasi

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## Cara Menggunakan

1. Jalankan server dengan `npm start`
2. Buka browser dan akses `http://localhost:3000/absen`
3. Isi form absensi:
   - Nama Pegawai
   - Area Pekerjaan
   - Jenis Pekerjaan
   - Rentang Waktu (Mulai - Selesai)
   - Upload Foto Selfie
   - Deskripsi Pekerjaan
4. Klik tombol "Kirim Data"
5. Data akan tersimpan di folder `./absensi`

## Struktur Data

Data absensi disimpan dalam format JSON di folder `./absensi`:
- File JSON: `absensi_[timestamp].json`
- File Foto: `foto_[timestamp].[ext]`

Format data JSON:
```json
{
  "timestamp": "2026-01-05T10:30:00.000Z",
  "nama": "John Doe",
  "area": "Gedung A",
  "jenis": "Maintenance",
  "waktuMulai": "08:00",
  "waktuSelesai": "17:00",
  "deskripsi": "Perbaikan AC di ruangan 101",
  "foto": "foto_1234567890.jpg"
}
```

## Fitur

- Input data absensi dengan form yang user-friendly
- Upload foto selfie sebagai bukti kehadiran
- Preview foto sebelum submit
- Validasi form
- Penyimpanan data dalam format JSON
- Timestamp otomatis

## Dependencies

- express: Web framework untuk Node.js
- multer: Middleware untuk handle upload file
