package models

import "time"

// DirectMessage model untuk sistem pesan langsung antar pengguna (Chat)
type DirectMessage struct {
	ID         string  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SenderID   string  `json:"senderId" gorm:"column:sender_id;type:uuid;not null"`
	ReceiverID string  `json:"receiverId" gorm:"column:receiver_id;type:uuid;not null"`
	ProposalID *string `json:"proposalId" gorm:"column:proposal_id;type:uuid"`
	Message    string  `json:"message" gorm:"not null"`
	IsRead     bool    `json:"isRead" gorm:"column:is_read;default:false"`
	// Penanda "hapus chat" per sisi; pesan tetap terlihat oleh pihak lain.
	HiddenForSender   bool      `json:"-" gorm:"column:hidden_for_sender;default:false"`
	HiddenForReceiver bool      `json:"-" gorm:"column:hidden_for_receiver;default:false"`
	CreatedAt         time.Time `json:"createdAt"`
}

func (DirectMessage) TableName() string { return "direct_messages" }
