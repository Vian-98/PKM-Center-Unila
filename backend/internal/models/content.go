package models

import "time"

type Content struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Type        string    `json:"type" gorm:"index;not null"`
	Title       string    `json:"title" gorm:"not null"`
	Category    string    `json:"category"`
	Description string    `json:"description" gorm:"type:text"`
	Body        string    `json:"body" gorm:"type:text"`
	MediaURL    string    `json:"mediaUrl"`
	ThumbnailURL string   `json:"thumbnailUrl"`
	Color       string    `json:"color" gorm:"default:gold"`
	PublishedAt time.Time `json:"publishedAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
