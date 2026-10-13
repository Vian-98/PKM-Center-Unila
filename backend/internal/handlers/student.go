package handlers

import (
	"crypto/rand"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

// StudentHandler menangani modul Portal Mahasiswa (Anggota 2 — Favian):
// dashboard progres usulan, pengajuan proposal multi-step, dokumen proposal,
// logbook kegiatan, direktori pembimbing, dan pelacakan status usulan publik.
type StudentHandler struct {
	DB *gorm.DB
}

// uuidV4 menghasilkan UUID v4 untuk Primary Key.
func uuidV4() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func orDefault(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}

// currentPeriod mengambil periode PKM aktif (status open), atau periode terbaru.
func (h StudentHandler) currentPeriod() (models.PKMPeriod, error) {
	var period models.PKMPeriod
	if err := h.DB.Where("status = ?", "open").Order("year DESC").First(&period).Error; err == nil {
		return period, nil
	}
	err := h.DB.Order("year DESC").First(&period).Error
	return period, err
}

// findTeam mencari tim mahasiswa pada periode tertentu tanpa membuat baru.
func (h StudentHandler) findTeam(userID, periodID string) (models.Team, bool) {
	var team models.Team
	if err := h.DB.Where("period_id = ? AND leader_id = ?", periodID, userID).
		Order("created_at DESC").First(&team).Error; err == nil {
		return team, true
	}
	var member models.TeamMember
	if err := h.DB.Where("student_id = ?", userID).First(&member).Error; err == nil {
		if err := h.DB.Where("id = ?", member.TeamID).First(&team).Error; err == nil {
			return team, true
		}
	}
	return team, false
}

// ensureTeam memastikan mahasiswa memiliki tim pada periode aktif (membuat bila belum ada).
func (h StudentHandler) ensureTeam(userID, periodID, studentName string) (models.Team, error) {
	if team, ok := h.findTeam(userID, periodID); ok {
		return team, nil
	}
	team := models.Team{
		ID:       uuidV4(),
		PeriodID: periodID,
		LeaderID: userID,
		Name:     "Tim " + studentName,
		Status:   "draft",
	}
	if err := h.DB.Create(&team).Error; err != nil {
		return team, err
	}
	joined := time.Now()
	h.DB.Create(&models.TeamMember{
		TeamID:           team.ID,
		StudentID:        userID,
		MemberRole:       "leader",
		InvitationStatus: "accepted",
		JoinedAt:         &joined,
	})
	return team, nil
}

// stepperLabels adalah 5 tahap visual usulan pada dashboard mahasiswa.
var stepperLabels = []struct{ Key, Label string }{
	{"draft", "Draft Usulan"},
	{"review_dosen", "Review Dosen"},
	{"review_internal", "Review Internal (Reviewer 1 & 2)"},
	{"lolos_belmawa", "Lolos Belmawa"},
	{"pimnas", "PIMNAS"},
}

// buildStepper memetakan status proposal menjadi status 5 tahap.
func buildStepper(status string, hasProposal bool) []gin.H {
	states := []string{"pending", "pending", "pending", "pending", "pending"}
	if !hasProposal {
		states[0] = "active"
	} else {
		switch status {
		case "draft":
			states[0] = "active"
		case "submitted":
			states[0] = "done"
			states[1] = "active"
		case "under_review", "revision":
			states[0], states[1] = "done", "done"
			states[2] = "active"
		case "approved":
			states[0], states[1], states[2] = "done", "done", "done"
			states[3] = "active"
		case "funded":
			states[0], states[1], states[2], states[3] = "done", "done", "done", "done"
		case "completed":
			states[0], states[1], states[2], states[3], states[4] = "done", "done", "done", "done", "done"
		case "rejected":
			states[0], states[1] = "done", "done"
			states[2] = "active"
		default:
			states[0] = "active"
		}
	}
	out := make([]gin.H, 0, len(stepperLabels))
	for i, s := range stepperLabels {
		out = append(out, gin.H{"key": s.Key, "label": s.Label, "status": states[i]})
	}
	return out
}

// GetDashboard mengembalikan ringkasan portal mahasiswa: profil, tim, dosen
// pembimbing, proposal, stepper, agenda tenggat, dan statistik.
func (h StudentHandler) GetDashboard(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	var profile struct {
		Name           string  `json:"name"`
		Email          string  `json:"email"`
		StudentNumber  string  `json:"studentNumber"`
		Faculty        string  `json:"faculty"`
		Department     string  `json:"department"`
		StudyProgram   string  `json:"studyProgram"`
		EntryYear      int     `json:"entryYear"`
		GPA            float64 `json:"gpa"`
		AcademicStatus string  `json:"academicStatus"`
	}
	h.DB.Table("users u").
		Select(`u.full_name as name, u.email, sp.student_number, sp.faculty, sp.department,
		        sp.study_program, sp.entry_year, sp.gpa, sp.academic_status`).
		Joins("LEFT JOIN student_profiles sp ON sp.user_id = u.id").
		Where("u.id = ?", userID).
		Scan(&profile)

	period, periodErr := h.currentPeriod()

	teamFound := false
	var team models.Team
	teamMembers := []gin.H{}
	if periodErr == nil {
		team, teamFound = h.findTeam(userID, period.ID)
	}
	if teamFound {
		rows, err := h.DB.Table("team_members tm").
			Select("tm.student_id, u.full_name as name, sp.student_number, tm.member_role, tm.invitation_status").
			Joins("JOIN users u ON u.id = tm.student_id").
			Joins("LEFT JOIN student_profiles sp ON sp.user_id = tm.student_id").
			Where("tm.team_id = ?", team.ID).
			Order("tm.member_role DESC").
			Rows()
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var m struct {
					StudentID        string `json:"studentId"`
					Name             string `json:"name"`
					StudentNumber    string `json:"studentNumber"`
					MemberRole       string `json:"memberRole"`
					InvitationStatus string `json:"invitationStatus"`
				}
				if h.DB.ScanRows(rows, &m) == nil {
					teamMembers = append(teamMembers, gin.H{
						"studentId": m.StudentID, "name": m.Name, "studentNumber": m.StudentNumber,
						"memberRole": m.MemberRole, "invitationStatus": m.InvitationStatus,
					})
				}
			}
		}
	}

	var proposal struct {
		ID           string     `json:"id"`
		Title        string     `json:"title"`
		Abstract     string     `json:"abstract"`
		Keywords     string     `json:"keywords"`
		FieldOfStudy string     `json:"fieldOfStudy"`
		Status       string     `json:"status"`
		SchemeCode   string     `json:"schemeCode"`
		SchemeName   string     `json:"schemeName"`
		IsFunded     bool       `json:"isFunded"`
		SubmittedAt  *time.Time `json:"submittedAt"`
		CreatedAt    time.Time  `json:"createdAt"`
		UpdatedAt    time.Time  `json:"updatedAt"`
		StageName    string     `json:"stageName"`
		LogbookCount int64      `json:"logbookCount"`
	}
	proposalFound := false
	if teamFound {
		h.DB.Table("proposals p").
			Select(`p.id, p.title, p.abstract, p.keywords, p.field_of_study, p.status, s.code as scheme_code, s.name as scheme_name,
			        p.is_funded, p.submitted_at, p.created_at, p.updated_at,
			        COALESCE(st.name, '') as stage_name,
			        (SELECT COUNT(*) FROM logbook_entries le WHERE le.proposal_id = p.id) as logbook_count`).
			Joins("JOIN pkm_schemes s ON s.id = p.scheme_id").
			Joins("LEFT JOIN pkm_stages st ON st.id = p.current_stage_id").
			Where("p.team_id = ?", team.ID).
			Order("p.created_at DESC").
			Scan(&proposal)
		proposalFound = proposal.ID != ""
	}

	var supervisor struct {
		Name           string `json:"name"`
		Email          string `json:"email"`
		LecturerNumber string `json:"lecturerNumber"`
		StudyProgram   string `json:"studyProgram"`
		Status         string `json:"status"`
	}
	if proposalFound {
		h.DB.Table("proposal_supervisors ps").
			Select("u.full_name as name, u.email, lp.lecturer_number, lp.study_program, 'accepted' as status").
			Joins("JOIN users u ON u.id = ps.lecturer_id").
			Joins("LEFT JOIN lecturer_profiles lp ON lp.user_id = ps.lecturer_id").
			Where("ps.proposal_id = ?", proposal.ID).
			Order("ps.is_primary DESC").
			Limit(1).
			Scan(&supervisor)
		if supervisor.Name == "" {
			h.DB.Table("supervisor_requests sr").
				Select("u.full_name as name, u.email, lp.lecturer_number, lp.study_program, sr.status").
				Joins("JOIN users u ON u.id = sr.lecturer_id").
				Joins("LEFT JOIN lecturer_profiles lp ON lp.user_id = sr.lecturer_id").
				Where("sr.proposal_id = ?", proposal.ID).
				Order("sr.created_at DESC").
				Limit(1).
				Scan(&supervisor)
		}
	}

	reviewers := []gin.H{}
	if proposalFound {
		rows, err := h.DB.Table("review_assignments ra").
			Select("u.full_name as name, ra.status").
			Joins("JOIN users u ON u.id = ra.reviewer_id").
			Where("ra.proposal_id = ?", proposal.ID).
			Rows()
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var r struct {
					Name   string `json:"name"`
					Status string `json:"status"`
				}
				if h.DB.ScanRows(rows, &r) == nil {
					reviewers = append(reviewers, gin.H{"name": r.Name, "status": r.Status})
				}
			}
		}
	}

	stages := []models.PKMStage{}
	if periodErr == nil {
		h.DB.Where("period_id = ?", period.ID).Order("stage_order ASC").Find(&stages)
	}
	agenda := []gin.H{}
	now := time.Now()
	for _, s := range stages {
		if s.EndDate != nil {
			agenda = append(agenda, gin.H{
				"type": "deadline", "title": s.Name, "date": s.EndDate, "status": s.Status,
				"overdue": s.EndDate.Before(now),
			})
		}
	}

	var feedbackCount int64
	if proposalFound {
		h.DB.Model(&models.ProposalFeedback{}).Where("proposal_id = ?", proposal.ID).Count(&feedbackCount)
	}

	latestProgress := 0
	if proposalFound {
		h.DB.Table("logbook_entries").Select("progress_percentage").
			Where("proposal_id = ?", proposal.ID).Order("activity_date DESC").Limit(1).Scan(&latestProgress)
	}

	data := gin.H{
		"student":    profile,
		"team":       nil,
		"proposal":   nil,
		"supervisor": nil,
		"reviewers":  reviewers,
		"stepper":    buildStepper(proposal.Status, proposalFound),
		"stages":     stages,
		"agenda":     agenda,
		"stats": gin.H{
			"logbookCount":    proposal.LogbookCount,
			"feedbackCount":   feedbackCount,
			"teamMemberCount": len(teamMembers),
			"latestProgress":  latestProgress,
		},
	}
	if periodErr == nil {
		data["period"] = period
	}
	if teamFound {
		data["team"] = gin.H{
			"id": team.ID, "name": team.Name, "status": team.Status,
			"leaderId": team.LeaderID, "members": teamMembers,
		}
	}
	if proposalFound {
		data["proposal"] = proposal
	}
	if supervisor.Name != "" {
		data["supervisor"] = supervisor
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetSchemes mengembalikan daftar skema PKM aktif untuk formulir pengajuan.
func (h StudentHandler) GetSchemes(c *gin.Context) {
	var schemes []models.PKMScheme
	h.DB.Where("is_active = ?", true).Order("id ASC").Find(&schemes)
	c.JSON(http.StatusOK, gin.H{"data": schemes})
}

// GetSupervisors mengembalikan direktori dosen (untuk pilihan pembimbing).
func (h StudentHandler) GetSupervisors(c *gin.Context) {
	rows, err := h.DB.Table("users u").
		Select(`u.id, u.full_name as name, u.email, lp.lecturer_number, lp.faculty,
		        lp.department, lp.study_program, lp.academic_position, lp.supervision_capacity`).
		Joins("JOIN lecturer_profiles lp ON lp.user_id = u.id").
		Order("u.full_name ASC").
		Rows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat direktori dosen"})
		return
	}
	defer rows.Close()

	items := []gin.H{}
	for rows.Next() {
		var d struct {
			ID                  string `json:"id"`
			Name                string `json:"name"`
			Email               string `json:"email"`
			LecturerNumber      string `json:"lecturerNumber"`
			Faculty             string `json:"faculty"`
			Department          string `json:"department"`
			StudyProgram        string `json:"studyProgram"`
			AcademicPosition    string `json:"academicPosition"`
			SupervisionCapacity int    `json:"supervisionCapacity"`
		}
		if h.DB.ScanRows(rows, &d) == nil {
			items = append(items, gin.H{
				"id": d.ID, "name": d.Name, "email": d.Email, "lecturerNumber": d.LecturerNumber,
				"faculty": d.Faculty, "department": d.Department, "studyProgram": d.StudyProgram,
				"academicPosition": d.AcademicPosition, "supervisionCapacity": d.SupervisionCapacity,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

// CreateProposal menyimpan/memperbarui usulan proposal mahasiswa (multi-step),
// termasuk dokumen dan permintaan bimbingan dosen.
func (h StudentHandler) CreateProposal(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	var input struct {
		SchemeCode           string `json:"schemeCode" binding:"required"`
		Title                string `json:"title" binding:"required"`
		Abstract             string `json:"abstract"`
		Keywords             string `json:"keywords"`
		FieldOfStudy         string `json:"fieldOfStudy"`
		SupervisorLecturerID string `json:"supervisorLecturerId"`
		SupervisorMessage    string `json:"supervisorMessage"`
		DocURL               string `json:"docUrl"`
		DocName              string `json:"docName"`
		Submit               bool   `json:"submit"`
		Members              []struct {
			NPM   string `json:"npm"`
			Name  string `json:"name"`
			Prodi string `json:"prodi"`
		} `json:"members"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data proposal tidak lengkap (skema dan judul wajib diisi)"})
		return
	}

	period, err := h.currentPeriod()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Belum ada periode PKM aktif"})
		return
	}

	var scheme models.PKMScheme
	if err := h.DB.Where("code = ?", input.SchemeCode).First(&scheme).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Skema PKM tidak ditemukan"})
		return
	}

	var student models.User
	h.DB.Where("id = ?", userID).First(&student)

	team, err := h.ensureTeam(userID, period.ID, student.FullName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyiapkan tim PKM"})
		return
	}

	var proposal models.Proposal
	found := h.DB.Where("team_id = ?", team.ID).Order("created_at DESC").First(&proposal).Error == nil
	if found && proposal.Status != "draft" && proposal.Status != "revision" {
		c.JSON(http.StatusConflict, gin.H{"message": "Proposal sudah diajukan dan tidak dapat diubah lagi"})
		return
	}
	if !found {
		proposal = models.Proposal{ID: uuidV4(), TeamID: team.ID, SchemeID: scheme.ID, PeriodID: period.ID}
	}
	proposal.SchemeID = scheme.ID
	proposal.Title = input.Title
	proposal.Abstract = input.Abstract
	proposal.Keywords = input.Keywords
	proposal.FieldOfStudy = input.FieldOfStudy
	proposal.Status = "draft"
	if input.Submit {
		now := time.Now()
		proposal.Status = "submitted"
		proposal.SubmittedAt = &now
	}

	if found {
		if err := h.DB.Save(&proposal).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui proposal"})
			return
		}
	} else if err := h.DB.Create(&proposal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan proposal"})
		return
	}

	if input.Submit {
		h.DB.Model(&models.Team{}).Where("id = ?", team.ID).Update("status", "submitted")
		h.notify(userID, "status_change", "Proposal berhasil diajukan",
			"Usulan \""+proposal.Title+"\" telah dikirim dan menunggu review dosen pembimbing.", "#mahasiswa")
	}

	if input.DocURL != "" {
		var count int64
		h.DB.Model(&models.ProposalDocument{}).Where("proposal_id = ?", proposal.ID).Count(&count)
		doc := models.ProposalDocument{
			ID:            uuidV4(),
			ProposalID:    proposal.ID,
			VersionNumber: int(count) + 1,
			FileName:      orDefault(input.DocName, "Proposal "+scheme.Code+".pdf"),
			FileURL:       input.DocURL,
			UploadedBy:    &userID,
			ChangeNotes:   "Diunggah melalui portal mahasiswa",
		}
		h.DB.Create(&doc)
	}

	if input.SupervisorLecturerID != "" {
		var existing models.SupervisorRequest
		if h.DB.Where("proposal_id = ? AND lecturer_id = ?", proposal.ID, input.SupervisorLecturerID).
			First(&existing).Error != nil {
			h.DB.Create(&models.SupervisorRequest{
				ID:             uuidV4(),
				ProposalID:     proposal.ID,
				LecturerID:     input.SupervisorLecturerID,
				RequestedBy:    &userID,
				RequestMessage: orDefault(input.SupervisorMessage, "Mohon kesediaan Bapak/Ibu menjadi dosen pembimbing tim kami."),
				Status:         "pending",
			})
		}
	}

	// Daftarkan anggota tim berdasarkan NPM (bila mahasiswa sudah terdaftar).
	for _, m := range input.Members {
		npm := strings.TrimSpace(m.NPM)
		if npm == "" {
			continue
		}
		var memberUser models.User
		if err := h.DB.Table("users u").
			Select("u.*").
			Joins("JOIN student_profiles sp ON sp.user_id = u.id").
			Where("sp.student_number = ?", npm).
			First(&memberUser).Error; err != nil {
			continue
		}
		if memberUser.ID == userID {
			continue
		}
		var existingMember models.TeamMember
		if h.DB.Where("team_id = ? AND student_id = ?", team.ID, memberUser.ID).
			First(&existingMember).Error != nil {
			h.DB.Create(&models.TeamMember{
				TeamID:           team.ID,
				StudentID:        memberUser.ID,
				MemberRole:       "member",
				InvitationStatus: "pending",
			})
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Proposal berhasil disimpan",
		"data":    proposal,
	})
}

// GetProposalDetail mengembalikan detail satu proposal milik mahasiswa.
func (h StudentHandler) GetProposalDetail(c *gin.Context) {
	userID := getUserIDFromContext(c)
	proposalID := c.Param("id")

	var allowed int64
	h.DB.Table("proposals p").
		Joins("JOIN teams t ON t.id = p.team_id").
		Joins("JOIN team_members tm ON tm.team_id = t.id").
		Where("p.id = ? AND tm.student_id = ?", proposalID, userID).
		Count(&allowed)
	if allowed == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Proposal tidak ditemukan"})
		return
	}

	var proposal models.Proposal
	h.DB.Where("id = ?", proposalID).First(&proposal)

	documents := []models.ProposalDocument{}
	h.DB.Where("proposal_id = ?", proposalID).Order("version_number DESC").Find(&documents)

	feedback := []gin.H{}
	rows, err := h.DB.Table("proposal_feedback pf").
		Select("pf.id, pf.feedback_type, pf.comment, pf.requires_revision, pf.created_at, u.full_name as author_name").
		Joins("LEFT JOIN users u ON u.id = pf.author_id").
		Where("pf.proposal_id = ?", proposalID).
		Order("pf.created_at DESC").
		Rows()
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var f struct {
				ID               string    `json:"id"`
				FeedbackType     string    `json:"feedbackType"`
				Comment          string    `json:"comment"`
				RequiresRevision bool      `json:"requiresRevision"`
				CreatedAt        time.Time `json:"createdAt"`
				AuthorName       string    `json:"authorName"`
			}
			if h.DB.ScanRows(rows, &f) == nil {
				feedback = append(feedback, gin.H{
					"id": f.ID, "feedbackType": f.FeedbackType, "comment": f.Comment,
					"requiresRevision": f.RequiresRevision, "createdAt": f.CreatedAt, "authorName": f.AuthorName,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"proposal":  proposal,
		"documents": documents,
		"feedback":  feedback,
	}})
}

// UploadProposalDocument menambahkan versi dokumen baru ke proposal.
func (h StudentHandler) UploadProposalDocument(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var input struct {
		ProposalID  string `json:"proposalId" binding:"required"`
		FileName    string `json:"fileName" binding:"required"`
		FileURL     string `json:"fileUrl" binding:"required"`
		ChangeNotes string `json:"changeNotes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Nama berkas dan tautan wajib diisi"})
		return
	}

	var allowed int64
	h.DB.Table("proposals p").
		Joins("JOIN teams t ON t.id = p.team_id").
		Joins("JOIN team_members tm ON tm.team_id = t.id").
		Where("p.id = ? AND tm.student_id = ?", input.ProposalID, userID).
		Count(&allowed)
	if allowed == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Proposal tidak ditemukan"})
		return
	}

	var count int64
	h.DB.Model(&models.ProposalDocument{}).Where("proposal_id = ?", input.ProposalID).Count(&count)

	doc := models.ProposalDocument{
		ID:            uuidV4(),
		ProposalID:    input.ProposalID,
		VersionNumber: int(count) + 1,
		FileName:      input.FileName,
		FileURL:       input.FileURL,
		UploadedBy:    &userID,
		ChangeNotes:   input.ChangeNotes,
	}
	if err := h.DB.Create(&doc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan dokumen"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Dokumen berhasil diunggah", "data": doc})
}

// GetLogbook mengembalikan entri logbook kegiatan tim beserta komentar dosen.
func (h StudentHandler) GetLogbook(c *gin.Context) {
	userID := getUserIDFromContext(c)

	proposalIDs := []string{}
	h.DB.Table("proposals p").
		Joins("JOIN team_members tm ON tm.team_id = p.team_id").
		Where("tm.student_id = ?", userID).
		Pluck("p.id", &proposalIDs)

	if filter := c.Query("proposalId"); filter != "" {
		proposalIDs = []string{filter}
	}

	entries := []gin.H{}
	if len(proposalIDs) > 0 {
		entryRows, err := h.DB.Table("logbook_entries le").
			Select(`le.id, le.proposal_id, le.student_id, u.full_name as student_name, le.activity_date,
			        le.title, le.activity_description, le.progress_result, le.obstacle, le.next_plan,
			        le.attachment_url, le.progress_percentage, le.verification_status, le.created_at`).
			Joins("JOIN users u ON u.id = le.student_id").
			Where("le.proposal_id IN ?", proposalIDs).
			Order("le.activity_date DESC, le.created_at DESC").
			Rows()
		if err == nil {
			defer entryRows.Close()
			for entryRows.Next() {
				var e struct {
					ID                  string    `json:"id"`
					ProposalID          string    `json:"proposalId"`
					StudentID           string    `json:"studentId"`
					StudentName         string    `json:"studentName"`
					ActivityDate        time.Time `json:"activityDate"`
					Title               string    `json:"title"`
					ActivityDescription string    `json:"activityDescription"`
					ProgressResult      string    `json:"progressResult"`
					Obstacle            string    `json:"obstacle"`
					NextPlan            string    `json:"nextPlan"`
					AttachmentURL       string    `json:"attachmentUrl"`
					ProgressPercentage  int       `json:"progressPercentage"`
					VerificationStatus  string    `json:"verificationStatus"`
					CreatedAt           time.Time `json:"createdAt"`
				}
				if h.DB.ScanRows(entryRows, &e) != nil {
					continue
				}
				comments := []gin.H{}
				commentRows, cerr := h.DB.Table("logbook_comments lc").
					Select("lc.id, lc.comment, lc.created_at, u.full_name as author_name").
					Joins("LEFT JOIN users u ON u.id = lc.author_id").
					Where("lc.logbook_id = ?", e.ID).
					Order("lc.created_at ASC").
					Rows()
				if cerr == nil {
					for commentRows.Next() {
						var cm struct {
							ID         string    `json:"id"`
							Comment    string    `json:"comment"`
							CreatedAt  time.Time `json:"createdAt"`
							AuthorName string    `json:"authorName"`
						}
						if h.DB.ScanRows(commentRows, &cm) == nil {
							comments = append(comments, gin.H{
								"id": cm.ID, "comment": cm.Comment, "createdAt": cm.CreatedAt, "authorName": cm.AuthorName,
							})
						}
					}
					commentRows.Close()
				}
				entries = append(entries, gin.H{
					"id": e.ID, "proposalId": e.ProposalID, "studentId": e.StudentID, "studentName": e.StudentName,
					"activityDate": e.ActivityDate, "title": e.Title, "activityDescription": e.ActivityDescription,
					"progressResult": e.ProgressResult, "obstacle": e.Obstacle, "nextPlan": e.NextPlan,
					"attachmentUrl": e.AttachmentURL, "progressPercentage": e.ProgressPercentage,
					"verificationStatus": e.VerificationStatus,
					"createdAt":          e.CreatedAt, "comments": comments,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": entries})
}

// CreateLogbook menambahkan catatan logbook kegiatan baru.
func (h StudentHandler) CreateLogbook(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var input struct {
		ProposalID          string `json:"proposalId"`
		ActivityDate        string `json:"activityDate" binding:"required"`
		Title               string `json:"title" binding:"required"`
		ActivityDescription string `json:"activityDescription"`
		ProgressResult      string `json:"progressResult"`
		Obstacle            string `json:"obstacle"`
		NextPlan            string `json:"nextPlan"`
		AttachmentURL       string `json:"attachmentUrl"`
		ProgressPercentage  int    `json:"progressPercentage"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Judul dan tanggal kegiatan wajib diisi"})
		return
	}

	proposalID := input.ProposalID
	if proposalID == "" {
		var latest models.Proposal
		if err := h.DB.Table("proposals p").
			Joins("JOIN team_members tm ON tm.team_id = p.team_id").
			Where("tm.student_id = ?", userID).
			Order("p.created_at DESC").
			First(&latest).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Anda belum memiliki proposal untuk diisi logbook-nya"})
			return
		}
		proposalID = latest.ID
	} else {
		var allowed int64
		h.DB.Table("proposals p").
			Joins("JOIN team_members tm ON tm.team_id = p.team_id").
			Where("p.id = ? AND tm.student_id = ?", proposalID, userID).
			Count(&allowed)
		if allowed == 0 {
			c.JSON(http.StatusNotFound, gin.H{"message": "Proposal tidak ditemukan"})
			return
		}
	}

	activityDate, err := time.Parse("2006-01-02", input.ActivityDate)
	if err != nil {
		activityDate = time.Now()
	}

	entry := models.LogbookEntry{
		ID:                  uuidV4(),
		ProposalID:          proposalID,
		StudentID:           userID,
		ActivityDate:        activityDate,
		Title:               input.Title,
		ActivityDescription: input.ActivityDescription,
		ProgressResult:      input.ProgressResult,
		Obstacle:            input.Obstacle,
		NextPlan:            input.NextPlan,
		AttachmentURL:       input.AttachmentURL,
		ProgressPercentage:  input.ProgressPercentage,
		VerificationStatus:  "pending",
	}
	if err := h.DB.Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan catatan logbook"})
		return
	}

	h.notify(userID, "logbook", "Catatan logbook tersimpan",
		"Entri \""+entry.Title+"\" berhasil ditambahkan pada logbook kegiatan.", "#logbook")

	c.JSON(http.StatusCreated, gin.H{"message": "Catatan logbook berhasil disimpan", "data": entry})
}

// TrackProposal menelusuri status usulan publik berdasarkan NPM/identitas mahasiswa.
func (h StudentHandler) TrackProposal(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Parameter pencarian (NPM) wajib diisi"})
		return
	}

	type TrackItem struct {
		StudentName   string `json:"studentName"`
		StudentNumber string `json:"studentNumber"`
		Faculty       string `json:"faculty"`
		StudyProgram  string `json:"studyProgram"`
		ProposalID    string `json:"proposalId"`
		Title         string `json:"title"`
		Status        string `json:"status"`
		SchemeCode    string `json:"schemeCode"`
		SchemeName    string `json:"schemeName"`
		TeamName      string `json:"teamName"`
		IsFunded      bool   `json:"isFunded"`
		PeriodYear    int    `json:"periodYear"`
		StageName     string `json:"stageName"`
	}

	var items []TrackItem
	rows, err := h.DB.Table("proposals p").
		Select(`u.full_name as student_name, sp.student_number, sp.faculty, sp.study_program,
		        p.id as proposal_id, p.title, p.status, s.code as scheme_code, s.name as scheme_name,
		        t.name as team_name, p.is_funded, per.year as period_year,
		        COALESCE(st.name, '') as stage_name`).
		Joins("JOIN teams t ON t.id = p.team_id").
		Joins("JOIN users u ON u.id = t.leader_id").
		Joins("LEFT JOIN student_profiles sp ON sp.user_id = t.leader_id").
		Joins("JOIN pkm_schemes s ON s.id = p.scheme_id").
		Joins("JOIN pkm_periods per ON per.id = p.period_id").
		Joins("LEFT JOIN pkm_stages st ON st.id = p.current_stage_id").
		Where("sp.student_number = ? OR u.email = ? OR u.full_name ILIKE ?", query, query, "%"+query+"%").
		Order("p.created_at DESC").
		Rows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menelusuri usulan"})
		return
	}
	defer rows.Close()
	for rows.Next() {
		var it TrackItem
		if h.DB.ScanRows(rows, &it) == nil {
			items = append(items, it)
		}
	}

	results := make([]gin.H, 0, len(items))
	for _, it := range items {
		supervisors := []string{}
		supRows, _ := h.DB.Table("proposal_supervisors ps").
			Select("u.full_name").
			Joins("JOIN users u ON u.id = ps.lecturer_id").
			Where("ps.proposal_id = ?", it.ProposalID).
			Rows()
		if supRows != nil {
			for supRows.Next() {
				var name string
				if h.DB.ScanRows(supRows, &name) == nil {
					supervisors = append(supervisors, name)
				}
			}
			supRows.Close()
		}
		reviewers := []gin.H{}
		revRows, _ := h.DB.Table("review_assignments ra").
			Select("u.full_name as name, ra.status").
			Joins("JOIN users u ON u.id = ra.reviewer_id").
			Where("ra.proposal_id = ?", it.ProposalID).
			Rows()
		if revRows != nil {
			for revRows.Next() {
				var r struct {
					Name   string `json:"name"`
					Status string `json:"status"`
				}
				if h.DB.ScanRows(revRows, &r) == nil {
					reviewers = append(reviewers, gin.H{"name": r.Name, "status": r.Status})
				}
			}
			revRows.Close()
		}
		results = append(results, gin.H{
			"studentName": it.StudentName, "studentNumber": it.StudentNumber,
			"faculty": it.Faculty, "studyProgram": it.StudyProgram,
			"proposalId": it.ProposalID, "title": it.Title, "status": it.Status,
			"schemeCode": it.SchemeCode, "schemeName": it.SchemeName, "teamName": it.TeamName,
			"isFunded": it.IsFunded, "periodYear": it.PeriodYear, "stageName": it.StageName,
			"supervisors": supervisors, "reviewers": reviewers,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": results, "count": len(results)})
}

// notify menyimpan notifikasi in-app (dipakai bersama dengan modul Radhit).
func (h StudentHandler) notify(userID, ntype, title, message, targetURL string) {
	if userID == "" {
		return
	}
	h.DB.Create(&models.Notification{
		ID:               uuidV4(),
		UserID:           userID,
		NotificationType: ntype,
		Title:            title,
		Message:          message,
		TargetURL:        targetURL,
	})
}

// GetNotifications mengembalikan notifikasi in-app milik pengguna yang login.
func (h StudentHandler) GetNotifications(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}
	items := []models.Notification{}
	h.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(30).Find(&items)

	var unread int64
	h.DB.Model(&models.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&unread)

	c.JSON(http.StatusOK, gin.H{"data": items, "unread": unread})
}

// MarkNotificationsRead menandai seluruh notifikasi pengguna sebagai telah dibaca.
func (h StudentHandler) MarkNotificationsRead(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}
	h.DB.Model(&models.Notification{}).Where("user_id = ?", userID).Update("is_read", true)
	c.JSON(http.StatusOK, gin.H{"message": "Notifikasi ditandai telah dibaca"})
}

// UploadStudentFile menerima berkas (PDF/gambar/dokumen) untuk dokumen proposal
// maupun bukti kegiatan logbook, lalu mengembalikan tautan relatif yang dapat diakses.
func (h StudentHandler) UploadStudentFile(c *gin.Context) {
	if getUserIDFromContext(c) == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Berkas tidak ditemukan pada permintaan"})
		return
	}
	const maxBytes = 10 << 20 // 10 MB
	if file.Size > maxBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"message": "Ukuran berkas melebihi 10 MB"})
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{
		".pdf": true, ".png": true, ".jpg": true, ".jpeg": true,
		".webp": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true,
	}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format berkas tidak didukung (PDF/gambar/dokumen)"})
		return
	}
	dir := os.Getenv("UPLOAD_DIR")
	if dir == "" {
		dir = "uploads"
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyiapkan penyimpanan berkas"})
		return
	}
	stored := uuidV4() + ext
	if err := c.SaveUploadedFile(file, filepath.Join(dir, stored)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan berkas"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": gin.H{
		"url":  "/uploads/" + stored,
		"name": file.Filename,
		"size": file.Size,
	}})
}
