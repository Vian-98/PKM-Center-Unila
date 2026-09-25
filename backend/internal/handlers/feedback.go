package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

// ---------- FEEDBACK (Kritik & Saran + Form Kontak) ----------

type FeedbackHandler struct{ DB *gorm.DB }

type feedbackInput struct {
	Kind    string `json:"kind" binding:"required,oneof=saran kontak"`
	Name    string `json:"name" binding:"max=120"`
	Email   string `json:"email" binding:"max=160"`
	Message string `json:"message" binding:"required,min=3,max=2000"`
}

func (h FeedbackHandler) Create(c *gin.Context) {
	var input feedbackInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Pesan belum valid (minimal 3 karakter)"})
		return
	}
	item := models.Feedback{Kind: input.Kind, Name: input.Name, Email: input.Email, Message: input.Message}
	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan pesan"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func (h FeedbackHandler) List(c *gin.Context) {
	query := h.DB.Order("read asc, created_at desc")
	if kind := c.Query("kind"); kind != "" {
		query = query.Where("kind = ?", kind)
	}
	var items []models.Feedback
	if err := query.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat pesan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h FeedbackHandler) MarkRead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}
	var item models.Feedback
	if err := h.DB.First(&item, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Pesan tidak ditemukan"})
		return
	}
	item.Read = true
	if err := h.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui pesan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h FeedbackHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return
	}
	var item models.Feedback
	if err := h.DB.First(&item, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Pesan tidak ditemukan"})
		return
	}
	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus pesan"})
		return
	}
	c.Status(http.StatusNoContent)
}

// ---------- STATISTIK SKEMA PKM ----------

type StatsHandler struct{ DB *gorm.DB }

func (h StatsHandler) List(c *gin.Context) {
	var items []models.SchemeStat
	if err := h.DB.Order("id asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat statistik"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h StatsHandler) Update(c *gin.Context) {
	var input []models.SchemeStat
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data statistik belum valid"})
		return
	}
	for _, s := range input {
		if s.Scheme == "" {
			continue
		}
		var existing models.SchemeStat
		err := h.DB.Where("scheme = ?", s.Scheme).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			existing = models.SchemeStat{Scheme: s.Scheme, Count: s.Count}
			h.DB.Create(&existing)
			continue
		}
		if existing.Count != s.Count {
			h.DB.Model(&existing).Update("count", s.Count)
		}
	}
	h.List(c)
}

// ---------- KONTAK ----------

type ContactHandler struct{ DB *gorm.DB }

type contactInput struct {
	Address   string `json:"address"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	WhatsApp  string `json:"whatsApp"`
	Instagram string `json:"instagram"`
	Facebook  string `json:"facebook"`
	MapEmbed  string `json:"mapEmbed"`
}

func (h ContactHandler) Get(c *gin.Context) {
	var item models.ContactInfo
	if err := h.DB.First(&item, 1).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"data": models.ContactInfo{}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h ContactHandler) Update(c *gin.Context) {
	var input contactInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data kontak belum valid"})
		return
	}
	var item models.ContactInfo
	if err := h.DB.First(&item, 1).Error; err != nil {
		item = models.ContactInfo{ID: 1}
	}
	item.Address, item.Email, item.Phone, item.WhatsApp, item.Instagram, item.Facebook, item.MapEmbed = input.Address, input.Email, input.Phone, input.WhatsApp, input.Instagram, input.Facebook, input.MapEmbed
	if err := h.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan kontak"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}