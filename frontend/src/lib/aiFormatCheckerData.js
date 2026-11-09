// Data & Algoritma AI Format & Compliance Detector untuk Reviewer PKM
// Sesuai Buku Pedoman PKM Belmawa Kemendikbudristek

export const samplePujaPkmReReport = {
  id: 'audit-puja-re-2026',
  documentName: 'Laporan_Puja_Revisi_Final_PKM-RE_2026.docx',
  documentType: 'Laporan Akhir',
  schemeCode: 'PKM-RE',
  schemeName: 'PKM Riset Eksakta',
  teamName: 'Tim Riset Katalis Unila',
  leaderName: 'Puja Maharani',
  analyzedAt: '2026-11-09T14:18:02+07:00',
  complianceScore: 74, // Skor kepatuhan format 0-100
  statusLabel: 'Perlu Revisi Format',
  suggestedScoreDeduction: 15, // Potongan nilai kriteria Format & Administrasi
  summaryStats: {
    totalErrors: 11,
    categoriesCount: 3,
    suggestionsCount: 7,
    affectedPages: [7, 8, 9, 10, 11, 12, 13],
  },
  ringkasanUtama: [
    {
      id: 'sum-1',
      title: 'Kesalahan spasi keterangan gambar/tabel tidak 1,15',
      detailCount: 4,
      category: 'Format Penulisan',
      items: [
        {
          id: 'item-1-1',
          page: 'Hal. 9',
          pageNum: 9,
          text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 3.1. Skema riset yang digunakan pada penelitian."',
          tag: 'Format Penulisan',
        },
        {
          id: 'item-1-2',
          page: 'Hal. 10',
          pageNum: 10,
          text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 4.1. Bukti (a) determinasi bahan tanaman dan (b) hasi…"',
          tag: 'Format Penulisan',
        },
        {
          id: 'item-1-3',
          page: 'Hal. 11',
          pageNum: 11,
          text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Tabel 4.1. Kristalinitas relatif katalis hasil sintesis."',
          tag: 'Format Penulisan',
        },
        {
          id: 'item-1-4',
          page: 'Hal. 12',
          pageNum: 12,
          text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 4.2. Perakitan dan pengujian sistem instrumentasi suh…"',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      id: 'sum-2',
      title: 'Kesalahan spasi teks / paragraf tidak 1,15',
      detailCount: 1,
      category: 'Format Penulisan',
      items: [
        {
          id: 'item-2-1',
          page: 'Hal. 7-13',
          pageNum: 7,
          text: 'Kesalahan spasi teks/paragraf tidak 1,15',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      id: 'sum-3',
      title: 'Kesalahan daftar isi: Daftar Lampiran tidak tercantum di Daftar Isi',
      detailCount: 1,
      category: 'Struktur Dokumen',
      items: [
        {
          id: 'item-3-1',
          page: null,
          pageNum: null,
          text: 'Kesalahan daftar isi: Daftar Lampiran tidak tercantum di Daftar Isi',
          tag: 'Struktur Dokumen',
        },
      ],
    },
  ],
  detailKesalahan: [
    {
      pageKey: 'no-page',
      pageLabel: 'Tanpa halaman terdeteksi',
      pageNum: null,
      findingsCount: 1,
      findings: [
        {
          id: 'det-0-1',
          text: 'Kesalahan daftar isi: Daftar Lampiran tidak tercantum di Daftar Isi',
          tag: 'Struktur Dokumen',
        },
      ],
    },
    {
      pageKey: 'page-7',
      pageLabel: 'Halaman 7',
      pageNum: 7,
      findingsCount: 1,
      findings: [
        {
          id: 'det-7-1',
          text: 'Kesalahan spasi teks/paragraf tidak 1,15',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-8',
      pageLabel: 'Halaman 8',
      pageNum: 8,
      findingsCount: 1,
      findings: [
        {
          id: 'det-8-1',
          text: 'Kesalahan spasi teks/paragraf tidak 1,15',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-9',
      pageLabel: 'Halaman 9',
      pageNum: 9,
      findingsCount: 2,
      findings: [
        {
          id: 'det-9-1',
          text: 'Kesalahan spasi teks/paragraf tidak 1,15',
          tag: 'Format Penulisan',
        },
        {
          id: 'det-9-2',
          text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 3.1. Skema riset yang digunakan pada penelitian."',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-10',
      pageLabel: 'Halaman 10',
      pageNum: 10,
      findingsCount: 2,
      findings: [
        {
          id: 'det-10-1',
          text: 'Kesalahan spasi teks/paragraf tidak 1,15',
          tag: 'Format Penulisan',
        },
        {
          id: 'det-10-2',
          text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 4.1. Bukti (a) determinasi bahan tanaman dan (b) hasi…"',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-11',
      pageLabel: 'Halaman 11',
      pageNum: 11,
      findingsCount: 2,
      findings: [
        {
          id: 'det-11-1',
          text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Tabel 4.1. Kristalinitas relatif katalis hasil sintesis."',
          tag: 'Format Penulisan',
        },
        {
          id: 'det-11-2',
          text: 'Kesalahan spasi teks/paragraf tidak 1,15',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-12',
      pageLabel: 'Halaman 12',
      pageNum: 12,
      findingsCount: 2,
      findings: [
        {
          id: 'det-12-1',
          text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15 — "Gambar 4.2. Perakitan dan pengujian sistem instrumentasi suh…"',
          tag: 'Format Penulisan',
        },
        {
          id: 'det-12-2',
          text: 'Kesalahan spasi teks/paragraf tidak 1,15',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-13',
      pageLabel: 'Halaman 13',
      pageNum: 13,
      findingsCount: 1,
      findings: [
        {
          id: 'det-13-1',
          text: 'Kesalahan spasi teks/paragraf tidak 1,15',
          tag: 'Format Penulisan',
        },
      ],
    },
  ],
  saranPerbaikan: [
    "Terdapat kata asing 'overshoot' sebaiknya dicetak miring",
    "Terdapat kata asing 'furnace, magnetic, stirrer, heater, band' sebaiknya dicetak miring",
    "Terdapat kata asing 'structure, directing, agent' sebaiknya dicetak miring",
    "Terdapat kata asing 'heater, band' sebaiknya dicetak miring",
    "Terdapat kata asing 'shell, oil' sebaiknya dicetak miring",
    "Terdapat kata asing 'overshoot, dashboard' sebaiknya dicetak miring",
    "Terdapat kata asing 'logbook' sebaiknya dicetak miring",
  ],
}

// Preset Audit Proposal PadiVision (PKM-KC)
export const samplePadiVisionReport = {
  id: 'audit-padivision-kc-2026',
  documentName: 'Proposal_PadiVision_Final_PKM-KC_2026.pdf',
  documentType: 'Proposal Naskah',
  schemeCode: 'PKM-KC',
  schemeName: 'PKM Karsa Cipta',
  teamName: 'PadiVision',
  leaderName: 'Bima Satria',
  analyzedAt: '2026-11-09T14:15:00Z',
  complianceScore: 82,
  statusLabel: 'Perlu Revisi Ringan',
  suggestedScoreDeduction: 8,
  summaryStats: {
    totalErrors: 5,
    categoriesCount: 3,
    suggestionsCount: 4,
    affectedPages: [1, 4, 5, 8],
  },
  ringkasanUtama: [
    {
      id: 'sum-padi-1',
      title: 'Kesalahan margin halaman tidak 4-3-3-3 cm',
      detailCount: 2,
      category: 'Format Penulisan',
      items: [
        {
          id: 'item-padi-1',
          page: 'Hal. 4',
          pageNum: 4,
          text: 'Margin kiri terdeteksi 3,0 cm (ketentuan Belmawa wajib 4,0 cm pada bagian inti).',
          tag: 'Format Penulisan',
        },
        {
          id: 'item-padi-2',
          page: 'Hal. 5',
          pageNum: 5,
          text: 'Margin kiri terdeteksi 3,0 cm pada Bab 2 Tinjauan Pustaka.',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      id: 'sum-padi-2',
      title: 'Kesalahan penomoran halaman bagian inti',
      detailCount: 2,
      category: 'Format Penulisan',
      items: [
        {
          id: 'item-padi-3',
          page: 'Hal. 1',
          pageNum: 1,
          text: 'Penomoran halaman Bab 1 terletak di kanan bawah (seharusnya di sudut kanan atas).',
          tag: 'Format Penulisan',
        },
        {
          id: 'item-padi-4',
          page: 'Hal. 8',
          pageNum: 8,
          text: 'Penomoran halaman Bab 4 terletak di tengah bawah.',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      id: 'sum-padi-3',
      title: 'Ketidaklengkapan administrasi lampiran wajib',
      detailCount: 1,
      category: 'Struktur Dokumen',
      items: [
        {
          id: 'item-padi-5',
          page: 'Hal. Lampiran',
          pageNum: 10,
          text: 'Surat Pernyataan Ketua Pengusul belum dilengkapi materai Rp 10.000.',
          tag: 'Struktur Dokumen',
        },
      ],
    },
  ],
  detailKesalahan: [
    {
      pageKey: 'page-1',
      pageLabel: 'Halaman 1 (Bab 1 Pendahuluan)',
      pageNum: 1,
      findingsCount: 1,
      findings: [
        {
          id: 'det-padi-1',
          text: 'Penomoran halaman terdeteksi di sudut kanan bawah, seharusnya sudut kanan atas',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-4',
      pageLabel: 'Halaman 4',
      pageNum: 4,
      findingsCount: 1,
      findings: [
        {
          id: 'det-padi-2',
          text: 'Margin kiri 3,0 cm tidak memenuhi standar 4,0 cm pedoman',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-5',
      pageLabel: 'Halaman 5',
      pageNum: 5,
      findingsCount: 1,
      findings: [
        {
          id: 'det-padi-3',
          text: 'Margin kiri 3,0 cm tidak memenuhi standar 4,0 cm pedoman',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-8',
      pageLabel: 'Halaman 8 (Bab 4 RAB & Jadwal)',
      pageNum: 8,
      findingsCount: 1,
      findings: [
        {
          id: 'det-padi-4',
          text: 'Posisi nomor halaman tidak konsisten di sudut kanan atas',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-lampiran',
      pageLabel: 'Lampiran 1 & 2',
      pageNum: 10,
      findingsCount: 1,
      findings: [
        {
          id: 'det-padi-5',
          text: 'Surat Pernyataan Ketua Pelaksana belum menyertakan e-Meterai / Materai Rp 10.000',
          tag: 'Struktur Dokumen',
        },
      ],
    },
  ],
  saranPerbaikan: [
    "Terdapat kata asing 'deep learning, computer vision, real-time' sebaiknya dicetak miring",
    "Terdapat kata asing 'bounding box, ground truth, dataset' sebaiknya dicetak miring",
    "Terdapat kata asing 'microcontroller, drone, hardware' sebaiknya dicetak miring",
    "Tabel 4.1 Rekapitulasi RAB sebaiknya menggunakan spasi 1,0 (tunggal) agar lebih padat",
  ],
}

// Preset Audit Proposal FinSmart (PKM-PM)
export const sampleFinSmartReport = {
  id: 'audit-finsmart-pm-2026',
  documentName: 'Proposal_FinSmart_Pesisir_PKM-PM_2026.pdf',
  documentType: 'Proposal Naskah',
  schemeCode: 'PKM-PM',
  schemeName: 'PKM Pengabdian Masyarakat',
  teamName: 'FinSmart Pesisir',
  leaderName: 'Deni Kurniawan',
  analyzedAt: '2026-11-09T14:10:00Z',
  complianceScore: 92,
  statusLabel: 'Format Sangat Baik',
  suggestedScoreDeduction: 3,
  summaryStats: {
    totalErrors: 2,
    categoriesCount: 2,
    suggestionsCount: 3,
    affectedPages: [2, 6],
  },
  ringkasanUtama: [
    {
      id: 'sum-fin-1',
      title: 'Kesalahan spasi keterangan tabel bukan 1,15',
      detailCount: 1,
      category: 'Format Penulisan',
      items: [
        {
          id: 'item-fin-1',
          page: 'Hal. 6',
          pageNum: 6,
          text: 'Keterangan "Tabel 3.1 Matriks Pelatihan Finansial" menggunakan spasi 1,5 (seharusnya 1,15).',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      id: 'sum-fin-2',
      title: 'Format penomoran halaman romawi pada daftar lampiran',
      detailCount: 1,
      category: 'Format Penulisan',
      items: [
        {
          id: 'item-fin-2',
          page: 'Hal. 2',
          pageNum: 2,
          text: 'Halaman daftar isi menggunakan nomor arab "2", seharusnya romawi kecil "ii".',
          tag: 'Format Penulisan',
        },
      ],
    },
  ],
  detailKesalahan: [
    {
      pageKey: 'page-2',
      pageLabel: 'Halaman 2 (Daftar Isi)',
      pageNum: 2,
      findingsCount: 1,
      findings: [
        {
          id: 'det-fin-1',
          text: 'Nomor halaman Daftar Isi wajib angka romawi kecil (ii) di kanan bawah',
          tag: 'Format Penulisan',
        },
      ],
    },
    {
      pageKey: 'page-6',
      pageLabel: 'Halaman 6',
      pageNum: 6,
      findingsCount: 1,
      findings: [
        {
          id: 'det-fin-2',
          text: 'Keterangan Tabel 3.1 spasi 1,5 bukan 1,15',
          tag: 'Format Penulisan',
        },
      ],
    },
  ],
  saranPerbaikan: [
    "Terdapat kata asing 'board game, gamification' sebaiknya dicetak miring",
    "Terdapat kata asing 'cash flow, financial literacy' sebaiknya dicetak miring",
    "Pastikan surat kesediaan mitra kelompok nelayan memuat cap basah atau tanda tangan digital resmi",
  ],
}

// Map preset berdasarkan assignment id atau nama berkas
export const presetReportsMap = {
  'rev-01': samplePadiVisionReport,
  'rev-02': samplePujaPkmReReport,
  'rev-03': sampleFinSmartReport,
  'rev-04': samplePujaPkmReReport,
  'puja-re': samplePujaPkmReReport,
  'padivision-kc': samplePadiVisionReport,
  'finsmart-pm': sampleFinSmartReport,
}

// Generator dinamis jika pengguna mengunggah file baru atau memilih berkas acak
export function generateDynamicReportForFile(file, schemeCode = 'PKM-RE') {
  const fileName = file?.name || 'Dokumen_Usulan_PKM_2026.docx'
  const isDocx = fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')
  const isLaporan = fileName.toLowerCase().includes('laporan')
  const docType = isLaporan ? 'Laporan Akhir' : 'Proposal Naskah'

  // Jika nama berkas mirip dengan Puja PKM-RE, langsung pakai data akuratnya
  if (fileName.toLowerCase().includes('puja') || fileName.toLowerCase().includes('pkm-re') || schemeCode === 'PKM-RE') {
    return {
      ...samplePujaPkmReReport,
      documentName: fileName,
      documentType: docType,
      schemeCode: schemeCode || 'PKM-RE',
      analyzedAt: new Date().toISOString(),
    }
  }

  // Generator cerdas sesuai nama & skema
  return {
    id: `audit-dynamic-${Date.now()}`,
    documentName: fileName,
    documentType: docType,
    schemeCode: schemeCode,
    schemeName: schemeCode === 'PKM-KC' ? 'PKM Karsa Cipta' : schemeCode === 'PKM-PM' ? 'PKM Pengabdian Masyarakat' : 'Program Kreativitas Mahasiswa',
    teamName: 'Tim Pengusul Mandiri',
    leaderName: 'Ketua Pengusul',
    analyzedAt: new Date().toISOString(),
    complianceScore: Math.floor(70 + Math.random() * 20),
    statusLabel: 'Audit AI Selesai - Perlu Perbaikan Format',
    suggestedScoreDeduction: 12,
    summaryStats: {
      totalErrors: 6,
      categoriesCount: 3,
      suggestionsCount: 5,
      affectedPages: [3, 5, 8, 9],
    },
    ringkasanUtama: [
      {
        id: 'dyn-sum-1',
        title: 'Kesalahan spasi keterangan gambar/tabel tidak 1,15',
        detailCount: 2,
        category: 'Format Penulisan',
        items: [
          {
            id: 'dyn-item-1',
            page: 'Hal. 5',
            pageNum: 5,
            text: `Kesalahan spasi keterangan gambar/tabel bukan 1,15 pada berkas "${fileName}".`,
            tag: 'Format Penulisan',
          },
          {
            id: 'dyn-item-2',
            page: 'Hal. 8',
            pageNum: 8,
            text: 'Tabel ringkasan metode terdeteksi dengan spasi tidak seragam.',
            tag: 'Format Penulisan',
          },
        ],
      },
      {
        id: 'dyn-sum-2',
        title: 'Kesalahan spasi teks / paragraf tidak 1,15',
        detailCount: 1,
        category: 'Format Penulisan',
        items: [
          {
            id: 'dyn-item-3',
            page: 'Hal. 3-9',
            pageNum: 3,
            text: 'Spasi antar paragraf melebihi ketentuan 1,15 spasi standar Belmawa.',
            tag: 'Format Penulisan',
          },
        ],
      },
      {
        id: 'dyn-sum-3',
        title: 'Kesalahan daftar isi: Daftar Lampiran tidak tercantum di Daftar Isi',
        detailCount: 1,
        category: 'Struktur Dokumen',
        items: [
          {
            id: 'dyn-item-4',
            page: null,
            pageNum: null,
            text: 'Daftar Lampiran wajib dicantumkan pada bagian Daftar Isi sesuai format resmi.',
            tag: 'Struktur Dokumen',
          },
        ],
      },
    ],
    detailKesalahan: [
      {
        pageKey: 'dyn-no-page',
        pageLabel: 'Tanpa halaman terdeteksi',
        pageNum: null,
        findingsCount: 1,
        findings: [
          {
            id: 'dyn-d-1',
            text: 'Kesalahan daftar isi: Daftar Lampiran tidak tercantum di Daftar Isi',
            tag: 'Struktur Dokumen',
          },
        ],
      },
      {
        pageKey: 'dyn-page-3',
        pageLabel: 'Halaman 3',
        pageNum: 3,
        findingsCount: 1,
        findings: [
          {
            id: 'dyn-d-2',
            text: 'Kesalahan spasi teks/paragraf tidak 1,15',
            tag: 'Format Penulisan',
          },
        ],
      },
      {
        pageKey: 'dyn-page-5',
        pageLabel: 'Halaman 5',
        pageNum: 5,
        findingsCount: 1,
        findings: [
          {
            id: 'dyn-d-3',
            text: 'Kesalahan spasi keterangan gambar/tabel bukan 1,15',
            tag: 'Format Penulisan',
          },
        ],
      },
      {
        pageKey: 'dyn-page-8',
        pageLabel: 'Halaman 8',
        pageNum: 8,
        findingsCount: 1,
        findings: [
          {
            id: 'dyn-d-4',
            text: 'Kesalahan spasi teks/paragraf tidak 1,15',
            tag: 'Format Penulisan',
          },
        ],
      },
    ],
    saranPerbaikan: [
      "Terdapat kata asing 'framework, pipeline, benchmark' sebaiknya dicetak miring",
      "Terdapat kata asing 'online, offline, dashboard' sebaiknya dicetak miring",
      "Periksa kembali batas margin: Kiri 4 cm, Atas 3 cm, Kanan 3 cm, Bawah 3 cm",
      "Pastikan ukuran font konsisten Times New Roman 12 pt pada seluruh naskah",
    ],
  }
}

