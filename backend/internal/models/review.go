package models

import "time"

// ---------- REVIEW & PENILAIAN ----------

type ReviewAssignment struct {
	ID             string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProposalID     string     `json:"proposalId" gorm:"column:proposal_id;type:uuid;not null"`
	ReviewerID     string     `json:"reviewerId" gorm:"column:reviewer_id;type:uuid;not null"`
	AssignedBy     *string    `json:"assignedBy" gorm:"column:assigned_by;type:uuid"`
	Status         string     `json:"status" gorm:"default:assigned"`
	ReviewDeadline *time.Time `json:"reviewDeadline" gorm:"column:review_deadline;type:date"`
	AssignedAt     time.Time  `json:"assignedAt" gorm:"column:assigned_at"`
}

func (ReviewAssignment) TableName() string { return "review_assignments" }

type Review struct {
	ID             string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AssignmentID   string     `json:"assignmentId" gorm:"column:assignment_id;type:uuid;uniqueIndex;not null"`
	TotalScore     float64    `json:"totalScore" gorm:"column:total_score"`
	Strengths      string     `json:"strengths"`
	Weaknesses     string     `json:"weaknesses"`
	Comments       string     `json:"comments"`
	Recommendation string     `json:"recommendation"`
	ReviewStatus   string     `json:"reviewStatus" gorm:"column:review_status;default:draft"`
	SubmittedAt    *time.Time `json:"submittedAt" gorm:"column:submitted_at"`
}

func (Review) TableName() string { return "reviews" }

type ReviewCriteria struct {
	ID          int64   `json:"id" gorm:"primaryKey"`
	SchemeID    int64   `json:"schemeId" gorm:"column:scheme_id;not null"`
	Name        string  `json:"name" gorm:"not null"`
	Description string  `json:"description"`
	MaxScore    float64 `json:"maxScore" gorm:"column:max_score;default:100"`
	Weight      float64 `json:"weight" gorm:"default:1"`
}

func (ReviewCriteria) TableName() string { return "review_criteria" }

type ReviewScore struct {
	ReviewID    string  `json:"reviewId" gorm:"column:review_id;type:uuid;primaryKey"`
	CriterionID int64   `json:"criterionId" gorm:"column:criterion_id;primaryKey"`
	Score       float64 `json:"score"`
	Comment     string  `json:"comment"`
}

func (ReviewScore) TableName() string { return "review_scores" }
