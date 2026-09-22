import React, { useState } from 'react';
import {
  X,
  Printer,
  FileDown,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { Student, TherapySession } from '../types';
import { formatDisplayDate } from '../utils/excelParser';
import { downloadStudentBookPDF, generateStudentBookPDF } from '../utils/pdfExport';
import { PelangiLogo } from './PelangiLogo';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  allSessions: TherapySession[];
  selectedSingleSession?: TherapySession | null;
  allStudents: Student[];
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  student,
  allSessions,
  selectedSingleSession,
  allStudents,
}) => {
  // Option A (Satu Siswa), Option B (Periode Tertentu), Option C (Satu Sesi), Option D (Semua Siswa)
  const [exportMode, setExportMode] = useState<'student_all' | 'period' | 'single' | 'all_students'>(
    selectedSingleSession ? 'single' : 'student_all'
  );

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    selectedSingleSession?.session_id || ''
  );
  const [clinicName, setClinicName] = useState('PUSAT TERAPI TUMBUH KEMBANG ANAK');

  if (!isOpen) return null;

  const studentSessions = allSessions.filter(
    (s) => s.student_id === student.student_id && !s.is_deleted
  );

  // Compute filtered sessions for current modal preview
  let previewSessions = [...studentSessions];
  let periodTitle = 'Seluruh Riwayat';

  if (exportMode === 'single') {
    previewSessions = previewSessions.filter((s) => s.session_id === selectedSessionId);
    periodTitle = previewSessions[0] ? formatDisplayDate(previewSessions[0].date) : 'Satu Sesi';
  } else if (exportMode === 'period') {
    if (startDate) {
      previewSessions = previewSessions.filter((s) => s.date >= startDate);
    }
    if (endDate) {
      previewSessions = previewSessions.filter((s) => s.date <= endDate);
    }
    const s = startDate ? formatDisplayDate(startDate) : 'Awal';
    const e = endDate ? formatDisplayDate(endDate) : 'Kini';
    periodTitle = `${s} s/d ${e}`;
  } else {
    periodTitle = 'Semua Sesi Terdaftar';
  }

  // Handle Download PDF
  const handleDownloadPDF = () => {
    if (exportMode === 'all_students') {
      // Batch download each active student
      const activeStudents = allStudents.filter((s) => !s.is_deleted);
      activeStudents.forEach((st, idx) => {
        const sList = allSessions.filter((sess) => sess.student_id === st.student_id && !sess.is_deleted);
        setTimeout(() => {
          downloadStudentBookPDF(
            { student: st, sessions: sList, clinicName },
            `Buku_Catatan_Terapi_${st.student_name.replace(/\s+/g, '_')}.pdf`
          );
        }, idx * 500);
      });
      alert(`Memulai pengunduhan ${activeStudents.length} file PDF terpisah untuk setiap siswa.`);
      onClose();
      return;
    }

    let fileName = `Buku_Catatan_Terapi_${student.student_name.replace(/\s+/g, '_')}.pdf`;
    if (exportMode === 'period') {
      fileName = `Buku_Catatan_${student.student_name.replace(/\s+/g, '_')}_${startDate || 'Awal'}_ke_${endDate || 'Kini'}.pdf`;
    } else if (exportMode === 'single') {
      fileName = `Buku_Catatan_Sesi_${student.student_name.replace(/\s+/g, '_')}_${previewSessions[0]?.date || 'Sesi'}.pdf`;
    }

    downloadStudentBookPDF(
      {
        student,
        sessions: previewSessions,
        periodTitle,
        clinicName,
      },
      fileName
    );
  };

  // Handle Browser Native Window Print with clean layout
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-800">
                CETAK BUKU CATATAN & EXPORT PDF (A4)
              </h2>
              <p className="text-xs text-slate-500">
                Dokumen resmi siap cetak format A4 Portrait lengkap dengan tanda tangan/paraf terapis.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Export Mode Selector (Point 15: A, B, C, D) */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 block text-xs">
              Pilih Opsi Cetak & Ekspor Dokumen:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {/* Option A */}
              <button
                type="button"
                onClick={() => setExportMode('student_all')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  exportMode === 'student_all'
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-slate-800 block text-xs">
                  A. PDF Satu Siswa
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Seluruh {studentSessions.length} sesi {student.student_name}
                </p>
              </button>

              {/* Option B */}
              <button
                type="button"
                onClick={() => setExportMode('period')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  exportMode === 'period'
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-slate-800 block text-xs">
                  B. Periode Tertentu
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Filter rentang tanggal tertentu
                </p>
              </button>

              {/* Option C */}
              <button
                type="button"
                onClick={() => {
                  setExportMode('single');
                  if (!selectedSessionId && studentSessions[0]) {
                    setSelectedSessionId(studentSessions[0].session_id);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  exportMode === 'single'
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-slate-800 block text-xs">
                  C. PDF Satu Sesi
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cetak 1 catatan terapi spesifik
                </p>
              </button>

              {/* Option D */}
              <button
                type="button"
                onClick={() => setExportMode('all_students')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  exportMode === 'all_students'
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-slate-800 block text-xs">
                  D. PDF Semua Siswa
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  File PDF terpisah per anak
                </p>
              </button>
            </div>
          </div>

          {/* Conditional Sub-controls */}
          {exportMode === 'period' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Dari Tanggal:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Sampai Tanggal:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                />
              </div>
              <div className="self-end pb-1 text-slate-500">
                Menemukan: <strong>{previewSessions.length} sesi</strong> pada rentang ini
              </div>
            </div>
          )}

          {exportMode === 'single' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Pilih Sesi yang Ingin Dicetak:
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
              >
                {studentSessions.map((s, idx) => (
                  <option key={s.session_id} value={s.session_id}>
                    Sesi #{idx + 1} • {formatDisplayDate(s.date)} • {s.therapy_type} ({s.therapist_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clinic Name Header */}
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium whitespace-nowrap">Header Lembaga/Klinik:</span>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-xs text-slate-700 font-bold"
            />
          </div>

          {/* Pratinjau Lembar A4 (Live Preview) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Pratinjau Layout Dokumen Cetak (A4 Portrait)</span>
              <span className="text-teal-700 font-normal">
                {previewSessions.length} Sesi Terpilih
              </span>
            </div>

            {/* A4 Paper Simulation Canvas (Notebook Model) */}
            <div className="bg-slate-300/60 p-4 sm:p-6 rounded-2xl max-h-96 overflow-y-auto border border-slate-300 flex justify-center">
              <div className="bg-white w-full max-w-[620px] rounded-r-xl shadow-lg border border-slate-300 text-slate-800 space-y-5 print-page relative overflow-hidden flex">
                
                {/* Visual Spiral Binder on Left of Preview */}
                <div className="w-9 bg-teal-900 shrink-0 relative flex flex-col justify-around items-center py-4 border-r-2 border-amber-500 shadow-inner no-print">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="relative flex items-center justify-center w-full my-1">
                      {/* Metal ring loop */}
                      <div className="w-5 h-2.5 bg-slate-300 rounded-full border border-slate-500 shadow-xs flex items-center justify-center">
                        <div className="w-2.5 h-1.5 bg-slate-800 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notebook Page Content */}
                <div className="p-5 sm:p-7 flex-1 space-y-5">
                  {/* Master Header Banner */}
                  <div className="bg-teal-900 text-white p-3.5 rounded-xl relative overflow-hidden shadow-xs">
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-400" />
                    <div className="pl-2 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                          {clinicName}
                        </h4>
                        <h2 className="text-sm font-extrabold tracking-tight mt-0.5 flex items-center gap-1.5">
                          <span>📕 BUKU CATATAN TERAPI SISWA</span>
                        </h2>
                        <p className="text-[9px] text-teal-100 mt-0.5">
                          Pelangi Lazuardi • Catatan Harian Intervensi & Lembar Progres Perkembangan Ananda
                        </p>
                      </div>
                      <div className="bg-white/95 px-2.5 py-1.5 rounded-lg shadow-2xs shrink-0">
                        <PelangiLogo className="h-7 sm:h-8" />
                      </div>
                    </div>
                  </div>

                  {/* Student Identity Box (Model Kartu Profil Buku Catatan) */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 relative">
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-teal-600 rounded-l-xl" />
                    <div className="pl-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block mb-1">
                          Identitas Siswa
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <strong className="text-slate-900 text-xs font-extrabold break-words">
                            {student.student_name.toUpperCase()}
                          </strong>
                          {student.nickname && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                              Panggilan: {student.nickname}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 mt-0.5 truncate">
                          ID Siswa: <strong className="text-slate-700 font-mono">{student.custom_id || student.student_id}</strong>
                        </div>
                      </div>

                      <div className="space-y-1 sm:text-right">
                        <div>
                          <span className="text-slate-500">Periode Catatan:</span>{' '}
                          <strong className="text-slate-800">{periodTitle}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Status Catatan:</span>{' '}
                          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            ✓ Rekam Resmi Pelangi Lazuardi Terverifikasi
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sessions in Document (Point 14 Format with Notebook Blocks) */}
                  <div className="space-y-4">
                    {previewSessions.length === 0 ? (
                      <p className="text-center text-slate-400 italic py-6">
                        Tidak ada sesi yang sesuai dengan kriteria cetak.
                      </p>
                    ) : (
                      previewSessions.map((sess, idx) => (
                        <div
                          key={sess.session_id}
                          className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white text-[11px] print-session-card"
                        >
                          {/* Session Header Ribbon */}
                          <div className="bg-slate-100 border-b border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <PelangiLogo variant="icon" className="h-4 w-auto" />
                              <span className="bg-teal-800 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs">
                                SESI #{idx + 1}
                              </span>
                              <span className="font-bold text-slate-800 text-xs">
                                {formatDisplayDate(sess.date)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                Terapis: <strong className="text-slate-800">{sess.therapist_name}</strong>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                {sess.therapy_type}
                              </span>
                            </div>
                          </div>

                          {/* 3 Notebook Note Sections (Strict Column Boundaries with Ruled Lines) */}
                          <div className="p-3.5 space-y-3">
                            {/* 1. LEMBAR PROGRES SESI (Amber Parchment with Notebook Ruling) */}
                            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 relative pl-4 overflow-hidden shadow-2xs">
                              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500 rounded-l" />
                              <span className="font-bold text-amber-900 block text-[10px] uppercase tracking-wider mb-1.5">
                                📝 1. LEMBAR PROGRES SESI (Kondisi Awal & Perkembangan)
                              </span>
                              <div className="border-t border-amber-200/60 pt-1.5">
                                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words text-[11px] font-normal">
                                  {sess.session_progress || '-'}
                                </p>
                              </div>
                            </div>

                            {/* 2. PROGRAM INTERVENSI (Sky Blue with Notebook Ruling) */}
                            <div className="bg-sky-50/80 border border-sky-200 rounded-lg p-3 relative pl-4 overflow-hidden shadow-2xs">
                              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-sky-500 rounded-l" />
                              <span className="font-bold text-sky-900 block text-[10px] uppercase tracking-wider mb-1.5">
                                🎯 2. PROGRAM INTERVENSI & STIMULASI
                              </span>
                              <div className="border-t border-sky-200/60 pt-1.5">
                                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words text-[11px] font-normal">
                                  {sess.intervention_program || '-'}
                                </p>
                              </div>
                            </div>

                            {/* 3. RESPON ANANDA TERHADAP INTERVENSI (Emerald Green with Notebook Ruling) */}
                            <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 relative pl-4 overflow-hidden shadow-2xs">
                              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500 rounded-l" />
                              <span className="font-bold text-emerald-900 block text-[10px] uppercase tracking-wider mb-1.5">
                                ⭐ 3. RESPON ANANDA TERHADAP INTERVENSI
                              </span>
                              <div className="border-t border-emerald-200/60 pt-1.5">
                                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words text-[11px] font-normal">
                                  {sess.child_response || '-'}
                                </p>
                              </div>
                            </div>

                            {/* Paraf & Verifikasi Terapis (Stamp Box) */}
                            <div className="pt-2 flex justify-end">
                              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-right w-56 text-[9px] shadow-2xs">
                                <span className="text-slate-400 block font-bold uppercase tracking-wider">
                                  Diverifikasi Oleh Terapis:
                                </span>
                                <strong className="text-slate-800 text-[11px] block mt-0.5 truncate">
                                  {sess.therapist_name || '-'}
                                </strong>
                                <div className="border-b border-dashed border-slate-400 mt-4 mb-1" />
                                <span className="text-slate-400 italic text-[8.5px]">Paraf / Tanda Tangan Resmi</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Official Notebook Footer */}
                  <div className="pt-4 mt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <PelangiLogo variant="icon" className="h-4 w-auto" />
                      <span className="font-semibold text-teal-900">Pusat Terapi Tumbuh Kembang Anak Pelangi Lazuardi</span>
                    </div>
                    <span className="italic text-slate-400">
                      Buku Catatan Terapi Siswa • Rekam Resmi Terverifikasi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Format: <strong>A4 Portrait</strong> • Siap dicetak langsung atau diunduh sebagai PDF
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-trigger-browser-print"
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Sekarang (Print)</span>
            </button>
            <button
              id="btn-trigger-pdf-download"
              type="button"
              onClick={handleDownloadPDF}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh File PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
