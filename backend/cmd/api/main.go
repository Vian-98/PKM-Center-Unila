package main

import (
	"log"

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
	if err := db.AutoMigrate(&models.User{}); err != nil { log.Fatal(err) }
	seedUsers(db)
	secret := config.Env("JWT_SECRET", "development-secret")
	r := gin.Default()
	r.Use(cors.New(cors.Config{AllowOrigins: []string{config.Env("CORS_ORIGIN", "http://localhost:5173")}, AllowMethods: []string{"GET", "POST", "OPTIONS"}, AllowHeaders: []string{"Origin", "Content-Type", "Authorization"}}))
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	auth := handlers.AuthHandler{DB: db, Secret: secret}
	api := r.Group("/api")
	api.POST("/auth/login", auth.Login)
	api.GET("/auth/me", middleware.RequireAuth(secret), auth.Me)
	api.GET("/admin/overview", middleware.RequireAuth(secret, string(models.RoleAdmin)), func(c *gin.Context) { c.JSON(200, gin.H{"message": "Selamat datang, Admin PKM Center"}) })
	r.Run(":" + config.Env("PORT", "8080"))
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
