package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

// ---------- TIMELINE ----------

type TimelineHandler struct{ DB *gorm.DB }

type timelineInput struct {
	Year  int    `json:"year" binding:"required"`
	Stage string `json:"stage" binding:"required,max=120"`
	Label string `json:"label" binding:"max=180"`
	Note  string `json:"note"`
	Order int    `json:"order"`
}

func (h TimelineHandler) List(c *gin.Context) {
	var items []models.Timeline
	if err := h.DB.Order("year desc, \"order\" asc, id asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat timeline"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h TimelineHandler) Create(c *gin.Context) {
	var input timelineInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data timeline belum valid"})
		return
	}
	item := models.Timeline{Year: input.Year, Stage: input.Stage, Label: input.Label, Note: input.Note, Order: input.Order}
	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan timeline"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func (h TimelineHandler) Update(c *gin.Context) {
	item, ok := h.findTimeline(c)
	if !ok {
		return
	}
	var input timelineInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data timeline belum valid"})
		return
	}
	item.Year, item.Stage, item.Label, item.Note, item.Order = input.Year, input.Stage, input.Label, input.Note, input.Order
	if err := h.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui timeline"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h TimelineHandler) Delete(c *gin.Context) {
	item, ok := h.findTimeline(c)
	if !ok {
		return
	}
	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus timeline"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h TimelineHandler) findTimeline(c *gin.Context) (models.Timeline, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return models.Timeline{}, false
	}
	var item models.Timeline
	if err := h.DB.First(&item, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Timeline tidak ditemukan"})
		return models.Timeline{}, false
	}
	return item, true
}

// ---------- PEDOMAN ----------

type PedomanHandler struct{ DB *gorm.DB }

type pedomanInput struct {
	Year    int    `json:"year" binding:"required"`
	Title   string `json:"title" binding:"required,max=200"`
	FileURL string `json:"fileUrl"`
	Source  string `json:"source" binding:"max=100"`
	Note    string `json:"note"`
}

func (h PedomanHandler) List(c *gin.Context) {
	var items []models.Pedoman
	if err := h.DB.Order("year desc, id asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat pedoman"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h PedomanHandler) Create(c *gin.Context) {
	var input pedomanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data pedoman belum valid"})
		return
	}
	item := models.Pedoman{Year: input.Year, Title: input.Title, FileURL: input.FileURL, Source: input.Source, Note: input.Note}
	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan pedoman"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func (h PedomanHandler) Update(c *gin.Context) {
	item, ok := h.findPedoman(c)
	if !ok {
		return
	}
	var input pedomanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data pedoman belum valid"})
		return
	}
	item.Year, item.Title, item.FileURL, item.Source, item.Note = input.Year, input.Title, input.FileURL, input.Source, input.Note
	if err := h.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui pedoman"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h PedomanHandler) Delete(c *gin.Context) {
	item, ok := h.findPedoman(c)
	if !ok {
		return
	}
	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus pedoman"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h PedomanHandler) findPedoman(c *gin.Context) (models.Pedoman, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return models.Pedoman{}, false
	}
	var item models.Pedoman
	if err := h.DB.First(&item, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Pedoman tidak ditemukan"})
		return models.Pedoman{}, false
	}
	return item, true
}

// ---------- PORTFOLIO ----------

type PortfolioHandler struct{ DB *gorm.DB }

type portfolioInput struct {
	Year        int    `json:"year" binding:"required"`
	Title       string `json:"title" binding:"required,max=200"`
	Team        string `json:"team" binding:"max=300"`
	Scheme      string `json:"scheme" binding:"max=40"`
	Faculty     string `json:"faculty" binding:"max=120"`
	Prodi       string `json:"prodi" binding:"max=120"`
	Description string `json:"description"`
	Link        string `json:"link"`
}

func (h PortfolioHandler) List(c *gin.Context) {
	query := h.DB.Order("year desc, id asc")
	if year := c.Query("year"); year != "" {
		if y, err := strconv.Atoi(year); err == nil {
			query = query.Where("year = ?", y)
		}
	}
	if scheme := c.Query("scheme"); scheme != "" {
		query = query.Where("scheme = ?", scheme)
	}
	var items []models.Portfolio
	if err := query.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat portofolio"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h PortfolioHandler) Create(c *gin.Context) {
	var input portfolioInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data portofolio belum valid"})
		return
	}
	item := models.Portfolio{Year: input.Year, Title: input.Title, Team: input.Team, Scheme: input.Scheme, Faculty: input.Faculty, Prodi: input.Prodi, Description: input.Description, Link: input.Link}
	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan portofolio"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func (h PortfolioHandler) Update(c *gin.Context) {
	item, ok := h.findPortfolio(c)
	if !ok {
		return
	}
	var input portfolioInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data portofolio belum valid"})
		return
	}
	item.Year, item.Title, item.Team, item.Scheme, item.Faculty, item.Prodi, item.Description, item.Link = input.Year, input.Title, input.Team, input.Scheme, input.Faculty, input.Prodi, input.Description, input.Link
	if err := h.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui portofolio"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h PortfolioHandler) Delete(c *gin.Context) {
	item, ok := h.findPortfolio(c)
	if !ok {
		return
	}
	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus portofolio"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h PortfolioHandler) findPortfolio(c *gin.Context) (models.Portfolio, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID tidak valid"})
		return models.Portfolio{}, false
	}
	var item models.Portfolio
	if err := h.DB.First(&item, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Portofolio tidak ditemukan"})
		return models.Portfolio{}, false
	}
	return item, true
}