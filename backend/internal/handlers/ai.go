package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode"

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

const pkmSystemPrompt = `Anda adalah PKMATE, asisten AI resmi dari PKM Center Universitas Lampung (Unila).
Tugas utama Anda adalah mendampingi mahasiswa Unila dalam brainstorming ide, memvalidasi kebaruan ide (novelty), dan mengarahkan ide proposal ke skema Program Kreativitas Mahasiswa (PKM) Kemendikbudristek/Belmawa yang paling tepat.

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
- Gaya Bahasa: Profesional, akademis, santun, bernas (ringkas dan padat makna), lugas, serta menggunakan peristilahan ilmiah standar Belmawa Dikti / PIMNAS.
- Kebijakan Penggunaan Emoji: Minimalisir atau hindari penggunaan emoji. Tampilkan jawaban yang bersih, rapi, dan profesional tanpa hiasan emoji.
- Pemrosesan Ide Mahasiswa:
  1. Telaah & Baca Masukan: Pahami secara saksama inti masalah empiris, pendekatan teknologi/metode, dan target sasaran dari masukan user (meskipun user menggunakan bahasa informal/santai).
  2. Peringkas & Padatkan: Singkirkan kata percakapan santai, kata ganti orang (saya, kami, mau bikin, pengen buat, dsb), serta uraian bertele-tele. Rangkum ke intisari substansi ilmiah yang padat.
  3. Perbaiki Kata & Diksi: Transformasikan bahasa lisan menjadi kosakata ilmiah akademis yang baku, presisi, dan persuasif (contoh: "bikin pakan lele murah dari maggot" -> "optimasi formulasi pakan alternatif ikan lele berbasis biokonversi maggot BSF").
  4. Judul Ilmiah Bernas: Rumuskan judul PKM yang spesifik, solutif, ringkas (maksimal 20 kata), dan mencerminkan skema PKM yang tepat.
- Fitur Perintah Khusus (Commands):
  1. '/canvas' (PKM Strategy Canvas):
     Jika pengguna mengetik '/canvas' atau meminta penyusunan PKM Strategy Canvas (PSC):
     Fasilitasi penyusunan 8 pilar strategis yang telah diringkas dan disempurnakan:
     - Masalah (Problem): 2-3 poin kendala faktual/urgensi lapangan yang terukur & tajam.
     - Tujuan (Purpose): 2-3 poin tujuan solutif dan terarah.
     - Gagasan (Idea): 2-3 poin konsep inovasi pendekatan ilmiah yang diajukan.
     - Metode (Method): 2-3 tahapan metodologis sistematis (persiapan, eksekusi/fabrikasi, validasi/pengujian, evaluasi).
     - Keunikan (Unique Value): 2-3 keunggulan komparatif dibanding solusi yang sudah ada.
     - Kegiatan Utama (Key Activities): 2-3 langkah kerja operasional tim pelaksana.
     - Kebaharuan (Novelty): 2-3 unsur kebaruan (novelty) dan state-of-the-art gap.
     - Luaran (Output): Luaran wajib Belmawa, luaran spesifik skema, HaKI/Paten, dan Publikasi Ilmiah.
     Bimbing mahasiswa dan sertakan blok data terstruktur di akhir jawaban untuk otomatisasi pratinjau dan ekspor PDF:
     [PSC_DATA]
     {
       "title": "Judul Inovasi Ilmiah Hasil Ringkasan dan Penyempurnaan",
       "scheme": "PKM-KC",
       "problem": ["Poin masalah ringkas 1", "Poin masalah ringkas 2"],
       "purpose": ["Poin tujuan ringkas 1", "Poin tujuan ringkas 2"],
       "idea": ["Poin gagasan ringkas 1", "Poin gagasan ringkas 2"],
       "method": ["Tahap 1: ...", "Tahap 2: ...", "Tahap 3: ..."],
       "uniqueValue": ["Poin keunikan 1", "Poin keunikan 2"],
       "keyActivities": ["Aktivitas 1", "Aktivitas 2", "Aktivitas 3"],
       "novelty": ["Poin kebaharuan 1", "Poin kebaharuan 2"],
       "output": ["Laporan Kemajuan dan Laporan Akhir PKM Belmawa", "Luaran Khusus Skema", "Hak Cipta (HaKI) / Paten Sederhana", "Artikel Ilmiah Terakreditasi"]
     }
     [/PSC_DATA]
  2. '/tanya' (Konsultasi Bebas):
     Kembali ke mode diskusi dan brainstorming ide umum.
- Jika mahasiswa mengajukan ide/pertanyaan umum, susun tanggapan dengan format terstruktur:
  1. **Rekomendasi Skema PKM Utama & Alternatif** (disertai argumentasi kelayakan).
  2. **Analisis Kebaruan (Novelty) & Potensi Dampak** (skor estimasi 1-10 beserta keunikannya).
  3. **Saran Penguatan Metodologi & Luaran** (agar kompetitif dalam seleksi Belmawa).
  4. **Rekomendasi Kolaborasi Tim Multidisiplin** (saran fakultas/jurusan di Unila yang relevan, misal: FMIPA, FT, FP, FK, FEB, FH, FISIP, FKIP).
- Gunakan format Markdown yang rapi dengan poin-poin yang mudah dibaca.`

// gatewayAPIKey mengambil API key 9Router dari environment. Jika kosong,
// key dibaca dari file hasil provisioning otomatis service 9router.
func gatewayAPIKey() string {
	if key := config.Env("AI_GATEWAY_KEY", ""); key != "" {
		return key
	}
	keyFile := config.Env("AI_GATEWAY_KEY_FILE", "")
	if keyFile == "" {
		return ""
	}
	raw, err := os.ReadFile(keyFile)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(raw))
}

