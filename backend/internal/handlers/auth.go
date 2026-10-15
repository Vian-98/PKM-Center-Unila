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

// userRoles mengambil semua kode peran pengguna dari tabel user_roles/roles.
func (h AuthHandler) userRoles(userID string) []string {
	var codes []string
	h.DB.Table("user_roles").
		Joins("JOIN roles ON roles.id = user_roles.role_id").
		Where("user_roles.user_id = ?", userID).
		Pluck("roles.code", &codes)
	return codes
}

// primaryRole menentukan peran utama bila seorang user memiliki beberapa peran.
func (h AuthHandler) primaryRole(userID string) string {
	codes := h.userRoles(userID)
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
	roles := h.userRoles(user.ID)
	if len(roles) == 0 && role != "" {
		roles = []string{role}
	}
	now := time.Now()
	h.DB.Model(&models.User{}).Where("id = ?", user.ID).Update("last_login_at", now)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   user.ID,
		"role":  role,
		"roles": roles,
		"exp":   now.Add(24 * time.Hour).Unix(),
	})
	signed, _ := token.SignedString([]byte(h.Secret))
	c.JSON(http.StatusOK, gin.H{
		"token": signed,
		"user":  gin.H{"id": user.ID, "name": user.FullName, "email": user.Email, "role": role, "roles": roles},
	})
}

type switchRoleInput struct {
	Role string `json:"role" binding:"required"`
}

func (h AuthHandler) SwitchRole(c *gin.Context) {
	claims, ok := c.MustGet("user").(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Sesi tidak valid"})
		return
	}
	userID, _ := claims["sub"].(string)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Identitas pengguna tidak ditemukan"})
		return
	}

	var input switchRoleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Peran tujuan wajib ditentukan"})
		return
	}

	roles := h.userRoles(userID)
	currRole, _ := claims["role"].(string)

	allowed := false
	for _, r := range roles {
		if r == input.Role || r == "admin" {
			allowed = true
			break
		}
	}
	if currRole == "admin" {
		allowed = true
	}

	if !allowed {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akun Anda tidak memiliki hak akses untuk peran ini"})
		return
	}

	var user models.User
	if err := h.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Pengguna tidak ditemukan"})
		return
	}

	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   user.ID,
		"role":  input.Role,
		"roles": roles,
		"exp":   now.Add(24 * time.Hour).Unix(),
	})
	signed, _ := token.SignedString([]byte(h.Secret))

	c.JSON(http.StatusOK, gin.H{
		"message": "Berhasil beralih peran",
		"token":   signed,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.FullName,
			"email": user.Email,
			"role":  input.Role,
			"roles": roles,
		},
	})
}

func (h AuthHandler) Me(c *gin.Context) {
	claims, ok := c.MustGet("user").(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Sesi tidak valid"})
		return
	}
	userID, _ := claims["sub"].(string)
	role, _ := claims["role"].(string)

	var user models.User
	if err := h.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Pengguna tidak ditemukan"})
		return
	}
	roles := h.userRoles(userID)

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":    user.ID,
			"name":  user.FullName,
			"email": user.Email,
			"role":  role,
			"roles": roles,
		},
	})
}

type updateProfileInput struct {
	Name                string `json:"name"`
	Phone               string `json:"phone"`
	Faculty             string `json:"faculty"`
	Department          string `json:"department"`
	StudyProgram        string `json:"studyProgram"`
	AcademicPosition    string `json:"academicPosition"`
	Biography           string `json:"biography"`
	SupervisionCapacity int    `json:"supervisionCapacity"`
	IDNumber            string `json:"idNumber"`
}

func (h AuthHandler) UpdateProfile(c *gin.Context) {
	claims, ok := c.MustGet("user").(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Sesi tidak valid"})
		return
	}
	userID, _ := claims["sub"].(string)

	var input updateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data pembaruan tidak valid"})
		return
	}

	var user models.User
	if err := h.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Pengguna tidak ditemukan"})
		return
	}

	if input.Name != "" {
		user.FullName = input.Name
	}
	if input.Phone != "" {
		user.Phone = input.Phone
	}
	h.DB.Save(&user)

	var lp models.LecturerProfile
	if h.DB.Where("user_id = ?", userID).First(&lp).Error == nil {
		if input.Faculty != "" { lp.Faculty = input.Faculty }
		if input.Department != "" { lp.Department = input.Department }
		if input.StudyProgram != "" { lp.StudyProgram = input.StudyProgram }
		if input.AcademicPosition != "" { lp.AcademicPosition = input.AcademicPosition }
		if input.Biography != "" { lp.Biography = input.Biography }
		if input.SupervisionCapacity > 0 { lp.SupervisionCapacity = input.SupervisionCapacity }
		if input.IDNumber != "" { lp.LecturerNumber = input.IDNumber }
		h.DB.Save(&lp)
	}

	var sp models.StudentProfile
	if h.DB.Where("user_id = ?", userID).First(&sp).Error == nil {
		if input.Faculty != "" { sp.Faculty = input.Faculty }
		if input.Department != "" { sp.Department = input.Department }
		if input.StudyProgram != "" { sp.StudyProgram = input.StudyProgram }
		if input.Biography != "" { sp.Biography = input.Biography }
		if input.IDNumber != "" { sp.StudentNumber = input.IDNumber }
		h.DB.Save(&sp)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profil berhasil diperbarui",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.FullName,
			"email": user.Email,
			"phone": user.Phone,
		},
	})
}
