package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

type ReviewerHandler struct {
	DB *gorm.DB
}

// GetOverview mengembalikan statistik antrean penilaian reviewer
func (h ReviewerHandler) GetOverview(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	var totalAssignments int64
	h.DB.Model(&models.ReviewAssignment{}).Where("reviewer_id = ?", userID).Count(&totalAssignments)

	var pendingCount int64
	h.DB.Model(&models.ReviewAssignment{}).Where("reviewer_id = ? AND status = ?", userID, "assigned").Count(&pendingCount)

	var inProgressCount int64
	h.DB.Model(&models.ReviewAssignment{}).Where("reviewer_id = ? AND status = ?", userID, "in_progress").Count(&inProgressCount)

	var completedCount int64
	h.DB.Model(&models.ReviewAssignment{}).Where("reviewer_id = ? AND status = ?", userID, "completed").Count(&completedCount)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"totalAssignments": totalAssignments,
			"pendingCount":     pendingCount,
			"inProgressCount":  inProgressCount,
			"completedCount":   completedCount,
		},
	})
}

// GetAssignments mengembalikan daftar antrean penilaian reviewer (pasca-deadline)
func (h ReviewerHandler) GetAssignments(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	type AssignmentItem struct {
		ID             string     `json:"id"`
		ProposalID     string     `json:"proposalId"`
		ProposalTitle  string     `json:"proposalTitle"`
		SchemeCode     string     `json:"schemeCode"`
		SchemeName     string     `json:"schemeName"`
		TeamName       string     `json:"teamName"`
		LeaderName     string     `json:"leaderName"`
		Faculty        string     `json:"faculty"`
		Status         string     `json:"status"` // assigned, in_progress, completed
		ReviewDeadline *time.Time `json:"reviewDeadline"`
		AssignedAt     time.Time  `json:"assignedAt"`
		TotalScore     *float64   `json:"totalScore"`
		Recommendation *string    `json:"recommendation"`
		ReviewStatus   *string    `json:"reviewStatus"`
	}

	var items []AssignmentItem
	rows, err := h.DB.Table("review_assignments ra").
		Select(`ra.id, ra.proposal_id, p.title as proposal_title, s.code as scheme_code,
		        s.name as scheme_name, t.name as team_name, u.full_name as leader_name,
		        sp.faculty, ra.status, ra.review_deadline, ra.assigned_at,
		        r.total_score, r.recommendation, r.review_status`).
		Joins("JOIN proposals p ON p.id = ra.proposal_id").
		Joins("JOIN pkm_schemes s ON s.id = p.scheme_id").
		Joins("JOIN teams t ON t.id = p.team_id").
		Joins("JOIN users u ON u.id = t.leader_id").
		Joins("LEFT JOIN student_profiles sp ON sp.user_id = u.id").
		Joins("LEFT JOIN reviews r ON r.assignment_id = ra.id").
		Where("ra.reviewer_id = ?", userID).
		Order("ra.assigned_at DESC").
		Rows()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat antrean review"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var item AssignmentItem
		if err := h.DB.ScanRows(rows, &item); err == nil {
			items = append(items, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GetAssignmentDetail mengembalikan detail penugasan beserta proposal, dokumen, kriteria rubrik, dan nilai
func (h ReviewerHandler) GetAssignmentDetail(c *gin.Context) {
	userID := getUserIDFromContext(c)
	assignmentID := c.Param("id")

	var assignment models.ReviewAssignment
	if err := h.DB.Where("id = ? AND reviewer_id = ?", assignmentID, userID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Penugasan review tidak ditemukan"})
		return
	}

	var proposal models.Proposal
	h.DB.Where("id = ?", assignment.ProposalID).First(&proposal)

	var scheme models.PKMScheme
	h.DB.Where("id = ?", proposal.SchemeID).First(&scheme)

	var team models.Team
	h.DB.Where("id = ?", proposal.TeamID).First(&team)

	var leader models.User
	h.DB.Where("id = ?", team.LeaderID).First(&leader)

	var studentProfile models.StudentProfile
	h.DB.Where("user_id = ?", leader.ID).First(&studentProfile)

	var documents []models.ProposalDocument
	h.DB.Where("proposal_id = ?", proposal.ID).Order("version_number DESC").Find(&documents)

	// Kriteria penilaian rubrik untuk skema ini
	var criteria []models.ReviewCriteria
	h.DB.Where("scheme_id = ?", scheme.ID).Find(&criteria)

	// Jika belum ada kriteria terdaftar di DB untuk skema ini, generate kriteria standar PKM
	if len(criteria) == 0 {
		defaultCriteria := []models.ReviewCriteria{
			{SchemeID: scheme.ID, Name: "Format & Administrasi", Description: "Kesesuaian format pedoman PKM, tata tulis, dan kelengkapan lampiran.", MaxScore: 100, Weight: 0.15},
			{SchemeID: scheme.ID, Name: "Gagasan & Kreativitas", Description: "Ketajaman perumusan masalah, orisinalitas ide, dan nilai kebaruan (novelty).", MaxScore: 100, Weight: 0.25},
			{SchemeID: scheme.ID, Name: "Metodologi & Rencana Kerja", Description: "Ketepatan metode pelaksanaan, alur kegiatan, dan instrumen yang digunakan.", MaxScore: 100, Weight: 0.30},
			{SchemeID: scheme.ID, Name: "Potensi Dampak & Luaran", Description: "Kemanfaatan bagi mitra/masyarakat/iptek dan ketercapaian target luaran wajib.", MaxScore: 100, Weight: 0.20},
			{SchemeID: scheme.ID, Name: "Anggaran & Jadwal", Description: "Kewajaran rencana anggaran biaya (RAB) dan kesesuaian timeline kegiatan.", MaxScore: 100, Weight: 0.10},
		}
		for _, dc := range defaultCriteria {
			h.DB.Create(&dc)
		}
		h.DB.Where("scheme_id = ?", scheme.ID).Find(&criteria)
	}

	// Data review yang sudah ada (jika pernah disimpan)
	var review models.Review
	h.DB.Where("assignment_id = ?", assignment.ID).First(&review)

	var scores []models.ReviewScore
	if review.ID != "" {
		h.DB.Where("review_id = ?", review.ID).Find(&scores)
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"assignment": assignment,
			"proposal": gin.H{
				"id":           proposal.ID,
				"title":        proposal.Title,
				"abstract":     proposal.Abstract,
				"keywords":     proposal.Keywords,
				"status":       proposal.Status,
				"scheme":       scheme,
				"team":         team,
				"leader":       leader,
				"faculty":      studentProfile.Faculty,
				"studyProgram": studentProfile.StudyProgram,
			},
			"documents": documents,
			"criteria":  criteria,
			"review":    review,
			"scores":    scores,
		},
	})
}

// ScoreInput merepresentasikan input form scoring reviewer
type ScoreItemInput struct {
	CriterionID int64   `json:"criterionId"`
	Score       float64 `json:"score"`
	Comment     string  `json:"comment"`
}

type ReviewSaveInput struct {
	Scores         []ScoreItemInput `json:"scores"`
	TotalScore     float64          `json:"totalScore"`
	Strengths      string           `json:"strengths"`
	Weaknesses     string           `json:"weaknesses"`
	Comments       string           `json:"comments"`
	Recommendation string           `json:"recommendation"` // 'funded' | 'revision' | 'rejected' | 'accepted'
}

// SaveReview menyimpan draf penilaian atau pembaruan skor review
func (h ReviewerHandler) SaveReview(c *gin.Context) {
	userID := getUserIDFromContext(c)
	assignmentID := c.Param("id")

	var assignment models.ReviewAssignment
	if err := h.DB.Where("id = ? AND reviewer_id = ?", assignmentID, userID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Penugasan review tidak ditemukan"})
		return
	}

	var input ReviewSaveInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format penilaian tidak valid"})
		return
	}

	var review models.Review
	err := h.DB.Where("assignment_id = ?", assignment.ID).First(&review).Error
	if err == gorm.ErrRecordNotFound {
		review = models.Review{
			AssignmentID:   assignment.ID,
			TotalScore:     input.TotalScore,
			Strengths:      input.Strengths,
			Weaknesses:     input.Weaknesses,
			Comments:       input.Comments,
			Recommendation: input.Recommendation,
			ReviewStatus:   "draft",
		}
		if err := h.DB.Create(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat draf review"})
			return
		}
	} else {
		review.TotalScore = input.TotalScore
		review.Strengths = input.Strengths
		review.Weaknesses = input.Weaknesses
		review.Comments = input.Comments
		review.Recommendation = input.Recommendation
		h.DB.Save(&review)
	}

	// Simpan skor per kriteria
	for _, sc := range input.Scores {
		var existingScore models.ReviewScore
		if h.DB.Where("review_id = ? AND criterion_id = ?", review.ID, sc.CriterionID).First(&existingScore).Error == gorm.ErrRecordNotFound {
			h.DB.Create(&models.ReviewScore{
				ReviewID:    review.ID,
				CriterionID: sc.CriterionID,
				Score:       sc.Score,
				Comment:     sc.Comment,
			})
		} else {
			existingScore.Score = sc.Score
			existingScore.Comment = sc.Comment
			h.DB.Save(&existingScore)
		}
	}

	// Update status assignment jika masih assigned
	if assignment.Status == "assigned" {
		assignment.Status = "in_progress"
		h.DB.Save(&assignment)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Draf penilaian berhasil disimpan",
		"data":    review,
	})
}

