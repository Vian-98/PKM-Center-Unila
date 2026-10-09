package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

type AuthHandler struct {
	DB     *gorm.DB
	Secret string
}

type loginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// rolePriority menentukan peran utama bila seorang user memiliki beberapa peran.
var rolePriority = []string{"admin", "pimpinan", "dosen", "reviewer", "mahasiswa"}

// primaryRole mengambil kode peran dari tabel user_roles/roles (skema v2).
func (h AuthHandler) primaryRole(userID string) string {
	var codes []string
	h.DB.Table("user_roles").
		Joins("JOIN roles ON roles.id = user_roles.role_id").
		Where("user_roles.user_id = ?", userID).
		Pluck("roles.code", &codes)
	for _, preferred := range rolePriority {
		for _, code := range codes {
			if code == preferred {
				return code
			}
		}
	}
	if len(codes) > 0 {
		return codes[0]
	}
	return ""
}

func (h AuthHandler) Login(c *gin.Context) {
	var input loginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Email dan kata sandi wajib valid"})
		return
	}
	var user models.User
	if err := h.DB.Where("email = ?", input.Email).First(&user).Error; err != nil ||
		bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Email atau kata sandi tidak tepat"})
		return
	}
	role := h.primaryRole(user.ID)
	now := time.Now()
	h.DB.Model(&models.User{}).Where("id = ?", user.ID).Update("last_login_at", now)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": role,
		"exp":  now.Add(24 * time.Hour).Unix(),
	})
	signed, _ := token.SignedString([]byte(h.Secret))
	c.JSON(http.StatusOK, gin.H{
		"token": signed,
		"user":  gin.H{"id": user.ID, "name": user.FullName, "email": user.Email, "role": role},
	})
}

func (h AuthHandler) Me(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"user": c.MustGet("user")}) }
