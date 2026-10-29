package handlers

import (
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/models"
)

type MessageFeedbackHandler struct {
	DB *gorm.DB
}

// visibleThread membatasi query pada pesan antara userID dan contactID yang
// belum disembunyikan ("hapus chat") oleh userID.
func visibleThread(db *gorm.DB, userID, contactID string) *gorm.DB {
	return db.Where(
		"(sender_id = ? AND receiver_id = ? AND hidden_for_sender = false) OR (sender_id = ? AND receiver_id = ? AND hidden_for_receiver = false)",
		userID, contactID, contactID, userID)
}

// ChatContact adalah data ringkas pengguna yang dapat dihubungi lewat pesan langsung.
type ChatContact struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Role    string `json:"role"`
	Faculty string `json:"faculty"`
}

// GetContacts mengembalikan direktori akun aktif (selain diri sendiri) untuk memulai chat baru.
func (h MessageFeedbackHandler) GetContacts(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	var items []ChatContact
	h.DB.Raw(`
		SELECT u.id, u.full_name AS name, u.email,
		       COALESCE(sp.faculty, lp.faculty, '') AS faculty
		FROM users u
		LEFT JOIN student_profiles sp ON sp.user_id = u.id
		LEFT JOIN lecturer_profiles lp ON lp.user_id = u.id
		WHERE u.id <> ? AND u.account_status = 'active'
		ORDER BY u.full_name
	`, userID).Scan(&items)

	auth := AuthHandler{DB: h.DB}
	for i := range items {
		items[i].Role = auth.primaryRole(items[i].ID)
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GetConversations mengembalikan ringkasan daftar percakapan aktif pengguna
func (h MessageFeedbackHandler) GetConversations(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	type ConversationItem struct {
		ContactID    string    `json:"contactId"`
		ContactName  string    `json:"contactName"`
		ContactEmail string    `json:"contactEmail"`
		ContactRole  string    `json:"contactRole"`
		LastMessage  string    `json:"lastMessage"`
		LastSenderID string    `json:"lastSenderId"`
		LastSentAt   time.Time `json:"lastSentAt"`
		UnreadCount  int64     `json:"unreadCount"`
	}

	// Cari semua user yang pernah berkirim pesan dengan userID
	var contactIDs []string
	h.DB.Raw(`
		SELECT DISTINCT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as contact_id
		FROM direct_messages
		WHERE (sender_id = ? AND hidden_for_sender = false) OR (receiver_id = ? AND hidden_for_receiver = false)
	`, userID, userID, userID).Pluck("contact_id", &contactIDs)

	auth := AuthHandler{DB: h.DB}
	items := []ConversationItem{}
	for _, cid := range contactIDs {
		var contact models.User
		if h.DB.Where("id = ?", cid).First(&contact).Error != nil {
			continue
		}

		var lastMsg models.DirectMessage
		if visibleThread(h.DB, userID, cid).Order("created_at DESC").First(&lastMsg).Error != nil {
			continue
		}

		var unread int64
		h.DB.Model(&models.DirectMessage{}).
			Where("sender_id = ? AND receiver_id = ? AND is_read = false AND hidden_for_receiver = false", cid, userID).
			Count(&unread)

		items = append(items, ConversationItem{
			ContactID:    contact.ID,
			ContactName:  contact.FullName,
			ContactEmail: contact.Email,
			ContactRole:  auth.primaryRole(cid),
			LastMessage:  lastMsg.Message,
			LastSenderID: lastMsg.SenderID,
			LastSentAt:   lastMsg.CreatedAt,
			UnreadCount:  unread,
		})
	}

	sort.Slice(items, func(i, j int) bool { return items[i].LastSentAt.After(items[j].LastSentAt) })

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GetThread mengembalikan riwayat pesan langsung antara user login dan contactId
func (h MessageFeedbackHandler) GetThread(c *gin.Context) {
	userID := getUserIDFromContext(c)
	contactID := c.Param("contactId")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	var contact models.User
	if h.DB.Where("id = ?", contactID).First(&contact).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Kontak tidak ditemukan"})
		return
	}

	messages := []models.DirectMessage{}
	visibleThread(h.DB, userID, contactID).
		Order("created_at ASC").
		Find(&messages)

	// Otomatis tandai pesan dari kontak sebagai sudah dibaca
	h.DB.Model(&models.DirectMessage{}).
		Where("sender_id = ? AND receiver_id = ? AND is_read = false", contactID, userID).
		Update("is_read", true)

	c.JSON(http.StatusOK, gin.H{"data": messages})
}

// SendMessage mengirim pesan baru
func (h MessageFeedbackHandler) SendMessage(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	var input struct {
		ReceiverID string  `json:"receiverId" binding:"required"`
		ProposalID *string `json:"proposalId"`
		Message    string  `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Penerima dan pesan wajib diisi"})
		return
	}

	text := strings.TrimSpace(input.Message)
	if text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Pesan tidak boleh kosong"})
		return
	}
	if input.ReceiverID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Tidak dapat mengirim pesan ke diri sendiri"})
		return
	}
	var receiver models.User
	if h.DB.Where("id = ?", input.ReceiverID).First(&receiver).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Penerima tidak terdaftar di sistem"})
		return
	}

	msg := models.DirectMessage{
		SenderID:   userID,
		ReceiverID: receiver.ID,
		ProposalID: input.ProposalID,
		Message:    text,
		IsRead:     false,
		CreatedAt:  time.Now(),
	}

	if err := h.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengirim pesan"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Pesan terkirim",
		"data":    msg,
	})
}

// HideThread menyembunyikan riwayat chat dengan contactId dari sisi user login saja;
// lawan bicara tetap dapat melihat pesannya.
func (h MessageFeedbackHandler) HideThread(c *gin.Context) {
	userID := getUserIDFromContext(c)
	contactID := c.Param("contactId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses tidak diizinkan"})
		return
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.DirectMessage{}).
			Where("sender_id = ? AND receiver_id = ?", userID, contactID).
			Update("hidden_for_sender", true).Error; err != nil {
			return err
		}
		return tx.Model(&models.DirectMessage{}).
			Where("sender_id = ? AND receiver_id = ?", contactID, userID).
			Updates(map[string]any{"hidden_for_receiver": true, "is_read": true}).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus riwayat chat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Riwayat chat dihapus dari tampilan Anda"})
}

// GetProposalFeedback mengembalikan rekap catatan revisi dan feedback proposal
func (h MessageFeedbackHandler) GetProposalFeedback(c *gin.Context) {
	proposalID := c.Param("proposalId")

	type FeedbackItem struct {
		ID               string    `json:"id"`
		ProposalID       string    `json:"proposalId"`
		AuthorID         *string   `json:"authorId"`
		AuthorName       string    `json:"authorName"`
		AuthorRole       string    `json:"authorRole"`
		FeedbackType     string    `json:"feedbackType"` // comment, revision, approval, rejection
		Comment          string    `json:"comment"`
		RequiresRevision bool      `json:"requiresRevision"`
		CreatedAt        time.Time `json:"createdAt"`
	}

	var items []FeedbackItem
	rows, err := h.DB.Table("proposal_feedback pf").
		Select(`pf.id, pf.proposal_id, pf.author_id, u.full_name as author_name,
		        r.code as author_role, pf.feedback_type, pf.comment, pf.requires_revision, pf.created_at`).
		Joins("LEFT JOIN users u ON u.id = pf.author_id").
		Joins("LEFT JOIN user_roles ur ON ur.user_id = u.id").
		Joins("LEFT JOIN roles r ON r.id = ur.role_id").
		Where("pf.proposal_id = ?", proposalID).
		Order("pf.created_at DESC").
		Rows()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat catatan revisi proposal"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var item FeedbackItem
		if err := h.DB.ScanRows(rows, &item); err == nil {
			items = append(items, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// CreateProposalFeedback menambahkan feedback atau catatan revisi pada proposal
func (h MessageFeedbackHandler) CreateProposalFeedback(c *gin.Context) {
	userID := getUserIDFromContext(c)
	proposalID := c.Param("proposalId")

	var input struct {
		DocumentID       *string `json:"documentId"`
		FeedbackType     string  `json:"feedbackType"` // comment, revision, approval, rejection
		Comment          string  `json:"comment" binding:"required"`
		RequiresRevision bool    `json:"requiresRevision"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Catatan feedback wajib diisi"})
		return
	}

	fbType := input.FeedbackType
	if fbType == "" {
		if input.RequiresRevision {
			fbType = "revision"
		} else {
			fbType = "comment"
		}
	}

	fb := models.ProposalFeedback{
		ProposalID:       proposalID,
		DocumentID:       input.DocumentID,
		AuthorID:         &userID,
		FeedbackType:     fbType,
		Comment:          input.Comment,
		RequiresRevision: input.RequiresRevision,
		CreatedAt:        time.Now(),
	}

	if err := h.DB.Create(&fb).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan catatan feedback"})
		return
	}

	// Jika membutuhkan revisi, ubah status proposal menjadi 'revision'
	if input.RequiresRevision {
		h.DB.Model(&models.Proposal{}).Where("id = ?", proposalID).Update("status", "revision")
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Catatan revisi berhasil ditambahkan",
		"data":    fb,
	})
}