// callGateway mengirim permintaan ke 9Router OpenAI-compatible endpoint
func (h AIHandler) callGateway(ctx context.Context, messages []openAIChatMessage, model string) (string, string, error) {
	gatewayURL := config.Env("AI_GATEWAY_URL", "http://9router:20128/v1")
	apiKey := gatewayAPIKey()
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

	// 1. Coba unmarshal format standar non-streaming OpenAI chat completion
	var chatResp openAIChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err == nil && len(chatResp.Choices) > 0 {
		content := strings.TrimSpace(chatResp.Choices[0].Message.Content)
		if content != "" {
			usedModel := chatResp.Model
			if usedModel == "" {
				usedModel = model
			}
			return content, usedModel, nil
		}
	}

	// 2. Jika respons berupa stream SSE (data: {...}), kumpulkan semua potongan teks
	respStr := string(respBytes)
	if strings.Contains(respStr, "data:") {
		var sb strings.Builder
		usedModel := model
		lines := strings.Split(respStr, "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if !strings.HasPrefix(line, "data:") {
				continue
			}
			chunkJSON := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
			if chunkJSON == "[DONE]" || chunkJSON == "" {
				continue
			}
			var chunk struct {
				Model   string `json:"model"`
				Choices []struct {
					Delta struct {
						Content string `json:"content"`
					} `json:"delta"`
					Message struct {
						Content string `json:"content"`
					} `json:"message"`
				} `json:"choices"`
			}
			if err := json.Unmarshal([]byte(chunkJSON), &chunk); err == nil {
				if chunk.Model != "" {
					usedModel = chunk.Model
				}
				if len(chunk.Choices) > 0 {
					if chunk.Choices[0].Delta.Content != "" {
						sb.WriteString(chunk.Choices[0].Delta.Content)
					} else if chunk.Choices[0].Message.Content != "" {
						sb.WriteString(chunk.Choices[0].Message.Content)
					}
				}
			}
		}
		content := strings.TrimSpace(sb.String())
		if content != "" {
			return content, usedModel, nil
		}
	}

	return "", "", fmt.Errorf("gateway returned empty choices or unrecognized format: %s", string(respBytes))
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
	var reply, usedModel string
	var err error

	// 1. Coba panggil model utama via 9Router (timeout 25s)
	ctxPrimary, cancelPrimary := context.WithTimeout(c.Request.Context(), 25*time.Second)
	reply, usedModel, err = h.callGateway(ctxPrimary, llmMessages, preferredModel)
	cancelPrimary()

	// 2. Jika model utama gagal / timeout, coba model cepat claude-sonnet-4-6 (timeout 20s)
	if err != nil || reply == "" {
		log.Printf("[AI 9Router] Model %s kendala: %v. Mencoba ag/claude-sonnet-4-6...", preferredModel, err)
		ctxClaude, cancelClaude := context.WithTimeout(c.Request.Context(), 20*time.Second)
		reply, usedModel, err = h.callGateway(ctxClaude, llmMessages, "ag/claude-sonnet-4-6")
		cancelClaude()
	}

	// 3. Jika masih gagal, coba model gemini-3.8-flash (timeout 15s)
	if err != nil || reply == "" {
		log.Printf("[AI 9Router] Model claude kendala: %v. Mencoba ag/gemini-3.8-flash...", err)
		ctxGemini, cancelGemini := context.WithTimeout(c.Request.Context(), 15*time.Second)
		reply, usedModel, err = h.callGateway(ctxGemini, llmMessages, "ag/gemini-3.8-flash")
		cancelGemini()
	}

	// 4. Jika gateway benar-benar tidak merespons (mis. offline total), gunakan asisten berbasis aturan darurat
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
	apiKey := gatewayAPIKey()
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
	apiKey := gatewayAPIKey()
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


func cleanUserIdea(query string) string {
	cleaned := strings.TrimSpace(query)
	prefixes := []string{
		"[mode pkm strategy canvas]:",
		"[mode pkm strategy canvas]",
		"/canvas",
		"/tanya",
		"buatkan canvas untuk ide",
		"buatkan canvas untuk",
		"buatkan canvas tentang",
		"buatkan canvas",
		"buatkan psc untuk",
		"buatkan psc tentang",
		"buatkan psc",
		"tolong bikinkan canvas",
		"tolong bikinkan psc",
		"tolong bikinkan",
		"bikinkan canvas",
		"bikinkan psc",
		"bikinkan",
		"tolong buatkan canvas",
		"tolong buatkan psc",
		"tolong buatkan",
		"tolong bantu buatkan",
		"tolong bantu",
		"tolong buat",
		"bisa tolong buatkan",
		"bisa tolong",
		"bisa buatkan",
		"coba buatkan",
		"coba bikin",
		"saya punya ide mau bikin",
		"saya punya ide mau buat",
		"saya punya ide membuat",
		"saya punya ide untuk",
		"saya punya ide",
		"saya ingin membuat ide",
		"saya ingin membuat",
		"saya ingin buat",
		"saya ingin mengembangkan",
		"saya mau bikin",
		"saya mau buat",
		"kami ingin membuat",
		"kami mau bikin",
		"rencana saya membuat",
		"bagaimana kalau kita buat",
		"gimana kalau kita bikin",
		"ide saya adalah",
		"ide saya:",
		"ide:",
		"judul:",
		"topik:",
		"tentang:",
		"tentang",
	}

	for {
		changed := false
		lower := strings.ToLower(cleaned)
		for _, p := range prefixes {
			if strings.HasPrefix(lower, p) {
				cleaned = strings.TrimSpace(cleaned[len(p):])
				cleaned = strings.TrimPrefix(cleaned, ":")
				cleaned = strings.TrimPrefix(cleaned, "-")
				cleaned = strings.TrimSpace(cleaned)
				changed = true
				break
			}
		}
		if !changed {
			break
		}
	}

	// Rapikan kata-kata informal menjadi padanan yang lebih baku
	replacements := map[string]string{
		"pake":      "berbasis",
		"pakai":     "berbasis",
		"bikin":     "pembuatan",
		"buat":      "pengembangan",
		"anak sd":   "siswa sekolah dasar",
		"murah":     "ekonomis",
		"cepet":     "cepat",
		"gampang":   "mudah diakses",
	}

	words := strings.Fields(cleaned)
	for i, w := range words {
		if val, exists := replacements[strings.ToLower(w)]; exists {
			words[i] = val
		}
	}
	cleaned = strings.Join(words, " ")

	return strings.Trim(cleaned, ` "'.,!?`)
}

