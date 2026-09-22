import * as XLSX from 'xlsx';
import { ParsedSpreadsheetRow, SpreadsheetRowRaw } from '../types';
import { generateSessionHash } from './storage';

// Helper to normalize column names for matching
function normalizeHeader(header: string): string {
  return (header || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Extract full name and nickname from e.g. "Adnan Lutfan Malik (Adnan)"
export function parseStudentName(rawName: string): {
  fullName: string;
  nickname?: string;
  original: string;
} {
  const original = (rawName || '').trim();
  const match = original.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return {
      fullName: match[1].trim(),
      nickname: match[2].trim(),
      original,
    };
  }
  return {
    fullName: original,
    original,
  };
}

// Convert Excel serial date or various timestamp formats (e.g. "9/16/2026 9:39:18") to { dateStr: YYYY-MM-DD, timeStr: HH:MM, raw: string }
export function parseTimestampOrDate(value: any): {
  dateStr: string;
  timeStr?: string;
} {
  if (value === null || value === undefined || value === '') {
    return { dateStr: '' };
  }

  // Excel serial number (e.g., 46283)
  if (typeof value === 'number') {
    try {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        const y = date.y;
        const m = String(date.m).padStart(2, '0');
        const d = String(date.d).padStart(2, '0');
        let timeStr: string | undefined = undefined;
        if (date.H !== undefined && date.M !== undefined) {
          timeStr = `${String(date.H).padStart(2, '0')}:${String(date.M).padStart(2, '0')}`;
        }
        return { dateStr: `${y}-${m}-${d}`, timeStr };
      }
    } catch {
      // fallback below
    }
  }

  const str = String(value).trim();

  // Pattern: "9/16/2026 9:39:18" or "16/09/2026 09:39:18" or "2026-09-16 09:39:18"
  const [datePart, timePart] = str.split(/\s+/);

  let timeStr: string | undefined = undefined;
  if (timePart) {
    const tMatch = timePart.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (tMatch) {
      timeStr = `${String(tMatch[1]).padStart(2, '0')}:${tMatch[2]}`;
    }
  }

  if (datePart) {
    // Pattern YYYY-MM-DD
    const ymdMatch = datePart.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = String(ymdMatch[2]).padStart(2, '0');
      const day = String(ymdMatch[3]).padStart(2, '0');
      return { dateStr: `${year}-${month}-${day}`, timeStr };
    }

    // Pattern M/D/YYYY or D/M/YYYY (e.g. 9/16/2026)
    const slashMatch = datePart.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
      const num1 = parseInt(slashMatch[1], 10);
      const num2 = parseInt(slashMatch[2], 10);
      const year = slashMatch[3];

      let month: string;
      let day: string;

      if (num1 > 12) {
        // Must be DD/MM/YYYY (e.g. 18/09/2026)
        day = String(num1).padStart(2, '0');
        month = String(num2).padStart(2, '0');
      } else if (num2 > 12) {
        // Must be MM/DD/YYYY (e.g. 9/16/2026 from Google Forms)
        month = String(num1).padStart(2, '0');
        day = String(num2).padStart(2, '0');
      } else {
        // Both <= 12. If Google Form default (MM/DD/YYYY) vs DD/MM/YYYY
        // Default to MM/DD/YYYY if coming with timestamp, else DD/MM/YYYY
        if (timePart) {
          month = String(num1).padStart(2, '0');
          day = String(num2).padStart(2, '0');
        } else {
          day = String(num1).padStart(2, '0');
          month = String(num2).padStart(2, '0');
        }
      }

      return { dateStr: `${year}-${month}-${day}`, timeStr };
    }
  }

  return { dateStr: str, timeStr };
}

// Convert Excel serial date or various string date formats to normalized string (YYYY-MM-DD)
export function normalizeDate(value: any): string {
  const res = parseTimestampOrDate(value);
  return res.dateStr;
}

