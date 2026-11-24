package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

// IdeaHandler menangani tahap 2 "Seleksi Ide" dan pengaturan bidang reviewer.
// Reviewer hanya dapat melihat dan memutus ide/proposal dari bidang yang dipegangnya.
type IdeaHandler struct {
	DB *gorm.DB
}

// reviewerFieldIDs mengembalikan id bidang (expertise_fields) yang dipegang reviewer.
func reviewerFieldIDs(db *gorm.DB, userID string) []int64 {
	ids := []int64{}
	db.Model(&models.UserExpertise{}).Where("user_id = ?", userID).Pluck("expertise_id", &ids)
	return ids
}

// isAdmin: admin boleh melihat seluruh bidang.
func isAdmin(c *gin.Context) bool {
	role, _ := c.Get("role")
	return role == "admin"
}

// ListFields mengembalikan daftar bidang baku (publik, untuk form pengajuan).
func (h IdeaHandler) ListFields(c *gin.Context) {
	fields := []models.ExpertiseField{}
	h.DB.Order("id").Find(&fields)
	c.JSON(http.StatusOK, gin.H{"data": fields})
}

type ideaInput struct {
	FieldID      int64  `json:"fieldId" binding:"required"`
	SchemeCode   string `json:"schemeCode"`
	Title        string `json:"title" binding:"required"`
	Problem      string `json:"problem" binding:"required"`
	Solution     string `json:"solution" binding:"required"`
	Novelty      string `json:"novelty"`
	TargetOutput string `json:"targetOutput"`
}

func (in *ideaInput) normalize() string {
	in.Title = strings.TrimSpace(in.Title)
	in.Problem = strings.TrimSpace(in.Problem)
	in.Solution = strings.TrimSpace(in.Solution)
	in.Novelty = strings.TrimSpace(in.Novelty)
	in.TargetOutput = strings.TrimSpace(in.TargetOutput)
	in.SchemeCode = strings.TrimSpace(in.SchemeCode)
	switch {
	case in.Title == "" || in.Problem == "" || in.Solution == "":
		return "Judul, permasalahan, dan solusi ide wajib diisi"
	case len([]rune(in.Title)) > 255:
		return "Judul ide maksimal 255 karakter"
	}
	return ""
}

func (h IdeaHandler) fieldExists(id int64) bool {
	var count int64
	h.DB.Model(&models.ExpertiseField{}).Where("id = ?", id).Count(&count)
	return count > 0
}

// StudentSubmit: mahasiswa mengajukan ide awal ke bidang tertentu.
func (h IdeaHandler) StudentSubmit(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var in ideaInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bidang, judul, permasalahan, dan solusi ide wajib diisi"})
		return
	}
	if msg := in.normalize(); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": msg})
		return
	}
	if !h.fieldExists(in.FieldID) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bidang tidak dikenal"})
		return
	}

	idea := models.IdeaSubmission{
		StudentID:        userID,
		ExpertiseFieldID: in.FieldID,
		SchemeCode:       in.SchemeCode,
		Title:            in.Title,
		Problem:          in.Problem,
		Solution:         in.Solution,
		Novelty:          in.Novelty,
		TargetOutput:     in.TargetOutput,
		Status:           "submitted",
	}
	if err := h.DB.Create(&idea).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan pengajuan ide"})
		return
	}
	StudentHandler{DB: h.DB}.notify(userID, "status_change", "Ide berhasil diajukan",
		fmt.Sprintf("Ide \"%s\" masuk tahap seleksi ide dan menunggu penilaian reviewer bidang.", idea.Title), "#mahasiswa/ajukan-ide")
	c.JSON(http.StatusCreated, gin.H{"message": "Ide berhasil diajukan", "data": idea})
}

