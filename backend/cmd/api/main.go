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
	if err := db.AutoMigrate(&models.User{}, &models.Content{}); err != nil { log.Fatal(err) }
	seedUsers(db)
	seedContent(db)
	secret := config.Env("JWT_SECRET", "development-secret")
	r := gin.Default()
	r.Use(cors.New(cors.Config{AllowOrigins: []string{config.Env("CORS_ORIGIN", "http://localhost:5173")}, AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, AllowHeaders: []string{"Origin", "Content-Type", "Authorization"}}))
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	auth := handlers.AuthHandler{DB: db, Secret: secret}
	content := handlers.ContentHandler{DB: db}
	api := r.Group("/api")
	api.POST("/auth/login", auth.Login)
	api.GET("/auth/me", middleware.RequireAuth(secret), auth.Me)
	api.GET("/content", content.ListPublic)
	api.GET("/content/:id", content.GetPublic)
	admin := api.Group("/admin", middleware.RequireAuth(secret, string(models.RoleAdmin)))
	admin.GET("/overview", func(c *gin.Context) { c.JSON(200, gin.H{"message": "Selamat datang, Admin PKM Center"}) })
	admin.GET("/content", content.ListAdmin)
	admin.POST("/content", content.Create)
	admin.PUT("/content/:id", content.Update)
	admin.DELETE("/content/:id", content.Delete)
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
