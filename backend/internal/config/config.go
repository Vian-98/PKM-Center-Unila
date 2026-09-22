package config

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Database() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	for attempt := 1; attempt <= 12; attempt++ {
		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			return db
		}
		log.Printf("database connection attempt %d/12 failed: %v", attempt, err)
		time.Sleep(3 * time.Second)
	}
	log.Fatal("database connection failed after retries")
	return nil
}

func Env(key, fallback string) string {
	if value := os.Getenv(key); value != "" { return value }
	return fallback
}