export function formatDisplayDate(dateStr: string, _timeStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthsIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${monthsIndo[monthIndex]} ${year}`;
      }
    }
  } catch {
    // fallback
  }
  return dateStr;
}

// Parse uploaded or fetched spreadsheet buffer (XLSX, XLS, CSV)
export function parseSpreadsheetArrayBuffer(arrayBuffer: ArrayBuffer): {
  rows: ParsedSpreadsheetRow[];
  headers: string[];
  detectedColumns: { [standardKey: string]: string };
  rawRowCount: number;
} {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File spreadsheet tidak memiliki sheet data.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: SpreadsheetRowRaw[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: true,
  });

  if (!rawData || rawData.length === 0) {
    throw new Error('Sheet spreadsheet kosong, tidak ada baris data yang terbaca.');
  }

  // Inspect headers in first row or keys
  const firstRow = rawData[0];
  const headers = Object.keys(firstRow);

  // Map columns flexibly
  const detectedColumns: { [standardKey: string]: string } = {};

  const columnAliases: { [standardKey: string]: string[] } = {
    date: ['timestamp', 'tanggal', 'tgl', 'date', 'waktu', 'tanggalsesi'],
    studentName: ['namasiswa', 'siswa', 'studentname', 'namaanak', 'ananda', 'nama'],
    therapistName: ['namaterapis', 'terapis', 'therapistname', 'therapist', 'petugas'],
    therapyType: ['jenisterapi', 'terapi', 'therapytype', 'jenis', 'bidangterapi'],
    sessionSchedule: [
      'sesi',
      'jadwal',
      'sesiterapi',
      'sesike',
      'jam',
      'jamsesi',
      'waktusesi',
      'schedule',
      'session',
      'pukul',
    ],
    sessionProgress: [
      'lembarprogressesi',
      'lembarprogres',
      'progres',
      'progressesi',
      'lembarprogresesi',
      'progresesi',
      'catatanprogres',
    ],
    interventionProgram: [
      'programintervensi',
      'intervensi',
      'program',
      'rencanaevaluasi',
      'kegiatanintervensi',
    ],
    childResponse: [
      'responanandaterhadapintervensi',
      'responananda',
      'responterhadapintervensi',
      'responanak',
      'respon',
      'reaksi',
    ],
  };

  headers.forEach((header) => {
    const norm = normalizeHeader(header);
    for (const [key, aliases] of Object.entries(columnAliases)) {
      if (!detectedColumns[key] && aliases.some((a) => norm.includes(a) || a.includes(norm))) {
        detectedColumns[key] = header;
      }
    }
  });

  const parsedRows: ParsedSpreadsheetRow[] = [];

  rawData.forEach((row, index) => {
    // Exact column values or fallback
    const rawDate = detectedColumns.date
      ? row[detectedColumns.date]
      : row['Timestamp'] || row['timestamp'] || row['Tanggal'] || row['tanggal'] || '';
    const rawStudent = detectedColumns.studentName
      ? row[detectedColumns.studentName]
      : row['NAMA SISWA'] || row['Nama Siswa'] || '';
    const rawTherapist = detectedColumns.therapistName
      ? row[detectedColumns.therapistName]
      : row['NAMA TERAPIS'] || row['Nama Terapis'] || '';
    const rawTherapy = detectedColumns.therapyType
      ? row[detectedColumns.therapyType]
      : row['JENIS TERAPI'] || row['Jenis Terapi'] || '';
    const rawSession = detectedColumns.sessionSchedule
      ? row[detectedColumns.sessionSchedule]
      : row['Sesi'] || row['sesi'] || row['Jadwal'] || row['jadwal'] || row['Jam'] || '';
    const rawProgress = detectedColumns.sessionProgress
      ? row[detectedColumns.sessionProgress]
      : row['Lembar Progres Sesi'] || row['Lembar Progres'] || '';
    const rawIntervention = detectedColumns.interventionProgram
      ? row[detectedColumns.interventionProgram]
      : row['Program Intervensi'] || '';
    const rawResponse = detectedColumns.childResponse
      ? row[detectedColumns.childResponse]
      : row['Respon Ananda Terhadap Intervensi'] || row['Respon Ananda'] || '';

    const parsedDateObj = parseTimestampOrDate(rawDate);
    const dateStr = parsedDateObj.dateStr;
    const timeStr = parsedDateObj.timeStr;
    const rawTimestamp = String(rawDate || '').trim();
    const sessionSchedule = String(rawSession || '').trim() || (timeStr ? `Pukul ${timeStr}` : '');

    const studentName = String(rawStudent || '').trim();
    const therapistName = String(rawTherapist || '').trim();
    const therapyType = String(rawTherapy || '').trim();
    const sessionProgress = String(rawProgress || '').trim();
    const interventionProgram = String(rawIntervention || '').trim();
    const childResponse = String(rawResponse || '').trim();

    // Check if entire row is blank
    if (!studentName && !dateStr && !therapistName && !therapyType && !sessionProgress) {
      return; // skip completely blank row
    }

    const validationErrors: string[] = [];
    if (!studentName) {
      validationErrors.push('NAMA SISWA kosong');
    }
    if (!dateStr) {
      validationErrors.push('Tanggal / Timestamp kosong');
    }
    if (!therapistName) {
      validationErrors.push('NAMA TERAPIS kosong');
    }
    if (!therapyType) {
      validationErrors.push('JENIS TERAPI kosong');
    }
    if (!sessionProgress) {
      validationErrors.push('Lembar Progres Sesi belum diisi');
    }

    parsedRows.push({
      rowIndex: index + 2, // 1-based, accounting for header row
      date: dateStr,
      timeStr,
      sessionSchedule,
      rawTimestamp,
      studentName,
      therapistName,
      therapyType,
      sessionProgress,
      interventionProgram,
      childResponse,
      isValid: validationErrors.length === 0,
      validationErrors,
    });
  });

  return {
    rows: parsedRows,
    headers,
    detectedColumns,
    rawRowCount: rawData.length,
  };
}

// Parse uploaded file (XLSX, XLS, CSV)
export async function parseSpreadsheetFile(file: File): Promise<{
  rows: ParsedSpreadsheetRow[];
  headers: string[];
  detectedColumns: { [standardKey: string]: string };
  rawRowCount: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  return parseSpreadsheetArrayBuffer(arrayBuffer);
}

// Helper to convert Base64 string to ArrayBuffer safely
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Comprehensive Google Resource URL Parser
export interface ParsedGoogleResource {
  type: 'published_sheet' | 'standard_sheet' | 'drive_file' | 'drive_folder' | 'raw_id' | 'unknown';
  id: string | null;
  pubId: string | null;
  gid: string | null;
}

export function parseGoogleResourceUrl(input: string): ParsedGoogleResource {
  const trimmed = (input || '').trim();

  let gid: string | null = null;
  const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  if (/\/folders\/([a-zA-Z0-9-_]+)/.test(trimmed)) {
    return { type: 'drive_folder', id: null, pubId: null, gid: null };
  }

  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) {
    return { type: 'published_sheet', id: null, pubId: pubMatch[1], gid };
  }

  const sheetMatch = trimmed.match(/\/spreadsheets\/d\/(?!e\/)([a-zA-Z0-9-_]+)/);
  if (sheetMatch) {
    return { type: 'standard_sheet', id: sheetMatch[1], pubId: null, gid };
  }

  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (driveFileMatch) {
    return { type: 'drive_file', id: driveFileMatch[1], pubId: null, gid };
  }

  const driveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (driveIdMatch && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
    return { type: 'drive_file', id: driveIdMatch[1], pubId: null, gid };
  }

  if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
    return { type: 'raw_id', id: trimmed, pubId: null, gid };
  }

  return { type: 'unknown', id: null, pubId: null, gid };
}

// Helper to fetch Google Spreadsheet (Direct Browser CORS fetch + Backend proxy fallback)
export async function fetchGoogleSpreadsheetFromUrl(url: string, sheetGid?: string): Promise<{
  arrayBuffer: ArrayBuffer;
  fileName: string;
  spreadsheetId: string;
}> {
  const parsed = parseGoogleResourceUrl(url);
  const finalGid = sheetGid || parsed.gid;

  if (parsed.type === 'drive_folder') {
    throw new Error(
      'Tautan yang Anda masukkan adalah folder Google Drive, bukan spreadsheet. Silakan buka file spreadsheet di dalam folder, lalu salin tautan file tersebut.'
    );
  }

  // 1. ATTEMPT DIRECT BROWSER FETCH (Google's CSV / gviz endpoints support CORS for public sheets)
  if (parsed.type === 'standard_sheet' || parsed.type === 'raw_id') {
    const sheetId = parsed.id;
    if (sheetId) {
      try {
        const directCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${
          finalGid ? `&gid=${finalGid}` : ''
        }`;
        const directRes = await fetch(directCsvUrl, { mode: 'cors' });
        if (directRes.ok) {
          const contentType = directRes.headers.get('content-type') || '';
          const text = await directRes.text();
          // Verify it's not a Google login page
          if (
            !text.includes('accounts.google.com') &&
            !text.includes('ServiceLogin') &&
            !text.includes('<!DOCTYPE html>') &&
            text.length > 20
          ) {
            const encoder = new TextEncoder();
            return {
              arrayBuffer: encoder.encode(text).buffer,
              fileName: `Google_Spreadsheet_${sheetId.substring(0, 10)}.csv`,
              spreadsheetId: sheetId,
            };
          }
        }
      } catch {
        // Direct fetch failed or blocked by CORS/privacy, proceed to backend proxy
      }
    }
  } else if (parsed.type === 'published_sheet' && parsed.pubId) {
    try {
      const directPubCsv = `https://docs.google.com/spreadsheets/d/e/${parsed.pubId}/pub?output=csv${
        finalGid ? `&gid=${finalGid}` : ''
      }`;
      const directRes = await fetch(directPubCsv, { mode: 'cors' });
      if (directRes.ok) {
        const text = await directRes.text();
        if (!text.includes('accounts.google.com') && !text.includes('<!DOCTYPE html>') && text.length > 20) {
          const encoder = new TextEncoder();
          return {
            arrayBuffer: encoder.encode(text).buffer,
            fileName: `Google_Spreadsheet_Pub_${parsed.pubId.substring(0, 10)}.csv`,
            spreadsheetId: parsed.pubId,
          };
        }
      }
    } catch {
      // Direct fetch failed, proceed to backend proxy
    }
  }

  // 2. ATTEMPT VIA BACKEND PROXY (safely handles XLSX export & handles non-JSON responses)
  let response: Response;
  try {
    response = await fetch('/api/fetch-google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, sheetGid: finalGid }),
    });
  } catch (netErr: any) {
    throw new Error(
      `Tidak dapat terhubung ke server aplikasi (${netErr?.message || 'Koneksi terputus'}). Silakan gunakan tab "Upload File Lokal" untuk mengunggah file spreadsheet langsung dari komputer.`
    );
  }

  // Safely parse response content
  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!data) {
    const rawText = await response.text();
    if (
      rawText.toLowerCase().includes('the page cannot be found') ||
      rawText.toLowerCase().includes('page not found') ||
      rawText.includes('The page c')
    ) {
      throw new Error(
        'Server Google atau jaringan tidak dapat mengakses tautan spreadsheet ini. Pastikan izin akses telah diubah ke "Siapa saja yang memiliki tautan" (Anyone with the link). Sebagai alternatif tercepat dan paling andal, unduh file spreadsheet (.xlsx atau .csv) ke komputer Anda lalu unggah di tab "Upload File Lokal".'
      );
    }
    throw new Error(
      `Gagal membaca respon server (Status: ${response.status}). Disarankan mengunduh file ke komputer dan menggunakan tab "Upload File Lokal".`
    );
  }

  if (!data.success) {
    throw new Error(
      data.error ||
        'Gagal mengunduh Google Spreadsheet. Pastikan dokumen dibuka untuk publik atau gunakan tab "Upload File Lokal".'
    );
  }

  const arrayBuffer = base64ToArrayBuffer(data.fileBase64);

  return {
    arrayBuffer,
    fileName: data.fileName || 'Google_Spreadsheet.xlsx',
    spreadsheetId: data.spreadsheetId || 'spreadsheet',
  };
}

