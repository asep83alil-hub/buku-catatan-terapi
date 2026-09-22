import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json({ limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Comprehensive Google Resource URL Parser
  interface ParsedGoogleResource {
    type: 'published_sheet' | 'standard_sheet' | 'drive_file' | 'drive_folder' | 'raw_id' | 'unknown';
    id: string | null;
    pubId: string | null;
    gid: string | null;
  }

  function parseGoogleResourceUrl(input: string): ParsedGoogleResource {
    const trimmed = (input || '').trim();

    // Check GID in URL query or hash
    let gid: string | null = null;
    const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }

    // Check if it's a Google Drive folder
    if (/\/folders\/([a-zA-Z0-9-_]+)/.test(trimmed)) {
      return { type: 'drive_folder', id: null, pubId: null, gid: null };
    }

    // Published Google Sheet (e.g. /spreadsheets/d/e/2PACX-.../pubhtml or /pub?output=...)
    const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (pubMatch) {
      return { type: 'published_sheet', id: null, pubId: pubMatch[1], gid };
    }

    // Standard Google Sheet (e.g. /spreadsheets/d/{ID}/edit or view) - ensure ID is not 'e'
    const sheetMatch = trimmed.match(/\/spreadsheets\/d\/(?!e\/)([a-zA-Z0-9-_]+)/);
    if (sheetMatch) {
      return { type: 'standard_sheet', id: sheetMatch[1], pubId: null, gid };
    }

    // Google Drive file (e.g. /file/d/{ID}/...)
    const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (driveFileMatch) {
      return { type: 'drive_file', id: driveFileMatch[1], pubId: null, gid };
    }

    // Google Drive open?id={ID} or uc?id={ID}
    const driveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (driveIdMatch && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
      return { type: 'drive_file', id: driveIdMatch[1], pubId: null, gid };
    }

    // Raw ID (alphanumeric, underscores, hyphens, length >= 25)
    if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
      return { type: 'raw_id', id: trimmed, pubId: null, gid };
    }

    return { type: 'unknown', id: null, pubId: null, gid };
  }

  // API Route: Fetch Google Spreadsheet (.xlsx export or CSV fallback)
  app.post('/api/fetch-google-sheet', async (req, res) => {
    try {
      const { url, sheetGid } = req.body;
      if (!url || typeof url !== 'string') {
        return res.json({ success: false, error: 'URL Google Spreadsheet wajib diisi.' });
      }

      const parsed = parseGoogleResourceUrl(url);
      const finalGid = sheetGid || parsed.gid;

      if (parsed.type === 'drive_folder') {
        return res.json({
          success: false,
          error:
            'Tautan yang Anda masukkan adalah folder Google Drive, bukan spreadsheet. Silakan buka file spreadsheet di dalam folder, lalu salin tautan file/spreadsheet tersebut.',
        });
      }

      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: '*/*',
      };

      // Case 1: Published Google Sheet (2PACX-...)
      if (parsed.type === 'published_sheet' && parsed.pubId) {
        const pubId = parsed.pubId;
        const candidateUrls = [
          `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=xlsx${finalGid ? `&gid=${finalGid}` : ''}`,
          `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv${finalGid ? `&gid=${finalGid}` : ''}`,
        ];

        for (const candidateUrl of candidateUrls) {
          try {
            console.log(`[Google Sheet Import] Mengunduh Sheet Publikasi: ${candidateUrl}`);
            const response = await fetch(candidateUrl, { headers, redirect: 'follow' });
            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              const arrayBuffer = await response.arrayBuffer();

              if (!contentType.includes('text/html') || arrayBuffer.byteLength > 100) {
                const textSample = Buffer.from(arrayBuffer).toString('utf-8', 0, 500);
                if (!textSample.includes('<!DOCTYPE html>') && !textSample.includes('accounts.google.com')) {
                  const base64Data = Buffer.from(arrayBuffer).toString('base64');
                  return res.json({
                    success: true,
                    spreadsheetId: pubId,
                    gid: finalGid,
                    fileName: `Google_Spreadsheet_Pub_${pubId.substring(0, 10)}.xlsx`,
                    fileBase64: base64Data,
                    sizeBytes: arrayBuffer.byteLength,
                  });
                }
              }
            }
          } catch (fetchErr) {
            console.warn('[Published Sheet Fetch Error]:', fetchErr);
          }
        }
      }

      // Case 2: Standard Sheet or Raw ID or Drive File that might be a sheet
      const sheetId = parsed.id;
      if (!sheetId) {
        return res.json({
          success: false,
          error:
            'Format tautan tidak dikenali. Pastikan Anda memasukkan tautan Google Spreadsheet lengkap (contoh: https://docs.google.com/spreadsheets/d/1Xyz.../edit).',
        });
      }

      // Candidates to try: XLSX export first, then CSV export via gviz/tq
      const candidates = [
        {
          url: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx${
            finalGid ? `&gid=${finalGid}` : ''
          }`,
          isCsv: false,
        },
        {
          url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${
            finalGid ? `&gid=${finalGid}` : ''
          }`,
          isCsv: true,
        },
      ];

      for (const candidate of candidates) {
        try {
          console.log(`[Google Sheet Import] Mencoba: ${candidate.url}`);
          const response = await fetch(candidate.url, { headers, redirect: 'follow' });

          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            const arrayBuffer = await response.arrayBuffer();
            const textSample = Buffer.from(arrayBuffer).toString('utf-8', 0, 1000);

            // Check if returned Google login page
            if (
              textSample.includes('accounts.google.com') ||
              textSample.includes('ServiceLogin') ||
              textSample.includes('Sign in - Google Accounts')
            ) {
              return res.json({
                success: false,
                isPrivate: true,
                error:
                  'Akses Ditolak (Privat): Google Spreadsheet ini belum diatur ke publik. Silakan buka dokumen di Google Spreadsheet -> klik tombol "Bagikan" (Share) -> ubah Akses umum menjadi "Siapa saja yang memiliki tautan" (Anyone with the link) -> Salin tautan dan coba lagi. Atau unduh file .xlsx ke komputer lalu gunakan tab "Upload File Lokal".',
              });
            }

            // Check if returned 404 or robot page
            if (textSample.includes('404. That’s an error') || textSample.includes('The requested URL was not found')) {
              continue; // Try next candidate
            }

            // Valid binary or CSV data
            if (!contentType.includes('text/html') || candidate.isCsv) {
              const base64Data = Buffer.from(arrayBuffer).toString('base64');
              return res.json({
                success: true,
                spreadsheetId: sheetId,
                gid: finalGid,
                fileName: `Google_Spreadsheet_${sheetId.substring(0, 10)}.${candidate.isCsv ? 'csv' : 'xlsx'}`,
                fileBase64: base64Data,
                sizeBytes: arrayBuffer.byteLength,
              });
            }
          }
        } catch (candidateErr) {
          console.warn('[Candidate fetch error]:', candidateErr);
        }
      }

      return res.json({
        success: false,
        error:
          'Tidak dapat mengunduh spreadsheet dari tautan tersebut. Pastikan akses dokumen telah diatur ke "Siapa saja yang memiliki tautan" (Anyone with the link). Anda juga bisa langsung mengunduh file (.xlsx / .csv) dari Google Spreadsheet ke komputer lalu gunakan tab "Upload File Lokal".',
      });
    } catch (err: any) {
      console.error('[Google Sheet Import Error]:', err);
      return res.json({
        success: false,
        error: `Gagal memproses spreadsheet: ${err.message || 'Terjadi kesalahan jaringan'}`,
      });
    }
  });

  // API Route: Fetch file from Google Drive
  app.post('/api/fetch-google-drive', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.json({ success: false, error: 'URL Google Drive wajib diisi.' });
      }

      const parsed = parseGoogleResourceUrl(url);

      if (parsed.type === 'drive_folder') {
        return res.json({
          success: false,
          error:
            'Tautan yang Anda masukkan adalah folder Google Drive, bukan file. Silakan buka file spreadsheet di dalam folder, lalu salin tautan file tersebut.',
        });
      }

      const fileId = parsed.id;
      if (!fileId) {
        return res.json({
          success: false,
          error:
            'Format tautan Google Drive tidak dikenali. Pastikan tautan berbentuk https://drive.google.com/file/d/... atau berikan ID file.',
        });
      }

      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: '*/*',
      };

      // 1. First, try exporting as Google Spreadsheet (in case it's a native Google Sheet on Drive)
      try {
        const sheetExportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
        const sheetRes = await fetch(sheetExportUrl, { headers, redirect: 'follow' });
        if (sheetRes.ok) {
          const contentType = sheetRes.headers.get('content-type') || '';
          const arrayBuffer = await sheetRes.arrayBuffer();
          const textSample = Buffer.from(arrayBuffer).toString('utf-8', 0, 500);

          if (
            !contentType.includes('text/html') &&
            !textSample.includes('accounts.google.com') &&
            !textSample.includes('<!DOCTYPE html>')
          ) {
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            return res.json({
              success: true,
              fileId,
              fileName: `Google_Drive_Sheet_${fileId.substring(0, 10)}.xlsx`,
              fileBase64: base64Data,
              sizeBytes: arrayBuffer.byteLength,
            });
          }
        }
      } catch (e) {
        // Continue to drive download URLs
      }

      // 2. Try direct download endpoints for Google Drive uploaded files (.xlsx, .xls, .csv)
      const downloadUrls = [
        `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
      ];

      for (const downloadUrl of downloadUrls) {
        try {
          console.log(`[Google Drive Import] Mengunduh: ${downloadUrl}`);
          const response = await fetch(downloadUrl, { headers, redirect: 'follow' });

          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            const arrayBuffer = await response.arrayBuffer();
            const textSample = Buffer.from(arrayBuffer).toString('utf-8', 0, 1500);

            if (
              textSample.includes('accounts.google.com') ||
              textSample.includes('ServiceLogin') ||
              textSample.includes('Sign in - Google Accounts')
            ) {
              return res.json({
                success: false,
                isPrivate: true,
                error:
                  'Akses Ditolak: File Google Drive ini belum dibagikan secara publik. Silakan klik kanan file di Google Drive -> "Bagikan" -> ubah akses menjadi "Siapa saja yang memiliki tautan" (Anyone with the link can view). Atau unduh file ke komputer lalu unggah di tab "Upload File Lokal".',
              });
            }

            // Check if Drive shows large file virus scan confirm page
            const confirmMatch = textSample.match(/confirm=([0-9a-zA-Z_]+)/);
            if (confirmMatch) {
              const confirmUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmMatch[1]}`;
              const confirmRes = await fetch(confirmUrl, { headers, redirect: 'follow' });
              if (confirmRes.ok) {
                const confirmedBuffer = await confirmRes.arrayBuffer();
                const base64Data = Buffer.from(confirmedBuffer).toString('base64');
                return res.json({
                  success: true,
                  fileId,
                  fileName: `Google_Drive_${fileId.substring(0, 10)}.xlsx`,
                  fileBase64: base64Data,
                  sizeBytes: confirmedBuffer.byteLength,
                });
              }
            }

            if (!contentType.includes('text/html') || arrayBuffer.byteLength > 1000) {
              if (!textSample.includes('<!DOCTYPE html>') && !textSample.includes('The requested URL was not found')) {
                const base64Data = Buffer.from(arrayBuffer).toString('base64');
                return res.json({
                  success: true,
                  fileId,
                  fileName: `Google_Drive_${fileId.substring(0, 10)}.xlsx`,
                  fileBase64: base64Data,
                  sizeBytes: arrayBuffer.byteLength,
                });
              }
            }
          }
        } catch (driveErr) {
          console.warn('[Drive download error]:', driveErr);
        }
      }

      return res.json({
        success: false,
        error:
          'Gagal mengunduh file dari Google Drive. Pastikan file berformat .xlsx, .xls, atau .csv dan izin file telah diatur ke "Siapa saja yang memiliki tautan". Alternatif terbaik: Unduh file dari Google Drive ke komputer Anda, lalu seret ke tab "Upload File Lokal".',
      });
    } catch (err: any) {
      console.error('[Google Drive Import Error]:', err);
      return res.json({
        success: false,
        error: `Gagal memproses file dari Google Drive: ${err.message || 'Kesalahan koneksi'}`,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
