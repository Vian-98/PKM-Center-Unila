package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"pkm-center/backend/internal/config"
	"pkm-center/backend/internal/handlers"
	"pkm-center/backend/internal/middleware"
	"pkm-center/backend/internal/models"
	"gorm.io/gorm"
)

func main() {
	db := config.Database()
	if err := db.AutoMigrate(&models.User{}, &models.Content{}, &models.Timeline{}, &models.Pedoman{}, &models.Portfolio{}, &models.Feedback{}, &models.SchemeStat{}, &models.ContactInfo{}); err != nil { log.Fatal(err) }
	seedUsers(db)
	seedContent(db)
	seedInfo(db)
	secret := config.Env("JWT_SECRET", "development-secret")
	r := gin.Default()
	r.Use(cors.New(cors.Config{AllowOrigins: []string{config.Env("CORS_ORIGIN", "http://localhost:5173")}, AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, AllowHeaders: []string{"Origin", "Content-Type", "Authorization"}}))
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	auth := handlers.AuthHandler{DB: db, Secret: secret}
	content := handlers.ContentHandler{DB: db}
	timeline := handlers.TimelineHandler{DB: db}
	pedoman := handlers.PedomanHandler{DB: db}
	portfolio := handlers.PortfolioHandler{DB: db}
	feedback := handlers.FeedbackHandler{DB: db}
	stats := handlers.StatsHandler{DB: db}
	contact := handlers.ContactHandler{DB: db}
	api := r.Group("/api")
	api.POST("/auth/login", auth.Login)
	api.GET("/auth/me", middleware.RequireAuth(secret), auth.Me)
	api.GET("/content", content.ListPublic)
	api.GET("/content/:id", content.GetPublic)
	api.GET("/timeline", timeline.List)
	api.GET("/pedoman", pedoman.List)
	api.GET("/portfolio", portfolio.List)
	api.GET("/stats", stats.List)
	api.GET("/contact", contact.Get)
	api.POST("/feedback", feedback.Create)
	admin := api.Group("/admin", middleware.RequireAuth(secret, string(models.RoleAdmin)))
	admin.GET("/overview", func(c *gin.Context) { c.JSON(200, gin.H{"message": "Selamat datang, Admin PKM Center"}) })
	admin.GET("/content", content.ListAdmin)
	admin.POST("/content", content.Create)
	admin.PUT("/content/:id", content.Update)
	admin.DELETE("/content/:id", content.Delete)
	admin.GET("/timeline", timeline.List)
	admin.POST("/timeline", timeline.Create)
	admin.PUT("/timeline/:id", timeline.Update)
	admin.DELETE("/timeline/:id", timeline.Delete)
	admin.GET("/pedoman", pedoman.List)
	admin.POST("/pedoman", pedoman.Create)
	admin.PUT("/pedoman/:id", pedoman.Update)
	admin.DELETE("/pedoman/:id", pedoman.Delete)
	admin.GET("/portfolio", portfolio.List)
	admin.POST("/portfolio", portfolio.Create)
	admin.PUT("/portfolio/:id", portfolio.Update)
	admin.DELETE("/portfolio/:id", portfolio.Delete)
	admin.GET("/feedback", feedback.List)
	admin.PUT("/feedback/:id/read", feedback.MarkRead)
	admin.DELETE("/feedback/:id", feedback.Delete)
	admin.GET("/stats", stats.List)
	admin.PUT("/stats", stats.Update)
	admin.GET("/contact", contact.Get)
	admin.PUT("/contact", contact.Update)
	r.Run(":" + config.Env("PORT", "8080"))
}

type seedContentItem struct {
	Type, Title, Category, Description, Body, MediaURL, ThumbnailURL, Color string
	DaysAgo                                                                  int
}

