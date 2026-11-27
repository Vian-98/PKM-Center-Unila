package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

// PeriodHandler mengelola periode PKM (contoh: "PKM 2026", "PKM 2027") dari panel admin.
// Tim, usulan, dan pilihan rencana mahasiswa dicatat per periode, jadi periode baru
// harus dibuka di sini supaya mahasiswa bisa mulai lagi dari awal tiap tahun.
type PeriodHandler struct {
	DB *gorm.DB
}

var validPeriodStatus = map[string]bool{"draft": true, "open": true, "closed": true, "archived": true}

// tahapan bawaan untuk periode baru bila belum ada periode lain yang bisa disalin.
var defaultStageNames = []string{
	"Pendaftaran & pengusulan",
	"Review proposal",
	"Penetapan pendanaan",
	"Pelaksanaan & monitoring",
	"Pelaporan & PIMNAS",
}

type periodInput struct {
	Name              string `json:"name"`
	Year              int    `json:"year"`
	RegistrationStart string `json:"registrationStart"`
	RegistrationEnd   string `json:"registrationEnd"`
	Status            string `json:"status"`
}

func parseOptionalDate(value string) (*time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}
	if len(value) > 10 {
		value = value[:10]
	}
	t, err := time.Parse("2006-01-02", value)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// apply memeriksa input dan mengisi period. Mengembalikan pesan galat untuk pengguna.
func (in periodInput) apply(period *models.PKMPeriod) string {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return "Nama periode wajib diisi"
	}
	if in.Year < 2000 || in.Year > 2100 {
		return "Tahun periode tidak valid"
	}
	status := strings.TrimSpace(in.Status)
	if status == "" {
		status = "draft"
	}
	if !validPeriodStatus[status] {
		return "Status periode tidak dikenal"
	}
	start, err := parseOptionalDate(in.RegistrationStart)
	if err != nil {
		return "Tanggal mulai pendaftaran tidak valid"
	}
	end, err := parseOptionalDate(in.RegistrationEnd)
	if err != nil {
		return "Tanggal akhir pendaftaran tidak valid"
	}
	if start != nil && end != nil && end.Before(*start) {
		return "Tanggal akhir pendaftaran harus setelah tanggal mulai"
	}
	period.Name = name
	period.Year = in.Year
	period.Status = status
	period.RegistrationStart = start
	period.RegistrationEnd = end
	return ""
}

// closeOtherOpen menutup periode lain yang masih "open" agar hanya satu periode aktif.
func closeOtherOpen(tx *gorm.DB, keepID string) error {
	return tx.Model(&models.PKMPeriod{}).
		Where("status = ? AND id <> ?", "open", keepID).
		Update("status", "closed").Error
}

func (h PeriodHandler) duplicateName(name string, year int, exceptID string) bool {
	var count int64
	q := h.DB.Model(&models.PKMPeriod{}).Where("LOWER(name) = LOWER(?) AND year = ?", name, year)
	if exceptID != "" {
		q = q.Where("id <> ?", exceptID)
	}
	q.Count(&count)
	return count > 0
}