// SubmitReview melakukan finalisasi penilaian & keputusan rekomendasi lolos pendanaan
func (h ReviewerHandler) SubmitReview(c *gin.Context) {
	userID := getUserIDFromContext(c)
	assignmentID := c.Param("id")

	var assignment models.ReviewAssignment
	if err := h.DB.Where("id = ? AND reviewer_id = ?", assignmentID, userID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Penugasan review tidak ditemukan"})
		return
	}

	var input ReviewSaveInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format penilaian tidak valid"})
		return
	}

	if input.Recommendation == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Keputusan rekomendasi wajib dipilih"})
		return
	}

	var review models.Review
	err := h.DB.Where("assignment_id = ?", assignment.ID).First(&review).Error
	now := time.Now()
	if err == gorm.ErrRecordNotFound {
		review = models.Review{
			AssignmentID:   assignment.ID,
			TotalScore:     input.TotalScore,
			Strengths:      input.Strengths,
			Weaknesses:     input.Weaknesses,
			Comments:       input.Comments,
			Recommendation: input.Recommendation,
			ReviewStatus:   "finalized",
			SubmittedAt:    &now,
		}
		h.DB.Create(&review)
	} else {
		review.TotalScore = input.TotalScore
		review.Strengths = input.Strengths
		review.Weaknesses = input.Weaknesses
		review.Comments = input.Comments
		review.Recommendation = input.Recommendation
		review.ReviewStatus = "finalized"
		review.SubmittedAt = &now
		h.DB.Save(&review)
	}

	// Simpan skor per kriteria
	for _, sc := range input.Scores {
		var existingScore models.ReviewScore
		if h.DB.Where("review_id = ? AND criterion_id = ?", review.ID, sc.CriterionID).First(&existingScore).Error == gorm.ErrRecordNotFound {
			h.DB.Create(&models.ReviewScore{
				ReviewID:    review.ID,
				CriterionID: sc.CriterionID,
				Score:       sc.Score,
				Comment:     sc.Comment,
			})
		} else {
			existingScore.Score = sc.Score
			existingScore.Comment = sc.Comment
			h.DB.Save(&existingScore)
		}
	}

	// Tandai assignment sebagai completed
	assignment.Status = "completed"
	h.DB.Save(&assignment)

	// Jika rekomendasi funded / rejected, update status proposal jika relevan
	if input.Recommendation == "funded" {
		h.DB.Model(&models.Proposal{}).Where("id = ?", assignment.ProposalID).Updates(map[string]any{
			"is_funded": true,
			"status":    "funded",
		})
	} else if input.Recommendation == "revision" {
		h.DB.Model(&models.Proposal{}).Where("id = ?", assignment.ProposalID).Update("status", "revision")
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Penilaian dan rekomendasi berhasil difinalisasi",
		"data":    review,
	})
}
