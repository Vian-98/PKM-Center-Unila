package handlers

import (
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"pkm-center/backend/internal/config"
	"pkm-center/backend/internal/models"
)

type AuthHandler struct {
	DB     *gorm.DB
	Secret string
}

type loginInput struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// rolePriority menentukan peran utama bila seorang user memiliki beberapa peran.
var rolePriority = []string{"admin", "admin_akun", "pimpinan", "dosen", "reviewer", "mahasiswa"}

// generateUUID menghasilkan UUID v4 tanpa dependensi eksternal.
func generateUUID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

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
		c.JSON(http.StatusBadRequest, gin.H{"message": "Identitas akun dan kata sandi wajib diisi"})
		return
	}

	ident := strings.TrimSpace(input.Email)
	var user models.User

	// 1. Cek langsung kecocokan email
	err := h.DB.Where("LOWER(email) = LOWER(?)", ident).First(&user).Error

	// 2. Jika tidak ditemukan dan bukan format email (tidak ada @), coba alias domain kampus
	if err != nil && !strings.Contains(ident, "@") {
		aliasEmail := strings.ToLower(ident) + "@pkm.unila.ac.id"
		err = h.DB.Where("LOWER(email) = LOWER(?)", aliasEmail).First(&user).Error
	}

	// 3. Jika belum ditemukan, cari berdasarkan NPM pada student_profiles
	if err != nil {
		var sp models.StudentProfile
		if spErr := h.DB.Where("student_number = ?", ident).First(&sp).Error; spErr == nil {
			err = h.DB.Where("id = ?", sp.UserID).First(&user).Error
		}
	}

	// 4. Jika belum ditemukan, cari berdasarkan NIP/NIDN pada lecturer_profiles
	if err != nil {
		var lp models.LecturerProfile
		if lpErr := h.DB.Where("lecturer_number = ?", ident).First(&lp).Error; lpErr == nil {
			err = h.DB.Where("id = ?", lp.UserID).First(&user).Error
		}
	}

	if err != nil || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Email, NPM/NIP, atau kata sandi tidak tepat"})
		return
	}

	// Pemeriksaan status verifikasi akun oleh Admin Akun
	if user.AccountStatus == "pending" {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Akun Anda sedang dalam status MENUNGGU VERIFIKASI data dan foto KTM oleh Admin Akun PKM Center. Silakan menunggu proses persetujuan.",
			"status":  "pending",
		})
		return
	}
	if user.AccountStatus == "rejected" {
		var sp models.StudentProfile
		reason := "Data atau foto KTM belum memenuhi ketentuan."
		if h.DB.Where("user_id = ?", user.ID).First(&sp).Error == nil && sp.RejectionReason != "" {
			reason = sp.RejectionReason
		}
		c.JSON(http.StatusForbidden, gin.H{
			"message":         "Pendaftaran akun Anda DITOLAK oleh Admin Akun. Alasan: " + reason,
			"status":          "rejected",
			"rejectionReason": reason,
		})
		return
	}
	if user.AccountStatus == "suspended" || user.AccountStatus == "inactive" {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Akun Anda telah dinonaktifkan atau ditangguhkan oleh Administrator.",
			"status":  user.AccountStatus,
		})
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
		if r == input.Role || r == "admin" || r == "admin_akun" {
			allowed = true
			break
		}
	}
	if currRole == "admin" || currRole == "admin_akun" {
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

// ---------- REGISTRASI & VERIFIKASI AKUN MAHASISWA (ADMIN AKUN) ----------

type registerStudentInput struct {
	Name              string `json:"name" binding:"required"`
	NPM               string `json:"npm"`
	StudentNumber     string `json:"student_number"`
	Email             string `json:"email" binding:"required"`
	Password          string `json:"password" binding:"required"`
	Phone             string `json:"phone"`
	Faculty           string `json:"faculty"`
	Department        string `json:"department"`
	StudyProgram      string `json:"studyProgram"`
	StudyProgramSnake string `json:"study_program"`
	EntryYear         int    `json:"entryYear"`
	EntryYearSnake    int    `json:"entry_year"`
	KtmURL            string `json:"ktmUrl"`
	KtmURLSnake       string `json:"ktm_url"`
}

// RegisterStudent menangani pendaftaran akun mahasiswa baru dengan unggahan foto KTM
func (h AuthHandler) RegisterStudent(c *gin.Context) {
	var input registerStudentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Semua data pendaftaran wajib diisi lengkap, termasuk foto KTM"})
		return
	}

	if input.NPM == "" {
		input.NPM = input.StudentNumber
	}
	if input.StudyProgram == "" {
		input.StudyProgram = input.StudyProgramSnake
	}
	if input.EntryYear == 0 {
		input.EntryYear = input.EntryYearSnake
	}
	if input.KtmURL == "" {
		input.KtmURL = input.KtmURLSnake
	}

	if strings.TrimSpace(input.NPM) == "" || strings.TrimSpace(input.KtmURL) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "NPM dan foto KTM wajib disertakan dalam pendaftaran"})
		return
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.NPM = strings.TrimSpace(input.NPM)
	input.Name = strings.TrimSpace(input.Name)

	if len(input.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Kata sandi minimal 6 karakter"})
		return
	}

	// 1. Validasi apakah Email sudah terdaftar
	var existingUser models.User
	if err := h.DB.Where("LOWER(email) = ?", input.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda."})
		return
	}

	// 2. Validasi apakah NPM sudah terdaftar
	var existingProfile models.StudentProfile
	if err := h.DB.Where("student_number = ?", input.NPM).First(&existingProfile).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "NPM ini sudah terdaftar. Silakan hubungi Admin Akun PKM Center jika Anda mengalami kendala."})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengenkripsi kata sandi"})
		return
	}

	newUserID := generateUUID()
	now := time.Now()
	user := models.User{
		ID:            newUserID,
		Email:         input.Email,
		PasswordHash:  string(hash),
		FullName:      input.Name,
		Phone:         strings.TrimSpace(input.Phone),
		AccountStatus: "pending", // Status pending verifikasi oleh Admin Akun
		AuthProvider:  "local",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat akun: " + err.Error()})
		return
	}

	// Daftarkan role mahasiswa
	var role models.Role
	if err := h.DB.Where("code = ?", "mahasiswa").First(&role).Error; err == nil {
		_ = h.DB.Create(&models.UserRole{UserID: newUserID, RoleID: role.ID}).Error
	}

	if input.EntryYear <= 0 {
		input.EntryYear = time.Now().Year()
	}

	profile := models.StudentProfile{
		UserID:         newUserID,
		StudentNumber:  input.NPM,
		Faculty:        strings.TrimSpace(input.Faculty),
		Department:     strings.TrimSpace(input.Department),
		StudyProgram:   strings.TrimSpace(input.StudyProgram),
		EntryYear:      input.EntryYear,
		AcademicStatus: "active",
		KtmURL:         strings.TrimSpace(input.KtmURL),
	}
	if err := h.DB.Create(&profile).Error; err != nil {
		log.Printf("Gagal menyimpan profil mahasiswa: %v", err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Pendaftaran berhasil! Akun Anda sedang dalam status MENUNGGU VERIFIKASI foto KTM oleh Admin Akun PKM Center. Anda dapat masuk setelah berkas Anda disetujui (ACC).",
		"data": gin.H{
			"userId":        user.ID,
			"name":          user.FullName,
			"email":         user.Email,
			"npm":           input.NPM,
			"accountStatus": user.AccountStatus,
		},
	})
}

