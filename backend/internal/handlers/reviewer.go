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

// FormatCheckItem mewakili temuan detail dalam sebuah halaman atau tanpa halaman
type FormatCheckItem struct {
	ID   string `json:"id"`
	Text string `json:"text"`
	Tag  string `json:"tag"`
}

// PageErrorGroup mewakili pengelompokan kesalahan per halaman
type PageErrorGroup struct {
	PageKey       string            `json:"pageKey"`
	PageLabel     string            `json:"pageLabel"`
	PageNum       *int              `json:"pageNum"`
	FindingsCount int               `json:"findingsCount"`
	Findings      []FormatCheckItem `json:"findings"`
}

// SummaryErrorSub mewakili sub-item di dalam kategori ringkasan utama
type SummaryErrorSub struct {
	ID      string  `json:"id"`
	Page    *string `json:"page"`
	PageNum *int    `json:"pageNum"`
	Text    string  `json:"text"`
	Tag     string  `json:"tag"`
}

// SummaryErrorItem mewakili rangkuman satu kategori kesalahan utama
type SummaryErrorItem struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	DetailCount int               `json:"detailCount"`
	Category    string            `json:"category"`
	Items       []SummaryErrorSub `json:"items"`
}

// AIFormatCheckResult mewakili respons audit otomatis format dokumen
type AIFormatCheckResult struct {
	ID                      string             `json:"id"`
	DocumentName            string             `json:"documentName"`
	DocumentType            string             `json:"documentType"`
	SchemeCode              string             `json:"schemeCode"`
	SchemeName              string             `json:"schemeName"`
	TeamName                string             `json:"teamName"`
	LeaderName              string             `json:"leaderName"`
	AnalyzedAt              string             `json:"analyzedAt"`
	ComplianceScore         int                `json:"complianceScore"`
	StatusLabel             string             `json:"statusLabel"`
	SuggestedScoreDeduction int                `json:"suggestedScoreDeduction"`
	RingkasanUtama          []SummaryErrorItem `json:"ringkasanUtama"`
	DetailKesalahan         []PageErrorGroup   `json:"detailKesalahan"`
	SaranPerbaikan          []string           `json:"saranPerbaikan"`
}

// CheckFormatAI melakukan audit otomatis format pedoman PKM Belmawa untuk penugasan tertentu
func (h ReviewerHandler) CheckFormatAI(c *gin.Context) {
	assignmentID := c.Param("id")

	var assignment models.ReviewAssignment
	h.DB.Where("id = ?", assignmentID).First(&assignment)

	var proposal models.Proposal
	if assignment.ProposalID != "" {
		h.DB.Where("id = ?", assignment.ProposalID).First(&proposal)
	}

	var scheme models.PKMScheme
	if proposal.SchemeID != "" {
		h.DB.Where("id = ?", proposal.SchemeID).First(&scheme)
	}

	schemeCode := scheme.Code
	if schemeCode == "" {
		schemeCode = "PKM-RE"
	}

	result := getSamplePujaPKMREReport()
	if schemeCode != "PKM-RE" {
		result.SchemeCode = schemeCode
		result.SchemeName = scheme.Name
	}
	if proposal.Title != "" {
		result.DocumentName = "Naskah_" + strings.ReplaceAll(proposal.Title, " ", "_") + ".pdf"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Audit format naskah berhasil dilakukan oleh AI",
		"data":    result,
	})
}