// List menampilkan semua periode beserta jumlah tim dan usulan di dalamnya.
func (h PeriodHandler) List(c *gin.Context) {
	type row struct {
		ID                string     `json:"id"`
		Name              string     `json:"name"`
		Year              int        `json:"year"`
		RegistrationStart *time.Time `json:"registrationStart"`
		RegistrationEnd   *time.Time `json:"registrationEnd"`
		Status            string     `json:"status"`
		CreatedAt         time.Time  `json:"createdAt"`
		TeamCount         int64      `json:"teamCount"`
		ProposalCount     int64      `json:"proposalCount"`
		StageCount        int64      `json:"stageCount"`
	}
	rows := []row{}
	err := h.DB.Raw(`
		SELECT p.id, p.name, p.year, p.registration_start, p.registration_end, p.status, p.created_at,
		       (SELECT COUNT(*) FROM teams t WHERE t.period_id = p.id) AS team_count,
		       (SELECT COUNT(*) FROM proposals pr WHERE pr.period_id = p.id) AS proposal_count,
		       (SELECT COUNT(*) FROM pkm_stages s WHERE s.period_id = p.id) AS stage_count
		FROM pkm_periods p
		ORDER BY p.year DESC, p.created_at DESC`).Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat periode"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// Create membuat periode baru dan menyalin daftar tahapan dari periode terakhir.
func (h PeriodHandler) Create(c *gin.Context) {
	var in periodInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data periode tidak valid"})
		return
	}
	period := models.PKMPeriod{ID: uuidV4()}
	if msg := in.apply(&period); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": msg})
		return
	}
	if h.duplicateName(period.Name, period.Year, "") {
		c.JSON(http.StatusConflict, gin.H{"message": "Periode dengan nama dan tahun ini sudah ada"})
		return
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// Ambil tahapan dari periode terbaru sebelum periode baru dibuat.
		var source models.PKMPeriod
		stageNames := []string{}
		if tx.Order("year DESC, created_at DESC").First(&source).Error == nil {
			var stages []models.PKMStage
			tx.Where("period_id = ?", source.ID).Order("stage_order ASC").Find(&stages)
			for _, s := range stages {
				stageNames = append(stageNames, s.Name)
			}
		}
		if len(stageNames) == 0 {
			stageNames = defaultStageNames
		}

		if err := tx.Create(&period).Error; err != nil {
			return err
		}
		for i, name := range stageNames {
			status := "pending"
			if i == 0 {
				status = "active"
			}
			if err := tx.Create(&models.PKMStage{ID: uuidV4(), PeriodID: period.ID, Name: name, StageOrder: i + 1, Status: status}).Error; err != nil {
				return err
			}
		}
		if period.Status == "open" {
			return closeOtherOpen(tx, period.ID)
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat periode"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": period, "message": "Periode dibuat"})
}

// Update mengubah data periode. Bila status diubah menjadi "open", periode lain ditutup.
func (h PeriodHandler) Update(c *gin.Context) {
	var period models.PKMPeriod
	if err := h.DB.Where("id = ?", c.Param("id")).First(&period).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Periode tidak ditemukan"})
		return
	}
	var in periodInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data periode tidak valid"})
		return
	}
	if msg := in.apply(&period); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": msg})
		return
	}
	if h.duplicateName(period.Name, period.Year, period.ID) {
		c.JSON(http.StatusConflict, gin.H{"message": "Periode dengan nama dan tahun ini sudah ada"})
		return
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.PKMPeriod{}).Where("id = ?", period.ID).Updates(map[string]interface{}{
			"name":               period.Name,
			"year":               period.Year,
			"status":             period.Status,
			"registration_start": period.RegistrationStart,
			"registration_end":   period.RegistrationEnd,
		}).Error; err != nil {
			return err
		}
		if period.Status == "open" {
			return closeOtherOpen(tx, period.ID)
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan periode"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": period, "message": "Periode tersimpan"})
}

// Delete menghapus periode yang belum punya tim maupun usulan.
func (h PeriodHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	var period models.PKMPeriod
	if err := h.DB.Where("id = ?", id).First(&period).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Periode tidak ditemukan"})
		return
	}
	var teams, proposals int64
	h.DB.Model(&models.Team{}).Where("period_id = ?", id).Count(&teams)
	h.DB.Model(&models.Proposal{}).Where("period_id = ?", id).Count(&proposals)
	if teams > 0 || proposals > 0 {
		c.JSON(http.StatusConflict, gin.H{"message": "Periode ini sudah berisi tim atau usulan. Ubah statusnya menjadi Ditutup atau Diarsipkan saja."})
		return
	}
	if err := h.DB.Delete(&models.PKMPeriod{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus periode"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Periode dihapus"})
}
