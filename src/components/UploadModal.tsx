import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  FileDown,
  Info,
  Layers,
  ArrowRight,
  Sparkles,
  Edit2,
  Globe,
  HardDrive,
  Link2,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { ParsedSpreadsheetRow, TherapySession, ImportCommitResult } from '../types';
import {
  parseSpreadsheetFile,
  parseSpreadsheetArrayBuffer,
  fetchGoogleSpreadsheetFromUrl,
  fetchGoogleDriveFromUrl,
  downloadTemplateSpreadsheet,
} from '../utils/excelParser';
import { generateSessionKey, generatePotentialDuplicateKey } from '../utils/storage';
import { RAW_PELANGI_CSV } from '../data/pelangiData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSessions: TherapySession[];
  onCommitImport: (validRows: ParsedSpreadsheetRow[]) => ImportCommitResult;
}

type SourceTab = 'sheets' | 'drive' | 'file';

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  existingSessions,
  onCommitImport,
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<SourceTab>('sheets');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetGid, setGoogleSheetGid] = useState('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');

  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedSpreadsheetRow[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<{ [key: string]: string }>({});
  const [fileSourceInfo, setFileSourceInfo] = useState<{
    type: SourceTab;
    title: string;
    subtitle: string;
  } | null>(null);

  const [importResult, setImportResult] = useState<ImportCommitResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generic buffer processor for both local files and remote Google Drive/Sheets
  const processSpreadsheetBuffer = (
    arrayBuffer: ArrayBuffer,
    sourceInfo: { type: SourceTab; title: string; subtitle: string }
  ) => {
    try {
      const result = parseSpreadsheetArrayBuffer(arrayBuffer);

      // 1. Indeks sesi aktif yang sudah ada berdasarkan kunci identitas unik:
      // (Tanggal + Nama Siswa + Nama Terapis + Jenis Terapi + Sesi)
      const existingByKey = new Map<string, TherapySession>();
      const existingByPotential = new Map<string, TherapySession[]>();

      existingSessions
        .filter((s) => !s.is_deleted)
        .forEach((s) => {
          const key = generateSessionKey(
            s.date,
            s.student_name,
            s.therapist_name,
            s.therapy_type,
            s.session_schedule,
            s.time_str
          );
          existingByKey.set(key, s);

          const potKey = generatePotentialDuplicateKey(s.date, s.student_name, s.therapy_type);
          const potList = existingByPotential.get(potKey) || [];
          potList.push(s);
          existingByPotential.set(potKey, potList);
        });

      // Track duplikasi intra-file agar dalam 1 spreadsheet tidak ada data berulang
      const seenFileKeys = new Map<string, ParsedSpreadsheetRow>();

      const checkedRows = result.rows.map((row) => {
        const key = generateSessionKey(
          row.date,
          row.studentName,
          row.therapistName,
          row.therapyType,
          row.sessionSchedule,
          row.timeStr
        );

        const potKey = generatePotentialDuplicateKey(row.date, row.studentName, row.therapyType);

        const matchedExisting = existingByKey.get(key);
        const seenInCurrentFile = seenFileKeys.get(key);

        let matchType: 'new' | 'update' | 'exact_match' | 'potential_duplicate' = 'new';
        let isDuplicate = false;
        let matchedSessionId: string | undefined = undefined;
        let matchDetails = 'Sesi baru (akan ditambahkan)';

        if (matchedExisting) {
          isDuplicate = true;
          matchedSessionId = matchedExisting.session_id;

          // Periksa apakah ada perubahan atau pembaruan pada lembar progres/intervensi/respon
          const isContentIdentical =
            (matchedExisting.session_progress || '').trim() === (row.sessionProgress || '').trim() &&
            (matchedExisting.intervention_program || '').trim() === (row.interventionProgram || '').trim() &&
            (matchedExisting.child_response || '').trim() === (row.childResponse || '').trim();

          if (isContentIdentical) {
            matchType = 'exact_match';
            matchDetails = 'Data sesi sudah ada & persis sama (dipertahankan 1 data, dilewati)';
          } else {
            matchType = 'update';
            matchDetails = 'Data sesi sudah ada. Isi catatan akan diperbarui (update in-place, tidak membuat baris baru)';
          }
        } else if (seenInCurrentFile) {
          isDuplicate = true;
          matchType = 'exact_match';
          matchDetails = `Duplikat dengan baris ${seenInCurrentFile.rowIndex} di file ini (hanya 1 baris disimpan)`;
        } else if (existingByPotential.has(potKey)) {
          // Siswa, tanggal, dan terapi sama, namun terapis atau sesi berbeda
          matchType = 'potential_duplicate';
          isDuplicate = false;
          const related = existingByPotential.get(potKey)![0];
          matchDetails = `Siswa & terapi sama di tanggal ini (${related.therapist_name}, ${related.session_schedule || related.time_str || 'Sesi lain'}). Tetap dicatat sebagai sesi terpisah.`;
        }

        seenFileKeys.set(key, row);

        return {
          ...row,
          isDuplicate,
          matchType,
          matchedSessionId,
          matchDetails,
        };
      });

      setParsedRows(checkedRows);
      setDetectedColumns(result.detectedColumns);
      setFileSourceInfo(sourceInfo);
      setParseError(null);
    } catch (err: any) {
      setParseError(err?.message || 'Gagal membaca format spreadsheet.');
      setParsedRows([]);
      setFileSourceInfo(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Local File Upload
  const handleFileChange = async (selectedFile: File) => {
    setIsParsing(true);
    setParseError(null);
    setImportResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      processSpreadsheetBuffer(buffer, {
        type: 'file',
        title: selectedFile.name,
        subtitle: `${(selectedFile.size / 1024).toFixed(1)} KB`,
      });
    } catch (err: any) {
      setParseError(err?.message || 'Gagal membaca file dari komputer.');
      setIsParsing(false);
    }
  };

  // Handle Google Spreadsheet URL Fetch
  const handleFetchGoogleSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleSheetUrl.trim()) {
      setParseError('Silakan masukkan tautan Google Spreadsheet terlebih dahulu.');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setImportResult(null);

    try {
      const res = await fetchGoogleSpreadsheetFromUrl(googleSheetUrl, googleSheetGid);
      processSpreadsheetBuffer(res.arrayBuffer, {
        type: 'sheets',
        title: res.fileName,
        subtitle: `Spreadsheet ID: ${res.spreadsheetId}`,
      });
    } catch (err: any) {
      setParseError(err.message || 'Gagal mengambil data dari Google Spreadsheet.');
      setIsParsing(false);
    }
  };

  // Handle Google Drive File Fetch
  const handleFetchGoogleDrive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleDriveUrl.trim()) {
      setParseError('Silakan masukkan tautan file Google Drive terlebih dahulu.');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setImportResult(null);

    try {
      const res = await fetchGoogleDriveFromUrl(googleDriveUrl);
      processSpreadsheetBuffer(res.arrayBuffer, {
        type: 'drive',
        title: res.fileName,
        subtitle: `File ID: ${res.fileId}`,
      });
    } catch (err: any) {
      setParseError(err.message || 'Gagal mengambil file dari Google Drive.');
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Inline correction of a row in preview table
  const handleUpdateRowField = (
    index: number,
    field: keyof ParsedSpreadsheetRow,
    value: string
  ) => {
    setParsedRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Re-validate row
      const errors: string[] = [];
      if (!target.studentName.trim()) errors.push('NAMA SISWA kosong');
      if (!target.date.trim()) errors.push('Tanggal kosong');
      if (!target.therapistName.trim()) errors.push('NAMA TERAPIS kosong');
      if (!target.therapyType.trim()) errors.push('JENIS TERAPI kosong');
      if (!target.sessionProgress.trim()) errors.push('Lembar Progres Sesi belum diisi');

      target.isValid = errors.length === 0;
      target.validationErrors = errors;

      updated[index] = target;
      return updated;
    });
  };

  // Execute final import into database
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada baris data valid untuk diimpor.');
      return;
    }

    const result = onCommitImport(validRows);
    setImportResult(result);
  };

  const handleResetData = () => {
    setParsedRows([]);
    setFileSourceInfo(null);
    setParseError(null);
    setImportResult(null);
  };

  // Summary Metrics
  const uniqueStudentsInFile = Array.from(
    new Set(
      parsedRows
        .map((r) => r.studentName.trim())
        .filter(Boolean)
    )
  );

  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const newSessionsRows = parsedRows.filter((r) => r.isValid && r.matchType === 'new');
  const updateSessionsRows = parsedRows.filter((r) => r.isValid && r.matchType === 'update');
  const exactDuplicateRows = parsedRows.filter((r) => r.isValid && r.matchType === 'exact_match');
  const potentialDuplicateRows = parsedRows.filter((r) => r.isValid && r.matchType === 'potential_duplicate');
  const validProcessableRows = parsedRows.filter(
    (r) => r.isValid && (r.matchType === 'new' || r.matchType === 'update' || r.matchType === 'potential_duplicate')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-800">
                UPLOAD & SINKRONISASI DATA SPREADSHEET
              </h2>
              <p className="text-xs text-slate-500">
                Sistem Anti-Duplikasi: Data baru ditambahkan, data yang sudah ada diperbarui, dan duplikat persis dipertahankan satu.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* If import is already completed successfully */}
          {importResult ? (
            <div className="py-6 px-4 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Sinkronisasi Spreadsheet Selesai!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                  Pemeriksaan duplikasi otomatis telah diterapkan. Data baru telah ditambahkan, data lama yang sesuai diperbarui tanpa baris ganda, dan data duplikat persis dilewati.
                </p>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto text-left text-xs pt-1">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-700 font-medium block text-[11px]">Sesi Baru Ditambah:</span>
                  <span className="text-lg font-bold text-emerald-800">
                    +{importResult.addedSessionsCount} Sesi
                  </span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-amber-700 font-medium block text-[11px]">Sesi Lama Diperbarui:</span>
                  <span className="text-lg font-bold text-amber-800">
                    {importResult.updatedSessionsCount} Sesi
                  </span>
                  <span className="text-[10px] text-amber-600 block mt-0.5">Update in-place</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-600 font-medium block text-[11px]">Duplikat Dilewati:</span>
                  <span className="text-lg font-bold text-slate-700">
                    {importResult.exactDuplicateCount} Sesi
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Pertahankan 1 data</span>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="text-teal-700 font-medium block text-[11px]">Total Data Unik Akhir:</span>
                  <span className="text-lg font-bold text-teal-800">
                    {importResult.totalSessionsAfter} Sesi
                  </span>
                  <span className="text-[10px] text-teal-600 block mt-0.5">0 data duplikat</span>
                </div>
              </div>

              {/* List of affected student books */}
              <div className="pt-2 text-xs text-slate-600 max-w-lg mx-auto">
                <span className="font-semibold block mb-1">
                  Buku Catatan Siswa Terkait ({importResult.affectedStudents.length} Siswa):
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto p-1">
                  {importResult.affectedStudents.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-medium text-[11px]"
                    >
                      📕 {name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Selesai & Buka Buku Catatan
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SOURCE SELECTION TABS (When no file loaded) */}
              {!fileSourceInfo && (
                <div>
                  <div className="flex border-b border-slate-200 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSourceTab('sheets');
                        setParseError(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        activeSourceTab === 'sheets'
                          ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>Google Spreadsheet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSourceTab('drive');
                        setParseError(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        activeSourceTab === 'drive'
                          ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <HardDrive className="w-4 h-4 text-sky-600" />
                      <span>Google Drive File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSourceTab('file');
                        setParseError(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        activeSourceTab === 'file'
                          ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Upload className="w-4 h-4 text-teal-600" />
                      <span>Upload File Lokal</span>
                    </button>
                  </div>

                  {/* TAB 1: GOOGLE SPREADSHEET */}
                  {activeSourceTab === 'sheets' && (
                    <div className="space-y-4">
                      <form onSubmit={handleFetchGoogleSheet} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tautan Dokumen Google Spreadsheet:
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={googleSheetUrl}
                              onChange={(e) => setGoogleSheetUrl(e.target.value)}
                              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit#gid=0"
                              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pl-9 text-slate-800 placeholder-slate-400 focus:outline-teal-500 focus:bg-white"
                            />
                            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Tempel tautan Google Sheet lengkap dari browser Anda.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              disabled={isParsing || !googleSheetUrl.trim()}
                              className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                                isParsing || !googleSheetUrl.trim()
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-teal-600 hover:bg-teal-700 text-white'
                              }`}
                            >
                              {isParsing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileSpreadsheet className="w-4 h-4" />
                              )}
                              <span>{isParsing ? 'Mengunduh Sheet...' : 'Tarik & Impor Spreadsheet'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const blob = new Blob([RAW_PELANGI_CSV], { type: 'text/csv;charset=utf-8;' });
                                const sampleFile = new File([blob], 'Data_Catatan_Terapi_Pelangi_50_Sesi.csv', { type: 'text/csv' });
                                handleFileChange(sampleFile);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-medium hover:bg-teal-100 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              <span>Coba Data Sampel Klinik (50 Sesi)</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => downloadTemplateSpreadsheet('xlsx')}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Download Template</span>
                          </button>
                        </div>
                      </form>

                      {/* Step-by-step guidance card */}
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-emerald-900">
                          <HelpCircle className="w-4 h-4 text-emerald-700" />
                          <span>Petunjuk Akses Google Spreadsheet:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900/90 pl-1 leading-relaxed">
                          <li>Buka file spreadsheet di <strong>Google Spreadsheet</strong>.</li>
                          <li>
                            Klik tombol <strong>Bagikan (Share)</strong> biru di pojok kanan atas.
                          </li>
                          <li>
                            Pada bagian Akses umum, pilih <strong>"Siapa saja yang memiliki tautan" (Anyone with the link)</strong> dengan peran <em>Pelihat (Viewer)</em>.
                          </li>
                          <li>
                            Klik <strong>Salin tautan (Copy link)</strong> dan tempelkan pada kolom di atas.
                          </li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: GOOGLE DRIVE FILE */}
                  {activeSourceTab === 'drive' && (
                    <div className="space-y-4">
                      <form onSubmit={handleFetchGoogleDrive} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tautan File di Google Drive:
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={googleDriveUrl}
                              onChange={(e) => setGoogleDriveUrl(e.target.value)}
                              placeholder="https://drive.google.com/file/d/1XyZ.../view?usp=sharing"
                              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pl-9 text-slate-800 placeholder-slate-400 focus:outline-teal-500 focus:bg-white"
                            />
                            <HardDrive className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Mendukung link file spreadsheet (.xlsx, .xls, .csv) yang disimpan di Google Drive.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isParsing || !googleDriveUrl.trim()}
                            className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                              isParsing || !googleDriveUrl.trim()
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-sky-600 hover:bg-sky-700 text-white'
                            }`}
                          >
                            {isParsing ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <HardDrive className="w-4 h-4" />
                            )}
                            <span>{isParsing ? 'Mengunduh File...' : 'Unduh & Impor dari Google Drive'}</span>
                          </button>
                        </div>
                      </form>

                      {/* Step-by-step guidance card */}
                      <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-950 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-sky-900">
                          <HelpCircle className="w-4 h-4 text-sky-700" />
                          <span>Cara Membagikan File di Google Drive:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-sky-900/90 pl-1 leading-relaxed">
                          <li>Buka <strong>Google Drive</strong> dan cari file Excel (.xlsx / .csv) Anda.</li>
                          <li>Klik kanan pada file lalu pilih <strong>Bagikan (Share) &gt; Salin tautan</strong>.</li>
                          <li>Pastikan akses diatur ke <strong>"Siapa saja yang memiliki tautan"</strong>.</li>
                          <li>Tempel link tersebut di kotak input di atas.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LOCAL FILE UPLOAD */}
                  {activeSourceTab === 'file' && (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/20 hover:bg-teal-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                        }}
                      />
                      <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          Tarik & lepas file spreadsheet ke sini, atau{' '}
                          <span className="text-teal-700 underline">klik untuk memilih</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Format file yang didukung: <strong>.XLSX</strong>, <strong>.XLS</strong>, <strong>.CSV</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const blob = new Blob([RAW_PELANGI_CSV], { type: 'text/csv;charset=utf-8;' });
                            const sampleFile = new File([blob], 'Data_Catatan_Terapi_Pelangi_50_Sesi.csv', { type: 'text/csv' });
                            handleFileChange(sampleFile);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold hover:bg-teal-100 shadow-2xs cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          <span>Uji Coba Dataset Pelangi (50 Baris)</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadTemplateSpreadsheet('xlsx');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Unduh Format Template (XLSX)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVE LOADED FILE / SPREADSHEET BANNER */}
              {fileSourceInfo && (
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2.5">
                    {fileSourceInfo.type === 'sheets' ? (
                      <Globe className="w-5 h-5 text-emerald-600" />
                    ) : fileSourceInfo.type === 'drive' ? (
                      <HardDrive className="w-5 h-5 text-sky-600" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800">{fileSourceInfo.title}</span>
                      <p className="text-[11px] text-slate-500">
                        {fileSourceInfo.subtitle} • {parsedRows.length} baris data terbaca
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetData}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200/70 transition-colors text-xs font-semibold cursor-pointer"
                    title="Ganti atau Impor File Lain"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ganti Sumber</span>
                  </button>
                </div>
              )}

              {/* Parsing Loading Indicator */}
              {isParsing && (
                <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Membaca data spreadsheet dan memvalidasi kolom...</p>
                </div>
              )}

              {/* Parse Error */}
              {parseError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="font-bold block text-rose-950 text-sm">Gagal Mengimpor Spreadsheet</span>
                      <p className="leading-relaxed mt-1 text-rose-800">{parseError}</p>
                    </div>

                    {(activeSourceTab === 'sheets' || activeSourceTab === 'drive') && (
                      <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-rose-200/70">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSourceTab('file');
                            setParseError(null);
                          }}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Gunakan Tab "Upload File Lokal" (Paling Cepat & Pasti Berhasil)</span>
                        </button>

                        {(googleSheetUrl || googleDriveUrl) && (
                          <a
                            href={activeSourceTab === 'sheets' ? googleSheetUrl : googleDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100/50 text-rose-900 rounded-lg font-medium text-[11px] inline-flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                            <span>Buka Link di Tab Baru</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Summary & Validation Warnings */}
              {parsedRows.length > 0 && (
                <div className="space-y-4">
                  {/* Warning: Incomplete Data Alert */}
                  {invalidRows.length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>⚠️ Data belum lengkap ({invalidRows.length} baris)</span>
                      </div>
                      <p className="text-amber-800">
                        Terdapat baris data yang kolom wajibnya belum terisi. Anda dapat <strong>memperbaiki langsung pada tabel pratinjau di bawah</strong> sebelum menyimpan:
                      </p>
                      <div className="max-h-28 overflow-y-auto space-y-1 bg-amber-100/50 p-2.5 rounded-lg border border-amber-200 text-[11px]">
                        {invalidRows.slice(0, 5).map((row) => (
                          <div key={row.rowIndex}>
                            <strong>Baris {row.rowIndex}:</strong> Siswa: "{row.studentName || 'KOSONG'}", Tgl: "{row.date || 'KOSONG'}" — Masalah:{' '}
                            <span className="text-rose-700 font-semibold">{row.validationErrors.join(', ')}</span>
                          </div>
                        ))}
                        {invalidRows.length > 5 && (
                          <div className="italic text-amber-700">
                            ...dan {invalidRows.length - 5} baris lainnya.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Anti-Duplication Assurance Banner */}
                  <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-emerald-950 space-y-0.5">
                      <span className="font-bold block text-emerald-900">
                        Aturan Proteksi Anti-Duplikasi Aktif
                      </span>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Data dicocokkan berdasarkan <strong>Tanggal + Nama Siswa + Nama Terapis + Jenis Terapi + Sesi</strong>. 
                        Data yang sudah ada akan <strong>diperbarui (update baris yang ada)</strong> tanpa membuat baris ganda. 
                        Data yang persis sama dipertahankan 1 data. Jika nama siswa sama namun tanggal, terapis, terapi, atau sesi berbeda, tetap dicatat sebagai sesi terpisah.
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[11px] block">Total Baris File:</span>
                      <span className="font-bold text-slate-800 text-sm">{parsedRows.length} Baris</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-emerald-700 text-[11px] block">Sesi Baru:</span>
                      <span className="font-bold text-emerald-800 text-sm">+{newSessionsRows.length} Tambah</span>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-amber-700 text-[11px] block">Update Baris Ada:</span>
                      <span className="font-bold text-amber-800 text-sm">{updateSessionsRows.length} Diperbarui</span>
                    </div>
                    <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                      <span className="text-slate-600 text-[11px] block">Duplikat Persis:</span>
                      <span className="font-bold text-slate-700 text-sm">{exactDuplicateRows.length} Dilewati</span>
                    </div>
                    <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-200 col-span-2 sm:col-span-1">
                      <span className="text-teal-700 text-[11px] block">Buku Siswa:</span>
                      <span className="font-bold text-teal-800 text-sm">{uniqueStudentsInFile.length} Siswa</span>
                    </div>
                  </div>

                  {/* Preview Table with Editable Cells */}
                  <div>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="font-bold text-slate-800">
                        Pratinjau & Validasi Data Spreadsheet
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Semua baris dapat diedit langsung pada tabel sebelum disimpan
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200 z-10">
                          <tr>
                            <th className="py-2.5 px-2.5 w-10 text-center">No</th>
                            <th className="py-2.5 px-2.5">Tanggal</th>
                            <th className="py-2.5 px-2.5">Sesi / Jam</th>
                            <th className="py-2.5 px-2.5">NAMA SISWA</th>
                            <th className="py-2.5 px-2.5">NAMA TERAPIS</th>
                            <th className="py-2.5 px-2.5">JENIS TERAPI</th>
                            <th className="py-2.5 px-2.5 min-w-44">Lembar Progres Sesi</th>
                            <th className="py-2.5 px-2.5 min-w-44">Program Intervensi</th>
                            <th className="py-2.5 px-2.5 text-center">Status / Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {parsedRows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={
                                !row.isValid
                                  ? 'bg-rose-50/60'
                                  : row.matchType === 'update'
                                  ? 'bg-amber-50/40'
                                  : row.matchType === 'exact_match'
                                  ? 'bg-slate-100/50 opacity-70'
                                  : row.matchType === 'potential_duplicate'
                                  ? 'bg-blue-50/30'
                                  : 'hover:bg-slate-50'
                              }
                            >
                              <td className="py-2 px-2 text-center text-slate-400 font-medium">
                                {row.rowIndex}
                              </td>

                              {/* Tanggal */}
                              <td className="py-2 px-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.date}
                                  placeholder="YYYY-MM-DD"
                                  onChange={(e) => handleUpdateRowField(idx, 'date', e.target.value)}
                                  className="w-24 px-1.5 py-0.5 border border-slate-200 rounded bg-white text-xs"
                                />
                              </td>

                              {/* Sesi / Jadwal */}
                              <td className="py-2 px-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.sessionSchedule || row.timeStr || ''}
                                  placeholder="Sesi / Jam"
                                  onChange={(e) => handleUpdateRowField(idx, 'sessionSchedule', e.target.value)}
                                  className="w-20 px-1.5 py-0.5 border border-slate-200 rounded bg-white text-[11px]"
                                />
                              </td>

                              {/* NAMA SISWA */}
                              <td className="py-2 px-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.studentName}
                                  placeholder="Nama Siswa"
                                  onChange={(e) => handleUpdateRowField(idx, 'studentName', e.target.value)}
                                  className="w-28 px-1.5 py-0.5 border border-slate-200 rounded bg-white font-bold text-teal-800 text-xs"
                                />
                              </td>

                              {/* NAMA TERAPIS */}
                              <td className="py-2 px-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.therapistName}
                                  placeholder="Nama Terapis"
                                  onChange={(e) => handleUpdateRowField(idx, 'therapistName', e.target.value)}
                                  className="w-28 px-1.5 py-0.5 border border-slate-200 rounded bg-white text-xs"
                                />
                              </td>

                              {/* JENIS TERAPI */}
                              <td className="py-2 px-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.therapyType}
                                  placeholder="Okupasi/Wicara"
                                  onChange={(e) => handleUpdateRowField(idx, 'therapyType', e.target.value)}
                                  className="w-24 px-1.5 py-0.5 border border-slate-200 rounded bg-white text-xs font-medium"
                                />
                              </td>

                              {/* Lembar Progres Sesi */}
                              <td className="py-2 px-2">
                                <textarea
                                  rows={1}
                                  value={row.sessionProgress}
                                  placeholder="Lembar progres..."
                                  onChange={(e) => handleUpdateRowField(idx, 'sessionProgress', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded bg-white text-[11px]"
                                />
                              </td>

                              {/* Program Intervensi */}
                              <td className="py-2 px-2">
                                <textarea
                                  rows={1}
                                  value={row.interventionProgram}
                                  placeholder="Program intervensi..."
                                  onChange={(e) => handleUpdateRowField(idx, 'interventionProgram', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded bg-white text-[11px]"
                                />
                              </td>

                              {/* Status / Aksi Badge */}
                              <td className="py-2 px-2 whitespace-nowrap text-center">
                                {!row.isValid ? (
                                  <span
                                    title={row.validationErrors.join(', ')}
                                    className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold text-[10px] inline-block"
                                  >
                                    Tidak Lengkap
                                  </span>
                                ) : row.matchType === 'update' ? (
                                  <span
                                    title={row.matchDetails}
                                    className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold text-[10px] inline-flex items-center gap-1"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    Update Baris Ada
                                  </span>
                                ) : row.matchType === 'exact_match' ? (
                                  <span
                                    title={row.matchDetails}
                                    className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-semibold text-[10px] inline-block"
                                  >
                                    Duplikat (1 Saja)
                                  </span>
                                ) : row.matchType === 'potential_duplicate' ? (
                                  <span
                                    title={row.matchDetails}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold text-[10px] inline-block"
                                  >
                                    Sesi Terpisah
                                  </span>
                                ) : (
                                  <span
                                    title="Sesi baru yang belum pernah tercatat"
                                    className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-[10px] inline-block"
                                  >
                                    Baru
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importResult && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {parsedRows.length > 0 && (
                <span>
                  Siap diproses:{' '}
                  <strong className="text-emerald-700">{newSessionsRows.length} baru</strong>,{' '}
                  <strong className="text-amber-700">{updateSessionsRows.length} update</strong>,{' '}
                  <span className="text-slate-500">{exactDuplicateRows.length} duplikat dilewati</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || validProcessableRows.length === 0}
                onClick={handleConfirmImport}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  parsedRows.length === 0 || validProcessableRows.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan / Sinkronkan Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
