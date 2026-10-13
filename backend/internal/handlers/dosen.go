package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

type DosenHandler struct {
	DB *gorm.DB
}

// getUserIDFromContext mengambil User ID dari klaim JWT pengguna yang login.
// Middleware menyimpan klaim sebagai jwt.MapClaims (map[string]interface{})
// dengan ID pengguna pada klaim "sub"; helper ini juga menerima gin.H agar
// tahan terhadap perubahan bentuk konteks.
func getUserIDFromContext(c *gin.Context) string {
	if id := c.GetString("userID"); id != "" {
		return id
	}
	val, exists := c.Get("user")
	if !exists {
		return ""
	}
	switch claims := val.(type) {
	case jwt.MapClaims:
		if id, _ := claims["sub"].(string); id != "" {
			return id
		}
		if id, _ := claims["id"].(string); id != "" {
			return id
		}
	case gin.H:
		if id, _ := claims["sub"].(string); id != "" {
			return id
		}
		if id, _ := claims["id"].(string); id != "" {
			return id
		}
	}
	return ""
}

// GetOverview mengembalikan ringkasan kuota bimbingan, usulan aktif, dan permintaan pending
func (h DosenHandler) GetOverview(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	var lecturerProfile models.LecturerProfile
	capacity := 10
	if err := h.DB.Where("user_id = ?", userID).First(&lecturerProfile).Error; err == nil {
		if lecturerProfile.SupervisionCapacity > 0 {
			capacity = lecturerProfile.SupervisionCapacity
		}
	}

	var activeSupervisedCount int64
	h.DB.Model(&models.ProposalSupervisor{}).Where("lecturer_id = ?", userID).Count(&activeSupervisedCount)

	var pendingRequestsCount int64
	h.DB.Model(&models.SupervisorRequest{}).Where("lecturer_id = ? AND status = ?", userID, "pending").Count(&pendingRequestsCount)

	var upcomingSessionsCount int64
	now := time.Now()
	h.DB.Model(&models.GuidanceSession{}).Where("lecturer_id = ? AND scheduled_at >= ? AND status = ?", userID, now, "scheduled").Count(&upcomingSessionsCount)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"lecturerNumber":        lecturerProfile.LecturerNumber,
			"faculty":               lecturerProfile.Faculty,
			"department":            lecturerProfile.Department,
			"studyProgram":          lecturerProfile.StudyProgram,
			"academicPosition":      lecturerProfile.AcademicPosition,
			"supervisionCapacity":   capacity,
			"activeSupervisedCount": activeSupervisedCount,
			"remainingCapacity":     capacity - int(activeSupervisedCount),
			"pendingRequestsCount":  pendingRequestsCount,
			"upcomingSessionsCount": upcomingSessionsCount,
		},
	})
}

