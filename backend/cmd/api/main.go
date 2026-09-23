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

func seedContent(db *gorm.DB) {
	var count int64
	db.Model(&models.Content{}).Count(&count)
	if count > 0 { return }
	items := []models.Content{
		{Type: "news", Title: "Pendaftaran pendampingan proposal PKM segera dibuka", Category: "Pengumuman", Description: "Siapkan ide terbaikmu dan ikuti sesi pendampingan awal bersama PKM Center.", Color: "gold"},
		{Type: "news", Title: "Meracik gagasan menjadi proposal yang berdampak", Category: "Kegiatan", Description: "Catatan dari kelas intensif pengembangan proposal bagi mahasiswa Unila.", Color: "blue"},
		{Type: "news", Title: "Merayakan karya dan kolaborasi mahasiswa Unila", Category: "Prestasi", Description: "Ruang apresiasi untuk perjalanan tim PKM dari kampus ke masyarakat.", Color: "red"},
		{Type: "video", Title: "Mengenal PKM Center", Category: "Video kegiatan", Description: "Tentang ruang tumbuh ide dan karya mahasiswa.", Color: "gold"},
		{Type: "gallery", Title: "Kelas pengembangan ide", Category: "Galeri foto", Description: "Dokumentasi kegiatan PKM Center.", Color: "blue"},
	}
	for i := range items { items[i].PublishedAt = time.Now(); db.Create(&items[i]) }
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