// UploadKTM menangani pengunggahan berkas foto Kartu Tanda Mahasiswa (KTM)
func (h AuthHandler) UploadKTM(c *gin.Context) {
	file, err := c.FormFile("ktm")
	if err != nil {
		file, err = c.FormFile("file")
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Berkas foto KTM wajib disertakan"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format berkas KTM harus berupa gambar (JPG, PNG, WEBP) atau PDF"})
		return
	}

	uploadDir := config.Env("UPLOAD_DIR", "uploads")
	ktmDir := filepath.Join(uploadDir, "ktm")
	_ = os.MkdirAll(ktmDir, 0o755)

	storedName := fmt.Sprintf("ktm_%d_%s%s", time.Now().UnixNano(), generateUUID()[:8], ext)
	targetPath := filepath.Join(ktmDir, storedName)

	if err := c.SaveUploadedFile(file, targetPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan berkas foto KTM: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Foto KTM berhasil diunggah",
		"url":     "/uploads/ktm/" + storedName,
		"ktm_url": "/uploads/ktm/" + storedName,
		"ktmUrl":  "/uploads/ktm/" + storedName,
	})
}

// StudentVerificationItem merepresentasikan baris akun mahasiswa yang diperiksa oleh Admin Akun
type StudentVerificationItem struct {
	ID              string     `json:"id"`
	Name            string     `json:"name"`
	Email           string     `json:"email"`
	Phone           string     `json:"phone"`
	AccountStatus   string     `json:"accountStatus"`
	CreatedAt       time.Time  `json:"createdAt"`
	StudentNumber   string     `json:"studentNumber"`
	Faculty         string     `json:"faculty"`
	Department      string     `json:"department"`
	StudyProgram    string     `json:"studyProgram"`
	EntryYear       int        `json:"entryYear"`
	KtmURL          string     `json:"ktmUrl"`
	RejectionReason string     `json:"rejectionReason"`
	VerifiedAt      *time.Time `json:"verifiedAt"`
	VerifiedBy      *string    `json:"verifiedBy"`
	VerifiedByName  string     `json:"verifiedByName"`
}

