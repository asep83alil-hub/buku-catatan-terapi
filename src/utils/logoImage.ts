/**
 * Utility untuk menghasilkan Data URL PNG beresolusi tinggi dari
 * Logo Resmi Pelangi Lazuardi (versi horizontal).
 * Digunakan untuk disematkan secara presisi dan tajam pada ekspor dokumen PDF (jsPDF).
 */

let cachedLogoDataUrl: string | null = null;

export function getPelangiHorizontalLogoDataUrl(): string {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }

  if (typeof document === 'undefined') {
    return '';
  }

  try {
    const canvas = document.createElement('canvas');
    // Rasio aspek 2.6 : 1 (1040 x 400 px) - Kualitas Retina / Cetak Tinggi
    const width = 1040;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, width, height);

    // ==========================================
    // 1. PERISAI (SHIELD EMBLEM)
    // ==========================================
    // Garis luar perisai biru #214F9B, isi putih
    ctx.save();

    // Jalur Perisai
    ctx.beginPath();
    ctx.moveTo(170, 50);
    ctx.bezierCurveTo(215, 50, 290, 42, 308, 64);
    ctx.bezierCurveTo(314, 88, 314, 210, 314, 232);
    ctx.bezierCurveTo(314, 304, 244, 342, 170, 372);
    ctx.bezierCurveTo(96, 342, 26, 304, 26, 232);
    ctx.bezierCurveTo(26, 210, 26, 88, 32, 64);
    ctx.bezierCurveTo(50, 42, 125, 50, 170, 50);
    ctx.closePath();

    // Isi Perisai Putih
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Stroke Perisai Biru Lazuardi
    ctx.strokeStyle = '#214F9B';
    ctx.lineWidth = 19;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // ==========================================
    // 2. LENGKUNGAN PELANGI (3 WARNA)
    // ==========================================
    const arcCenterX = 170;
    const arcCenterY = 196;

    // Lengkungan 1: Merah (Luar)
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, 105, Math.PI, 0, false);
    ctx.strokeStyle = '#E32626';
    ctx.lineWidth = 22;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Lengkungan 2: Kuning / Oranye (Tengah)
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, 83, Math.PI, 0, false);
    ctx.strokeStyle = '#F58220';
    ctx.lineWidth = 21;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Lengkungan 3: Hijau (Dalam)
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, 62, Math.PI, 0, false);
    ctx.strokeStyle = '#0FA958';
    ctx.lineWidth = 20;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // ==========================================
    // 3. FIGUR ANANDA & BUKU TERBUKA (BIRU)
    // ==========================================
    ctx.fillStyle = '#214F9B';

    // Kepala (Lingkaran)
    ctx.beginPath();
    ctx.arc(arcCenterX, 214, 28, 0, Math.PI * 2);
    ctx.fill();

    // Sayap / Halaman Buku Kiri
    ctx.beginPath();
    ctx.moveTo(arcCenterX, 342);
    ctx.bezierCurveTo(166, 280, 110, 246, 75, 238);
    ctx.bezierCurveTo(75, 276, 95, 324, arcCenterX, 342);
    ctx.closePath();
    ctx.fill();

    // Sayap / Halaman Buku Kanan
    ctx.beginPath();
    ctx.moveTo(arcCenterX, 342);
    ctx.bezierCurveTo(174, 280, 230, 246, 265, 238);
    ctx.bezierCurveTo(265, 276, 245, 324, arcCenterX, 342);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // ==========================================
    // 4. TIPOGRAFI "Pelangi Lazuardi" (SERIF BOLD)
    // ==========================================
    ctx.save();
    ctx.fillStyle = '#28292E';
    ctx.textBaseline = 'alphabetic';

    // Font serif yang kokoh dan presisi sesuai identitas resmi
    ctx.font = 'bold 142px "Georgia", "Merriweather", "Times New Roman", serif';

    const textStartX = 365;
    ctx.fillText('Pelangi', textStartX, 185);
    ctx.fillText('Lazuardi', textStartX, 348);

    ctx.restore();

    cachedLogoDataUrl = canvas.toDataURL('image/png');
    return cachedLogoDataUrl;
  } catch (err) {
    console.error('Failed to generate Pelangi logo data URL', err);
    return '';
  }
}
