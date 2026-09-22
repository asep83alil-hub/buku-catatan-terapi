import React, { useState } from 'react';
import {
  BarChart3,
  FileDown,
  Printer,
  CheckCircle2,
  Users,
  Activity,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Student, TherapySession } from '../types';
import { downloadStudentBookPDF } from '../utils/pdfExport';
import { PelangiLogo } from './PelangiLogo';
import * as XLSX from 'xlsx';

interface ReportsViewProps {
  students: Student[];
  sessions: TherapySession[];
  onOpenPrintModal: (student: Student) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  sessions,
  onOpenPrintModal,
}) => {
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const activeStudents = students.filter((s) => !s.is_deleted);
  const activeSessions = sessions.filter((s) => !s.is_deleted);

  // Export Option D: Batch PDF per student
  const handleBatchExportAllStudents = async () => {
    if (activeStudents.length === 0) return;
    setIsExportingAll(true);
    setExportProgress(0);

    for (let i = 0; i < activeStudents.length; i++) {
      const student = activeStudents[i];
      const studentSessions = activeSessions.filter((s) => s.student_id === student.student_id);

      downloadStudentBookPDF(
        { student, sessions: studentSessions },
        `Buku_Catatan_Terapi_${student.student_name.replace(/\s+/g, '_')}.pdf`
      );

      setExportProgress(Math.round(((i + 1) / activeStudents.length) * 100));
      // Give browser time between downloads
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsExportingAll(false);
  };

  // Export Master Spreadsheet of all sessions
  const handleExportAllToExcel = () => {
    const data = activeSessions.map((s) => ({
      'Tanggal': s.date,
      'NAMA SISWA': s.student_name,
      'NAMA TERAPIS': s.therapist_name,
      'JENIS TERAPI': s.therapy_type,
      'Lembar Progres Sesi': s.session_progress,
      'Program Intervensi': s.intervention_program,
      'Respon Ananda Terhadap Intervensi': s.child_response,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Seluruh Catatan Terapi');
    XLSX.writeFile(wb, `Rekap_Catatan_Terapi_Klinik_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 shrink-0">
            <PelangiLogo variant="horizontal" height={36} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              LAPORAN & EKSPOR DOKUMEN KLINIK
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cetak dan unduh Buku Catatan Terapi digital dalam format A4 PDF resmi berlogo Pelangi Lazuardi atau rekap spreadsheet Excel.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAllToExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor Master Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Point 15 Option D: Batch Export PDF Semua Siswa */}
      <div className="bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-200 p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Opsi Ekspor D (Batch PDF)</span>
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Cetak PDF Terpisah untuk Semua Siswa ({activeStudents.length} Siswa)
            </h2>
            <p className="text-xs text-slate-600 max-w-xl">
              Sesuai aturan sistem: Membuat 1 file PDF terpisah untuk setiap siswa (contoh: <em>Buku_Catatan_Terapi_Ahmad.pdf</em>, <em>Buku_Catatan_Terapi_Budi.pdf</em>). Tidak mencampurkan seluruh siswa menjadi satu dokumen.
            </p>
          </div>

          <button
            onClick={handleBatchExportAllStudents}
            disabled={isExportingAll || activeStudents.length === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
              isExportingAll
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {isExportingAll
                ? `Mengunduh (${exportProgress}%)...`
                : 'Ekspor PDF Semua Siswa'}
            </span>
          </button>
        </div>

        {isExportingAll && (
          <div className="mt-4 pt-3 border-t border-teal-200">
            <div className="w-full bg-teal-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-teal-800 mt-1 block">
              Memproses pembuatan file PDF per siswa... {exportProgress}%
            </span>
          </div>
        )}
      </div>

      {/* Per-Student PDF Generator Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-800">PILIHAN EKSPOR PDF PER SISWA</h2>
          <p className="text-xs text-slate-500">Pilih siswa untuk mengunduh PDF individual (Opsi A, B, atau C)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">ID Siswa</th>
                <th className="py-3 px-4">Jumlah Sesi</th>
                <th className="py-3 px-4">Terapi Terlibat</th>
                <th className="py-3 px-4 text-right">Aksi Ekspor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Belum ada data siswa untuk diekspor.
                  </td>
                </tr>
              ) : (
                activeStudents.map((student) => {
                const studentSessions = activeSessions.filter(
                  (s) => s.student_id === student.student_id
                );
                const therapyTypes = Array.from(
                  new Set(studentSessions.map((s) => s.therapy_type).filter(Boolean))
                ).join(', ');

                return (
                  <tr key={student.student_id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      📕 {student.student_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {student.custom_id || student.student_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-teal-700">
                      {studentSessions.length} Sesi
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {therapyTypes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() =>
                            downloadStudentBookPDF({
                              student,
                              sessions: studentSessions,
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs border border-teal-200 cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5 text-teal-600" />
                          <span>Download PDF</span>
                        </button>
                        <button
                          onClick={() => onOpenPrintModal(student)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Opsi Cetak...</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
