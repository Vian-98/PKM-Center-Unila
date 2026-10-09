package models

import "time"

// ---------- LOGBOOK KEGIATAN & ANALISIS AI ----------

type LogbookEntry struct {
	ID                  string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProposalID          string    `json:"proposalId" gorm:"column:proposal_id;type:uuid;not null"`
	StudentID           string    `json:"studentId" gorm:"column:student_id;type:uuid;not null"`
	ActivityDate        time.Time `json:"activityDate" gorm:"column:activity_date;type:date;not null"`
	Title               string    `json:"title" gorm:"not null"`
	ActivityDescription string    `json:"activityDescription" gorm:"column:activity_description"`
	ProgressResult      string    `json:"progressResult" gorm:"column:progress_result"`
	Obstacle            string    `json:"obstacle"`
	NextPlan            string    `json:"nextPlan" gorm:"column:next_plan"`
	AttachmentURL       string    `json:"attachmentUrl" gorm:"column:attachment_url"`
	VerificationStatus  string    `json:"verificationStatus" gorm:"column:verification_status;default:pending"`
	CreatedAt           time.Time `json:"createdAt"`
}

func (LogbookEntry) TableName() string { return "logbook_entries" }

type LogbookComment struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	LogbookID string    `json:"logbookId" gorm:"column:logbook_id;type:uuid;not null"`
	AuthorID  *string   `json:"authorId" gorm:"column:author_id;type:uuid"`
	Comment   string    `json:"comment" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt"`
}

func (LogbookComment) TableName() string { return "logbook_comments" }

type AIAnalysis struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	RequestedBy     *string   `json:"requestedBy" gorm:"column:requested_by;type:uuid"`
	ProposalID      *string   `json:"proposalId" gorm:"column:proposal_id;type:uuid"`
	AnalysisType    string    `json:"analysisType" gorm:"column:analysis_type;not null"`
	InputText       string    `json:"inputText" gorm:"column:input_text"`
	OutputText      string    `json:"outputText" gorm:"column:output_text"`
	ConfidenceScore *float64  `json:"confidenceScore" gorm:"column:confidence_score"`
	ModelName       string    `json:"modelName" gorm:"column:model_name"`
	CreatedAt       time.Time `json:"createdAt"`
}

func (AIAnalysis) TableName() string { return "ai_analyses" }