func detectScheme(text string) (string, string) {
	lower := strings.ToLower(text)

	if strings.Contains(lower, "ekstrak") || strings.Contains(lower, "senyawa") || strings.Contains(lower, "uji lab") ||
		strings.Contains(lower, "bakteri") || strings.Contains(lower, "kimia") || strings.Contains(lower, "biologi") ||
		strings.Contains(lower, "molekul") || strings.Contains(lower, "formulasi") || strings.Contains(lower, "uji efektivitas") ||
		strings.Contains(lower, "kanker") || strings.Contains(lower, "herbal") || strings.Contains(lower, "antioksidan") ||
		strings.Contains(lower, "pupuk") || strings.Contains(lower, "pakan") || strings.Contains(lower, "pelet") ||
		strings.Contains(lower, "maggot") || strings.Contains(lower, "lele") || strings.Contains(lower, "briket") {
		return "PKM-RE", "Riset Eksakta"
	}
	if strings.Contains(lower, "sosial") || strings.Contains(lower, "budaya") || strings.Contains(lower, "hukum") ||
		strings.Contains(lower, "psikologi") || strings.Contains(lower, "kebijakan") || strings.Contains(lower, "persepsi") ||
		strings.Contains(lower, "sejarah") || strings.Contains(lower, "etnografi") || strings.Contains(lower, "kearifan lokal") {
		return "PKM-RSH", "Riset Sosial Humaniora"
	}
	if strings.Contains(lower, "bisnis") || strings.Contains(lower, "wirausaha") || strings.Contains(lower, "jual") ||
		strings.Contains(lower, "omset") || strings.Contains(lower, "kemasan") || strings.Contains(lower, "keripik") ||
		strings.Contains(lower, "kuliner") || strings.Contains(lower, "minuman") || strings.Contains(lower, "kafe") ||
		strings.Contains(lower, "fashion") || strings.Contains(lower, "snack") || strings.Contains(lower, "market") {
		return "PKM-K", "Kewirausahaan"
	}
	if strings.Contains(lower, "desa") || strings.Contains(lower, "pemberdayaan") || strings.Contains(lower, "masyarakat") ||
		strings.Contains(lower, "pkk") || strings.Contains(lower, "panti") || strings.Contains(lower, "edukasi masyarakat") ||
		strings.Contains(lower, "stunting") || strings.Contains(lower, "mitra non") || strings.Contains(lower, "penyuluhan") {
		return "PKM-PM", "Pengabdian kepada Masyarakat"
	}
	if strings.Contains(lower, "umkm") || strings.Contains(lower, "mitra produktif") || strings.Contains(lower, "petani") ||
		strings.Contains(lower, "peternak") || strings.Contains(lower, "nelayan") || strings.Contains(lower, "bengkel") ||
		strings.Contains(lower, "mesin industri") || strings.Contains(lower, "efisiensi produksi") {
		return "PKM-PI", "Penerapan Iptek"
	}
	if strings.Contains(lower, "video") || strings.Contains(lower, "animasi") || strings.Contains(lower, "film") ||
		strings.Contains(lower, "sdgs") || strings.Contains(lower, "isu nasional") || strings.Contains(lower, "youtube") ||
		strings.Contains(lower, "kampanye") || strings.Contains(lower, "gagasan konstruktif") {
		return "PKM-VGK", "Video Gagasan Konstruktif"
	}
	if strings.Contains(lower, "futuristik") || strings.Contains(lower, "indonesia 2045") || strings.Contains(lower, "indonesia emas") ||
		strings.Contains(lower, "visioner") || strings.Contains(lower, "gagasan tertulis") {
		return "PKM-GFT", "Gagasan Futuristik Tertulis"
	}

	return "PKM-KC", "Karsa Cipta"
}

func toAcademicTitle(text string) string {
	words := strings.Fields(text)
	for i, w := range words {
		if len(w) > 0 {
			r := []rune(strings.ToLower(w))
			r[0] = unicode.ToUpper(r[0])
			words[i] = string(r)
		}
	}
	return strings.Join(words, " ")
}

