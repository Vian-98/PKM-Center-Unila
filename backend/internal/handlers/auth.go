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

type AuthHandler struct { DB *gorm.DB; Secret string }
type loginInput struct { Email string `json:"email" binding:"required,email"`; Password string `json:"password" binding:"required"` }

func (h AuthHandler) Login(c *gin.Context) {
	var input loginInput
	if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"message": "Email dan kata sandi wajib valid"}); return }
	var user models.User
	if err := h.DB.Where("email = ?", input.Email).First(&user).Error; err != nil || bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)) != nil { c.JSON(http.StatusUnauthorized, gin.H{"message": "Email atau kata sandi tidak tepat"}); return }
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"sub": user.ID, "role": user.Role, "exp": time.Now().Add(24*time.Hour).Unix()})
	signed, _ := token.SignedString([]byte(h.Secret))
	c.JSON(http.StatusOK, gin.H{"token": signed, "user": gin.H{"id": user.ID, "name": user.Name, "email": user.Email, "role": user.Role}})
}

func (h AuthHandler) Me(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"user": c.MustGet("user")}) }
