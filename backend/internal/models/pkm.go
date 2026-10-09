package models

import "time"

// ---------- MASTER PKM ----------

type PKMPeriod struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name              string    `json:"name" gorm:"not null"`
	Year              int       `json:"year" gorm:"not null"`
	RegistrationStart *time.Time `json:"registrationStart" gorm:"column:registration_start;type:date"`
	RegistrationEnd   *time.Time `json:"registrationEnd" gorm:"column:registration_end;type:date"`
	Status            string    `json:"status" gorm:"default:draft"`
	CreatedAt         time.Time `json:"createdAt"`
}

func (PKMPeriod) TableName() string { return "pkm_periods" }

type PKMScheme struct {
	ID          int64  `json:"id" gorm:"primaryKey"`
	Code        string `json:"code" gorm:"uniqueIndex;not null"`
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	MinMembers  int    `json:"minMembers" gorm:"column:min_members;default:3"`
	MaxMembers  int    `json:"maxMembers" gorm:"column:max_members;default:5"`
	IsActive    bool   `json:"isActive" gorm:"column:is_active;default:true"`
}

func (PKMScheme) TableName() string { return "pkm_schemes" }

type PKMStage struct {
	ID          string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PeriodID    string     `json:"periodId" gorm:"column:period_id;type:uuid;not null"`
	Name        string     `json:"name" gorm:"not null"`
	StageOrder  int        `json:"stageOrder" gorm:"column:stage_order;default:0"`
	StartDate   *time.Time `json:"startDate" gorm:"column:start_date;type:date"`
	EndDate     *time.Time `json:"endDate" gorm:"column:end_date;type:date"`
	Status      string     `json:"status" gorm:"default:pending"`
	Description string     `json:"description"`
}

func (PKMStage) TableName() string { return "pkm_stages" }

// SchemeStatView memetakan view v_scheme_stats (statistik turunan dari proposals).
type SchemeStatView struct {
	Scheme string `json:"scheme"`
	Name   string `json:"name"`
	Count  int    `json:"count"`
	Funded int    `json:"funded"`
}
