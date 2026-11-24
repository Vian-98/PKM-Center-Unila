package models

import "time"

// ---------- SELEKSI IDE (TAHAP 2) ----------

// IdeaSubmission adalah ide awal mahasiswa yang diseleksi reviewer sesuai bidangnya
// sebelum tim dibentuk dan pembimbing dicari.
type IdeaSubmission struct {
	ID               string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StudentID        string     `json:"studentId" gorm:"column:student_id;type:uuid;not null"`
	ExpertiseFieldID int64      `json:"fieldId" gorm:"column:expertise_field_id;not null"`
	SchemeCode       string     `json:"schemeCode" gorm:"column:scheme_code"`
	Title            string     `json:"title" gorm:"not null"`
	Problem          string     `json:"problem" gorm:"not null"`
	Solution         string     `json:"solution" gorm:"not null"`
	Novelty          string     `json:"novelty"`
	TargetOutput     string     `json:"targetOutput" gorm:"column:target_output"`
	Status           string     `json:"status" gorm:"default:submitted"`
	Score            *float64   `json:"score"`
	ReviewerID       *string    `json:"reviewerId" gorm:"column:reviewer_id;type:uuid"`
	ReviewerNote     string     `json:"reviewerNote" gorm:"column:reviewer_note"`
	ReviewedAt       *time.Time `json:"reviewedAt" gorm:"column:reviewed_at"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

func (IdeaSubmission) TableName() string { return "idea_submissions" }
