package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pkm-center/backend/internal/config"
	"pkm-center/backend/internal/models"
)

// AIHandler menangani integrasi AI Idea Lab dengan 9Router gateway
// dan persistensi riwayat konsultasi ke tabel ai_analyses.
type AIHandler struct {
	DB *gorm.DB
}

type BrainstormRequest struct {
	Message    string              `json:"message" binding:"required"`
	History    []ChatMessageInput  `json:"history"`
	ProposalID *string             `json:"proposalId"`
}

type ChatMessageInput struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatRequest struct {
	Model       string              `json:"model"`
	Messages    []openAIChatMessage `json:"messages"`
	Temperature float32             `json:"temperature"`
	Stream      bool                `json:"stream"`
}

type openAIChatResponse struct {
	ID      string `json:"id"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error"`
}

const pkmSystemPrompt = `Anda adalah AI Asisten Idea Lab dari PKM Center Universitas Lampung (Unila).
Tugas utama Anda adalah mendampingi mahasiswa Unila dalam brainstorming, memvalidasi kebaruan ide (novelty), dan mengarahkan ide proposal ke skema Program Kreativitas Mahasiswa (PKM) Kemendikbudristek/Belmawa yang paling tepat.

Skema PKM yang berlaku:
1. PKM-RE (Riset Eksakta): Penelitian ilmiah fenomena alam/teknologi/kesehatan/pertanian/teknik.
2. PKM-RSH (Riset Sosial Humaniora): Penelitian dinamika sosial, budaya, kebijakan, perilaku masyarakat.
3. PKM-K (Kewirausahaan): Produk/jasa berbasis kreativitas dengan orientasi profit dan keunggulan pasar.
4. PKM-PM (Pengabdian kepada Masyarakat): Solusi inovatif nirlaba untuk masyarakat non-produktif (desa, panti, komunitas).
5. PKM-PI (Penerapan Iptek): Bantuan teknologi/manajemen untuk mitra produktif (UMKM, industri kecil, petani/nelayan mandiri).
6. PKM-KC (Karsa Cipta): Kreasi nalar menghasilkan prototipe fungsional (hardware/software/alat).
7. PKM-KI (Karya Inovatif): Produk fungsional skala penuh siap pasar/operasi.
8. PKM-VGK (Video Gagasan Konstruktif): Video kreatif mengusung solusi isu SDGs / prioritas nasional.
9. PKM-GFT (Gagasan Futuristik Tertulis): Karya tulis visioner masa depan Indonesia.
10. PKM-AI (Artikel Ilmiah): Artikel berbasis hasil kegiatan akademik mahasiswa yang sudah terlaksana.

Panduan Penilaian & Output:
- Selalu berikan tanggapan dalam Bahasa Indonesia yang ramah, santun, akademis, terstruktur rapi, dan memotivasi.
- Jika mahasiswa mengajukan ide/pertanyaan, berikan tanggapan dengan struktur:
  1. 🎯 **Rekomendasi Skema PKM Utama & Alternatif** (disertai alasan singkat).
  2. 💡 **Analisis Kebaruan (Novelty) & Potensi Dampak** (skala 1-10 beserta keunikannya).
  3. 🛠️ **Saran Penguatan Metodologi & Luaran** (agar kompetitif di seleksi nasional Belmawa).
  4. 🤝 **Rekomendasi Kolaborasi Tim Multidisiplin** (saran jurusan/fakultas di Unila yang cocok dilibatkan, misal: FMIPA, FT, FP, FK, FEB, FH, FISIP, FKIP).
- Gunakan format Markdown rapi dengan poin-poin yang mudah dibaca.`