// ListStudentsForVerification menampilkan daftar mahasiswa untuk dikelola/diverifikasi Admin Akun
func (h AuthHandler) ListStudentsForVerification(c *gin.Context) {
	statusFilter := strings.TrimSpace(strings.ToLower(c.Query("status")))
	searchQuery := strings.TrimSpace(strings.ToLower(c.Query("search")))

	type queryResult struct {
		ID              string
		FullName        string
		Email           string
		Phone           string
		AccountStatus   string
		CreatedAt       time.Time
		StudentNumber   string
		Faculty         string
		Department      string
		StudyProgram    string
		EntryYear       int
		KtmURL          string
		RejectionReason string
		VerifiedAt      *time.Time
		VerifiedBy      *string
		VerifiedByName  *string
	}

	query := h.DB.Table("users").
		Select(`users.id, users.full_name, users.email, users.phone, users.account_status, users.created_at,
		        student_profiles.student_number, student_profiles.faculty, student_profiles.department,
		        student_profiles.study_program, student_profiles.entry_year, student_profiles.ktm_url,
		        student_profiles.rejection_reason, student_profiles.verified_at, student_profiles.verified_by,
		        verifier.full_name AS verified_by_name`).
		Joins("JOIN student_profiles ON student_profiles.user_id = users.id").
		Joins("LEFT JOIN users AS verifier ON verifier.id = student_profiles.verified_by")

	if statusFilter != "" && statusFilter != "all" {
		query = query.Where("users.account_status = ?", statusFilter)
	}

	if searchQuery != "" {
		likeTerm := "%" + searchQuery + "%"
		query = query.Where("(LOWER(users.full_name) LIKE ? OR LOWER(users.email) LIKE ? OR LOWER(student_profiles.student_number) LIKE ? OR LOWER(student_profiles.faculty) LIKE ?)",
			likeTerm, likeTerm, likeTerm, likeTerm)
	}

	var results []queryResult
	if err := query.Order("users.created_at desc").Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data verifikasi akun: " + err.Error()})
		return
	}

	items := make([]StudentVerificationItem, len(results))
	for i, r := range results {
		vName := ""
		if r.VerifiedByName != nil {
			vName = *r.VerifiedByName
		}
		items[i] = StudentVerificationItem{
			ID:              r.ID,
			Name:            r.FullName,
			Email:           r.Email,
			Phone:           r.Phone,
			AccountStatus:   r.AccountStatus,
			CreatedAt:       r.CreatedAt,
			StudentNumber:   r.StudentNumber,
			Faculty:         r.Faculty,
			Department:      r.Department,
			StudyProgram:    r.StudyProgram,
			EntryYear:       r.EntryYear,
			KtmURL:          r.KtmURL,
			RejectionReason: r.RejectionReason,
			VerifiedAt:      r.VerifiedAt,
			VerifiedBy:      r.VerifiedBy,
			VerifiedByName:  vName,
		}
	}

	// Hitung statistik ringkasan
	var totalAll, totalPending, totalActive, totalRejected int64
	h.DB.Table("users").Joins("JOIN student_profiles ON student_profiles.user_id = users.id").Count(&totalAll)
	h.DB.Table("users").Joins("JOIN student_profiles ON student_profiles.user_id = users.id").Where("users.account_status = ?", "pending").Count(&totalPending)
	h.DB.Table("users").Joins("JOIN student_profiles ON student_profiles.user_id = users.id").Where("users.account_status = ?", "active").Count(&totalActive)
	h.DB.Table("users").Joins("JOIN student_profiles ON student_profiles.user_id = users.id").Where("users.account_status = ?", "rejected").Count(&totalRejected)

	c.JSON(http.StatusOK, gin.H{
		"data": items,
		"stats": gin.H{
			"total":    totalAll,
			"pending":  totalPending,
			"active":   totalActive,
			"rejected": totalRejected,
		},
	})
}

