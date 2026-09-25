package models

import "time"

// Timeline PKM per tahun: tahapan pengusulan → review → penetapan → PIMNAS.
type Timeline struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Year      int       `json:"year" gorm:"index;not null"`
	Stage     string    `json:"stage" gorm:"not null"` // nama tahapan
	Label     string    `json:"label"`                 // tanggal/jadwal, mis. "16 Februari 2026"
	Note      string    `json:"note"`
	Order     int       `json:"order" gorm:"default:0"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Pedoman PKM per tahun.
type Pedoman struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Year      int       `json:"year" gorm:"index;not null"`
	Title     string    `json:"title" gorm:"not null"`
	FileURL   string    `json:"fileUrl"` // tautan PDF eksternal
	Source    string    `json:"source"`  // asal dokumen, mis. "SIMBELMAWA"
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Portfolio: arsip proposal yang lolos pendanaan per tahun.
type Portfolio struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Year        int       `json:"year" gorm:"index;not null"`
	Title       string    `json:"title" gorm:"not null"`
	Team        string    `json:"team"`
	Scheme      string    `json:"scheme" gorm:"index"` // PKM-K, PKM-PI, dst
	Faculty     string    `json:"faculty"`
	Prodi       string    `json:"prodi"`
	Description string    `json:"description" gorm:"type:text"`
	Link        string    `json:"link" gorm:"type:text"` // tautan/luaran (opsional)
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Feedback: Kritik & Saran dari guest + pesan form kontak.
type Feedback struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Kind      string    `json:"kind" gorm:"index;not null"` // "saran" | "kontak"
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Message   string    `json:"message" gorm:"type:text;not null"`
	Read      bool      `json:"read" gorm:"default:false"`
	CreatedAt time.Time `json:"createdAt"`
}

// SchemeStat: jumlah usulan proposal per skema PKM (ditampilkan di Home).
type SchemeStat struct {
	ID     uint   `json:"id" gorm:"primaryKey"`
	Scheme string `json:"scheme" gorm:"uniqueIndex;not null"` // PKM-K, PKM-PI, dst
	Count  int    `json:"count" gorm:"default:0"`
}

// ContactInfo: informasi kontak PKM Center (baris tunggal, id=1).
type ContactInfo struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Address   string    `json:"address" gorm:"type:text"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	WhatsApp  string    `json:"whatsApp"`
	Instagram string    `json:"instagram"`
	Facebook  string    `json:"facebook"`
	MapEmbed  string    `json:"mapEmbed" gorm:"type:text"` // URL embed peta
	UpdatedAt time.Time `json:"updatedAt"`
}