// GetProposals mengembalikan daftar proposal yang dibimbing oleh dosen
func (h DosenHandler) GetProposals(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	type ProposalItem struct {
		ID            string     `json:"id"`
		Title         string     `json:"title"`
		Abstract      string     `json:"abstract"`
		Status        string     `json:"status"`
		SchemeCode    string     `json:"schemeCode"`
		SchemeName    string     `json:"schemeName"`
		TeamName      string     `json:"teamName"`
		LeaderName    string     `json:"leaderName"`
		LeaderFaculty string     `json:"leaderFaculty"`
		IsFunded      bool       `json:"isFunded"`
		SubmittedAt   *time.Time `json:"submittedAt"`
		CreatedAt     time.Time  `json:"createdAt"`
		LogbookCount  int64      `json:"logbookCount"`
	}

	var items []ProposalItem
	rows, err := h.DB.Table("proposal_supervisors ps").
		Select(`p.id, p.title, p.abstract, p.status, s.code as scheme_code, s.name as scheme_name,
		        t.name as team_name, u.full_name as leader_name, sp.faculty as leader_faculty,
		        p.is_funded, p.submitted_at, p.created_at,
		        (SELECT COUNT(*) FROM logbook_entries le WHERE le.proposal_id = p.id) as logbook_count`).
		Joins("JOIN proposals p ON p.id = ps.proposal_id").
		Joins("JOIN pkm_schemes s ON s.id = p.scheme_id").
		Joins("JOIN teams t ON t.id = p.team_id").
		Joins("JOIN users u ON u.id = t.leader_id").
		Joins("LEFT JOIN student_profiles sp ON sp.user_id = u.id").
		Where("ps.lecturer_id = ?", userID).
		Order("p.created_at DESC").
		Rows()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat proposal bimbingan"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var item ProposalItem
		if err := h.DB.ScanRows(rows, &item); err == nil {
			items = append(items, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GetRequests mengembalikan daftar permintaan bimbingan mahasiswa untuk dosen
func (h DosenHandler) GetRequests(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	type RequestItem struct {
		ID              string     `json:"id"`
		ProposalID      string     `json:"proposalId"`
		ProposalTitle   string     `json:"proposalTitle"`
		SchemeCode      string     `json:"schemeCode"`
		TeamName        string     `json:"teamName"`
		StudentName     string     `json:"studentName"`
		StudentNumber   string     `json:"studentNumber"`
		StudentFaculty  string     `json:"studentFaculty"`
		StudentProdi    string     `json:"studentProdi"`
		RequestMessage  string     `json:"requestMessage"`
		Status          string     `json:"status"`
		ResponseMessage string     `json:"responseMessage"`
		RespondedAt     *time.Time `json:"respondedAt"`
		CreatedAt       time.Time  `json:"createdAt"`
	}

	var items []RequestItem
	rows, err := h.DB.Table("supervisor_requests sr").
		Select(`sr.id, sr.proposal_id, p.title as proposal_title, s.code as scheme_code,
		        t.name as team_name, u.full_name as student_name, sp.student_number,
		        sp.faculty as student_faculty, sp.study_program as student_prodi,
		        sr.request_message, sr.status, sr.response_message, sr.responded_at, sr.created_at`).
		Joins("JOIN proposals p ON p.id = sr.proposal_id").
		Joins("JOIN pkm_schemes s ON s.id = p.scheme_id").
		Joins("JOIN teams t ON t.id = p.team_id").
		Joins("JOIN users u ON u.id = sr.requested_by").
		Joins("LEFT JOIN student_profiles sp ON sp.user_id = u.id").
		Where("sr.lecturer_id = ?", userID).
		Order("sr.created_at DESC").
		Rows()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat permintaan bimbingan"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var item RequestItem
		if err := h.DB.ScanRows(rows, &item); err == nil {
			items = append(items, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// RespondRequest menangani ACC / Reject permintaan bimbingan
func (h DosenHandler) RespondRequest(c *gin.Context) {
	userID := getUserIDFromContext(c)
	requestID := c.Param("id")

	var input struct {
		Action  string `json:"action" binding:"required"` // 'accepted' | 'rejected'
		Message string `json:"message"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Aksi tidak valid (harus accepted atau rejected)"})
		return
	}

	if input.Action != "accepted" && input.Action != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Aksi harus 'accepted' atau 'rejected'"})
		return
	}

	var req models.SupervisorRequest
	if err := h.DB.Where("id = ? AND lecturer_id = ?", requestID, userID).First(&req).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Permintaan bimbingan tidak ditemukan"})
		return
	}

	now := time.Now()
	req.Status = input.Action
	req.ResponseMessage = input.Message
	req.RespondedAt = &now

	if err := h.DB.Save(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui status permintaan"})
		return
	}

	// Jika diterima, tambahkan relasi di proposal_supervisors jika belum ada
	if input.Action == "accepted" {
		var sup models.ProposalSupervisor
		if h.DB.Where("proposal_id = ? AND lecturer_id = ?", req.ProposalID, userID).First(&sup).Error == gorm.ErrRecordNotFound {
			h.DB.Create(&models.ProposalSupervisor{
				ProposalID: req.ProposalID,
				LecturerID: userID,
				IsPrimary:  true,
				AssignedAt: now,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status permintaan bimbingan berhasil diperbarui",
		"data":    req,
	})
}

// GetGuidanceSessions mengembalikan slot dan jadwal bimbingan milik dosen
func (h DosenHandler) GetGuidanceSessions(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	type SessionItem struct {
		ID            string    `json:"id"`
		ProposalID    string    `json:"proposalId"`
		ProposalTitle string    `json:"proposalTitle"`
		SchemeCode    string    `json:"schemeCode"`
		TeamName      string    `json:"teamName"`
		ScheduledAt   time.Time `json:"scheduledAt"`
		Location      string    `json:"location"`
		MeetingURL    string    `json:"meetingUrl"`
		Status        string    `json:"status"`
		Agenda        string    `json:"agenda"`
		MeetingNotes  string    `json:"meetingNotes"`
	}

	var items []SessionItem
	rows, err := h.DB.Table("guidance_sessions gs").
		Select(`gs.id, gs.proposal_id, p.title as proposal_title, s.code as scheme_code,
		        t.name as team_name, gs.scheduled_at, gs.location, gs.meeting_url,
		        gs.status, gs.agenda, gs.meeting_notes`).
		Joins("JOIN proposals p ON p.id = gs.proposal_id").
		Joins("JOIN pkm_schemes s ON s.id = p.scheme_id").
		Joins("JOIN teams t ON t.id = p.team_id").
		Where("gs.lecturer_id = ?", userID).
		Order("gs.scheduled_at DESC").
		Rows()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat jadwal bimbingan"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var item SessionItem
		if err := h.DB.ScanRows(rows, &item); err == nil {
			items = append(items, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// CreateGuidanceSession membuat slot/jadwal bimbingan baru
func (h DosenHandler) CreateGuidanceSession(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var input struct {
		ProposalID  string `json:"proposalId" binding:"required"`
		ScheduledAt string `json:"scheduledAt" binding:"required"`
		Location    string `json:"location"`
		MeetingURL  string `json:"meetingUrl"`
		Agenda      string `json:"agenda"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data jadwal bimbingan wajib diisi"})
		return
	}

	parsedTime, err := time.Parse(time.RFC3339, input.ScheduledAt)
	if err != nil {
		// Fallback parse format datetime-local HTML5: 2026-10-15T14:30
		parsedTime, err = time.Parse("2006-01-02T15:04", input.ScheduledAt)
		if err != nil {
			parsedTime = time.Now().Add(24 * time.Hour)
		}
	}

	session := models.GuidanceSession{
		ProposalID:  input.ProposalID,
		LecturerID:  &userID,
		ScheduledAt: parsedTime,
		Location:    input.Location,
		MeetingURL:  input.MeetingURL,
		Status:      "scheduled",
		Agenda:      input.Agenda,
	}

	if err := h.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat sesi bimbingan"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Jadwal bimbingan berhasil dibuat",
		"data":    session,
	})
}

// UpdateGuidanceSession memperbarui jadwal, status, dan catatan hasil bimbingan (meeting notes)
func (h DosenHandler) UpdateGuidanceSession(c *gin.Context) {
	userID := getUserIDFromContext(c)
	sessionID := c.Param("id")

	var session models.GuidanceSession
	if err := h.DB.Where("id = ? AND lecturer_id = ?", sessionID, userID).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Sesi bimbingan tidak ditemukan"})
		return
	}

	var input struct {
		ScheduledAt  *string `json:"scheduledAt"`
		Location     *string `json:"location"`
		MeetingURL   *string `json:"meetingUrl"`
		Status       *string `json:"status"` // 'scheduled', 'completed', 'cancelled', 'rescheduled'
		Agenda       *string `json:"agenda"`
		MeetingNotes *string `json:"meetingNotes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	if input.Status != nil {
		session.Status = *input.Status
	}
	if input.Location != nil {
		session.Location = *input.Location
	}
	if input.MeetingURL != nil {
		session.MeetingURL = *input.MeetingURL
	}
	if input.Agenda != nil {
		session.Agenda = *input.Agenda
	}
	if input.MeetingNotes != nil {
		session.MeetingNotes = *input.MeetingNotes
	}
	if input.ScheduledAt != nil && *input.ScheduledAt != "" {
		if pt, err := time.Parse(time.RFC3339, *input.ScheduledAt); err == nil {
			session.ScheduledAt = pt
		} else if pt, err := time.Parse("2006-01-02T15:04", *input.ScheduledAt); err == nil {
			session.ScheduledAt = pt
		}
	}

	if err := h.DB.Save(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan perubahan bimbingan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sesi bimbingan berhasil diperbarui",
		"data":    session,
	})
}

// DeleteGuidanceSession membatalkan / menghapus jadwal bimbingan
func (h DosenHandler) DeleteGuidanceSession(c *gin.Context) {
	userID := getUserIDFromContext(c)
	sessionID := c.Param("id")

	if err := h.DB.Where("id = ? AND lecturer_id = ?", sessionID, userID).Delete(&models.GuidanceSession{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus jadwal bimbingan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Jadwal bimbingan berhasil dihapus"})
}