func isGasQuery(text string) bool {
	lower := strings.ToLower(text)
	if strings.Contains(lower, "lpg") || strings.Contains(lower, "kebocoran gas") ||
		strings.Contains(lower, "tabung gas") || strings.Contains(lower, "sensor gas") ||
		strings.Contains(lower, "deteksi gas") || strings.Contains(lower, "bau gas") {
		return true
	}
	// Periksa kata 'gas' sebagai kata yang berdiri sendiri (word boundary)
	for _, word := range strings.Fields(lower) {
		cleanW := strings.Trim(word, `.,!?:;'"()[]{}`)
		if cleanW == "gas" {
			return true
		}
	}
	return false
}

func generateDynamicPKMStrategyCanvas(query string) string {
	clean := cleanUserIdea(query)
	if clean == "" {
		return `### PKM Strategy Canvas (PSC) - Panduan Awal
Halo! Anda berada dalam mode penyusunan **PKM Strategy Canvas (PSC)**.

Untuk memetakan 8 pilar kanvas secara otomatis dan presisi, silakan sebutkan:
1. **Gagasan / Inovasi Anda:** (contoh: *Pemanfaatan ekstrak kulit manggis untuk salep luka bakar*, *Aplikasi deteksi hama padi berbasis AI*, atau *Briket ramah lingkungan dari limbah kelapa sawit*).
2. **Skema yang diinginkan (opsional):** PKM-RE, PKM-RSH, PKM-K, PKM-PM, PKM-PI, PKM-KC, atau PKM-VGK.

Ketikkan ide Anda pada kolom pesan di bawah, dan PKMATE akan langsung merumuskan 8 pilar kanvas lengkap beserta draf PDF resminya!`
	}

	lower := strings.ToLower(clean)

	var title, scheme, schemeName string
	var problem, purpose, idea, method, uniqueValue, keyActivities, novelty, output []string

	if strings.Contains(lower, "lele") || strings.Contains(lower, "maggot") || strings.Contains(lower, "bsf") ||
		(strings.Contains(lower, "ikan") && strings.Contains(lower, "pakan")) || strings.Contains(lower, "pelet") {
		scheme, schemeName = "PKM-RE", "Riset Eksakta"
		title = "Optimasi Formulasi Pelet Pakan Ikan Lele Berbasis Biokonversi Maggot BSF sebagai Alternatif Pakan Mandiri dan Efisien"
		problem = []string{
			"Tingginya beban biaya pakan komersial yang mencapai 60-70% dari total biaya operasional pembudidaya ikan lele.",
			"Ketergantungan terhadap bahan baku impor tepung ikan yang menyebabkan fluktuasi harga pakan di tingkat peternak lokal.",
		}
		purpose = []string{
			"Merumuskan rasio substitusi optimal biomassa maggot BSF dalam pelet pakan lele berprotein tinggi (>35%).",
			"Mengevaluasi laju pertumbuhan spesifik (SGR) dan rasio konversi pakan (FCR) benih lele uji secara empiris.",
		}
		idea = []string{
			"Pemanfaatan biomassa larva Black Soldier Fly (BSF) hasil biokonversi limbah organik sebagai sumber protein pakan bermutu.",
			"Standardisasi teknik peletisasi terapung mandiri yang berbiaya terjangkau bagi kelompok budidaya.",
		}
		method = []string{
			"Tahap 1: Preparasi bahan baku, pengeringan, dan penepungan biomassa maggot BSF terstandar.",
			"Tahap 2: Formulasi komposisi pelet, proses ekstrusi cetak, dan uji daya apung pakan.",
			"Tahap 3: Uji proksimat laboratorium, feeding trial pada kolam perlakuan, dan analisis kelayakan ekonomi.",
		}
		uniqueValue = []string{
			"Menekan biaya pengeluaran pakan hingga 35-40% tanpa menurunkan laju pertumbuhan ikan.",
			"Menerapkan prinsip ekonomi sirkular zero-waste dari limbah organik perkotaan.",
		}
		keyActivities = []string{
			"Kultivasi dan pemanenan maggot BSF serta pengadaan bahan pendukung pelet.",
			"Proses peletisasi formula pakan dan pengujian laboratorium terakreditasi.",
			"Uji coba pemberian pakan pada kolam budidaya mitra dan pencatatan biomassa berkala.",
		}
		novelty = []string{
			"Formulasi pelet berbasis biomassa lokal dengan teknik pengolahan yang menjaga asam amino esensial.",
			"Rasio substitusi tepung ikan teruji yang mempertahankan laju pertumbuhan setara pakan pabrikan.",
		}
		output = []string{
			"Laporan Kemajuan dan Laporan Akhir PKM Belmawa",
			"Produk Pelet Pakan Mandiri Formula Unggul Teruji Laboratorium",
			"Sertifikat Hak Cipta / Draf Paten Sederhana atas Formulasi Pakan",
			"Artikel Ilmiah Terpublikasi pada Jurnal Nasional Terakreditasi",
		}
	} else if strings.Contains(lower, "aksara") || strings.Contains(lower, "lampung") || strings.Contains(lower, "bahasa lampung") || strings.Contains(lower, "tapis") {
		scheme, schemeName = "PKM-KC", "Karsa Cipta"
		title = "Pengembangan Aplikasi Mobile Edukasi Berbasis Gamifikasi Interaktif untuk Pelestarian Aksara Lampung Siswa Sekolah Dasar"
		problem = []string{
			"Menurunnya literasi generasi muda terhadap aksara Lampung akibat minimnya media pembelajaran digital yang menarik.",
			"Metode konvensional berbasis buku teks dinilai monoton sehingga sulit mempertahankan atensi belajar siswa.",
		}
		purpose = []string{
			"Merancang aplikasi mobile edukasi berbasis gamifikasi yang mempermudah pengenalan aksara Lampung secara adaptif.",
			"Menguji efektivitas media pembelajaran digital terhadap peningkatan daya ingat dan pengenalan ortografi siswa.",
		}
		idea = []string{
			"Integrasi modul petualangan, kuis adaptif, dan audio fonetik interaktif ke dalam media ajar muatan lokal.",
			"Desain antarmuka ramah anak dengan karakter visual bermuatan kearifan lokal Lampung.",
		}
		method = []string{
			"Tahap 1: Analisis kurikulum muatan lokal sekolah dasar dan perancangan storyboard interaktif.",
			"Tahap 2: Pengembangan sistem aplikasi mobile, integrasi aset grafis, dan audio fonetik.",
			"Tahap 3: Pengujian fungsionalitas aplikasi, validasi ahli materi/media, dan uji coba kelas eksperimen.",
		}
		uniqueValue = []string{
			"Menyajikan metode belajar aksara daerah yang interaktif, visual, dan menyenangkan langsung dari smartphone.",
			"Dilengkapi fitur monitoring capaian belajar siswa yang dapat diakses oleh guru dan orang tua.",
		}
		keyActivities = []string{
			"Pengumpulan silabus materi aksara Lampung dan perancangan aset grafis digital.",
			"Pengembangan kode program aplikasi serta uji alpha-beta testing.",
			"Sosialisasi dan uji coba penerapan di sekolah dasar mitra serta evaluasi hasil belajar.",
		}
		novelty = []string{
			"Digitalisasi ortografi aksara Lampung yang memadukan fonetik audio dengan tantangan bertingkat.",
			"Pemanfaatan pendekatan gamifikasi kontekstual budaya daerah yang belum tersedia secara terstruktur di Play Store.",
		}
		output = []string{
			"Laporan Kemajuan dan Laporan Akhir PKM Belmawa",
			"Aplikasi Mobile Android Siap Pakai (.apk) dan Akun Pengembang",
			"Sertifikat Hak Cipta (HaKI) atas Program Komputer dan Desain Aset Visual",
			"Artikel Ilmiah Terpublikasi pada Jurnal Pendidikan Terakreditasi",
		}
	} else if strings.Contains(lower, "kopi") || strings.Contains(lower, "briket") || strings.Contains(lower, "bioarang") || strings.Contains(lower, "pirolisis") {
		scheme, schemeName = "PKM-RE", "Riset Eksakta"
		title = "Pemanfaatan Limbah Kulit Kopi Menjadi Briket Ramah Lingkungan Berdaya Kalor Tinggi sebagai Solusi Energi Alternatif"
		problem = []string{
			"Penumpukan limbah padat kulit kopi pascapanen yang belum termanfaatkan dan menimbulkan pencemaran di sentra perkebunan.",
			"Tingginya biaya bahan bakar gas/minyak untuk kebutuhan proses pengeringan dan pengolahan pada UMKM sentra kopi.",
		}
		purpose = []string{
			"Menghasilkan briket bioarang kulit kopi berdaya kalor tinggi (>5.000 kal/g) dengan kadar abu rendah.",
			"Menyediakan alternatif bahan bakar terbarukan yang ekonomis dan ramah lingkungan bagi industri kecil.",
		}
		idea = []string{
			"Konversi biomassa kulit kopi melalui proses karbonisasi pirolisis dan pencetakan hidrolik.",
			"Formulasi perekat alami organik untuk meningkatkan densitas energi dan stabilitas nyala api.",
		}
		method = []string{
			"Tahap 1: Pengeringan dan karbonisasi limbah kulit kopi menggunakan reaktor pirolisis terkontrol.",
			"Tahap 2: Penggilingan arang, pencampuran formula perekat organik, dan pengepresan briket hidrolik.",
			"Tahap 3: Uji proksimat laboratorium (daya kalor, kadar air, kadar abu) dan uji laju pembakaran.",
		}
		uniqueValue = []string{
			"Mengurangi timbulan limbah agroindustri perkebunan sekaligus menghasilkan bahan bakar berbiaya murah.",
			"Durasi pembakaran lebih lama dan menghasilkan asap minimal dibanding briket konvensional.",
		}
		keyActivities = []string{
			"Pengadaan bahan baku kulit kopi dari perkebunan sentra di Lampung.",
			"Proses karbonisasi, pencetakan briket, dan pengeringan optimal.",
			"Pengujian parameter mutu baku di laboratorium dan uji coba pembakaran bersama mitra.",
		}
		novelty = []string{
			"Optimasi rasio perekat alami pada arang kulit kopi untuk mencapai densitas energi maksimal.",
			"Solusi energi sirkular tepat guna berbasis potensi perkebunan lokal Lampung.",
		}
		output = []string{
			"Laporan Kemajuan dan Laporan Akhir PKM Belmawa",
			"Produk Briket Bioarang Kulit Kopi Berdaya Kalor Tinggi Teruji SNI",
			"Sertifikat Hak Cipta / Paten Sederhana atas Komposisi dan Metode Pembuatan",
			"Artikel Ilmiah Terpublikasi pada Jurnal Rekayasa Energi Terakreditasi",
		}
	} else if strings.Contains(lower, "robot") || strings.Contains(lower, "lalu lintas") ||
		strings.Contains(lower, "lalulintas") || strings.Contains(lower, "kemacetan") ||
		strings.Contains(lower, "traffic") || strings.Contains(lower, "zebra cross") {
		scheme, schemeName = "PKM-KC", "Karsa Cipta"
		title = "Pengembangan Robot Pengatur Lalu Lintas Cerdas Berbasis IoT dan Computer Vision untuk Penguraian Kemacetan"
		problem = []string{
			"Tingginya kemacetan pada persimpangan perkotaan akibat sistem lampu lalu lintas berbasis timer statis yang tidak adaptif terhadap kepadatan kendaraan.",
			"Keterbatasan personel kepolisian lalu lintas dalam memantau dan menertibkan pelanggaran marka jalan seperti zebra cross secara kontinu 24 jam.",
		}
		purpose = []string{
			"Merancang purwarupa robot pengatur lalu lintas cerdas yang mampu mengoptimalkan durasi lampu hijau secara adaptif berdasarkan kepadatan arus.",
			"Mengintegrasikan sistem peringatan otomatis bagi pelanggar marka jalan serta transmisi telemetri data kepadatan kendaraan berbasis IoT.",
		}
		idea = []string{
			"Pemanfaatan computer vision berbasis on-device edge AI untuk mendeteksi panjang antrean kendaraan dan mengatur durasi sinyal secara real-time.",
			"Integrasi aktuator interaktif dan pengeras suara terarah (directional speaker) sebagai asisten lapangan cerdas bagi petugas di persimpangan jalan.",
		}
		method = []string{
			"Tahap 1: Analisis data kepadatan lalu lintas di persimpangan, perancangan desain mekanik robot, dan arsitektur sistem kendali mikrokontroler.",
			"Tahap 2: Perakitan purwarupa robot, integrasi kamera AI (YOLO), modul telemetri IoT, pengeras suara, dan modul relay lampu sinyal.",
			"Tahap 3: Kalibrasi algoritma deteksi kendaraan, uji coba simulasi miniatur persimpangan skala terstandar, dan evaluasi efisiensi antrean.",
		}
		uniqueValue = []string{
			"Sistem pengaturan lampu adaptif real-time yang memprioritaskan ruas terpadat secara otomatis tanpa perlu intervensi operator manusia.",
			"Dilengkapi fitur deteksi pelanggaran marka zebra cross dan teguran suara interaktif yang meningkatkan ketertiban pengendara secara preventif.",
		}
		keyActivities = []string{
			"Observasi lapangan di titik persimpangan rawan macet dan pengadaan komponen mekanik/elektronik robot.",
			"Pemrograman model deteksi kendaraan, integrasi firmware kontrol mikrokontroler, dan fabrikasi purwarupa fisik robot.",
			"Uji coba fungsionalitas purwarupa pada model persimpangan serta penyusunan berkas paten dan artikel ilmiah.",
		}
		novelty = []string{
			"Integrasi robotika fisik di persimpangan yang menggabungkan pengaturan lampu adaptif, deteksi pelanggar marka, dan telemetri IoT dalam satu sistem mandiri.",
			"Pengolahan inferensi computer vision langsung pada unit lokal (edge computing) sehingga sistem tetap beroperasi tanpa ketergantungan koneksi cloud.",
		}
		output = []string{
			"Laporan Kemajuan dan Laporan Akhir PKM Belmawa",
			"Purwarupa Fungsional Robot Pengatur Lalu Lintas Cerdas Teruji",
			"Sertifikat Hak Cipta / Paten Sederhana atas Desain Sistem dan Perangkat Lunak Robot",
			"Artikel Ilmiah Terpublikasi pada Jurnal Rekayasa Teknologi dan Robotika Terakreditasi",
		}
	} else if isGasQuery(lower) {
		scheme, schemeName = "PKM-KC", "Karsa Cipta"
		title = "Rancang Bangun Sistem Deteksi Dini Kebocoran Gas LPG Terintegrasi IoT dan Notifikasi Cepat Tanggap"
		problem = []string{
			"Tingginya risiko kebakaran akibat kebocoran gas LPG yang terlambat disadari penghuni rumah tangga maupun UMKM.",
			"Detektor gas konvensional di pasaran hanya membunyikan alarm lokal tanpa kemampuan peringatan jarak jauh atau pemutus otomatis.",
		}
		purpose = []string{
			"Merancang sistem deteksi kebocoran gas LPG dengan sensitivitas tinggi dan responsivitas cepat.",
			"Mengintegrasikan aktuator penutup katup otomatis dan transmisi peringatan bahaya via IoT ke gawai pengguna.",
		}
		idea = []string{
			"Penggabungan sensor gas semikonduktor dengan mikrokontroler hemat daya dan aktuator mekanis penutup regulator.",
			"Penyediaan sistem telemetri yang mengirimkan peringatan instan secara nirkabel saat konsentrasi gas melewati ambang aman.",
		}
		method = []string{
			"Tahap 1: Desain skematik elektronik, pemilihan komponen sensor, dan perancangan housing purwarupa.",
			"Tahap 2: Pemrograman firmware mikrokontroler, integrasi sensor MQ, aktuator servo, dan modul IoT.",
			"Tahap 3: Kalibrasi batas ambang ppm gas, uji kecepatan respons alarm, dan simulasi keselamatan.",
		}
		uniqueValue = []string{
			"Tindakan preventif aktif melalui penutupan otomatis regulator tabung gas saat terjadi kebocoran.",
			"Biaya produksi alat terjangkau dan mudah dipasang pada instalasi dapur rumah tangga.",
		}
		keyActivities = []string{
			"Fabrikasi purwarupa perangkat keras dan kalibrasi sensor gas.",
			"Pengujian kestabilan konektivitas IoT dan integrasi webhook notifikasi.",
			"Simulasi uji coba keamanan ruang tertutup dan evaluasi keandalan sistem.",
		}
		novelty = []string{
			"Integrasi sistem proteksi ganda: alarm suara lokal + penutupan katup mekanik + notifikasi gawai real-time.",
			"Algoritma penapisan noise sensor untuk meminimalisir alarm palsu (false positive) akibat asap dapur biasa.",
		}
		output = []string{
			"Laporan Kemajuan dan Laporan Akhir PKM Belmawa",
			"Purwarupa Fungsional Sistem Deteksi Kebocoran Gas Siap Operasi",
			"Sertifikat Hak Cipta / Paten Sederhana atas Desain Sistem Deteksi",
			"Artikel Ilmiah Terpublikasi pada Jurnal Instrumentasi dan Rekayasa Terakreditasi",
		}
	} else if strings.Contains(lower, "stunting") || strings.Contains(lower, "gizi") || strings.Contains(lower, "balita") || strings.Contains(lower, "cangkang telur") {
		scheme, schemeName = "PKM-RE", "Riset Eksakta"
		title = "Formulasi Biskuit Tinggi Kalsium dan Protein Berbasis Tepung Cangkang Telur sebagai Intervensi Balita Risiko Stunting"
		problem = []string{
			"Tingginya prevalensi stunting pada balita akibat defisiensi mikronutrien penting seperti kalsium dan protein.",
			"Limbah cangkang telur melimpah dan belum dimanfaatkan secara higienis sebagai sumber kalsium pangan fungsional.",
		}
		purpose = []string{
			"Merumuskan biskuit bergizi dengan fortifikasi tepung cangkang telur mikropartikel yang aman dan higienis.",
			"Menganalisis kadar kalsium, proksimat gizi, dan tingkat penerimaan organoleptik pada balita.",
		}
		idea = []string{
			"Pemanfaatan kalsium organik dari cangkang telur tersterilisasi sebagai bahan fortifikasi kudapan padat gizi.",
			"Desain biskuit fungsional berdaya simpan stabil dengan cita rasa yang disukai anak-anak.",
		}
		method = []string{
			"Tahap 1: Pencucian higienis, sterilisasi termal, kalsinasi, dan penepungan nano-kalsium cangkang telur.",
			"Tahap 2: Formulasi adonan biskuit dengan variasi konsentrasi tepung dan proses pemanggangan optimal.",
			"Tahap 3: Uji laboratorium kadar kalsium/proksimat, uji mikrobiologi, dan uji sensoris organoleptik.",
		}
		uniqueValue = []string{
			"Solusi intervensi stunting berbiaya sangat terjangkau dengan memanfaatkan limbah kaya kalsium.",
			"Ukuran partikel kalsium mikro meningkatkan bioavailabilitas penyerapan pada saluran pencernaan balita.",
		}
		keyActivities = []string{
			"Pengumpulan cangkang telur dari sentra kuliner dan preparasi tepung kalsium terstandar.",
			"Eksekusi pembuatan formula biskuit dan pengujian parameter mutu di laboratorium.",
			"Edukasi serta uji penerimaan organoleptik bersama kader Posyandu mitra.",
		}
		novelty = []string{
			"Metode sterilisasi dan penepungan cangkang telur bebas patogen untuk suplementasi gizi balita.",
			"Formulasi biskuit dengan tekstur renyah dan kadar bioavailabilitas kalsium terverifikasi.",
		}
		output = []string{
			"Laporan Kemajuan dan Laporan Akhir PKM Belmawa",
			"Produk Biskuit Padat Gizi Teruji Bebas Cemaran Logam dan Mikroba",
			"Sertifikat Hak Cipta / Paten Sederhana atas Komposisi Pangan Fungsional",
			"Artikel Ilmiah Terpublikasi pada Jurnal Gizi & Kesehatan Masyarakat",
		}
	} else {
		// Analisis cerdas untuk topik umum/kustom
		scheme, schemeName = detectScheme(clean)
		refinedTopic := toAcademicTitle(clean)

		switch scheme {
		case "PKM-RE":
			title = fmt.Sprintf("Kajian Eksperimental dan Sintesis Formulasi %s sebagai Solusi Sains Terbarukan", refinedTopic)
		case "PKM-RSH":
			title = fmt.Sprintf("Analisis Dinamika Sosial dan Rekomendasi Strategis: Studi Komprehensif %s", refinedTopic)
		case "PKM-K":
			title = fmt.Sprintf("Komersialisasi Inovasi Produk %s Bernilai Tambah Tinggi Berorientasi Pasar Berkelanjutan", refinedTopic)
		case "PKM-PM":
			title = fmt.Sprintf("Pemberdayaan Masyarakat Sasaran Melalui Sosialisasi dan Implementasi %s", refinedTopic)
		case "PKM-PI":
			title = fmt.Sprintf("Penerapan Iptek Tepat Guna %s untuk Peningkatan Kapasitas Produksi Mitra", refinedTopic)
		case "PKM-VGK":
			title = fmt.Sprintf("Video Gagasan Konstruktif: Inovasi %s sebagai Resolusi Isu Strategis Masa Depan", refinedTopic)
		case "PKM-GFT":
			title = fmt.Sprintf("Gagasan Futuristik Tertulis: Konsep Visioner %s Menuju Indonesia Emas", refinedTopic)
		default:
			title = fmt.Sprintf("Rancang Bangun dan Purwarupa Fungsional %s Berbasis Teknologi Cerdas Terintegrasi", refinedTopic)
		}

		problem = []string{
			fmt.Sprintf("Keterbatasan efisiensi dan kendala operasional dalam penanganan %s dengan metode konvensional.", clean),
			"Belum tersedianya solusi terpadu yang ramah lingkungan, terjangkau, dan berkelanjutan bagi target sasaran.",
		}
		purpose = []string{
			fmt.Sprintf("Mengembangkan dan mengimplementasikan inovasi %s sebagai solusi aplikatif terukur.", clean),
			"Menghasilkan parameter rancangan/standarisasi teknis yang tervalidasi secara ilmiah.",
		}
		idea = []string{
			fmt.Sprintf("Penerapan pendekatan ilmiah modern dalam optimalisasi %s secara adaptif.", clean),
			"Perancangan solusi yang ergonomis, efisien, dan siap diadopsi oleh pengguna sasaran.",
		}
		method = []string{
			"Tahap 1: Studi literatur mutakhir, identifikasi gap riset, dan analisis kebutuhan teknis.",
			fmt.Sprintf("Tahap 2: Eksekusi formulasi/fabrikasi purwarupa %s dan kalibrasi parameter fungsi.", clean),
			"Tahap 3: Pengujian validitas performa, analisis data empiris terukur, dan evaluasi hasil.",
		}
		uniqueValue = []string{
			fmt.Sprintf("Menawarkan efisiensi biaya dan kemudahan operasional lebih tinggi pada penanganan %s.", clean),
			"Memiliki nilai kemanfaatan langsung yang terbukti dan berpotensi untuk dihilirisasi atau dipatenkan.",
		}
		keyActivities = []string{
			fmt.Sprintf("Riset pendahuluan dan pengadaan komponen/bahan baku spesifik %s.", clean),
			"Eksekusi perancangan purwarupa atau formulasi bahan serta pengujian bertahap.",
			"Uji coba lapangan, penyusunan naskah luaran, dan pendaftaran Hak Kekayaan Intelektual (HaKI).",
		}
		novelty = []string{
			fmt.Sprintf("Penerapan metode/formulasi orisinal pada %s yang belum terjamah penelitian terdahulu.", clean),
			"Peningkatan terukur dalam aspek akurasi, efisiensi kerja, dan daya guna dibanding metode konvensional.",
		}
		output = []string{
			"Laporan Kemajuan dan Laporan Akhir PKM Belmawa",
			"Purwarupa Fungsional / Produk Hasil Riset Terstandarisasi",
			"Sertifikat Hak Cipta (HaKI) / Paten Sederhana atas Karya Inovasi",
			"Artikel Ilmiah Terpublikasi pada Jurnal Nasional Terakreditasi",
		}
	}

	p1, p2 := problem[0], problem[1]
	pur1, pur2 := purpose[0], purpose[1]
	id1, id2 := idea[0], idea[1]
	uv1, uv2 := uniqueValue[0], uniqueValue[1]
	nov1, nov2 := novelty[0], novelty[1]

	return fmt.Sprintf(`### PKM Strategy Canvas (PSC) - Draf Ide Terpetakan & Disempurnakan
PKMATE telah menelaah masukan Anda, meringkas kalimat ke substansi inti, serta menyempurnakan diksi menjadi judul dan 8 pilar ilmiah standar Belmawa Dikti:

**Usulan:** "%s" (%s - %s)
**Judul Rekomendasi:** *%s*

1. **Masalah (Problem):**
   - %s
   - %s

2. **Tujuan (Purpose):**
   - %s
   - %s

3. **Gagasan (Idea):**
   - %s
   - %s

4. **Metode (Method):**
   - %s
   - %s
   - %s

5. **Keunikan (Unique Value):**
   - %s
   - %s

6. **Kegiatan Utama (Key Activities):**
   - %s
   - %s
   - %s

7. **Kebaharuan (Novelty):**
   - %s
   - %s

8. **Luaran (Output):**
   - %s
   - %s
   - %s
   - %s

Tekan tombol **"Buka / Edit Canvas"** untuk memeriksa rincian atau **"Unduh / Cetak PDF"** untuk mengunduh dokumen lanskap resmi.

[PSC_DATA]
{
  "title": %q,
  "scheme": %q,
  "problem": [%q, %q],
  "purpose": [%q, %q],
  "idea": [%q, %q],
  "method": [%q, %q, %q],
  "uniqueValue": [%q, %q],
  "keyActivities": [%q, %q, %q],
  "novelty": [%q, %q],
  "output": [%q, %q, %q, %q]
}
[/PSC_DATA]`,
		clean, scheme, schemeName, title,
		p1, p2,
		pur1, pur2,
		id1, id2,
		method[0], method[1], method[2],
		uv1, uv2,
		keyActivities[0], keyActivities[1], keyActivities[2],
		nov1, nov2,
		output[0], output[1], output[2], output[3],
		title, scheme,
		p1, p2,
		pur1, pur2,
		id1, id2,
		method[0], method[1], method[2],
		uv1, uv2,
		keyActivities[0], keyActivities[1], keyActivities[2],
		nov1, nov2,
		output[0], output[1], output[2], output[3],
	)
}

// generateLocalPKMAnalysis adalah mesin analisis aturan cadangan jika koneksi AI terputus total
func generateLocalPKMAnalysis(query string) string {
	lower := strings.ToLower(query)

	// Penanganan Perintah /canvas untuk PKM Strategy Canvas (PSC)
	if strings.Contains(lower, "/canvas") || strings.Contains(lower, "strategy canvas") || strings.Contains(lower, "psc") || strings.Contains(lower, "[mode pkm strategy canvas]") {
		return generateDynamicPKMStrategyCanvas(query)
	}

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

	return fmt.Sprintf(`### Analisis PKMATE - PKM Center Unila
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