func seedContent(db *gorm.DB) {
	items := []seedContentItem{
		// --- BERITA (9 item) ---
		{Type: "news", Title: "Pendaftaran pendampingan proposal PKM segera dibuka", Category: "Pengumuman", DaysAgo: 1,
			Description:  "Siapkan ide terbaikmu dan ikuti sesi pendampingan awal bersama PKM Center.",
			ThumbnailURL: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=70", Color: "gold",
			Body: "PKM Center Universitas Lampung membuka kembali pendaftaran sesi pendampingan awal bagi mahasiswa yang ingin menyusun proposal Program Kreativitas Mahasiswa (PKM). Sesi ini terbuka untuk seluruh fakultas dan jenjang, tanpa perlu membawa draft final.\n\nPendampingan dipandu oleh fasilitator yang berpengalaman dalam pengelolaan PKM, mulai dari pemilihan skema, perumusan masalah, hingga strategi penyusunan luaran. Mahasiswa yang baru pertama kali mengenal PKM juga dipersilakan hadir untuk bertanya dan melihat contoh proposal yang pernah didanai.\n\nPendaftaran dilakukan melalui formulir daring yang akan diumumkan di halaman berita ini. Tempat terbatas sehingga peserta diprioritaskan berdasarkan urutan pendaftaran. Pantau kanal resmi PKM Center Unila untuk jadwal dan tata cara selengkapnya."},
		{Type: "news", Title: "Meracik gagasan menjadi proposal yang berdampak", Category: "Kegiatan", DaysAgo: 8,
			Description:  "Catatan dari kelas intensif pengembangan proposal bagi mahasiswa Unila.",
			ThumbnailURL: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=70", Color: "blue",
			Body: "Kelas intensif pengembangan proposal PKM kembali digelar PKM Center Unila. Peserta diajak menyusun kerangka proposal dari pertanyaan penelitian yang jernih, bukan sekadar menumpuk latar belakang.\n\nMateri mencakup cara membaca pedoman, menyusun metodologi yang realistis, serta menyelaraskan luaran dengan indikator keberhasilan. Setiap kelompok mendapat sesi konsultasi langsung sehingga revisi proposal berjalan lebih cepat dan terarah.\n\nKelas ditutup dengan presentasi singkat antarkelompok dan umpan balik dari fasilitator. Catatan dari kelas ini akan dibagikan sebagai panduan ringkas agar peserta bisa menerapkannya menjelang penutupan pengusulan."},
		{Type: "news", Title: "Merayakan karya dan kolaborasi mahasiswa Unila", Category: "Prestasi", DaysAgo: 15,
			Description:  "Ruang apresiasi untuk perjalanan tim PKM dari kampus ke masyarakat.",
			ThumbnailURL: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=70", Color: "red",
			Body: "Perjalanan tim PKM Unila dari kampus menuju masyarakat kembali dirayakan dalam pertemuan apresiasi tahunan PKM Center. Kegiatan ini menjadi ruang bertukar cerita antartim yang telah menyelesaikan pendanaannya.\n\nBerbagai skema tampil berbagi pengalaman, dari pengabdian masyarakat, produk kewirausahaan, hingga karya inovatif. Banyak tim mengungkapkan bahwa kunci keberhasilan mereka adalah kolaborasi lintas disiplin dan konsistensi melakukan riset kecil sejak awal.\n\nMomen ini juga menjadi bahan evaluasi PKM Center untuk merancang pendampingan tahun berikutnya. Rekaman dan dokumentasi acara dapat dilihat pada halaman galeri."},
		{Type: "news", Title: "Mengenal lintasan skema Program Kreativitas Mahasiswa", Category: "Info PKM", DaysAgo: 22,
			Description:  "Panduan awal memilih skema yang sesuai dengan pertanyaan dan gagasanmu.",
			ThumbnailURL: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=70", Color: "green",
			Body: "PKM memiliki beragam skema yang disesuaikan dengan jenis gagasan dan luaran yang ingin dicapai. Memahami lintasan skema sejak awal membantu mahasiswa memilih jalur yang paling sesuai dengan pertanyaan dan kapasitas timnya.\n\nSecara umum skema PKM terbagi dalam bidang riset, kewirausahaan, pengabdian masyarakat, karya inovatif, gagasan futuristik, serta penulisan ilmiah dan karsa cipta. Setiap skema memiliki pedoman, batasan anggota, dan luaran minimal yang berbeda.\n\nPKM Center Unila menyediakan pendampingan orientasi skema setiap awal periode pengusulan. Mahasiswa dapat datang ke sesi orientasi atau menghubungi kanal resmi untuk bertanya sebelum menentukan pilihan skema."},
		{Type: "news", Title: "Klinik proposal: dari riset ke aksi nyata", Category: "Kegiatan", DaysAgo: 29,
			Description:  "Belajar menyusun alur proposal yang kuat, jernih, dan mudah dipahami.",
			ThumbnailURL: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=70", Color: "gold",
			Body: "Klinik proposal PKM Center menghadirkan sesi konsultasi satu-per-satu bagi mahasiswa yang draft proposalnya telah mentok di tahap tertentu. Klinik ini dirancang untuk menjawab kebuntuan teknis, bukan sekadar ceramah umum.\n\nSetiap sesi dibatasi agar fasilitator dapat membaca naskah dan memberikan catatan yang spesifik: alur masalah, kesesuaian metode, anggaran, hingga jadwal pelaksanaan. Mahasiswa membawa draft digital dan pulang dengan daftar revisi yang jelas.\n\nKlinik diselenggarakan rutin menjelang tenggat pengusulan. Jadwal sesi diumumkan di halaman berita dan media sosial PKM Center Unila."},
		{Type: "news", Title: "Agenda PKM Center untuk semester ini", Category: "Pengumuman", DaysAgo: 36,
			Description:  "Simpan tanggal penting untuk pelatihan, klinik, dan sesi konsultasi.",
			ThumbnailURL: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70", Color: "blue",
			Body: "PKM Center Unila merilis agenda kegiatan untuk semester ini: orientasi skema, kelas intensif, klinik proposal, pelatihan manajemen pendanaan, hingga sesi apresiasi karya.\n\nSemua agenda bersifat terbuka bagi mahasiswa Unila. Sebagian kegiatan terselenggara secara luring di kampus, sementara beberapa sesi orientasi dapat diikuti secara daring.\n\nSimpan tanggal pentingnya dan pantau pembaruan. Jadwal dapat berubah sewaktu-waktu, sehingga informasi resmi tetap merujuk pada pengumuman di halaman ini."},
		{Type: "news", Title: "Kolaborasi lintas fakultas memperkaya riset PKM", Category: "Kegiatan", DaysAgo: 43,
			Description:  "Tim lintas fakultas membawa perspektif baru dalam menyusun proposal yang berdampak.",
			ThumbnailURL: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=70", Color: "green",
			Body: "Tim PKM lintas fakultas semakin umum ditemukan di Unila. Perpaduan keahlian, misalnya ekonomi, hukum, dan teknik dalam satu tim, menghasilkan proposal dengan pendekatan yang lebih kaya.\n\nKolaborasi ini menuntut pembagian peran yang jelas dan komunikasi yang teratur. PKM Center mendorong mahasiswa membangun tim sejak proses perumusan gagasan, bukan hanya saat melengkapi administrasi.\n\nBagi yang ingin membentuk tim lintas fakultas, sesi orientasi menyediakan ruang perkenalan antarcalon peserta. Informasi jadwal tersedia di kanal resmi PKM Center Unila."},
		{Type: "news", Title: "Pelatihan penulisan proposal bagi pengusul baru", Category: "Kegiatan", DaysAgo: 50,
			Description:  "Panduan praktis menulis proposal PKM bagi mahasiswa yang baru pertama kali mengusulkan.",
			ThumbnailURL: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=70", Color: "red",
			Body: "PKM Center Unila mengadakan pelatihan penulisan proposal yang dikhususkan bagi pengusul pemula. Peserta belajar struktur proposal dari judul, pendahuluan, metode, hingga rencana anggaran.\n\nPelatihan menekankan kebiasaan menulis bertahap: menyusun kerangka di awal pekan, mengisi tiap bagian secara berturut-turut, lalu meminta umpan balik sebelum tenggat. Pendekatan ini mengurangi kebiasaan menyelesaikan proposal di menit terakhir.\n\nPeserta yang menyelesaikan pelatihan mendapat prioritas pada sesi klinik proposal berikutnya. Pendaftaran dibuka melalui formulir di halaman berita."},
		{Type: "news", Title: "Dari kampus untuk masyarakat: PKM pengabdian", Category: "Prestasi", DaysAgo: 57,
			Description:  "Cerita tim PKM yang membawa ilmu kampus langsung ke tengah masyarakat.",
			ThumbnailURL: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=70", Color: "gold",
			Body: "Salah satu wajah PKM yang paling dekat dengan masyarakat adalah skema pengabdian. Tim menyusun program yang menjawab persoalan nyata di lokasi mitra, mulai dari pelatihan keterampilan hingga pendampingan usaha.\n\nKunci keberhasilan program ini adalah komunikasi awal dengan mitra. Tim yang meluangkan waktu memahami kebutuhan lapangan cenderung menyusun program yang relevan dan berkelanjutan.\n\nPKM Center mendampingi tim pengabdian sejak penyusunan proposal hingga pelaporan akhir. Dokumentasi kegiatan dapat dilihat pada halaman galeri."},

		// --- VIDEO (3 item) ---
		{Type: "video", Title: "Mengenal PKM Center", Category: "Video kegiatan", DaysAgo: 5,
			Description: "Tentang ruang tumbuh ide dan karya mahasiswa.", Color: "gold"},
		{Type: "video", Title: "Kiat memulai proposal PKM", Category: "Video kegiatan", DaysAgo: 12,
			Description: "Langkah pertama dari gagasan menuju proposal.", Color: "blue"},
		{Type: "video", Title: "Cerita dari tim PKM", Category: "Video kegiatan", DaysAgo: 19,
			Description: "Catatan proses, kolaborasi, dan pembelajaran.", Color: "red"},

		// --- GALERI FOTO (8 item) ---
		{Type: "gallery", Title: "Kelas pengembangan ide", Category: "Galeri foto", DaysAgo: 2,
			Description: "Sesi orientasi skema dan penyusunan gagasan awal.", MediaURL: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=75", Color: "gold"},
		{Type: "gallery", Title: "Diskusi tim lintas disiplin", Category: "Galeri foto", DaysAgo: 9,
			Description: "Ruang diskusi antartim dari berbagai fakultas.", MediaURL: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=1400&q=75", Color: "blue"},
		{Type: "gallery", Title: "Presentasi karya mahasiswa", Category: "Galeri foto", DaysAgo: 16,
			Description: "Sesi presentasi dan umpan balik antartim.", MediaURL: "https://images.unsplash.com/photo-1509869175650-a1d97972541a?auto=format&fit=crop&w=1400&q=75", Color: "red"},
		{Type: "gallery", Title: "Pendampingan proposal", Category: "Galeri foto", DaysAgo: 23,
			Description: "Konsultasi satu-per-satu bersama fasilitator.", MediaURL: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=75", Color: "green"},
		{Type: "gallery", Title: "Ruang kolaborasi PKM", Category: "Galeri foto", DaysAgo: 30,
			Description: "Suasana kerja bersama di ruang PKM Center.", MediaURL: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1400&q=75", Color: "blue"},
		{Type: "gallery", Title: "Belajar bersama mentor", Category: "Galeri foto", DaysAgo: 37,
			Description: "Diskusi kecil bersama fasilitator berpengalaman.", MediaURL: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1400&q=75", Color: "gold"},
		{Type: "gallery", Title: "Perayaan proses dan karya", Category: "Galeri foto", DaysAgo: 44,
			Description: "Apresiasi dan perayaan capaian tim PKM.", MediaURL: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1400&q=75", Color: "red"},
		{Type: "gallery", Title: "Dari kampus untuk masyarakat", Category: "Galeri foto", DaysAgo: 51,
			Description: "Kegiatan PKM yang menyentuh langsung masyarakat.", MediaURL: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1400&q=75", Color: "green"},
	}

	for _, s := range items {
		var existing models.Content
		err := db.Where("title = ?", s.Title).First(&existing).Error
		published := time.Now().AddDate(0, 0, -s.DaysAgo)
		if err == gorm.ErrRecordNotFound {
			db.Create(&models.Content{Type: s.Type, Title: s.Title, Category: s.Category, Description: s.Description, Body: s.Body, MediaURL: s.MediaURL, ThumbnailURL: s.ThumbnailURL, Color: s.Color, PublishedAt: published})
			continue
		}
		if err != nil { continue }
		// Upsert non-destruktif: hanya mengisi kolom yang masih kosong,
		// sehingga konten (mis. URL video) yang pernah dibuat/diubah admin tidak tertimpa.
		updates := map[string]any{}
		if existing.ThumbnailURL == "" && s.ThumbnailURL != "" { updates["thumbnail_url"] = s.ThumbnailURL }
		if existing.MediaURL == "" && s.MediaURL != "" { updates["media_url"] = s.MediaURL }
		if existing.Body == "" && s.Body != "" { updates["body"] = s.Body }
		if existing.Description == "" && s.Description != "" { updates["description"] = s.Description }
		if existing.Category == "" && s.Category != "" { updates["category"] = s.Category }
		if existing.Color == "" && s.Color != "" { updates["color"] = s.Color }
		// Selaraskan tanggal terbit seed-known jika melenceng lebih dari sehari,
		// supaya urutan berita tetap terbaru-ke-lama tanpa menimpa data admin.
		if existing.PublishedAt.Add(24*time.Hour).Before(published) || existing.PublishedAt.After(published.Add(24*time.Hour)) {
			updates["published_at"] = published
		}
		if len(updates) > 0 { db.Model(&existing).Updates(updates) }
	}
}

func seedUsers(db *gorm.DB) {
	accounts := []struct { Name, Email, Password string; Role models.Role }{
		{"Admin PKM", "admin@pkm.unila.ac.id", "admin123", models.RoleAdmin},
		{"Nadia Mahasiswa", "mahasiswa@pkm.unila.ac.id", "mahasiswa123", models.RoleMahasiswa},
		{"Dr. Budi Dosen", "dosen@pkm.unila.ac.id", "dosen123", models.RoleDosen},
	}
	for _, account := range accounts {
		var user models.User
		if db.Where("email = ?", account.Email).First(&user).Error == gorm.ErrRecordNotFound {
			hash, _ := bcrypt.GenerateFromPassword([]byte(account.Password), bcrypt.DefaultCost)
			db.Create(&models.User{Name: account.Name, Email: account.Email, Password: string(hash), Role: account.Role})
		}
	}
}

// seedInfo mengisi tabel baru (timeline, pedoman, portofolio, statistik,
// kontak, feedback) secara non-destruktif: hanya membuat baris yang belum ada.
func seedInfo(db *gorm.DB) {
	// --- TIMELINE PKM per tahun ---
	stages := []struct { Year, Order int; Stage, Label, Note string }{
		// 2026
		{2026, 1, "Sosialisasi & orientasi skema", "Januari — Februari 2026", "Pengenalan skema PKM dan sesi tanya jawab bagi calon pengusul."},
		{2026, 2, "Pendampingan penyusunan proposal", "Februari — Maret 2026", "Kelas intensif, klinik proposal, dan konsultasi per kelompok."},
		{2026, 3, "Pengusulan proposal (submit)", "Akhir Maret 2026", "Pengajuan proposal melalui sistem SIMBELMAWA."},
		{2026, 4, "Review & penilaian proposal", "April 2026", "Penilaian oleh reviewer internal dan tingkat nasional."},
		{2026, 5, "Penetapan proposal didanai", "Mei 2026", "Pengumuman proposal yang lolos pendanaan."},
		{2026, 6, "Pelaksanaan & monitoring", "Juni — Oktober 2026", "Pelaksanaan kegiatan, monitoring, dan pelaporan kemajuan."},
		{2026, 7, "PIMNAS", "November 2026", "Pekan Ilmiah Mahasiswa Nasional."},
		// 2025
		{2025, 1, "Sosialisasi & orientasi skema", "Januari 2025", "Pengenalan skema PKM dan sesi tanya jawab bagi calon pengusul."},
		{2025, 2, "Pendampingan penyusunan proposal", "Januari — Februari 2025", "Kelas intensif dan klinik proposal."},
		{2025, 3, "Pengusulan proposal (submit)", "Maret 2025", "Batas akhir pengajuan proposal."},
		{2025, 4, "Review & penilaian proposal", "Maret — April 2025", "Penilaian proposal tingkat nasional."},
		{2025, 5, "Penetapan proposal didanai", "April 2025", "Pengumuman proposal yang lolos pendanaan."},
		{2025, 6, "Pelaksanaan & monitoring", "Mei — Oktober 2025", "Pelaksanaan kegiatan dan monitoring pendanaan."},
		{2025, 7, "PIMNAS", "November 2025", "Pekan Ilmiah Mahasiswa Nasional — tim Unila meraih 12 medali."},
		// 2024
		{2024, 1, "Sosialisasi & orientasi skema", "Januari 2024", "Pengenalan skema PKM bagi mahasiswa baru."},
		{2024, 2, "Pendampingan penyusunan proposal", "Januari — Februari 2024", "Kelas intensif dan klinik proposal."},
		{2024, 3, "Pengusulan proposal (submit)", "Maret 2024", "Batas akhir pengajuan proposal."},
		{2024, 4, "Review & penilaian proposal", "Maret — April 2024", "Penilaian proposal tingkat nasional."},
		{2024, 5, "Penetapan proposal didanai", "April 2024", "Pengumuman proposal yang lolos pendanaan."},
		{2024, 6, "Pelaksanaan & monitoring", "Mei — Oktober 2024", "Pelaksanaan kegiatan dan monitoring pendanaan."},
		{2024, 7, "PIMNAS", "November 2024", "Pekan Ilmiah Mahasiswa Nasional."},
	}
	for _, s := range stages {
		var existing models.Timeline
		if db.Where("year = ? AND stage = ?", s.Year, s.Stage).First(&existing).Error == gorm.ErrRecordNotFound {
			db.Create(&models.Timeline{Year: s.Year, Stage: s.Stage, Label: s.Label, Note: s.Note, Order: s.Order})
		}
	}

	// --- PEDOMAN PKM per tahun (tautan ke katalog resmi SIMBELMAWA) ---
	pedoman := []models.Pedoman{
		{Year: 2026, Title: "Buku Panduan PKM 2026", Source: "SIMBELMAWA", FileURL: "https://simbelmawa.kemdikbud.go.id/portals/buku-panduan/", Note: "Pedoman resmi pengusulan Program Kreativitas Mahasiswa tahun 2026."},
		{Year: 2025, Title: "Buku Panduan PKM 2025", Source: "SIMBELMAWA", FileURL: "https://simbelmawa.kemdikbud.go.id/portals/buku-panduan/", Note: "Pedoman resmi pengusulan Program Kreativitas Mahasiswa tahun 2025."},
		{Year: 2024, Title: "Buku Panduan PKM 2024", Source: "SIMBELMAWA", FileURL: "https://simbelmawa.kemdikbud.go.id/portals/buku-panduan/", Note: "Pedoman resmi pengusulan Program Kreativitas Mahasiswa tahun 2024."},
		{Year: 2023, Title: "Buku Panduan PKM 2023", Source: "SIMBELMAWA", FileURL: "https://simbelmawa.kemdikbud.go.id/portals/buku-panduan/", Note: "Arsip pedoman pengusulan PKM tahun 2023."},
	}
	for _, p := range pedoman {
		var existing models.Pedoman
		if db.Where("year = ? AND title = ?", p.Year, p.Title).First(&existing).Error == gorm.ErrRecordNotFound {
			db.Create(&p)
		}
	}

	// --- PORTOFOLIO: arsip proposal lolos pendanaan ---
	portfolio := []models.Portfolio{
		{Year: 2025, Title: "Optimalisasi Potensi Wisata Embung melalui Pengembangan Ekonomi Kreatif Berbasis Komunitas", Team: "Alya Rahma, Bagas Prasetyo, Citra Ayu, Dimas Aditya", Scheme: "PKM-PM", Faculty: "FISIP", Prodi: "Ilmu Komunikasi", Description: "Program pengabdian kepada masyarakat untuk mengembangkan ekonomi kreatif berbasis komunitas di kawasan wisata Embung, mencakup pelatihan tata kelola, pemasaran digital, dan pendampingan berkelanjutan."},
		{Year: 2025, Title: "Sistem Monitoring Kualitas Air Budidaya Ikan Berbasis IoT", Team: "Raka Maulana, Sinta Dewi, Fajar Ramadhan, Nadia Putri", Scheme: "PKM-KC", Faculty: "FMIPA", Prodi: "Fisika", Description: "Purwarupa alat pemantau suhu, pH, dan oksigen terlarut kolam ikan secara real-time dengan notifikasi ke ponsel pembudidaya."},
		{Year: 2025, Title: "Budpupuk: Pupuk Organik dari Limbah Rumah Tangga", Team: "Dewi Lestari, Eko Saputra, Fina Amelia, Galih Pratama", Scheme: "PKM-K", Faculty: "FEB", Prodi: "Manajemen", Description: "Usaha pupuk organik dari limbah rumah tangga dengan model kemitraan bersama bank sampah setempat."},
		{Year: 2025, Title: "Aplikasi Belajar Membaca bagi Anak Usia Dini dengan Metode Fonik", Team: "Intan Permata, Joko Susilo, Kania Rahma", Scheme: "PKM-PI", Faculty: "FKIP", Prodi: "PG PAUD", Description: "Aplikasi pembelajaran membaca berbasis metode fonik yang dikembangkan bersama komunitas guru PAUD."},
		{Year: 2025, Title: "Terapi Relaksasi Digital untuk Menurunkan Stres Akademik Mahasiswa", Team: "Laila Nur, Miftahul Huda, Nabila Salsabila, Oktavian Saputra", Scheme: "PKM-RE", Faculty: "Fakultas Kedokteran", Prodi: "Pendidikan Dokter", Description: "Studi eksperimental pengaruh terapi relaksasi digital terhadap tingkat stres akademik mahasiswa."},
		{Year: 2024, Title: "Sekotong Pintar: Edukasi Pencegahan Stunting Berbasis Media Digital", Team: "Putri Maharani, Qori Aini, Reza Akbar, Salsabila Fitri", Scheme: "PKM-PM", Faculty: "Kedokteran", Prodi: "Ilmu Kesehatan Masyarakat", Description: "Edukasi pencegahan stunting melalui media digital bagi ibu balita di daerah pesisir Lampung."},
		{Year: 2024, Title: "Klinik Tanaman: Deteksi Penyakit Daun Berbasis Citra", Team: "Taufik Hidayat, Umi Kalsum, Vina Agustina, Wildan Fauzi", Scheme: "PKM-KC", Faculty: "FMIPA", Prodi: "Ilmu Komputer", Description: "Sistem deteksi dini penyakit daun tanaman pangan menggunakan pengolahan citra dan pembelajaran mesin."},
		{Year: 2024, Title: "Keripik Bayam Kaya Zat Besi sebagai Camilan Sehat Remaja", Team: "Yoga Pratama, Zainab Zahra, Andi Firmansyah, Bella Safitri", Scheme: "PKM-K", Faculty: "Fakultas Pertanian", Prodi: "Teknologi Hasil Pertanian", Description: "Inovasi olahan bayam menjadi keripik dengan kandungan zat besi tinggi yang disukai remaja."},
		{Year: 2024, Title: "Robocar: Kendaraan Listrik Mini untuk Pembelajaran STEM", Team: "Candra Wijaya, Dimas Pangestu, Elsa Melati, Farhan Maulana", Scheme: "PKM-KI", Faculty: "Fakultas Teknik", Prodi: "Teknik Elektro", Description: "Prototipe kendaraan listrik mini sebagai media pembelajaran STEM di sekolah menengah."},
		{Year: 2024, Title: "Gagasan Kota Hijau untuk Bandar Lampung Menuju Netralitas Karbon 2050", Team: "Gita Salsabilla, Haris Munandar, Ines Anggraini", Scheme: "PKM-GFT", Faculty: "Fakultas Teknik", Prodi: "Perencanaan Wilayah dan Kota", Description: "Gagasan futuristik tertulis tentang infrastruktur hijau dan regulasi menuju netralitas karbon kota."},
	}
	for _, p := range portfolio {
		var existing models.Portfolio
		err := db.Where("year = ? AND title = ?", p.Year, p.Title).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			db.Create(&p)
			continue
		}
		if err != nil { continue }
		// Non-destruktif: hanya mengisi kolom ringkasan yang masih kosong.
		updates := map[string]any{}
		if existing.Description == "" && p.Description != "" { updates["description"] = p.Description }
		if existing.Link == "" && p.Link != "" { updates["link"] = p.Link }
		if len(updates) > 0 { db.Model(&existing).Updates(updates) }
	}

	// --- STATISTIK jumlah usulan per skema PKM ---
	schemes := []struct { Scheme string; Count int }{
		{"PKM-K", 87}, {"PKM-PI", 92}, {"PKM-PM", 64}, {"PKM-KC", 41},
		{"PKM-GFT", 12}, {"PKM-KI", 38}, {"PKM-AI", 9}, {"PKM-RE", 56}, {"PKM-RSH", 27},
	}
	for _, s := range schemes {
		var existing models.SchemeStat
		if db.Where("scheme = ?", s.Scheme).First(&existing).Error == gorm.ErrRecordNotFound {
			db.Create(&models.SchemeStat{Scheme: s.Scheme, Count: s.Count})
		}
	}

	// --- KONTAK (baris tunggal id=1) ---
	var contactExisting models.ContactInfo
	if db.First(&contactExisting, 1).Error == gorm.ErrRecordNotFound {
		db.Create(&models.ContactInfo{
			ID:        1,
			Address:   "Gedung Rektorat Unila, Jl. Prof. Dr. Soemantri Brojonegoro No. 1, Gedong Meneng, Bandar Lampung 35145",
			Email:     "pkmcenter@unila.ac.id",
			Phone:     "(0721) 704 947",
			WhatsApp:  "+62 812 7019 8888",
			Instagram: "@pkmcenter.unila",
			Facebook:  "PKM Center Universitas Lampung",
			MapEmbed:  "https://maps.google.com/maps?q=Universitas%20Lampung&t=&z=15&ie=UTF8&iwloc=&output=embed",
		})
	}

	// --- CONTOH PESAN (feedback) untuk demo panel admin ---
	feedbacks := []models.Feedback{
		{Kind: "saran", Name: "Rizky Mahasiswa", Email: "rizky@example.com", Message: "Saran untuk PKM Center: tambahkan jadwal sesi klinik proposal yang sore hari agar bisa dihadiri mahasiswa yang ada kuliah pagi.", Read: false},
		{Kind: "kontak", Name: "Ibu Sari", Email: "sari@example.com", Message: "Selamat siang, saya ingin bertanya mengenai kerja sama pendampingan PKM dengan sekolah di luar kampus. Terima kasih.", Read: false},
	}
	for _, f := range feedbacks {
		var existing models.Feedback
		if db.Where("kind = ? AND message = ?", f.Kind, f.Message).First(&existing).Error == gorm.ErrRecordNotFound {
			db.Create(&f)
		}
	}
}
