const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files

// Setup multer untuk upload foto
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const absensiDir = path.join(__dirname, 'absensi');
        if (!fs.existsSync(absensiDir)) {
            fs.mkdirSync(absensiDir, { recursive: true });
        }
        cb(null, absensiDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `foto_${timestamp}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diperbolehkan!'));
        }
    }
});

// Route untuk halaman absen
app.get('/absen', (req, res) => {
    res.sendFile(path.join(__dirname, 'ddekk.html'));
});

// Route untuk halaman dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Route untuk submit absensi
app.post('/submit-absensi', upload.single('foto'), (req, res) => {
    try {
        const { nama, area, jenis, waktuMulai, waktuSelesai, desc, timestamp } = req.body;
        
        // Validasi data
        if (!nama || !area || !jenis || !waktuMulai || !waktuSelesai || !desc) {
            return res.status(400).json({ 
                success: false, 
                message: 'Semua field harus diisi!' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Foto harus diupload!' 
            });
        }

        // Siapkan data absensi
        const dataAbsensi = {
            timestamp: timestamp || new Date().toISOString(),
            nama,
            area,
            jenis,
            waktuMulai,
            waktuSelesai,
            deskripsi: desc,
            foto: req.file.filename
        };

        // Simpan ke file JSON
        const fileName = `absensi_${Date.now()}.json`;
        const filePath = path.join(__dirname, 'absensi', fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(dataAbsensi, null, 2));

        res.json({ 
            success: true, 
            message: 'Data absensi berhasil disimpan!',
            data: dataAbsensi
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan saat menyimpan data!' 
        });
    }
});

// API untuk mendapatkan semua data absensi
app.get('/api/absensi', (req, res) => {
    try {
        const absensiDir = path.join(__dirname, 'absensi');
        
        if (!fs.existsSync(absensiDir)) {
            return res.json({ 
                success: true, 
                data: [] 
            });
        }

        const files = fs.readdirSync(absensiDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const allAbsensi = jsonFiles.map(file => {
            const filePath = path.join(absensiDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        });

        // Sort by timestamp (newest first)
        allAbsensi.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ 
            success: true, 
            data: allAbsensi 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan saat mengambil data!' 
        });
    }
});

// API untuk export ke Excel
app.get('/api/export-excel', (req, res) => {
    try {
        const absensiDir = path.join(__dirname, 'absensi');
        
        if (!fs.existsSync(absensiDir)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Tidak ada data untuk di-export' 
            });
        }

        const files = fs.readdirSync(absensiDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Tidak ada data untuk di-export' 
            });
        }

        const allAbsensi = jsonFiles.map(file => {
            const filePath = path.join(absensiDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        });

        // Sort by timestamp (newest first)
        allAbsensi.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Prepare data for Excel
        const excelData = allAbsensi.map((item, index) => {
            const date = new Date(item.timestamp);
            return {
                'No': index + 1,
                'Tanggal': date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                }),
                'Waktu': date.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                'Nama': item.nama,
                'Area': item.area,
                'Jenis Pekerjaan': item.jenis,
                'Waktu Mulai': item.waktuMulai,
                'Waktu Selesai': item.waktuSelesai,
                'Deskripsi': item.deskripsi,
                'URL Foto': `http://localhost:${PORT}/absensi/${item.foto}`
            };
        });

        // Create workbook and worksheet
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(excelData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 5 },  // No
            { wch: 20 }, // Tanggal
            { wch: 12 }, // Waktu
            { wch: 30 }, // Nama
            { wch: 15 }, // Area
            { wch: 18 }, // Jenis Pekerjaan
            { wch: 12 }, // Waktu Mulai
            { wch: 12 }, // Waktu Selesai
            { wch: 40 }, // Deskripsi
            { wch: 50 }  // URL Foto
        ];

        xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Absensi');

        // Generate Excel file
        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        const fileName = `Absensi_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        res.send(excelBuffer);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan saat export data!' 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Buka http://localhost:${PORT} untuk dashboard`);
    console.log(`Buka http://localhost:${PORT}/absen untuk input absensi`);
});