// callGateway mengirim permintaan ke 9Router OpenAI-compatible endpoint
func (h AIHandler) callGateway(ctx context.Context, messages []openAIChatMessage, model string) (string, string, error) {
	gatewayURL := config.Env("AI_GATEWAY_URL", "http://9router:20128/v1")
	apiKey := config.Env("AI_GATEWAY_KEY", "sk-37e4ccdf3c8d4cf5-7unsdj-fea45214")
	endpoint := strings.TrimRight(gatewayURL, "/") + "/chat/completions"

	reqBody := openAIChatRequest{
		Model:       model,
		Messages:    messages,
		Temperature: 0.7,
		Stream:      false,
	}

	rawJSON, err := json.Marshal(reqBody)
	if err != nil {
		return "", "", fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(rawJSON))
	if err != nil {
		return "", "", fmt.Errorf("create http request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	}

	client := &http.Client{Timeout: 45 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", "", fmt.Errorf("gateway network call: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("read gateway response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", fmt.Errorf("gateway returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	var chatResp openAIChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return "", "", fmt.Errorf("unmarshal gateway response: %w", err)
	}

	if chatResp.Error != nil && chatResp.Error.Message != "" {
		return "", "", fmt.Errorf("gateway error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 || chatResp.Choices[0].Message.Content == "" {
		return "", "", fmt.Errorf("gateway returned empty choices")
	}

	usedModel := chatResp.Model
	if usedModel == "" {
		usedModel = model
	}

	return strings.TrimSpace(chatResp.Choices[0].Message.Content), usedModel, nil
}

// Brainstorm menangani ide usulan mahasiswa melalui 9Router
func (h AIHandler) Brainstorm(c *gin.Context) {
	var req BrainstormRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format pesan tidak valid atau kosong"})
		return
	}

	userMsg := strings.TrimSpace(req.Message)
	if userMsg == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Pesan tidak boleh kosong"})
		return
	}

	// Persiapkan pesan untuk LLM (System + Chat History + Current Message)
	llmMessages := []openAIChatMessage{
		{Role: "system", Content: pkmSystemPrompt},
	}

	// Ambil riwayat percakapan sebelumnya (maksimal 10 putaran terakhir)
	if len(req.History) > 0 {
		start := 0
		if len(req.History) > 10 {
			start = len(req.History) - 10
		}
		for _, hItem := range req.History[start:] {
			r := "user"
			if hItem.Role == "ai" || hItem.Role == "assistant" {
				r = "assistant"
			}
			cText := strings.TrimSpace(hItem.Content)
			if cText != "" {
				llmMessages = append(llmMessages, openAIChatMessage{
					Role:    r,
					Content: cText,
				})
			}
		}
	}

	// Masukkan pesan terkini
	llmMessages = append(llmMessages, openAIChatMessage{
		Role:    "user",
		Content: userMsg,
	})

	preferredModel := config.Env("AI_GATEWAY_MODEL", "pkm-brainstorming")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 50*time.Second)
	defer cancel()

	// 1. Coba panggil model utama via 9Router
	reply, usedModel, err := h.callGateway(ctx, llmMessages, preferredModel)
	if err != nil {
		log.Printf("[AI 9Router] Model %s failed: %v. Mencoba fallback ke ag/gemini-3.8-flash...", preferredModel, err)
		// 2. Fallback ke model gemini-3.8-flash langsung jika combo mengalami kendala
		fallbackModel := "ag/gemini-3.8-flash"
		reply, usedModel, err = h.callGateway(ctx, llmMessages, fallbackModel)
		if err != nil {
			log.Printf("[AI 9Router] Fallback model %s failed: %v", fallbackModel, err)
		}
	}

	// Jika gateway benar-benar tidak merespons (mis. offline), gunakan asisten berbasis aturan darurat
	if reply == "" {
		reply = generateLocalPKMAnalysis(userMsg)
		usedModel = "fallback-local-rule-engine"
	}

	// Simpan ke tabel ai_analyses jika memungkinkan
	var userPtr *string
	if uID, ok := c.Get("userID"); ok {
		if sID, isStr := uID.(string); isStr && sID != "" {
			userPtr = &sID
		}
	}

	confidence := 0.95
	analysisRecord := models.AIAnalysis{
		RequestedBy:     userPtr,
		ProposalID:      req.ProposalID,
		AnalysisType:    "brainstorm",
		InputText:       userMsg,
		OutputText:      reply,
		ConfidenceScore: &confidence,
		ModelName:       usedModel,
		CreatedAt:       time.Now(),
	}

	if err := h.DB.Create(&analysisRecord).Error; err != nil {
		log.Printf("[AI 9Router] Gagal menyimpan ai_analyses: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":         analysisRecord.ID,
			"reply":      reply,
			"model":      usedModel,
			"confidence": confidence,
			"createdAt":  analysisRecord.CreatedAt,
		},
	})
}

// GetHistory mengembalikan riwayat sesi brainstorming user yang sedang login
func (h AIHandler) GetHistory(c *gin.Context) {
	uID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusOK, gin.H{"data": []models.AIAnalysis{}})
		return
	}
	userID, ok := uID.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusOK, gin.H{"data": []models.AIAnalysis{}})
		return
	}

	var list []models.AIAnalysis
	if err := h.DB.Where("requested_by = ? AND analysis_type = ?", userID, "brainstorm").
		Order("created_at asc").Limit(30).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memuat riwayat konsultasi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

