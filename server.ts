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

  // Extract Google Spreadsheet ID from various URL patterns
  function extractSpreadsheetId(input: string): { id: string | null; gid: string | null } {
    const trimmed = input.trim();

    // Check GID in URL query or hash
    let gid: string | null = null;
    const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }

    // Pattern 1: https://docs.google.com/spreadsheets/d/{ID}/...
    const dMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (dMatch) {
      return { id: dMatch[1], gid };
    }

    // Pattern 2: Raw ID (alphanumeric, underscores, hyphens, length > 25)
    if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
      return { id: trimmed, gid };
    }

    return { id: null, gid };
  }

  // Extract Google Drive File ID from URL
  function extractDriveFileId(input: string): string | null {
    const trimmed = input.trim();

    // Pattern 1: https://drive.google.com/file/d/{ID}/...
    const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileMatch) return fileMatch[1];

    // Pattern 2: https://drive.google.com/open?id={ID} or uc?id={ID}
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (idParamMatch) return idParamMatch[1];

    // Pattern 3: Raw ID
    if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  }

  // API Route: Fetch Google Spreadsheet (.xlsx export)
  app.post('/api/fetch-google-sheet', async (req, res) => {
    try {
      const { url, sheetGid } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL Google Spreadsheet wajib diisi.' });
      }

      const { id, gid } = extractSpreadsheetId(url);
      if (!id) {
        return res.status(400).json({
          error:
            'Format tautan tidak dikenali. Pastikan Anda memasukkan link Google Spreadsheet lengkap (contoh: https://docs.google.com/spreadsheets/d/.../edit).',
        });
      }

      const finalGid = sheetGid || gid;
      const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx${
        finalGid ? `&gid=${finalGid}` : ''
      }`;

      console.log(`[Google Sheet Import] Mengunduh: ${exportUrl}`);

      const response = await fetch(exportUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Google Spreadsheet mengembalikan status HTTP ${response.status}. Pastikan dokumen tidak dihapus.`,
        });
      }

      const contentType = response.headers.get('content-type') || '';
      const arrayBuffer = await response.arrayBuffer();

      // Check if response returned an HTML login page instead of xlsx binary
      if (contentType.includes('text/html')) {
        const textSample = Buffer.from(arrayBuffer).toString('utf-8', 0, 1000);
        if (textSample.includes('accounts.google.com') || textSample.includes('Sign in') || textSample.includes('ServiceLogin')) {
          return res.status(403).json({
            error:
              'Akses Ditolak (Privat): Google Spreadsheet ini belum diatur ke publik. Silakan buka file di Google Spreadsheet -> klik tombol "Bagikan" (Share) -> ubah Akses umum menjadi "Siapa saja yang memiliki tautan" (Anyone with the link can view) -> Salin tautan dan coba lagi.',
          });
        }
      }

      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      return res.json({
        success: true,
        spreadsheetId: id,
        gid: finalGid,
        fileName: `Google_Spreadsheet_${id}.xlsx`,
        fileBase64: base64Data,
        sizeBytes: arrayBuffer.byteLength,
      });
    } catch (err: any) {
      console.error('[Google Sheet Import Error]:', err);
      return res.status(500).json({
        error: `Gagal mengunduh Google Spreadsheet: ${err.message || 'Terjadi kesalahan jaringan'}`,
      });
    }
  });

  // API Route: Fetch file from Google Drive
  app.post('/api/fetch-google-drive', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL Google Drive wajib diisi.' });
      }

      // First check if user pasted a Google Spreadsheet link into the Drive box
      const sheetCheck = extractSpreadsheetId(url);
      if (sheetCheck.id) {
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetCheck.id}/export?format=xlsx${
          sheetCheck.gid ? `&gid=${sheetCheck.gid}` : ''
        }`;
        const response = await fetch(exportUrl, { redirect: 'follow' });
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const arrayBuffer = await response.arrayBuffer();
          if (!contentType.includes('text/html')) {
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            return res.json({
              success: true,
              fileId: sheetCheck.id,
              fileName: `Google_Drive_Sheet_${sheetCheck.id}.xlsx`,
              fileBase64: base64Data,
              sizeBytes: arrayBuffer.byteLength,
            });
          }
        }
      }

      const fileId = extractDriveFileId(url);
      if (!fileId) {
        return res.status(400).json({
          error:
            'Format tautan Google Drive tidak dikenali. Pastikan link berbentuk https://drive.google.com/file/d/... atau berikan ID file.',
        });
      }

      // Direct download URL for shared Google Drive files
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log(`[Google Drive Import] Mengunduh file ID: ${fileId}`);

      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Google Drive mengembalikan kode error HTTP ${response.status}.`,
        });
      }

      const contentType = response.headers.get('content-type') || '';
      const arrayBuffer = await response.arrayBuffer();

      if (contentType.includes('text/html')) {
        const textSample = Buffer.from(arrayBuffer).toString('utf-8', 0, 1000);
        if (textSample.includes('ServiceLogin') || textSample.includes('accounts.google.com')) {
          return res.status(403).json({
            error:
              'Akses Ditolak: File Google Drive ini belum dibagikan. Silakan klik kanan file di Google Drive -> "Bagikan" -> ubah akses menjadi "Siapa saja yang memiliki tautan" (Anyone with the link).',
          });
        }
      }

      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      return res.json({
        success: true,
        fileId,
        fileName: `Google_Drive_${fileId}.xlsx`,
        fileBase64: base64Data,
        sizeBytes: arrayBuffer.byteLength,
      });
    } catch (err: any) {
      console.error('[Google Drive Import Error]:', err);
      return res.status(500).json({
        error: `Gagal mengunduh file dari Google Drive: ${err.message || 'Kesalahan koneksi'}`,
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
