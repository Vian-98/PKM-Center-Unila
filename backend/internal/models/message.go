package models

import "time"

// DirectMessage model untuk sistem pesan langsung antar pengguna (Chat)
type DirectMessage struct {
	ID         string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SenderID   string    `json:"senderId" gorm:"column:sender_id;type:uuid;not null"`
	ReceiverID string    `json:"receiverId" gorm:"column:receiver_id;type:uuid;not null"`
	ProposalID *string   `json:"proposalId" gorm:"column:proposal_id;type:uuid"`
	Message    string    `json:"message" gorm:"not null"`
	IsRead     bool      `json:"isRead" gorm:"column:is_read;default:false"`
	CreatedAt  time.Time `json:"createdAt"`
}

func (DirectMessage) TableName() string { return "direct_messages" }
