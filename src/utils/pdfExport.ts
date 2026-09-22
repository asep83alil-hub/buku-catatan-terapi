import { jsPDF } from 'jspdf';
import { Student, TherapySession } from '../types';
import { formatDisplayDate } from './excelParser';
import { getPelangiHorizontalLogoDataUrl } from './logoImage';

interface ExportPDFOptions {
  student: Student;
  sessions: TherapySession[];
  periodTitle?: string;
  clinicName?: string;
  singleSessionId?: string;
}

// Color palettes for notebook theme
const THEME = {
  spineDark: [15, 76, 92] as [number, number, number], // #0f4c5c Deep Teal
  spineLight: [19, 78, 74] as [number, number, number], // #134e4a Darker Teal
  spineRingOuter: [71, 85, 105] as [number, number, number], // #475569
  spineRingHole: [248, 250, 252] as [number, number, number], // #f8fafc
  headerBg: [240, 253, 250] as [number, number, number], // soft mint
  borderTeal: [13, 148, 136] as [number, number, number], // teal-600
  textDark: [15, 23, 42] as [number, number, number], // slate-900
  textMuted: [100, 116, 139] as [number, number, number], // slate-500
  textSubtle: [148, 163, 184] as [number, number, number], // slate-400
  cardBg: [255, 255, 255] as [number, number, number],

  // Section 1: Progress (Warm Amber Parchment)
  sec1Bg: [255, 251, 235] as [number, number, number], // amber-50
  sec1Border: [252, 211, 77] as [number, number, number], // amber-300
  sec1Text: [146, 64, 14] as [number, number, number], // amber-800
  sec1Accent: [217, 119, 6] as [number, number, number], // amber-600
  sec1Rule: [254, 243, 199] as [number, number, number], // amber-100

  // Section 2: Intervention (Sky Blue Note)
  sec2Bg: [240, 249, 255] as [number, number, number], // sky-50
  sec2Border: [186, 230, 253] as [number, number, number], // sky-200
  sec2Text: [7, 89, 133] as [number, number, number], // sky-800
  sec2Accent: [2, 132, 199] as [number, number, number], // sky-600
  sec2Rule: [224, 242, 254] as [number, number, number], // sky-100

  // Section 3: Child Response (Emerald Green Note)
  sec3Bg: [240, 253, 244] as [number, number, number], // emerald-50
  sec3Border: [187, 247, 208] as [number, number, number], // emerald-200
  sec3Text: [22, 101, 52] as [number, number, number], // emerald-800
  sec3Accent: [22, 163, 74] as [number, number, number], // emerald-600
  sec3Rule: [220, 252, 231] as [number, number, number], // emerald-100
};

// Helper for therapy type colors
function getTherapyTypeTheme(type: string) {
  const norm = (type || '').toLowerCase();
  if (norm.includes('wicara')) {
    return {
      bg: [224, 242, 254] as [number, number, number],
      text: [3, 105, 161] as [number, number, number],
      border: [186, 230, 253] as [number, number, number],
      name: 'Terapi Wicara',
    };
  }
  if (norm.includes('okupasi') || norm.includes('si')) {
    return {
      bg: [220, 252, 231] as [number, number, number],
      text: [21, 128, 61] as [number, number, number],
      border: [187, 247, 208] as [number, number, number],
      name: 'Okupasi Terapi / SI',
    };
  }
  if (norm.includes('fisio')) {
    return {
      bg: [243, 232, 255] as [number, number, number],
      text: [107, 33, 168] as [number, number, number],
      border: [216, 180, 254] as [number, number, number],
      name: 'Fisioterapi',
    };
  }
  return {
    bg: [241, 245, 249] as [number, number, number],
    text: [71, 85, 105] as [number, number, number],
    border: [203, 213, 225] as [number, number, number],
    name: type || 'Terapi',
  };
}

