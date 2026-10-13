import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            
            # Running header
            self.drawString(2.5 * cm, 28.2 * cm, "PKM CENTER UNIVERSITAS LAMPUNG — SIMBELMAWA 2026")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(2.5 * cm, 28.0 * cm, 18.5 * cm, 28.0 * cm)
            
            # Running footer
            self.line(2.5 * cm, 2.0 * cm, 18.5 * cm, 2.0 * cm)
            page_text = f"Halaman {self._pageNumber} dari {page_count}"
            self.drawRightString(18.5 * cm, 1.5 * cm, page_text)
            self.drawString(2.5 * cm, 1.5 * cm, "Dokumen Resmi Usulan Program Kreativitas Mahasiswa (PKM)")
            self.restoreState()

def create_pkm_pdf(filename, data):
    output_dir = os.path.dirname(filename)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    style_cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=20,
        alignment=1, # Centered
        textColor=colors.HexColor('#0b2149'),
        spaceAfter=15
    )
    
    style_cover_sub = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=16,
        alignment=1,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=25
    )

    style_cover_meta = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        alignment=1,
        textColor=colors.HexColor('#334155')
    )

    style_heading1 = ParagraphStyle(
        'H1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0b2149'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    style_heading2 = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1e40af'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=colors.HexColor('#1e293b'),
        alignment=4, # Justify
        spaceAfter=8
    )

    style_abstract = ParagraphStyle(
        'Abstract',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=14,
        textColor=colors.HexColor('#334155'),
        alignment=4,
        spaceAfter=10
    )

    style_table_text = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.white,
        alignment=1
    )

    story = []

    # ==================== HALAMAN SAMPUL ====================
    story.append(Spacer(1, 1.5 * cm))
    story.append(Paragraph("PROPOSAL PROGRAM KREATIVITAS MAHASISWA", ParagraphStyle('CoverTop', fontName='Helvetica-Bold', fontSize=12, leading=16, alignment=1, textColor=colors.HexColor('#0b2149'))))
    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph(data['title'].upper(), style_cover_title))
    story.append(Paragraph(f"BIDANG KEGIATAN:<br/><b>{data['scheme_full'].upper()} ({data['scheme_code']})</b>", style_cover_sub))
    
    logo_path = "frontend/public/Logo-2016-Unila.png"
    if os.path.exists(logo_path):
        story.append(Spacer(1, 0.5 * cm))
        story.append(Image(logo_path, width=3.2 * cm, height=3.2 * cm))
        story.append(Spacer(1, 0.8 * cm))
    else:
        story.append(Spacer(1, 2.5 * cm))

    story.append(Paragraph("<b>Diusulkan oleh:</b>", style_cover_meta))
    story.append(Spacer(1, 0.2 * cm))

    members_text = f"<b>Ketua Tim:</b> {data['leader']} ({data['leader_nim']}) - Angkatan 2022<br/>"
    for m in data['members']:
        members_text += f"{m['name']} ({m['nim']}) - Angkatan {m.get('angkatan', '2023')}<br/>"
    story.append(Paragraph(members_text, style_cover_meta))
    story.append(Spacer(1, 1.5 * cm))

    story.append(Paragraph(f"<b>UNIVERSITAS LAMPUNG</b><br/>BANDAR LAMPUNG<br/><b>TAHUN 2026</b>", style_cover_title))
    story.append(PageBreak())

    # ==================== LEMBAR PENGESAHAN ====================
    story.append(Paragraph("PENGESAHAN PROPOSAL PKM", ParagraphStyle('PengesahanTitle', fontName='Helvetica-Bold', fontSize=13, leading=17, alignment=1, textColor=colors.HexColor('#0b2149'))))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0b2149'), spaceBefore=6, spaceAfter=15))

    pengesahan_rows = [
        [Paragraph("1. Judul Kegiatan", style_table_text), Paragraph(f": <b>{data['title']}</b>", style_table_text)],
        [Paragraph("2. Bidang Kegiatan", style_table_text), Paragraph(f": {data['scheme_full']} ({data['scheme_code']})", style_table_text)],
        [Paragraph("3. Ketua Pelaksana", style_table_text), Paragraph(f":", style_table_text)],
        [Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;a. Nama Lengkap", style_table_text), Paragraph(f": {data['leader']}", style_table_text)],
        [Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;b. NIM / NPM", style_table_text), Paragraph(f": {data['leader_nim']}", style_table_text)],
        [Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;c. Jurusan / Fakultas", style_table_text), Paragraph(f": {data.get('faculty', 'Fakultas Teknik')} Unila", style_table_text)],
        [Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;d. Alamat Surel / HP", style_table_text), Paragraph(f": {data['leader'].lower().replace(' ', '.')}@student.unila.ac.id / 0812-7890-4421", style_table_text)],
        [Paragraph("4. Anggota Tim Pelaksana", style_table_text), Paragraph(f": {len(data['members']) + 1} Orang", style_table_text)],
        [Paragraph("5. Dosen Pendamping", style_table_text), Paragraph(f":", style_table_text)],
        [Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;a. Nama Lengkap & Gelar", style_table_text), Paragraph(f": {data.get('supervisor_name', 'Dr. Budi Dosen, S.T., M.T.')}", style_table_text)],
        [Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;b. NIP / NIDN", style_table_text), Paragraph(f": {data.get('supervisor_nip', '198204152008121002')} / 0015048201", style_table_text)],
        [Paragraph("6. Biaya Kegiatan Total", style_table_text), Paragraph(f":", style_table_text)],
        [Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;a. Belmawa Kemdiktisaintek", style_table_text), Paragraph(f": {data.get('budget_belmawa', 'Rp 8.750.000,-')}", style_table_text)],
        [Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;b. Perguruan Tinggi / Mitra", style_table_text), Paragraph(f": Rp 0,-", style_table_text)],
        [Paragraph("7. Jangka Waktu Pelaksanaan", style_table_text), Paragraph(f": 4 (Empat) Bulan", style_table_text)],
    ]

    t_pengesahan = Table(pengesahan_rows, colWidths=[5.5 * cm, 10.5 * cm])
    t_pengesahan.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_pengesahan)
    story.append(Spacer(1, 1 * cm))

    # Tanda tangan
    ttd_data = [
        [
            Paragraph("Menyetujui,<br/>Dosen Pendamping Kegiatan,<br/><br/><br/><br/><b><u>" + data.get('supervisor_name', 'Dr. Budi Dosen, S.T., M.T.') + "</u></b><br/>NIP. " + data.get('supervisor_nip', '198204152008121002'), style_table_text),
            Paragraph("Bandar Lampung, 08 Oktober 2026<br/>Ketua Pelaksana Kegiatan,<br/><br/><br/><br/><b><u>" + data['leader'] + "</u></b><br/>NPM. " + data['leader_nim'], style_table_text)
        ],
        [
            Paragraph("<br/>Mengetahui,<br/>Wakil Dekan Bidang Kemahasiswaan & Alumni,<br/><br/><br/><br/><b><u>Dr. Ir. Ahmad Syarif, M.T.</u></b><br/>NIP. 197408101999031002", style_table_text),
            Paragraph("", style_table_text)
        ]
    ]
    t_ttd = Table(ttd_data, colWidths=[8.0 * cm, 8.0 * cm])
    t_ttd.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_ttd)
    story.append(PageBreak())

    # ==================== RINGKASAN / ABSTRAK ====================
    story.append(Paragraph("RINGKASAN EKSEKUTIF", ParagraphStyle('AbstrakTitle', fontName='Helvetica-Bold', fontSize=12, leading=16, alignment=1, textColor=colors.HexColor('#0b2149'))))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0b2149'), spaceBefore=4, spaceAfter=12))
    story.append(Paragraph(data['abstract'], style_abstract))
    story.append(Paragraph(f"<b>Kata Kunci:</b> <i>{data.get('keywords', 'Inovasi, PKM, Universitas Lampung, SIMBELMAWA')}</i>", style_body))
    story.append(Spacer(1, 0.5 * cm))

    # ==================== BAB 1 ====================
    story.append(Paragraph("BAB 1. PENDAHULUAN", style_heading1))
    story.append(Paragraph("1.1 Latar Belakang Masalah", style_heading2))
    story.append(Paragraph(data['bab1_latar'], style_body))
    
    story.append(Paragraph("1.2 Rumusan Masalah", style_heading2))
    story.append(Paragraph(data['bab1_rumusan'], style_body))

    story.append(Paragraph("1.3 Urgensi dan Keutamaan Riset/Inovasi", style_heading2))
    story.append(Paragraph(data['bab1_urgensi'], style_body))

    story.append(Paragraph("1.4 Target Luaran", style_heading2))
    story.append(Paragraph(data.get('bab1_luaran', 'Luaran wajib: (1) Laporan kemajuan; (2) Laporan akhir; (3) Prototipe fungsional teruji; (4) Akun media sosial publikasi kegiatan. Luaran tambahan: Draf artikel ilmiah atau paten sederhana.'), style_body))

    # ==================== BAB 2 ====================
    story.append(Paragraph("BAB 2. TINJAUAN PUSTAKA", style_heading1))
    story.append(Paragraph(data['bab2_content'], style_body))

    # ==================== BAB 3 ====================
    story.append(Paragraph("BAB 3. TAHAP PELAKSANAAN / METODOLOGI", style_heading1))
    story.append(Paragraph(data['bab3_content'], style_body))

    # ==================== BAB 4 ====================
    story.append(PageBreak())
    story.append(Paragraph("BAB 4. BIAYA DAN JADWAL KEGIATAN", style_heading1))
    story.append(Paragraph("4.1 Rekapitulasi Rencana Anggaran Biaya (RAB)", style_heading2))

    rab_rows = [
        [Paragraph("No", style_table_header), Paragraph("Jenis Pengeluaran", style_table_header), Paragraph("Sumber Dana", style_table_header), Paragraph("Besaran (Rp)", style_table_header)],
        [Paragraph("1", style_table_text), Paragraph("Bahan Habis Pakai (Reagen, Sensor, Komponen Elektronik)", style_table_text), Paragraph("Belmawa", style_table_text), Paragraph(data.get('rab_1', 'Rp 4.250.000'), style_table_text)],
        [Paragraph("2", style_table_text), Paragraph("Sewa dan Jasa (Server Cloud GPU, Sewa Drone/Lab)", style_table_text), Paragraph("Belmawa", style_table_text), Paragraph(data.get('rab_2', 'Rp 2.100.000'), style_table_text)],
        [Paragraph("3", style_table_text), Paragraph("Transportasi Lokal dan Uji Lapangan Wilayah Lampung", style_table_text), Paragraph("Belmawa", style_table_text), Paragraph(data.get('rab_3', 'Rp 1.400.000'), style_table_text)],
        [Paragraph("4", style_table_text), Paragraph("Lain-lain (Pelaporan, Publikasi Medsos, Pengemasan)", style_table_text), Paragraph("Belmawa", style_table_text), Paragraph(data.get('rab_4', 'Rp 1.000.000'), style_table_text)],
        [Paragraph("<b>TOTAL</b>", style_table_text), Paragraph("<b>Jumlah Anggaran Yang Diusulkan</b>", style_table_text), Paragraph("<b>Belmawa</b>", style_table_text), Paragraph(f"<b>{data.get('budget_belmawa', 'Rp 8.750.000')}</b>", style_table_text)],
    ]
    t_rab = Table(rab_rows, colWidths=[1.2 * cm, 8.5 * cm, 2.8 * cm, 3.5 * cm])
    t_rab.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0b2149')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (0,1), (0,-1), 'CENTER'),
        ('ALIGN', (3,1), (3,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_rab)
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("4.2 Matriks Jadwal Kegiatan (Gantt Chart)", style_heading2))
    jadwal_rows = [
        [Paragraph("No", style_table_header), Paragraph("Jenis Rencana Kegiatan", style_table_header), Paragraph("Bulan 1", style_table_header), Paragraph("Bulan 2", style_table_header), Paragraph("Bulan 3", style_table_header), Paragraph("Bulan 4", style_table_header)],
        [Paragraph("1", style_table_text), Paragraph("Studi literatur & pengadaan komponen/bahan", style_table_text), Paragraph("V", style_table_text), Paragraph("", style_table_text), Paragraph("", style_table_text), Paragraph("", style_table_text)],
        [Paragraph("2", style_table_text), Paragraph("Pengembangan sistem / ekstraksi formulasi", style_table_text), Paragraph("V", style_table_text), Paragraph("V", style_table_text), Paragraph("", style_table_text), Paragraph("", style_table_text)],
        [Paragraph("3", style_table_text), Paragraph("Pengujian laboratorium / akurasi model AI", style_table_text), Paragraph("", style_table_text), Paragraph("V", style_table_text), Paragraph("V", style_table_text), Paragraph("", style_table_text)],
        [Paragraph("4", style_table_text), Paragraph("Validasi lapangan bersama petani / mitra", style_table_text), Paragraph("", style_table_text), Paragraph("", style_table_text), Paragraph("V", style_table_text), Paragraph("V", style_table_text)],
        [Paragraph("5", style_table_text), Paragraph("Penyusunan laporan akhir & artikel ilmiah", style_table_text), Paragraph("", style_table_text), Paragraph("", style_table_text), Paragraph("", style_table_text), Paragraph("V", style_table_text)],
    ]
    t_jadwal = Table(jadwal_rows, colWidths=[1.0 * cm, 7.5 * cm, 1.8 * cm, 1.8 * cm, 1.8 * cm, 1.8 * cm])
    t_jadwal.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e40af')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_jadwal)
    story.append(Spacer(1, 0.6 * cm))

    # ==================== DAFTAR PUSTAKA ====================
    story.append(Paragraph("DAFTAR PUSTAKA", style_heading1))
    pustaka_items = data.get('references', [
        "Jocher, G., et al. (2023). Ultralytics YOLOv8: Cutting-edge object detection and computer vision algorithms. GitHub Repository.",
        "Badan Pusat Statistik Provinsi Lampung. (2025). Produksi Padi dan Komoditas Unggulan Lampung Tahun 2024. BPS Lampung.",
        "Suhartono, E., & Wibowo, A. (2024). Deteksi Dini Penyakit Tanaman Tropis Menggunakan Pengolahan Citra Multispektral. Jurnal Rekayasa Pertanian, 12(2), 145-156.",
        "Direktorat Pembelajaran dan Kemahasiswaan. (2025). Pedoman Program Kreativitas Mahasiswa (PKM) Tahun 2025. Kemdiktisaintek RI, Jakarta."
    ])
    for idx, ref in enumerate(pustaka_items, 1):
        story.append(Paragraph(f"[{idx}] {ref}", ParagraphStyle('Ref', parent=style_body, fontSize=8.5, leading=12, spaceAfter=4)))

    # ==================== LAMPIRAN ====================
    story.append(PageBreak())
    story.append(Paragraph("LAMPIRAN 1. SURAT PERNYATAAN KETUA PELAKSANA", style_heading1))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0b2149'), spaceBefore=4, spaceAfter=12))

    pernyataan_text = f"""
    Yang bertanda tangan di bawah ini:<br/>
    Nama Ketua &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <b>{data['leader']}</b><br/>
    NIM / NPM &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <b>{data['leader_nim']}</b><br/>
    Program Studi &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {data.get('faculty', 'Fakultas Pertanian')}<br/>
    Perguruan Tinggi &nbsp;&nbsp;&nbsp;&nbsp;: Universitas Lampung<br/><br/>
    Dengan ini menyatakan bahwa proposal PKM kami dengan judul:<br/>
    <b>"{data['title']}"</b><br/>
    yang diusulkan untuk tahun anggaran 2026 adalah <b>asli karya kami</b> dan belum pernah dibiayai oleh lembaga atau sumber dana lain manapun.
    <br/><br/>
    Bilamana di kemudian hari ditemukan ketidaksesuaian dengan pernyataan ini, maka saya bersedia dituntut dan diproses sesuai dengan ketentuan yang berlaku dan mengembalikan seluruh biaya penelitian yang sudah diterima ke kas negara.
    <br/><br/>
    Demikian pernyataan ini dibuat dengan sesungguhnya dan dengan sebenar-benarnya secara sadar tanpa paksaan dari pihak manapun.
    """
    story.append(Paragraph(pernyataan_text, style_body))
    story.append(Spacer(1, 1.2 * cm))

    materai_box = [
        [
            Paragraph("", style_table_text),
            Paragraph(f"Bandar Lampung, 08 Oktober 2026<br/>Yang menyatakan,<br/><br/><b>[Materai Rp 10.000]</b><br/><br/><br/><b><u>{data['leader']}</u></b><br/>NPM. {data['leader_nim']}", style_table_text)
        ]
    ]
    t_materai = Table(materai_box, colWidths=[9.0 * cm, 7.0 * cm])
    story.append(t_materai)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] Berhasil membuat dokumen PDF: {filename}")

if __name__ == '__main__':
    proposals = [
        {
            'filename': 'frontend/public/docs/proposal-padivision-pkm-kc.pdf',
            'title': 'Deteksi Otomatis Penyakit Blas Padi Menggunakan Citra Drone & Mobile YOLOv8',
            'scheme_code': 'PKM-KC',
            'scheme_full': 'Program Kreativitas Mahasiswa Karsa Cipta',
            'leader': 'Bima Satria',
            'leader_nim': '2114121034',
            'faculty': 'Fakultas Pertanian',
            'supervisor_name': 'Dr. Budi Dosen, S.T., M.T.',
            'supervisor_nip': '198204152008121002',
            'members': [
                {'name': 'Nadia Putri Maharani', 'nim': '2117051001', 'angkatan': '2022'},
                {'name': 'Ahmad Fauzi', 'nim': '2214011045', 'angkatan': '2023'},
                {'name': 'Clara Anindya', 'nim': '2217021028', 'angkatan': '2023'}
            ],
            'abstract': 'Penyakit blas (Pyricularia oryzae) merupakan momok utama petani padi di Provinsi Lampung yang dapat menurunkan hasil panen hingga 50%. Solusi konvensional berupa inspeksi manual membutuhkan waktu lama dan rawan salah diagnosa. Inovasi Karsa Cipta ini mengembangkan sistem deteksi presisi dini berbasis wahana tanpa awak (drone) dengan kamera multispektral yang terintegrasi model visi komputer ringan YOLOv8n. Citra sawah beresolusi tinggi diakuisisi, diekstraksi indeks vegetasinya (NDVI), lalu diklasifikasikan ke dalam 4 stadium keparahan lesi daun secara real-time. Hasil inferensi ditampilkan pada aplikasi mobile petani lengkap dengan koordinat spasial GPS hotspot penyakit dan rekomendasi dosis fungisida ramah lingkungan.',
            'keywords': 'Blas Padi, Drone Multispektral, YOLOv8, Karsa Cipta, Smart Farming Lampung',
            'bab1_latar': 'Provinsi Lampung merupakan lumbung pangan strategis Sumatera dengan luas panen padi mencapai lebih dari 500.000 hektar. Namun, serangan penyakit blas daun (Pyricularia oryzae) kerap melanda pada fase vegetatif akhir, menimbulkan kerugian ekonomi miliaran rupiah bagi petani pedesaan. Deteksi manual yang ada saat ini lambat, membutuhkan tenaga penyuluh pertanian yang sangat terbatas, serta sering terlambat saat keparahan lesi telah meluas.',
            'bab1_rumusan': 'Bagaimana merancang arsitektur wahana drone berbiaya rendah dengan sensor visual yang mampu melakukan pemindaian otomatis hamparan sawah dan mengklasifikasikan bercak blas padi secara akurat menggunakan YOLOv8 serta menyajikannya dalam antarmuka aplikasi Android petani?',
            'bab1_urgensi': 'Teknologi ini memberikan lompatan efisiensi pemantauan lahan dari 2 hari/hektar menjadi hanya 12 menit/hektar, sekaligus menekan penggunaan pestisida kimia berlebih hingga 40% melalui penyemprotan terarah (precision spraying).',
            'bab2_content': 'Tinjauan literatur mencakup karakteristik spektral inframerah dekat daun terinfeksi jamur, perbandingan kinerja YOLOv7 vs YOLOv8 pada dataset edge computing, teknik kompresi model kuantisasi INT8 dengan TensorRT, serta integrasi protokol komunikasi nirkabel LoRa dan telemetry MAVLink pada drone autopiloting ardupilot.',
            'bab3_content': 'Metode pelaksanaan terdiri atas 4 tahapan: (1) Akuisisi data citra sawah Pringsewu sebanyak 2.500 foto raw; (2) Preprocessing, anotasi bounding box menggunakan Roboflow, dan augmentasi data variasi pencahayaan; (3) Pelatihan deep learning model YOLOv8n dengan transfer learning 300 epochs hingga mencapai mAP@50 > 91.2%; (4) Deploy model ke modul onboard Raspberry Pi 5 dan aplikasi Flutter Android serta validasi blind test di 3 kelompok tani mitra.',
            'budget_belmawa': 'Rp 8.750.000',
            'rab_1': 'Rp 4.150.000',
            'rab_2': 'Rp 2.200.000',
            'rab_3': 'Rp 1.400.000',
            'rab_4': 'Rp 1.000.000'
        },
        {
            'filename': 'frontend/public/docs/proposal-nanomarine-pkm-re.pdf',
            'title': 'Sintesis Nanokomposit Kitosan-Pektin Kulit Kakao sebagai Pengawet Alami Ikan Teri Nasi',
            'scheme_code': 'PKM-RE',
            'scheme_full': 'Program Kreativitas Mahasiswa Riset Eksakta',
            'leader': 'Clara Anindya',
            'leader_nim': '2117021028',
            'faculty': 'Fakultas MIPA',
            'supervisor_name': 'Dr. Budi Dosen, S.T., M.T.',
            'supervisor_nip': '198204152008121002',
            'members': [
                {'name': 'Rian Saputra', 'nim': '2117021045', 'angkatan': '2022'},
                {'name': 'Siti Rahmawati', 'nim': '2217031011', 'angkatan': '2023'}
            ],
            'abstract': 'Ikan teri nasi (Stolephorus commersonii) merupakan komoditas ekspor bernilai tinggi dari pesisir Teluk Lampung namun sangat rentan mengalami kemunduran mutu karena ketiadaan fasilitas cold storage pada kapal nelayan tradisional. Riset ini mengeksplorasi sintesis material edible film aktif berbasis nanokomposit kitosan limbah cangkang udang dan pektin limbah kulit kakao Lampung yang diperkaya senyawa fenolik antimikroba alami untuk memperpanjang daya simpan ikan teri tanpa formalin.',
            'keywords': 'Nanokomposit, Kitosan, Kulit Kakao, Edible Coating, Teri Nasi Lampung',
            'bab1_latar': 'Limbah kulit kakao di Lampung mencapai lebih dari 120.000 ton per tahun dan belum terutilisasi maksimal. Di sisi lain, nelayan tradisional Teluk Betung sering menghadapi masalah pembusukan ikan teri segar dalam 6-8 jam pasca tangkap sehingga kerap tergoda menggunakan pengawet sintetis berbahaya.',
            'bab1_rumusan': 'Bagaimana karakteristik fisikokimia, kekuatan mekanik, dan aktivitas antibakteri nanokomposit kitosan-pektin terhadap bakteri pembusuk Pseudomonas fluorescens pada ikan teri nasi?',
            'bab1_urgensi': 'Menghasilkan inovasi pelapis pangan edible non-toksik berbasis valorisasi dua limbah agro-maritim unggulan Lampung sekaligus meningkatkan higienitas pangan nusantara.',
            'bab2_content': 'Membahas kinetika ekstraksi pektin berbantuan gelombang mikro (MAE), mekanisme ikatan silang elektrostatik antara gugus amina kitosan dan karboksil pektin, serta spektrum FTIR, difraksi sinar-X (XRD), dan morfologi permukaan SEM.',
            'bab3_content': 'Metodologi eksperimental laboratorium: ekstraksi pektin kakao, formulasi larutan pelapis dengan variasi konsentrasi gliserol plasticizer, pengujian Total Volatile Base Nitrogen (TVB-N), Angka Lempeng Total (ALT), dan uji organoleptik hedonik selama 7 hari penyimpanan suhu dingin.',
            'budget_belmawa': 'Rp 9.400.000',
            'rab_1': 'Rp 4.800.000',
            'rab_2': 'Rp 2.500.000',
            'rab_3': 'Rp 1.100.000',
            'rab_4': 'Rp 1.000.000'
        },
        {
            'filename': 'frontend/public/docs/proposal-finsmart-pkm-pm.pdf',
            'title': 'Model Edukasi Finansial Berkelanjutan untuk Ibu Rumah Tangga Pesisir Berbasis Gamifikasi Tabungan Emas',
            'scheme_code': 'PKM-PM',
            'scheme_full': 'Program Kreativitas Mahasiswa Pengabdian Masyarakat',
            'leader': 'Deni Kurniawan',
            'leader_nim': '2111011056',
            'faculty': 'Fakultas Ekonomi dan Bisnis',
            'supervisor_name': 'Dr. Hendri Reviewer, M.Kom.',
            'supervisor_nip': '197903122005011003',
            'members': [
                {'name': 'Fajar Nugroho', 'nim': '2017051012', 'angkatan': '2021'},
                {'name': 'Nabila Zahra', 'nim': '2211021033', 'angkatan': '2023'}
            ],
            'abstract': 'Keluarga nelayan di pesisir Kalianda Lampung Selatan menghadapi ketidakpastian pendapatan musiman akibat cuaca buruk atau paceklik. Program pengabdian masyarakat ini menerapkan media board game interaktif "Keluarga Nelayan Berdaya" dan simulasi tabungan mikro emas digital untuk meningkatkan literasi perencanaan keuangan 35 ibu rumah tangga mitra.',
            'keywords': 'Literasi Keuangan, Gamifikasi, Nelayan Pesisir, Tabungan Emas, PKM-PM',
            'bab1_latar': 'Rendahnya indeks literasi keuangan masyarakat pesisir menyebabkan tingginya jeratan pinjaman rentenir informal saat musim paceklik. Ibu rumah tangga memegang peranan kunci sebagai manajer keuangan keluarga namun minim edukasi instrumen lindung nilai seperti tabungan emas mikro.',
            'bab1_rumusan': 'Bagaimana meningkatkan pemahaman alokasi pos anggaran darurat dan efektivitas tabungan emas digital bagi ibu rumah tangga nelayan melalui pendekatan simulasi permainan edukatif?',
            'bab1_urgensi': 'Menciptakan jaring pengaman finansial keluarga mandiri berbasis komunitas yang tangguh terhadap musim paceklik tangkapan ikan laut.',
            'bab2_content': 'Menganalisis prinsip experiential learning David Kolb, teori tabungan kehati-hatian (precautionary saving), dan model perilaku konsumtif rumah tangga perikanan skala kecil.',
            'bab3_content': 'Metode pengabdian: pre-test pengetahuan keuangan, 4 sesi lokakarya permainan papan interaktif, pendampingan pembukaan tabungan emas berbasis aplikasi resmi diawasi OJK, serta evaluasi rasio tabungan keluarga pasca program.',
            'budget_belmawa': 'Rp 7.800.000',
            'rab_1': 'Rp 3.200.000',
            'rab_2': 'Rp 1.800.000',
            'rab_3': 'Rp 1.600.000',
            'rab_4': 'Rp 1.200.000'
        },
        {
            'filename': 'frontend/public/docs/proposal-telangtea-pkm-k.pdf',
            'title': 'Produksi Teh Celup Daun Kelor & Bunga Telang Kaya Antioksidan Beraroma Melati',
            'scheme_code': 'PKM-K',
            'scheme_full': 'Program Kreativitas Mahasiswa Kewirausahaan',
            'leader': 'Eka Lestari',
            'leader_nim': '2114051019',
            'faculty': 'Fakultas Pertanian',
            'supervisor_name': 'Dr. Budi Dosen, S.T., M.T.',
            'supervisor_nip': '198204152008121002',
            'members': [
                {'name': 'Ahmad Fauzi', 'nim': '2214011045', 'angkatan': '2023'},
                {'name': 'Lina Permata', 'nim': '2214031008', 'angkatan': '2023'}
            ],
            'abstract': 'Peningkatan kesadaran gaya hidup sehat pasca pandemi membuka peluang pasar minuman herbal fungsional. TelangTea Botanica memadukan nutrisi superfood daun kelor (Moringa oleifera) dan warna biru alami bunga telang (Clitoria ternatea) beraroma melati dalam kemasan kantong celup piramida ramah lingkungan.',
            'keywords': 'Teh Celup Herbal, Daun Kelor, Bunga Telang, Antioksidan, Kewirausahaan Mahasiswa',
            'bab1_latar': 'Masyarakat urban semakin menghindari minuman tinggi gula dan beralih ke seduhan herbal alami. Tanaman kelor dan telang melimpah di pekarangan warga Lampung namun belum diolah menjadi produk bernilai tambah tinggi berdaya saing ritel modern.',
            'bab1_rumusan': 'Bagaimana memformulasikan racikan teh celup fungsional dengan organoleptik yang disukai konsumen muda dan membangun saluran pemasaran omnichannel yang menguntungkan?',
            'bab1_urgensi': 'Menghidupkan rantai pasok ekonomi petani lokal pekarangan dan mencetak wirausaha muda mandiri dengan proyeksi BEP dalam 3 bulan produksi.',
            'bab2_content': 'Tinjauan kandungan antosianin, flavonoid, vitamin C, perbandingan metode pengeringan cabinet dryer vs solar dome, serta analisis bauran pemasaran 4P (Product, Price, Place, Promotion).',
            'bab3_content': 'Tahapan produksi: sortasi bahan baku, pengeringan suhu 45C untuk menjaga zat aktif, penggilingan ukuran mesh 20, pengisian kemasan piramida food-grade, sertifikasi P-IRT & Halal, dan kampanye media sosial TikTok & Shopee.',
            'budget_belmawa': 'Rp 6.900.000',
            'rab_1': 'Rp 3.500.000',
            'rab_2': 'Rp 1.400.000',
            'rab_3': 'Rp 1.000.000',
            'rab_4': 'Rp 1.000.000'
        },
        {
            'filename': 'frontend/public/docs/proposal-agrosense-pkm-kc.pdf',
            'title': 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Lampung Berbasis Edge AI',
            'scheme_code': 'PKM-KC',
            'scheme_full': 'Program Kreativitas Mahasiswa Karsa Cipta',
            'leader': 'Nadia Putri Maharani',
            'leader_nim': '2117051001',
            'faculty': 'Fakultas Teknik',
            'supervisor_name': 'Dr. Budi Dosen, S.T., M.T.',
            'supervisor_nip': '198204152008121002',
            'members': [
                {'name': 'Rian Saputra', 'nim': '2117021045', 'angkatan': '2022'},
                {'name': 'Bima Satria', 'nim': '2114121034', 'angkatan': '2022'},
                {'name': 'Clara Anindya', 'nim': '2217021028', 'angkatan': '2023'}
            ],
            'abstract': 'Komoditas lada hitam Lampung (Lampung Black Pepper) mengalami penurunan produksi akibat anomali iklim dan penyakit busuk pangkal batang (Phytophthora capsici). Inovasi AgroSense mengintegrasikan sensor kelembaban tanah multi-kedalaman, stasiun cuaca mikro bertenaga surya, dan kontroler katup irigasi presisi berbasis algoritma Edge AI.',
            'keywords': 'Smart Agriculture, Lada Lampung, IoT, Edge AI, Irigasi Presisi',
            'bab1_latar': 'Perkebunan lada di Tanggamus dan Lampung Timur membutuhkan pengairan terukur karena tanaman lada sensitif terhadap genangan air maupun kekeringan ekstrem. Petani belum memiliki alat pemantau kelembaban mikro real-time.',
            'bab1_rumusan': 'Bagaimana merancang arsitektur perangkat keras IoT berdaya rendah dengan panel surya yang mampu mengatur irigasi tetes otomatis dan mengirimkan telemetri via jaringan GSM/LoRa ke cloud dashboard?',
            'bab1_urgensi': 'Menghemat air hingga 45%, mencegah infeksi jamur busuk akar akibat over-watering, dan menjaga kestabilan produktivitas lada hitam ekspor.',
            'bab2_content': 'Tinjauan sensor soil moisture FDR, mikrokontroler ESP32 tenaga surya dengan manajemen sleep mode ultra-rendah, protokol MQTT, dan model prediksi kebutuhan air tanaman berdasarkan rumus Penman-Monteith.',
            'bab3_content': 'Tahapan rancang bangun perangkat: perakitan sensor node, kalibrasi sensor laboratorium tanah, perancangan box enclosure IP66 tahan cuaca, pembuatan dashboard monitoring web, dan uji coba di kebun percontohan selama 3 bulan.',
            'budget_belmawa': 'Rp 8.950.000',
            'rab_1': 'Rp 4.450.000',
            'rab_2': 'Rp 2.100.000',
            'rab_3': 'Rp 1.300.000',
            'rab_4': 'Rp 1.100.000'
        }
    ]

    for p in proposals:
        create_pkm_pdf(p['filename'], p)