type updateAccountStatusInput struct {
	Status          string `json:"status" binding:"required"` // "active", "rejected", "pending"
	Reason          string `json:"reason"`
	RejectionReason string `json:"rejection_reason"`
}

// UpdateStudentStatus menangani persetujuan (ACC) atau penolakan akun oleh Admin Akun
func (h AuthHandler) UpdateStudentStatus(c *gin.Context) {
	studentUserID := c.Param("id")
	if studentUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID mahasiswa wajib disertakan"})
		return
	}

	var input updateAccountStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format status tidak valid"})
		return
	}

	input.Status = strings.TrimSpace(strings.ToLower(input.Status))
	if input.Status != "active" && input.Status != "rejected" && input.Status != "pending" && input.Status != "suspended" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Status harus 'active', 'rejected', 'pending', atau 'suspended'"})
		return
	}

	claims, _ := c.MustGet("user").(jwt.MapClaims)
	adminID, _ := claims["sub"].(string)

	var user models.User
	if err := h.DB.Where("id = ?", studentUserID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Pengguna tidak ditemukan"})
		return
	}

	user.AccountStatus = input.Status
	now := time.Now()
	user.UpdatedAt = now
	h.DB.Save(&user)

	var sp models.StudentProfile
	if err := h.DB.Where("user_id = ?", studentUserID).First(&sp).Error; err == nil {
		sp.VerifiedAt = &now
		if adminID != "" {
			sp.VerifiedBy = &adminID
		}
		if input.Status == "rejected" {
			r := strings.TrimSpace(input.Reason)
			if r == "" {
				r = strings.TrimSpace(input.RejectionReason)
			}
			if r == "" {
				r = "Foto KTM atau data pendaftaran tidak memenuhi kualifikasi."
			}
			sp.RejectionReason = r
		} else if input.Status == "active" {
			sp.RejectionReason = "" // Bersihkan alasan penolakan jika sudah di-ACC
		}
		h.DB.Save(&sp)
	}

	statusLabel := "disetujui (ACC)"
	if input.Status == "rejected" {
		statusLabel = "ditolak"
	} else if input.Status == "pending" {
		statusLabel = "dikembalikan ke antrean verifikasi"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Akun mahasiswa %s berhasil %s.", user.FullName, statusLabel),
		"data": gin.H{
			"id":            user.ID,
			"name":          user.FullName,
			"accountStatus": user.AccountStatus,
		},
	})
}

// DeleteStudentAccount memungkinkan Admin Akun menghapus akun mahasiswa pendaftar (jika spam / tidak valid)
func (h AuthHandler) DeleteStudentAccount(c *gin.Context) {
	studentUserID := c.Param("id")
	if studentUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID mahasiswa wajib disertakan"})
		return
	}

	var user models.User
	if err := h.DB.Where("id = ?", studentUserID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Akun tidak ditemukan"})
		return
	}

	// Hapus student_profile & user_roles (cascade jika ada)
	h.DB.Where("user_id = ?", studentUserID).Delete(&models.StudentProfile{})
	h.DB.Where("user_id = ?", studentUserID).Delete(&models.UserRole{})
	h.DB.Delete(&user)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Akun %s berhasil dihapus dari sistem", user.FullName),
	})
}