// Helper to fetch file from Google Drive (Safely handles JSON & proxy responses)
export async function fetchGoogleDriveFromUrl(url: string): Promise<{
  arrayBuffer: ArrayBuffer;
  fileName: string;
  fileId: string;
}> {
  const parsed = parseGoogleResourceUrl(url);

  if (parsed.type === 'drive_folder') {
    throw new Error(
      'Tautan yang Anda masukkan adalah folder Google Drive, bukan file spreadsheet. Silakan buka file di dalam folder tersebut, lalu salin tautan filenya.'
    );
  }

  // If user pasted a Google Spreadsheet URL into the Drive input, forward to sheet fetcher
  if (parsed.type === 'standard_sheet' || parsed.type === 'published_sheet') {
    const sheetResult = await fetchGoogleSpreadsheetFromUrl(url);
    return {
      arrayBuffer: sheetResult.arrayBuffer,
      fileName: sheetResult.fileName,
      fileId: sheetResult.spreadsheetId,
    };
  }

  let response: Response;
  try {
    response = await fetch('/api/fetch-google-drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch (netErr: any) {
    throw new Error(
      `Tidak dapat terhubung ke server aplikasi (${netErr?.message || 'Koneksi terputus'}). Silakan gunakan tab "Upload File Lokal" untuk mengunggah file langsung dari komputer.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!data) {
    const rawText = await response.text();
    if (
      rawText.toLowerCase().includes('the page cannot be found') ||
      rawText.toLowerCase().includes('page not found') ||
      rawText.includes('The page c')
    ) {
      throw new Error(
        'Server Google Drive menolak unduhan otomatis atau file tidak ditemukan. Silakan klik kanan file di Google Drive -> "Download / Unduh" (.xlsx atau .csv) ke komputer Anda, lalu unggah melalui tab "Upload File Lokal".'
      );
    }
    throw new Error(
      `Gagal membaca respon server Google Drive (Status: ${response.status}). Silakan gunakan tab "Upload File Lokal".`
    );
  }

  if (!data.success) {
    throw new Error(
      data.error ||
        'Gagal mengunduh file dari Google Drive. Pastikan file dibagikan ke publik atau gunakan tab "Upload File Lokal".'
    );
  }

  const arrayBuffer = base64ToArrayBuffer(data.fileBase64);

  return {
    arrayBuffer,
    fileName: data.fileName || 'Google_Drive_File.xlsx',
    fileId: data.fileId || 'drive_file',
  };
}

// Generate template spreadsheet for users to download
export function downloadTemplateSpreadsheet(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleData = [
    {
      'Timestamp': '9/16/2026 9:39:18',
      'NAMA SISWA': 'Adnan Lutfan Malik (Adnan)',
      'NAMA TERAPIS': 'Ruri Santi Hapsari',
      'JENIS TERAPI': 'Terapi Wicara',
      'Lembar Progres Sesi': 'Hari ini Ananda Adnan mampu beraktifitas dengan baik dan cukup responsif, dalam menamai 1 kata dan frase cukup baik dengan bantuan koreksi artikulasi, membuat kalimat SPO masih dibantu di bagian predikat yaitu di kata kerja. Dalam bernyanyi masih terus ditingkatkan kemampuannya dan produksi artikulasi nya.',
      'Program Intervensi': 'Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral',
      'Respon Ananda Terhadap Intervensi': 'Cukup kooperatif',
    },
    {
      'Timestamp': '9/16/2026 9:41:38',
      'NAMA SISWA': 'Ahmad Putra Raffasya Wiratama (Ahmad)',
      'NAMA TERAPIS': 'Eva Dwi Gusfianti, A.Md.TW',
      'JENIS TERAPI': 'Terapi Wicara',
      'Lembar Progres Sesi': 'Hari ini Ahmad cukup kooperatif dalam mengikuti aktivitas terapi wicara. Kegiatan diawali dengan oral motor exercise untuk membantu meningkatkan kesiapan dan kemampuan gerak organ bicara. Selanjutnya dilakukan latihan vokalisasi /a, i, u, e, o/ dengan mengikuti arahan terapis.\nAhmad juga melakukan latihan penguatan otot rahang untuk membantu meningkatkan kekuatan dan koordinasi gerakan rahang.',
      'Program Intervensi': 'Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral',
      'Respon Ananda Terhadap Intervensi': 'cukup koperatif',
    },
    {
      'Timestamp': '9/16/2026 10:03:17',
      'NAMA SISWA': 'Abdul Karim Sumitro (Aka)',
      'NAMA TERAPIS': 'Dara Kinanti',
      'JENIS TERAPI': 'Okupasi Terapi /SI',
      'Lembar Progres Sesi': 'Hari ini sesi terapi di awali dengan Aka diinstruksikan untuk Exercise mengelilingi Ruang SI sebanyak 3x Repetisi. Kemudian Aka diberikan aktivitas bersama teman yaitu:\n1. Membawa Bola dengan menggunakan Tongkat\n2. Bermain Congklak\nAktivitas ini bertujuan untuk meningkatkan Koordinasi Bilateral, Fine motor, Eye hand-coordination, motor planning, pemahaman aturan bermain.',
      'Program Intervensi': 'Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi',
      'Respon Ananda Terhadap Intervensi': 'Cukup Kooperatif',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catatan Terapi');

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Timestamp
    { wch: 36 }, // NAMA SISWA
    { wch: 30 }, // NAMA TERAPIS
    { wch: 22 }, // JENIS TERAPI
    { wch: 55 }, // Lembar Progres Sesi
    { wch: 45 }, // Program Intervensi
    { wch: 40 }, // Respon Ananda
  ];

  const fileName = `Format_Template_Catatan_Terapi.${format}`;
  XLSX.writeFile(wb, fileName, { bookType: format });
}