// StudentUpdate: mahasiswa memperbaiki ide berstatus "revision" lalu mengajukan ulang.
func (h IdeaHandler) StudentUpdate(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var idea models.IdeaSubmission
	if err := h.DB.Where("id = ? AND student_id = ?", c.Param("id"), userID).First(&idea).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Ide tidak ditemukan"})
		return
	}
	if idea.Status != "revision" {
		c.JSON(http.StatusConflict, gin.H{"message": "Hanya ide berstatus perlu revisi yang dapat diubah"})
		return
	}
	var in ideaInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bidang, judul, permasalahan, dan solusi ide wajib diisi"})
		return
	}
	if msg := in.normalize(); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": msg})
		return
	}
	if !h.fieldExists(in.FieldID) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bidang tidak dikenal"})
		return
	}
	h.DB.Model(&idea).Updates(map[string]any{
		"expertise_field_id": in.FieldID, "scheme_code": in.SchemeCode, "title": in.Title,
		"problem": in.Problem, "solution": in.Solution, "novelty": in.Novelty,
		"target_output": in.TargetOutput, "status": "submitted", "updated_at": time.Now(),
	})
	c.JSON(http.StatusOK, gin.H{"message": "Ide diperbarui dan diajukan ulang", "data": idea})
}

type ideaRow struct {
	ID           string     `json:"id"`
	StudentID    string     `json:"studentId"`
	StudentName  string     `json:"studentName"`
	StudentNPM   string     `json:"studentNpm"`
	Faculty      string     `json:"faculty"`
	StudyProgram string     `json:"studyProgram"`
	FieldID      int64      `json:"fieldId"`
	FieldName    string     `json:"fieldName"`
	SchemeCode   string     `json:"schemeCode"`
	Title        string     `json:"title"`
	Problem      string     `json:"problem"`
	Solution     string     `json:"solution"`
	Novelty      string     `json:"novelty"`
	TargetOutput string     `json:"targetOutput"`
	Status       string     `json:"status"`
	Score        *float64   `json:"score"`
	ReviewerName string     `json:"reviewerName"`
	ReviewerNote string     `json:"reviewerNote"`
	ReviewedAt   *time.Time `json:"reviewedAt"`
	CreatedAt    time.Time  `json:"createdAt"`
}

func (h IdeaHandler) ideaQuery() *gorm.DB {
	return h.DB.Table("idea_submissions i").
		Select(`i.id, i.student_id, u.full_name AS student_name, sp.student_number AS student_npm,
		        sp.faculty, sp.study_program, i.expertise_field_id AS field_id, f.name AS field_name,
		        i.scheme_code, i.title, i.problem, i.solution, i.novelty, i.target_output, i.status,
		        i.score, rv.full_name AS reviewer_name, i.reviewer_note, i.reviewed_at, i.created_at`).
		Joins("JOIN users u ON u.id = i.student_id").
		Joins("JOIN expertise_fields f ON f.id = i.expertise_field_id").
		Joins("LEFT JOIN student_profiles sp ON sp.user_id = i.student_id").
		Joins("LEFT JOIN users rv ON rv.id = i.reviewer_id")
}

