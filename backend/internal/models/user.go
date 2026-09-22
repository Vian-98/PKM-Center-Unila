package models

import "time"

type Role string

const (
	RoleAdmin     Role = "admin"
	RoleMahasiswa Role = "mahasiswa"
	RoleDosen     Role = "dosen"
)

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"not null"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"not null"`
	Role      Role      `json:"role" gorm:"type:varchar(20);not null"`
	CreatedAt time.Time `json:"createdAt"`
}