// ClearHistory menghapus riwayat konsultasi user
func (h AIHandler) ClearHistory(c *gin.Context) {
	uID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusOK, gin.H{"message": "Riwayat dibersihkan"})
		return
	}
	userID, ok := uID.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusOK, gin.H{"message": "Riwayat dibersihkan"})
		return
	}

	if err := h.DB.Where("requested_by = ? AND analysis_type = ?", userID, "brainstorm").
		Delete(&models.AIAnalysis{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus riwayat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Riwayat konsultasi berhasil dibersihkan"})
}

// GetStatus memeriksa ketersediaan gateway 9Router
func (h AIHandler) GetStatus(c *gin.Context) {
	gatewayURL := config.Env("AI_GATEWAY_URL", "http://9router:20128/v1")
	apiKey := config.Env("AI_GATEWAY_KEY", "sk-37e4ccdf3c8d4cf5-7unsdj-fea45214")
	preferredModel := config.Env("AI_GATEWAY_MODEL", "pkm-brainstorming")

	client := &http.Client{Timeout: 5 * time.Second}
	req, _ := http.NewRequest("GET", strings.TrimRight(gatewayURL, "/")+"/models", nil)
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	status := "online"
	statusCode := 200
	resp, err := client.Do(req)
	if err != nil {
		status = "offline"
		statusCode = 503
	} else {
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			status = fmt.Sprintf("unhealthy (status %d)", resp.StatusCode)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"gatewayStatus": status,
		"gatewayCode":   statusCode,
		"gatewayUrl":    gatewayURL,
		"activeModel":   preferredModel,
	})
}

// AdminOverview menyediakan data status 9Router dan audit analitik AI untuk Admin
func (h AIHandler) AdminOverview(c *gin.Context) {
	gatewayURL := config.Env("AI_GATEWAY_URL", "http://9router:20128/v1")
	apiKey := config.Env("AI_GATEWAY_KEY", "sk-37e4ccdf3c8d4cf5-7unsdj-fea45214")
	preferredModel := config.Env("AI_GATEWAY_MODEL", "pkm-brainstorming")

	client := &http.Client{Timeout: 5 * time.Second}
	req, _ := http.NewRequest("GET", strings.TrimRight(gatewayURL, "/")+"/models", nil)
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	status := "online"
	statusCode := 200
	resp, err := client.Do(req)
	if err != nil {
		status = "offline"
		statusCode = 503
	} else {
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			status = fmt.Sprintf("unhealthy (status %d)", resp.StatusCode)
		}
	}

	var total int64
	h.DB.Model(&models.AIAnalysis{}).Count(&total)

	var recent []models.AIAnalysis
	h.DB.Order("created_at desc").Limit(15).Find(&recent)

	c.JSON(http.StatusOK, gin.H{
		"gatewayStatus":  status,
		"gatewayCode":    statusCode,
		"gatewayUrl":     gatewayURL,
		"activeModel":    preferredModel,
		"totalAnalyses":  total,
		"recentAnalyses": recent,
	})
}


