package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

type ContentHandler struct{ DB *gorm.DB }

type contentInput struct {
	Type        string `json:"type" binding:"required,oneof=news video gallery"`
	Title       string `json:"title" binding:"required,max=180"`
	Category    string `json:"category" binding:"max=80"`
	Description string `json:"description" binding:"max=500"`
	Body        string `json:"body"`
	MediaURL    string `json:"mediaUrl" binding:"omitempty,url"`
	ThumbnailURL string `json:"thumbnailUrl" binding:"omitempty,url"`
	Color       string `json:"color" binding:"omitempty,oneof=gold blue red green"`
}

func (h ContentHandler) ListPublic(c *gin.Context) {
	contentType := c.Query("type")
	query := h.DB.Order("published_at desc")
	if contentType != "" { query = query.Where("type = ?", contentType) }
	var items []models.Content
	if err := query.Find(&items).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat konten"}); return }
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h ContentHandler) GetPublic(c *gin.Context) { h.getByID(c) }

func (h ContentHandler) ListAdmin(c *gin.Context) { h.ListPublic(c) }

func (h ContentHandler) Create(c *gin.Context) {
	var input contentInput
	if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"message": "Data konten belum valid"}); return }
	if input.Color == "" { input.Color = "gold" }
	item := models.Content{Type: input.Type, Title: input.Title, Category: input.Category, Description: input.Description, Body: input.Body, MediaURL: input.MediaURL, ThumbnailURL: input.ThumbnailURL, Color: input.Color, PublishedAt: time.Now()}
	if err := h.DB.Create(&item).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan konten"}); return }
	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func (h ContentHandler) Update(c *gin.Context) {
	item, ok := h.find(c); if !ok { return }
	var input contentInput
	if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"message": "Data konten belum valid"}); return }
	if input.Color == "" { input.Color = "gold" }
	item.Type, item.Title, item.Category, item.Description, item.Body, item.MediaURL, item.ThumbnailURL, item.Color = input.Type, input.Title, input.Category, input.Description, input.Body, input.MediaURL, input.ThumbnailURL, input.Color
	if err := h.DB.Save(&item).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui konten"}); return }
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h ContentHandler) Delete(c *gin.Context) {
	item, ok := h.find(c); if !ok { return }
	if err := h.DB.Delete(&item).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus konten"}); return }
	c.Status(http.StatusNoContent)
}

func (h ContentHandler) getByID(c *gin.Context) { item, ok := h.find(c); if ok { c.JSON(http.StatusOK, gin.H{"data": item}) } }
func (h ContentHandler) find(c *gin.Context) (models.Content, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64); if err != nil { c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"}); return models.Content{}, false }
	var item models.Content
	if err := h.DB.First(&item, uint(id)).Error; err != nil { c.JSON(http.StatusNotFound, gin.H{"message": "Konten tidak ditemukan"}); return models.Content{}, false }
	return item, true
}
