// Package migrations menjalankan berkas SQL migrasi (embedded) secara
// berurutan saat startup. Berkas diberi nama berurutan (0001_, 0002_, ...)
// agar urutan eksekusi deterministik dan idempoten.
package migrations

import (
	"embed"
	"fmt"
	"sort"
	"strings"

	"gorm.io/gorm"
)

//go:embed *.sql
var files embed.FS

// Run mengeksekusi semua migrasi .sql yang tertanam. Setiap pernyataan
// dijalankan terpisah (mode autocommit) supaya aman terhadap prepared
// statement driver PostgreSQL.
func Run(db *gorm.DB) error {
	entries, err := files.ReadDir(".")
	if err != nil {
		return err
	}
	names := make([]string, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	for _, name := range names {
		raw, err := files.ReadFile(name)
		if err != nil {
			return err
		}
		for _, stmt := range splitStatements(string(raw)) {
			switch strings.ToUpper(strings.TrimSpace(stmt)) {
			case "BEGIN", "COMMIT", "START TRANSACTION":
				continue
			}
			if err := db.Exec(stmt).Error; err != nil {
				return fmt.Errorf("migrasi %s gagal: %w", name, err)
			}
		}
	}
	return nil
}

// splitStatements memecah skrip SQL menjadi pernyataan per pernyataan dengan
// menghormati string literal ('...') dan komentar baris (-- ...).
func splitStatements(script string) []string {
	var stmts []string
	var b strings.Builder
	inSingle := false
	inLineComment := false
	for i := 0; i < len(script); i++ {
		ch := script[i]
		if inLineComment {
			if ch == '\n' {
				inLineComment = false
				b.WriteByte(ch)
			}
			continue
		}
		if inSingle {
			b.WriteByte(ch)
			if ch == '\'' {
				if i+1 < len(script) && script[i+1] == '\'' { // '' escape
					b.WriteByte(script[i+1])
					i++
					continue
				}
				inSingle = false
			}
			continue
		}
		switch {
		case ch == '-' && i+1 < len(script) && script[i+1] == '-':
			inLineComment = true
			i++
		case ch == '\'':
			inSingle = true
			b.WriteByte(ch)
		case ch == ';':
			if s := strings.TrimSpace(b.String()); s != "" {
				stmts = append(stmts, s)
			}
			b.Reset()
		default:
			b.WriteByte(ch)
		}
	}
	if s := strings.TrimSpace(b.String()); s != "" {
		stmts = append(stmts, s)
	}
	return stmts
}
