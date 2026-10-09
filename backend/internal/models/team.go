package models

import "time"

// ---------- TIM PKM ----------

type Team struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PeriodID  string    `json:"periodId" gorm:"column:period_id;type:uuid;not null"`
	LeaderID  string    `json:"leaderId" gorm:"column:leader_id;type:uuid;not null"`
	Name      string    `json:"name" gorm:"not null"`
	Status    string    `json:"status" gorm:"default:draft"`
	CreatedAt time.Time `json:"createdAt"`
}

func (Team) TableName() string { return "teams" }

type TeamMember struct {
	TeamID           string     `json:"teamId" gorm:"column:team_id;type:uuid;primaryKey"`
	StudentID        string     `json:"studentId" gorm:"column:student_id;type:uuid;primaryKey"`
	MemberRole       string     `json:"memberRole" gorm:"column:member_role;default:member"`
	InvitationStatus string     `json:"invitationStatus" gorm:"column:invitation_status;default:pending"`
	JoinedAt         *time.Time `json:"joinedAt" gorm:"column:joined_at"`
}

func (TeamMember) TableName() string { return "team_members" }

type TeamInvitation struct {
	ID          string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TeamID      string     `json:"teamId" gorm:"column:team_id;type:uuid;not null"`
	SenderID    string     `json:"senderId" gorm:"column:sender_id;type:uuid;not null"`
	RecipientID string     `json:"recipientId" gorm:"column:recipient_id;type:uuid;not null"`
	Message     string     `json:"message"`
	Status      string     `json:"status" gorm:"default:pending"`
	RespondedAt *time.Time `json:"respondedAt" gorm:"column:responded_at"`
	CreatedAt   time.Time  `json:"createdAt"`
}

func (TeamInvitation) TableName() string { return "team_invitations" }