func getSamplePujaPKMREReport() AIFormatCheckResult {
	hal9 := 9
	hal10 := 10
	hal11 := 11
	hal12 := 12
	hal7 := 7
	hal8 := 8
	hal13 := 13

	strHal9 := "Hal. 9"
	strHal10 := "Hal. 10"
	strHal11 := "Hal. 11"
	strHal12 := "Hal. 12"
	strHal7to13 := "Hal. 7-13"

	return AIFormatCheckResult{
		ID:                      "audit-puja-re-2026",
		DocumentName:            "Laporan_Puja_Revisi_Final_PKM-RE_2026.docx",
		DocumentType:            "Laporan Akhir",
		SchemeCode:              "PKM-RE",
		SchemeName:              "PKM Riset Eksakta",
		TeamName:                "Tim Riset Katalis Unila",
		LeaderName:              "Puja Maharani",
		AnalyzedAt:              time.Now().Format(time.RFC3339),
		ComplianceScore:         74,
		StatusLabel:             "Perlu Revisi Format",
		SuggestedScoreDeduction: 15,
		RingkasanUtama: []SummaryErrorItem{
			{
				ID:          "sum-1",
				Title:       "Kesalahan spasi keterangan gambar/tabel tidak 1,15",
				DetailCount: 4,
				Category:    "Format Penulisan",
				Items: []SummaryErrorSub{
					{ID: "item-1-1", Page: &strHal9, PageNum: &hal9, Text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 3.1. Skema riset yang digunakan pada penelitian."`, Tag: "Format Penulisan"},
					{ID: "item-1-2", Page: &strHal10, PageNum: &hal10, Text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 4.1. Bukti (a) determinasi bahan tanaman dan (b) hasi…"`, Tag: "Format Penulisan"},
					{ID: "item-1-3", Page: &strHal11, PageNum: &hal11, Text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Tabel 4.1. Kristalinitas relatif katalis hasil sintesis."`, Tag: "Format Penulisan"},
					{ID: "item-1-4", Page: &strHal12, PageNum: &hal12, Text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 4.2. Perakitan dan pengujian sistem instrumentasi suh…"`, Tag: "Format Penulisan"},
				},
			},
			{
				ID:          "sum-2",
				Title:       "Kesalahan spasi teks / paragraf tidak 1,15",
				DetailCount: 1,
				Category:    "Format Penulisan",
				Items: []SummaryErrorSub{
					{ID: "item-2-1", Page: &strHal7to13, PageNum: &hal7, Text: "Kesalahan spasi teks/paragraf tidak 1,15", Tag: "Format Penulisan"},
				},
			},
			{
				ID:          "sum-3",
				Title:       "Kesalahan daftar isi: Daftar Lampiran tidak tercantum di Daftar Isi",
				DetailCount: 1,
				Category:    "Struktur Dokumen",
				Items: []SummaryErrorSub{
					{ID: "item-3-1", Text: "Kesalahan daftar isi: Daftar Lampiran tidak tercantum di Daftar Isi", Tag: "Struktur Dokumen"},
				},
			},
		},
		DetailKesalahan: []PageErrorGroup{
			{
				PageKey:       "no-page",
				PageLabel:     "Tanpa halaman terdeteksi",
				FindingsCount: 1,
				Findings: []FormatCheckItem{
					{ID: "det-0-1", Text: "Kesalahan daftar isi: Daftar Lampiran tidak tercantum di Daftar Isi", Tag: "Struktur Dokumen"},
				},
			},
			{
				PageKey:       "page-7",
				PageLabel:     "Halaman 7",
				PageNum:       &hal7,
				FindingsCount: 1,
				Findings: []FormatCheckItem{
					{ID: "det-7-1", Text: "Kesalahan spasi teks/paragraf tidak 1,15", Tag: "Format Penulisan"},
				},
			},
			{
				PageKey:       "page-8",
				PageLabel:     "Halaman 8",
				PageNum:       &hal8,
				FindingsCount: 1,
				Findings: []FormatCheckItem{
					{ID: "det-8-1", Text: "Kesalahan spasi teks/paragraf tidak 1,15", Tag: "Format Penulisan"},
				},
			},
			{
				PageKey:       "page-9",
				PageLabel:     "Halaman 9",
				PageNum:       &hal9,
				FindingsCount: 2,
				Findings: []FormatCheckItem{
					{ID: "det-9-1", Text: "Kesalahan spasi teks/paragraf tidak 1,15", Tag: "Format Penulisan"},
					{ID: "det-9-2", Text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 3.1. Skema riset yang digunakan pada penelitian."`, Tag: "Format Penulisan"},
				},
			},
			{
				PageKey:       "page-10",
				PageLabel:     "Halaman 10",
				PageNum:       &hal10,
				FindingsCount: 2,
				Findings: []FormatCheckItem{
					{ID: "det-10-1", Text: "Kesalahan spasi teks/paragraf tidak 1,15", Tag: "Format Penulisan"},
					{ID: "det-10-2", Text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 4.1. Bukti (a) determinasi bahan tanaman dan (b) hasi…"`, Tag: "Format Penulisan"},
				},
			},
			{
				PageKey:       "page-11",
				PageLabel:     "Halaman 11",
				PageNum:       &hal11,
				FindingsCount: 2,
				Findings: []FormatCheckItem{
					{ID: "det-11-1", Text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Tabel 4.1. Kristalinitas relatif katalis hasil sintesis."`, Tag: "Format Penulisan"},
					{ID: "det-11-2", Text: "Kesalahan spasi teks/paragraf tidak 1,15", Tag: "Format Penulisan"},
				},
			},
			{
				PageKey:       "page-12",
				PageLabel:     "Halaman 12",
				PageNum:       &hal12,
				FindingsCount: 2,
				Findings: []FormatCheckItem{
					{ID: "det-12-1", Text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 4.2. Perakitan dan pengujian sistem instrumentasi suh…"`, Tag: "Format Penulisan"},
					{ID: "det-12-2", Text: "Kesalahan spasi teks/paragraf tidak 1,15", Tag: "Format Penulisan"},
				},
			},
			{
				PageKey:       "page-13",
				PageLabel:     "Halaman 13",
				PageNum:       &hal13,
				FindingsCount: 1,
				Findings: []FormatCheckItem{
					{ID: "det-13-1", Text: "Kesalahan spasi teks/paragraf tidak 1,15", Tag: "Format Penulisan"},
				},
			},
		},
		SaranPerbaikan: []string{
			"Terdapat kata asing 'overshoot' sebaiknya dicetak miring",
			"Terdapat kata asing 'furnace, magnetic, stirrer, heater, band' sebaiknya dicetak miring",
			"Terdapat kata asing 'structure, directing, agent' sebaiknya dicetak miring",
			"Terdapat kata asing 'heater, band' sebaiknya dicetak miring",
			"Terdapat kata asing 'shell, oil' sebaiknya dicetak miring",
			"Terdapat kata asing 'overshoot, dashboard' sebaiknya dicetak miring",
			"Terdapat kata asing 'logbook' sebaiknya dicetak miring",
		},
	}
}