export function generateStudentBookPDF({
  student,
  sessions,
  periodTitle,
  clinicName = 'PUSAT TERAPI TUMBUH KEMBANG ANAK',
  singleSessionId,
}: ExportPDFOptions): jsPDF {
  // A4 Portrait dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Siapkan Data URL Logo Pelangi Lazuardi Horizontal beresolusi tinggi
  const horizontalLogoDataUrl = getPelangiHorizontalLogoDataUrl();

  // Left notebook binding margin: 22mm to give space for rings + clear area
  const marginX = 22;
  const marginRight = 14;
  const marginTop = 18;
  const marginBottom = 18;
  const contentWidth = pageWidth - marginX - marginRight; // 174mm

  let currentY = marginTop;

  // Filter sessions if singleSessionId is requested
  const targetSessions = singleSessionId
    ? sessions.filter((s) => s.session_id === singleSessionId)
    : [...sessions];

  const totalSessionsCount = targetSessions.length;

  // Determine period text
  let calculatedPeriod = periodTitle;
  if (!calculatedPeriod && targetSessions.length > 0) {
    const dates = targetSessions.map((s) => s.date).sort();
    const firstDate = formatDisplayDate(dates[0]);
    const lastDate = formatDisplayDate(dates[dates.length - 1]);
    calculatedPeriod = firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;
  } else if (!calculatedPeriod) {
    calculatedPeriod = 'Semua Periode';
  }

  // Draw authentic notebook spine & spiral binder rings on the left of each page
  const renderNotebookSpine = () => {
    // 1. Dark Teal Spine Strip
    doc.setFillColor(THEME.spineDark[0], THEME.spineDark[1], THEME.spineDark[2]);
    doc.rect(0, 0, 10, pageHeight, 'F');

    // 2. Spine highlight fold line (Gold accent)
    doc.setFillColor(217, 119, 6);
    doc.rect(10, 0, 1.2, pageHeight, 'F');

    // 3. Perforation dashed stitch line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(14, 0, 14, pageHeight);
    doc.setLineDashPattern([], 0); // reset dash

    // 4. Spiral Binder Ring Holes
    const ringSpacing = 16;
    const startRingY = 22;
    const ringCount = Math.floor((pageHeight - 35) / ringSpacing);

    for (let i = 0; i < ringCount; i++) {
      const ringY = startRingY + i * ringSpacing;

      // Metallic ring loop
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(1.2);
      doc.line(4, ringY, 13.5, ringY);

      // Hole ring outer grommet
      doc.setFillColor(THEME.spineRingOuter[0], THEME.spineRingOuter[1], THEME.spineRingOuter[2]);
      doc.circle(7, ringY, 2.2, 'F');

      // Inner hole
      doc.setFillColor(THEME.spineRingHole[0], THEME.spineRingHole[1], THEME.spineRingHole[2]);
      doc.circle(7, ringY, 1.4, 'F');
    }
  };

  // Draw Running Header on Page 2+
  const renderHeader = (pageNumber: number) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX - 2, 0, contentWidth + marginRight, 15, 'F');

    // Logo Resmi Pelangi Lazuardi (Horizontal) di sudut kanan running header
    if (horizontalLogoDataUrl) {
      try {
        const hLogoW = 26;
        const hLogoH = 26 / 2.6; // 10mm
        doc.addImage(horizontalLogoDataUrl, 'PNG', pageWidth - marginRight - hLogoW - 2, 2.5, hLogoW, hLogoH);
      } catch {
        // Abaikan jika tidak tersedia
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(THEME.textDark[0], THEME.textDark[1], THEME.textDark[2]);
    doc.text(clinicName.toUpperCase(), marginX, 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(THEME.textMuted[0], THEME.textMuted[1], THEME.textMuted[2]);
    const headerTitle = student.nickname
      ? `Buku Terapi: ${student.student_name} (${student.nickname}) • ID: ${student.custom_id || student.student_id}`
      : `Buku Terapi: ${student.student_name} • ID: ${student.custom_id || student.student_id}`;
    doc.text(headerTitle, marginX, 12);

    // Decorative line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, 14.5, pageWidth - marginRight, 14.5);
  };

  // Draw Running Footer
  const renderFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(marginX, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(THEME.borderTeal[0], THEME.borderTeal[1], THEME.borderTeal[2]);
    doc.text('BUKU CATATAN TERAPI SISWA • PELANGI LAZUARDI', marginX, pageHeight - 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(THEME.textMuted[0], THEME.textMuted[1], THEME.textMuted[2]);
    doc.text('•  Pusat Terapi Tumbuh Kembang Anak  •  Rekam Terverifikasi', marginX + 68, pageHeight - 7);

    doc.setFont('helvetica', 'bold');
    doc.text(`Halaman ${pageNumber} dari ${totalPages}`, pageWidth - marginRight, pageHeight - 7, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: ELEGANT NOTEBOOK COVER & PROFILE
  // ==========================================
  currentY = 20;

  // Master Clinic Header Banner
  const bannerHeight = 25;
  doc.setFillColor(15, 76, 92); // Deep Teal Header Bar
  doc.roundedRect(marginX, currentY, contentWidth, bannerHeight, 2, 2, 'F');

  // Decorative header corner notch (Amber Gold)
  doc.setFillColor(217, 119, 6);
  doc.rect(marginX, currentY, 3.5, bannerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(clinicName.toUpperCase(), marginX + 7, currentY + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('BUKU CATATAN TERAPI SISWA', marginX + 7, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(204, 251, 241);
  doc.text('Pelangi Lazuardi • Catatan Harian Intervensi & Lembar Progres Perkembangan Ananda', marginX + 7, currentY + 21);

  // Logo Pelangi Lazuardi Badge in PDF Header Banner (Right-aligned, matching horizontal logo)
  const logoBoxWidth = 52;
  const logoBoxHeight = 20;
  const logoBoxX = marginX + contentWidth - logoBoxWidth - 2.5;
  const logoBoxY = currentY + 2.5;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(204, 251, 241);
  doc.setLineWidth(0.3);
  doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 1.5, 1.5, 'D');

  if (horizontalLogoDataUrl) {
    try {
      const imgW = 48;
      const imgH = 48 / 2.6; // ~18.4mm
      const imgX = logoBoxX + (logoBoxWidth - imgW) / 2;
      const imgY = logoBoxY + (logoBoxHeight - imgH) / 2;
      doc.addImage(horizontalLogoDataUrl, 'PNG', imgX, imgY, imgW, imgH);
    } catch {
      // Fallback
    }
  } else {
    // Vector fallback
    const shieldX = logoBoxX + 8;
    const shieldY = logoBoxY + 10;
    doc.setDrawColor(33, 79, 155);
    doc.setLineWidth(0.6);
    doc.circle(shieldX, shieldY, 5, 'D');
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 41, 46);
    doc.text('Pelangi', logoBoxX + 16, logoBoxY + 8);
    doc.text('Lazuardi', logoBoxX + 16, logoBoxY + 15);
  }

  currentY += 28;

  // Student Identity Box (Model Kartu Profil Buku Catatan)
  const profileBoxHeight = 36;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, currentY, contentWidth, profileBoxHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, currentY, contentWidth, profileBoxHeight, 2, 2, 'D');

  // Left accent bar on identity box
  doc.setFillColor(13, 148, 136);
  doc.roundedRect(marginX, currentY, 3, profileBoxHeight, 1, 1, 'F');

  // Top sub-badge
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(marginX + 7, currentY + 4, 38, 5.5, 1, 1, 'F');
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(marginX + 7, currentY + 4, 38, 5.5, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 118, 110);
  doc.text('IDENTITAS SISWA & BUKU', marginX + 9, currentY + 8);

  // Student Name (Autoscale font if long name to ensure it stays strictly in left column)
  const rawStudentName = student.student_name.toUpperCase();
  doc.setFont('helvetica', 'bold');
  let nameFontSize = 12;
  doc.setFontSize(nameFontSize);
  while (nameFontSize > 8.5 && doc.getTextWidth(rawStudentName) > 78) {
    nameFontSize -= 0.5;
    doc.setFontSize(nameFontSize);
  }
  doc.setTextColor(15, 23, 42);
  doc.text(rawStudentName, marginX + 7, currentY + 17);

  // Nickname Chip if present
  let currentLeftInfoY = currentY + 23;
  if (student.nickname) {
    const nickText = `Panggilan: "${student.nickname}"`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const chipWidth = doc.getTextWidth(nickText) + 6;
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(marginX + 7, currentY + 19, chipWidth, 5, 1, 1, 'F');
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(marginX + 7, currentY + 19, chipWidth, 5, 1, 1, 'D');
    doc.setTextColor(4, 120, 87);
    doc.text(nickText, marginX + 10, currentY + 22.8);
    currentLeftInfoY = currentY + 29;
  }

  // ID Siswa
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Nomor Rekam/ID Siswa: ', marginX + 7, currentLeftInfoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${student.custom_id || student.student_id}`, marginX + 41, currentLeftInfoY);

  // Vertical Separator between Left and Right Profile info
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX + 88, currentY + 5, marginX + 88, currentY + profileBoxHeight - 5);

  // Right Column: Summary Stats & Status (Total Sesi Tercatat dihilangkan sesuai permintaan user)
  const col2X = marginX + 94;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Periode Catatan:', col2X, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(calculatedPeriod, col2X + 26, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Status Catatan:', col2X, currentY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61);
  doc.text('Rekam Resmi Pelangi Lazuardi Terverifikasi', col2X + 24, currentY + 21);

  if (student.guardian_name) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Orang Tua / Wali: ${student.guardian_name}`, col2X, currentY + 29);
  }

  currentY += profileBoxHeight + 8;

  // Divider with Notebook Title
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);

  doc.setFillColor(255, 255, 255);
  doc.rect(marginX + 20, currentY - 2.5, 62, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('LEMBARAN CATATAN HARIAN TERAPI', marginX + 23, currentY + 1);

  currentY += 7;

  // Empty state if no sessions
  if (targetSessions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada catatan sesi terapi yang tersimpan untuk siswa ini.', marginX + 4, currentY + 8);
    currentY += 15;
  }

  // ==========================================
  // RENDER NOTEBOOK SESSION CARDS
  // ==========================================
  targetSessions.forEach((session, idx) => {
    const therapyStyle = getTherapyTypeTheme(session.therapy_type);
    const formattedDate = formatDisplayDate(session.date);

    // CRITICAL: Set font family and font size BEFORE calling splitTextToSize
    // so that word-wrapping measurement matches exact rendering dimensions!
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Box dimensions:
    // Outer card width: contentWidth (174mm)
    // Section box width: secW = contentWidth - 8 = 166mm
    // Inside section: left padding 6mm, right padding 6mm
    // Safe text width: 166 - 12 = 154mm (we use 150mm for extra safe buffer)
    const textMaxWidth = 150;
    const progressLines = doc.splitTextToSize(session.session_progress || '-', textMaxWidth);
    const interventionLines = doc.splitTextToSize(session.intervention_program || '-', textMaxWidth);
    const responseLines = doc.splitTextToSize(session.child_response || '-', textMaxWidth);

    // Dynamic section heights:
    // Top padding + title: 8.5mm
    // Line height: 4.4mm
    // Bottom padding: 4.5mm
    const lineHeight = 4.4;
    const h1 = 8.5 + progressLines.length * lineHeight + 4.5;
    const h2 = 8.5 + interventionLines.length * lineHeight + 4.5;
    const h3 = 8.5 + responseLines.length * lineHeight + 4.5;
    const stampHeight = 21;
    const sessionHeaderHeight = 15;
    const sectionGaps = 3.5 * 3; // between the 3 sections
    const totalCardHeight = sessionHeaderHeight + h1 + h2 + h3 + sectionGaps + stampHeight + 6;

    // Check if the entire session card fits on the current page
    const availableSpace = pageHeight - marginBottom - currentY;
    if (totalCardHeight > availableSpace && currentY > marginTop + 10) {
      doc.addPage();
      currentY = marginTop;
    }

    const cardTopY = currentY;

    // 1. Session Card Outer Container Frame (Notebook Entry Border)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginX, currentY, contentWidth, totalCardHeight, 2.5, 2.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, currentY, contentWidth, totalCardHeight, 2.5, 2.5, 'D');

    // 2. Session Header Ribbon Bar
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(marginX, currentY, contentWidth, sessionHeaderHeight, 2.5, 2.5, 'F');
    // Square off bottom corners of header
    doc.rect(marginX, currentY + sessionHeaderHeight - 2, contentWidth, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, currentY + sessionHeaderHeight, marginX + contentWidth, currentY + sessionHeaderHeight);

    // Left Ribbon / Bookmark Badge
    doc.setFillColor(15, 76, 92);
    doc.roundedRect(marginX + 3.5, currentY + 3, 22, 9, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`SESI #${idx + 1}`, marginX + 6.5, currentY + 9);

    // Date & Time
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formattedDate, marginX + 29, currentY + 9.2);

    // Therapist Name (Strictly bounded so it never collides with badge)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Terapis: ', marginX + 86, currentY + 9.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const therapistNameTruncated = doc.splitTextToSize(session.therapist_name || '-', 42)[0];
    doc.text(therapistNameTruncated, marginX + 98, currentY + 9.2);

    // Therapy Type Pill Badge (Anchored on the right)
    const pillText = session.therapy_type || 'Terapi';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const pillWidth = Math.max(doc.getTextWidth(pillText) + 8, 28);
    const pillX = marginX + contentWidth - pillWidth - 3.5;
    doc.setFillColor(therapyStyle.bg[0], therapyStyle.bg[1], therapyStyle.bg[2]);
    doc.roundedRect(pillX, currentY + 3, pillWidth, 9, 1.5, 1.5, 'F');
    doc.setDrawColor(therapyStyle.border[0], therapyStyle.border[1], therapyStyle.border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(pillX, currentY + 3, pillWidth, 9, 1.5, 1.5, 'D');

    doc.setTextColor(therapyStyle.text[0], therapyStyle.text[1], therapyStyle.text[2]);
    doc.text(pillText, pillX + pillWidth / 2, currentY + 9, { align: 'center' });

    currentY += sessionHeaderHeight + 3.5;

    // Helper for rendering notebook section column with ruled lines
    const renderNoteSection = (
      secTitle: string,
      lines: string[],
      height: number,
      bg: [number, number, number],
      border: [number, number, number],
      accent: [number, number, number],
      titleColor: [number, number, number],
      ruleColor: [number, number, number]
    ) => {
      const secX = marginX + 4;
      const secW = contentWidth - 8; // 166mm

      // 1. Section Background Box
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.roundedRect(secX, currentY, secW, height, 1.5, 1.5, 'F');
      doc.setDrawColor(border[0], border[1], border[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(secX, currentY, secW, height, 1.5, 1.5, 'D');

      // 2. Left Vertical Accent Stripe (Notebook Margin Indicator)
      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.roundedRect(secX, currentY, 2.5, height, 0.8, 0.8, 'F');

      // 3. Section Header Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
      doc.text(secTitle.toUpperCase(), secX + 5.5, currentY + 5.2);

      // 4. Subtle Ruled Notebook Lines & Text inside Column
      let textY = currentY + 9.5;
      lines.forEach((line) => {
        // Soft ruled horizontal guideline under each line of text
        doc.setDrawColor(ruleColor[0], ruleColor[1], ruleColor[2]);
        doc.setLineWidth(0.2);
        doc.line(secX + 4, textY + 1.2, secX + secW - 4, textY + 1.2);

        // Body text: stays strictly within secX + 5.5 and secX + 5.5 + 150 = secX + 155.5 (well inside 166mm)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(line, secX + 5.5, textY);

        textY += lineHeight;
      });

      currentY += height + 3;
    };

    // 1. LEMBAR PROGRES SESI (Amber Parchment Note)
    renderNoteSection(
      '1. Lembar Progres Sesi (Kondisi Awal & Perkembangan)',
      progressLines,
      h1,
      THEME.sec1Bg,
      THEME.sec1Border,
      THEME.sec1Accent,
      THEME.sec1Text,
      THEME.sec1Rule
    );

    // 2. PROGRAM INTERVENSI (Sky Blue Note)
    renderNoteSection(
      '2. Program Intervensi & Stimulasi',
      interventionLines,
      h2,
      THEME.sec2Bg,
      THEME.sec2Border,
      THEME.sec2Accent,
      THEME.sec2Text,
      THEME.sec2Rule
    );

    // 3. RESPON ANANDA TERHADAP INTERVENSI (Emerald Green Note)
    renderNoteSection(
      '3. Respon Ananda Terhadap Intervensi',
      responseLines,
      h3,
      THEME.sec3Bg,
      THEME.sec3Border,
      THEME.sec3Accent,
      THEME.sec3Text,
      THEME.sec3Rule
    );

    // 4. PARAF & VERIFIKASI TERAPIS (Authentic Clinical Stamp Box)
    const stampBoxW = 75;
    const stampBoxH = 18;
    const stampBoxX = marginX + contentWidth - stampBoxW - 4;
    const stampBoxY = currentY + 0.5;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(stampBoxX, stampBoxY, stampBoxW, stampBoxH, 1.5, 1.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(stampBoxX, stampBoxY, stampBoxW, stampBoxH, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DIVERIFIKASI OLEH TERAPIS:', stampBoxX + 4, stampBoxY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(session.therapist_name || '-', stampBoxX + 4, stampBoxY + 9);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Paraf / Tanda Tangan:', stampBoxX + 4, stampBoxY + 14);

    // Signature dotted line
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(stampBoxX + 32, stampBoxY + 14.5, stampBoxX + stampBoxW - 4, stampBoxY + 14.5);
    doc.setLineDashPattern([], 0); // reset dash

    currentY = cardTopY + totalCardHeight + 6;
  });

  // ==========================================
  // POST-PROCESSING: RUNNING HEADER, FOOTER, AND BINDER
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Draw notebook spiral binder on every single page
    renderNotebookSpine();

    // On page 2+, draw running header
    if (p > 1) {
      renderHeader(p);
    }

    // Running footer on all pages
    renderFooter(p, totalPages);
  }

  return doc;
}

// Download PDF helper
export function downloadStudentBookPDF(options: ExportPDFOptions, fileName?: string) {
  const doc = generateStudentBookPDF(options);
  const cleanName = options.student.student_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const actualFileName = fileName || `Buku_Catatan_Terapi_${cleanName}.pdf`;
  doc.save(actualFileName);
}
