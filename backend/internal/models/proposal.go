package models

import "time"

// ---------- PROPOSAL & BIMBINGAN ----------

type Proposal struct {
	ID             string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TeamID         string     `json:"teamId" gorm:"column:team_id;type:uuid;not null"`
	SchemeID       int64      `json:"schemeId" gorm:"column:scheme_id;not null"`
	PeriodID       string     `json:"periodId" gorm:"column:period_id;type:uuid;not null"`
	Title          string     `json:"title" gorm:"not null"`
	Abstract       string     `json:"abstract"`
	Keywords       string     `json:"keywords"`
	Status         string     `json:"status" gorm:"default:draft"`
	CurrentStageID *string    `json:"currentStageId" gorm:"column:current_stage_id;type:uuid"`
	IsFunded       bool       `json:"isFunded" gorm:"column:is_funded;default:false"`
	SubmittedAt    *time.Time `json:"submittedAt" gorm:"column:submitted_at"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

func (Proposal) TableName() string { return "proposals" }

type ProposalDocument struct {
	ID            string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProposalID    string    `json:"proposalId" gorm:"column:proposal_id;type:uuid;not null"`
	VersionNumber int       `json:"versionNumber" gorm:"column:version_number;default:1"`
	FileName      string    `json:"fileName" gorm:"column:file_name;not null"`
	FileURL       string    `json:"fileUrl" gorm:"column:file_url;not null"`
	UploadedBy    *string   `json:"uploadedBy" gorm:"column:uploaded_by;type:uuid"`
	ChangeNotes   string    `json:"changeNotes" gorm:"column:change_notes"`
	UploadedAt    time.Time `json:"uploadedAt" gorm:"column:uploaded_at"`
}

func (ProposalDocument) TableName() string { return "proposal_documents" }

type SupervisorRequest struct {
	ID              string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProposalID      string     `json:"proposalId" gorm:"column:proposal_id;type:uuid;not null"`
	LecturerID      string     `json:"lecturerId" gorm:"column:lecturer_id;type:uuid;not null"`
	RequestedBy     *string    `json:"requestedBy" gorm:"column:requested_by;type:uuid"`
	RequestMessage  string     `json:"requestMessage" gorm:"column:request_message"`
	Status          string     `json:"status" gorm:"default:pending"`
	ResponseMessage string     `json:"responseMessage" gorm:"column:response_message"`
	RespondedAt     *time.Time `json:"respondedAt" gorm:"column:responded_at"`
	CreatedAt       time.Time  `json:"createdAt"`
}

func (SupervisorRequest) TableName() string { return "supervisor_requests" }

type ProposalSupervisor struct {
	ProposalID string    `json:"proposalId" gorm:"column:proposal_id;type:uuid;primaryKey"`
	LecturerID string    `json:"lecturerId" gorm:"column:lecturer_id;type:uuid;primaryKey"`
	IsPrimary  bool      `json:"isPrimary" gorm:"column:is_primary;default:false"`
	AssignedAt time.Time `json:"assignedAt" gorm:"column:assigned_at"`
}

func (ProposalSupervisor) TableName() string { return "proposal_supervisors" }

type GuidanceSession struct {
	ID           string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProposalID   string     `json:"proposalId" gorm:"column:proposal_id;type:uuid;not null"`
	LecturerID   *string    `json:"lecturerId" gorm:"column:lecturer_id;type:uuid"`
	ScheduledAt  time.Time  `json:"scheduledAt" gorm:"column:scheduled_at;not null"`
	Location     string     `json:"location"`
	MeetingURL   string     `json:"meetingUrl" gorm:"column:meeting_url"`
	Status       string     `json:"status" gorm:"default:scheduled"`
	Agenda       string     `json:"agenda"`
	MeetingNotes string     `json:"meetingNotes" gorm:"column:meeting_notes"`
}

func (GuidanceSession) TableName() string { return "guidance_sessions" }

type ProposalFeedback struct {
	ID               string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProposalID       string    `json:"proposalId" gorm:"column:proposal_id;type:uuid;not null"`
	DocumentID       *string   `json:"documentId" gorm:"column:document_id;type:uuid"`
	AuthorID         *string   `json:"authorId" gorm:"column:author_id;type:uuid"`
	FeedbackType     string    `json:"feedbackType" gorm:"column:feedback_type;default:comment"`
	Comment          string    `json:"comment" gorm:"not null"`
	RequiresRevision bool      `json:"requiresRevision" gorm:"column:requires_revision;default:false"`
	CreatedAt        time.Time `json:"createdAt"`
}

func (ProposalFeedback) TableName() string { return "proposal_feedback" }
