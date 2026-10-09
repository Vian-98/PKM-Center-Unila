package models

import "time"

// ---------- AUTENTIKASI & PENGGUNA (skema v2) ----------
// Detail kolom mengikuti backend/migrations/0001_init_pkm_schema.sql.

type User struct {
	ID              string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email           string     `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash    string     `json:"-" gorm:"column:password_hash;not null"`
	FullName        string     `json:"name" gorm:"column:full_name;not null"`
	Phone           string     `json:"phone"`
	AccountStatus   string     `json:"accountStatus" gorm:"column:account_status;default:active"`
	AuthProvider    string     `json:"authProvider" gorm:"column:auth_provider;default:local"`
	EmailVerifiedAt *time.Time `json:"emailVerifiedAt" gorm:"column:email_verified_at"`
	LastLoginAt     *time.Time `json:"lastLoginAt" gorm:"column:last_login_at"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

func (User) TableName() string { return "users" }

type Role struct {
	ID          int64  `json:"id" gorm:"primaryKey"`
	Code        string `json:"code" gorm:"uniqueIndex;not null"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (Role) TableName() string { return "roles" }

type UserRole struct {
	UserID     string    `json:"userId" gorm:"column:user_id;type:uuid;primaryKey"`
	RoleID     int64     `json:"roleId" gorm:"column:role_id;primaryKey"`
	AssignedAt time.Time `json:"assignedAt" gorm:"column:assigned_at;autoCreateTime"`
}

func (UserRole) TableName() string { return "user_roles" }

type StudentProfile struct {
	UserID         string  `json:"userId" gorm:"column:user_id;type:uuid;primaryKey"`
	StudentNumber  string  `json:"studentNumber" gorm:"column:student_number;uniqueIndex;not null"`
	Faculty        string  `json:"faculty"`
	Department     string  `json:"department"`
	StudyProgram   string  `json:"studyProgram" gorm:"column:study_program"`
	EntryYear      int     `json:"entryYear" gorm:"column:entry_year"`
	GPA            float64 `json:"gpa" gorm:"column:gpa"`
	AcademicStatus string  `json:"academicStatus" gorm:"column:academic_status"`
	Biography      string  `json:"biography"`
}

func (StudentProfile) TableName() string { return "student_profiles" }

type LecturerProfile struct {
	UserID              string `json:"userId" gorm:"column:user_id;type:uuid;primaryKey"`
	LecturerNumber      string `json:"lecturerNumber" gorm:"column:lecturer_number;uniqueIndex;not null"`
	Faculty             string `json:"faculty"`
	Department          string `json:"department"`
	StudyProgram        string `json:"studyProgram" gorm:"column:study_program"`
	AcademicPosition    string `json:"academicPosition" gorm:"column:academic_position"`
	Biography           string `json:"biography"`
	SupervisionCapacity int    `json:"supervisionCapacity" gorm:"column:supervision_capacity"`
}

func (LecturerProfile) TableName() string { return "lecturer_profiles" }

type ExpertiseField struct {
	ID          int64  `json:"id" gorm:"primaryKey"`
	Name        string `json:"name" gorm:"uniqueIndex;not null"`
	Description string `json:"description"`
}

func (ExpertiseField) TableName() string { return "expertise_fields" }

type UserExpertise struct {
	UserID         string `json:"userId" gorm:"column:user_id;type:uuid;primaryKey"`
	ExpertiseID    int64  `json:"expertiseId" gorm:"column:expertise_id;primaryKey"`
	ExpertiseLevel string `json:"expertiseLevel" gorm:"column:expertise_level"`
}

func (UserExpertise) TableName() string { return "user_expertise" }

type Achievement struct {
	ID                 string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	StudentID          string     `json:"studentId" gorm:"column:student_id;type:uuid;not null"`
	Title              string     `json:"title" gorm:"not null"`
	Category           string     `json:"category"`
	Organizer          string     `json:"organizer"`
	AchievementLevel   string     `json:"achievementLevel" gorm:"column:achievement_level"`
	Rank               string     `json:"rank" gorm:"column:rank"`
	AchievementDate    *time.Time `json:"achievementDate" gorm:"column:achievement_date;type:date"`
	CertificateURL     string     `json:"certificateUrl" gorm:"column:certificate_url"`
	VerificationStatus string     `json:"verificationStatus" gorm:"column:verification_status;default:pending"`
	CreatedAt          time.Time  `json:"createdAt"`
}

func (Achievement) TableName() string { return "achievements" }