// generateLocalPKMAnalysis adalah mesin analisis aturan cadangan jika koneksi AI terputus total
func generateLocalPKMAnalysis(query string) string {
	lower := strings.ToLower(query)
	var scheme, novelty, advice, team string

	if strings.Contains(lower, "tanah") || strings.Contains(lower, "iot") || strings.Contains(lower, "ai") || strings.Contains(lower, "sensor") {
		scheme = "**PKM-KC (Karsa Cipta)** untuk rancang bangun purwarupa, atau **PKM-PI (Penerapan Iptek)** jika langsung diterapkan pada mitra petani."
		novelty = "**8.6 / 10** — Kekuatan terletak pada integrasi sensor cerdas berbiaya rendah dan telemetri lokal."
		advice = "Fokuskan pada kalibrasi data sensor terhadap kondisi tanah lokal di Lampung, serta keandalan catu daya hemat energi."
		team = "Teknik Elektro/Informatika (Fakultas Teknik) + Agroteknologi (Fakultas Pertanian)."
	} else if strings.Contains(lower, "kopi") || strings.Contains(lower, "limbah") || strings.Contains(lower, "briket") || strings.Contains(lower, "pupuk") {
		scheme = "**PKM-RE (Riset Eksakta)** untuk formulasi & uji lab efektivitas, atau **PKM-K (Kewirausahaan)** jika fokus pada hilirisasi produk komersial."
		novelty = "**8.2 / 10** — Nilai tambah tinggi karena memanfaatkan komoditas unggulan Provinsi Lampung."
		advice = "Sertakan pengujian parameter baku mutu (SNI) dan perbandingan nilai ekonomis dibanding produk konvensional."
		team = "Kimia/Biologi (FMIPA) + Manajemen/Akuntansi (FEB) + Teknologi Industri Pertanian (FP)."
	} else if strings.Contains(lower, "desa") || strings.Contains(lower, "masyarakat") || strings.Contains(lower, "edukasi") || strings.Contains(lower, "stunting") {
		scheme = "**PKM-PM (Pengabdian kepada Masyarakat)** untuk solusi nirlaba bagi komunitas masyarakat."
		novelty = "**8.0 / 10** — Sangat relevan dengan kebutuhan pemecahan masalah riil masyarakat."
		advice = "Pastikan telah mengantongi surat kesediaan mitra non-produktif dan sertakan evaluasi keberlanjutan program pasca pendanaan."
		team = "Kesehatan Masyarakat/Kedokteran (FK) + Sosiologi/Komunikasi (FISIP) + Pendidikan (FKIP)."
	} else {
		scheme = "**PKM-KC (Karsa Cipta)** atau **PKM-RSH (Riset Sosial Humaniora)** sesuai fokus luaran yang diinginkan."
		novelty = "**7.8 / 10** — Gagasan menarik dengan potensi pengembangan lebih lanjut."
		advice = "Perkuat studi literatur 3-5 tahun terakhir dan identifikasi gap penelitian agar kebaruan semakin menonjol di hadapan reviewer Belmawa."
		team = "Kolaborasi multidisiplin 3-5 mahasiswa dari minimal 2 angkatan atau 2 program studi berbeda."
	}

	return fmt.Sprintf(`### 🎯 Analisis Idea Lab PKM Center Unila
Untuk gagasan: *"%s"*

1. **Rekomendasi Skema PKM:**
   %s

2. **Tingkat Kebaruan (Novelty) & Potensi Dampak:**
   %s

3. **Saran Penguatan Metodologi & Luaran:**
   %s

4. **Rekomendasi Kolaborasi Tim:**
   %s

*(Catatan: Mode asistensi cepat lokal aktif. Hubungkan 9Router untuk analisis LLM mendalam).*`, query, scheme, novelty, advice, team)
}
