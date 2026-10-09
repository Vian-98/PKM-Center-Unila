package models

import "time"

// ---------- KONTEN / CMS (skema v2) ----------
// content_posts (berita/artikel) & content_media (video/galeri) menggantikan
// tabel lama `contents`; `guidelines` menggantikan `pedoman`.

type ContentPost struct {
	ID            string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AuthorID      *string    `json:"authorId" gorm:"column:author_id;type:uuid"`
	ContentType   string     `json:"contentType" gorm:"column:content_type;default:news"`
	Title         string     `json:"title" gorm:"not null"`
	Slug          string     `json:"slug" gorm:"uniqueIndex;not null"`
	Summary       string     `json:"summary"`
	Content       string     `json:"content"`
	CoverImageURL string     `json:"coverImageUrl" gorm:"column:cover_image_url"`
	Status        string     `json:"status" gorm:"default:draft"`
	PublishedAt   *time.Time `json:"publishedAt" gorm:"column:published_at"`
	CreatedAt     time.Time  `json:"createdAt"`
}

func (ContentPost) TableName() string { return "content_posts" }

type ContentMedia struct {
	ID           string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AuthorID     *string    `json:"authorId" gorm:"column:author_id;type:uuid"`
	MediaType    string     `json:"mediaType" gorm:"column:media_type;not null"`
	Title        string     `json:"title" gorm:"not null"`
	Description  string     `json:"description"`
	MediaURL     string     `json:"mediaUrl" gorm:"column:media_url"`
	ThumbnailURL string     `json:"thumbnailUrl" gorm:"column:thumbnail_url"`
	Color        string     `json:"color" gorm:"default:gold"`
	Status       string     `json:"status" gorm:"default:published"`
	SortOrder    int        `json:"sortOrder" gorm:"column:sort_order"`
	PublishedAt  *time.Time `json:"publishedAt" gorm:"column:published_at"`
	CreatedAt    time.Time  `json:"createdAt"`
}

func (ContentMedia) TableName() string { return "content_media" }

type Guideline struct {
	ID            string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PeriodID      *string    `json:"periodId" gorm:"column:period_id;type:uuid"`
	Title         string     `json:"title" gorm:"not null"`
	FileURL       string     `json:"fileUrl" gorm:"column:file_url;not null"`
	Source        string     `json:"source"`
	Note          string     `json:"note"`
	VersionNumber int        `json:"versionNumber" gorm:"column:version_number;default:1"`
	IsActive      bool       `json:"isActive" gorm:"column:is_active;default:true"`
	PublishedAt   *time.Time `json:"publishedAt" gorm:"column:published_at"`
}

func (Guideline) TableName() string { return "guidelines" }

type Notification struct {
	ID               string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID           string    `json:"userId" gorm:"column:user_id;type:uuid;not null"`
	NotificationType string    `json:"notificationType" gorm:"column:notification_type;not null"`
	Title            string    `json:"title" gorm:"not null"`
	Message          string    `json:"message"`
	TargetURL        string    `json:"targetUrl" gorm:"column:target_url"`
	IsRead           bool      `json:"isRead" gorm:"column:is_read;default:false"`
	CreatedAt        time.Time `json:"createdAt"`
}

func (Notification) TableName() string { return "notifications" }