// StudentList: riwayat ide milik mahasiswa beserta keputusan reviewer.
func (h IdeaHandler) StudentList(c *gin.Context) {
	rows := []ideaRow{}
	h.ideaQuery().Where("i.student_id = ?", getUserIDFromContext(c)).Order("i.created_at DESC").Scan(&rows)
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// ReviewerFields: bidang yang dipegang reviewer login.
func (h IdeaHandler) ReviewerFields(c *gin.Context) {
	fields := []models.ExpertiseField{}
	q := h.DB.Order("id")
	if !isAdmin(c) {
		q = q.Where("id IN ?", append(reviewerFieldIDs(h.DB, getUserIDFromContext(c)), 0))
	}
	q.Find(&fields)
	c.JSON(http.StatusOK, gin.H{"data": fields, "allFields": isAdmin(c)})
}

// ReviewerList: ide dari bidang reviewer, opsional difilter status.
func (h IdeaHandler) ReviewerList(c *gin.Context) {
	q := h.ideaQuery()
	if !isAdmin(c) {
		q = q.Where("i.expertise_field_id IN ?", append(reviewerFieldIDs(h.DB, getUserIDFromContext(c)), 0))
	}
	if status := c.Query("status"); status != "" {
		q = q.Where("i.status = ?", status)
	}
	rows := []ideaRow{}
	q.Order("CASE WHEN i.status = 'submitted' THEN 0 ELSE 1 END, i.created_at DESC").Scan(&rows)
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

var ideaDecisionLabel = map[string]string{
	"accepted": "lolos seleksi ide",
	"revision": "perlu revisi",
	"rejected": "tidak lolos seleksi ide",
}

// ReviewerDecide: reviewer sebidang memutus ide (lolos / perlu revisi / tidak lolos).
func (h IdeaHandler) ReviewerDecide(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var in struct {
		Decision string   `json:"decision" binding:"required"`
		Note     string   `json:"note"`
		Score    *float64 `json:"score"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Keputusan seleksi wajib dipilih"})
		return
	}
	label, ok := ideaDecisionLabel[in.Decision]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Keputusan harus accepted, revision, atau rejected"})
		return
	}
	in.Note = strings.TrimSpace(in.Note)
	if in.Decision != "accepted" && in.Note == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Catatan wajib diisi untuk keputusan revisi atau tidak lolos"})
		return
	}
	if in.Score != nil && (*in.Score < 0 || *in.Score > 100) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Skor harus di antara 0 dan 100"})
		return
	}

	var idea models.IdeaSubmission
	if err := h.DB.Where("id = ?", c.Param("id")).First(&idea).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Ide tidak ditemukan"})
		return
	}
	if !isAdmin(c) {
		allowed := false
		for _, id := range reviewerFieldIDs(h.DB, userID) {
			if id == idea.ExpertiseFieldID {
				allowed = true
			}
		}
		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"message": "Ide ini di luar bidang yang Anda pegang"})
			return
		}
	}

	now := time.Now()
	h.DB.Model(&idea).Updates(map[string]any{
		"status": in.Decision, "reviewer_note": in.Note, "score": in.Score,
		"reviewer_id": userID, "reviewed_at": now, "updated_at": now,
	})
	msg := fmt.Sprintf("Ide \"%s\" dinyatakan %s.", idea.Title, label)
	if in.Decision == "accepted" {
		msg += " Lanjutkan ke pembentukan tim dan pencarian dosen pembimbing."
	}
	if in.Note != "" {
		msg += " Catatan reviewer: " + in.Note
	}
	StudentHandler{DB: h.DB}.notify(idea.StudentID, "status_change", "Hasil seleksi ide", msg, "#mahasiswa/ajukan-ide")
	c.JSON(http.StatusOK, gin.H{"message": "Keputusan seleksi ide tersimpan"})
}

// AdminListReviewers: akun reviewer beserta bidang yang dipegang.
func (h IdeaHandler) AdminListReviewers(c *gin.Context) {
	type reviewerRow struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	rows := []reviewerRow{}
	h.DB.Raw(`
		SELECT DISTINCT u.id, u.full_name AS name, u.email
		FROM users u
		JOIN user_roles ur ON ur.user_id = u.id
		JOIN roles r ON r.id = ur.role_id
		WHERE r.code = 'reviewer'
		ORDER BY u.full_name
	`).Scan(&rows)

	out := make([]gin.H, 0, len(rows))
	for _, r := range rows {
		out = append(out, gin.H{"id": r.ID, "name": r.Name, "email": r.Email, "fieldIds": reviewerFieldIDs(h.DB, r.ID)})
	}
	c.JSON(http.StatusOK, gin.H{"data": out})
}

// AdminSetReviewerFields: admin menetapkan bidang yang dipegang seorang reviewer.
func (h IdeaHandler) AdminSetReviewerFields(c *gin.Context) {
	reviewerID := c.Param("id")
	var in struct {
		FieldIDs []int64 `json:"fieldIds"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Daftar bidang tidak valid"})
		return
	}
	var isReviewer int64
	h.DB.Raw(`SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
	          WHERE ur.user_id = ? AND r.code = 'reviewer'`, reviewerID).Scan(&isReviewer)
	if isReviewer == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Akun reviewer tidak ditemukan"})
		return
	}
	seen := map[int64]bool{}
	unique := []int64{}
	for _, id := range in.FieldIDs {
		if !h.fieldExists(id) {
			c.JSON(http.StatusBadRequest, gin.H{"message": fmt.Sprintf("Bidang %d tidak dikenal", id)})
			return
		}
		if !seen[id] {
			seen[id] = true
			unique = append(unique, id)
		}
	}
	in.FieldIDs = unique

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", reviewerID).Delete(&models.UserExpertise{}).Error; err != nil {
			return err
		}
		for _, id := range in.FieldIDs {
			if err := tx.Create(&models.UserExpertise{UserID: reviewerID, ExpertiseID: id, ExpertiseLevel: "expert"}).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan bidang reviewer"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Bidang reviewer diperbarui", "fieldIds": in.FieldIDs})
}
