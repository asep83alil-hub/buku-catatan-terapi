import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileDown
} from 'lucide-react';
import { Student, TherapySession } from '../types';
import { downloadTemplateSpreadsheet } from '../utils/excelParser';
import {
  resetDatabaseToDefault,
  clearAllDatabase,
  clearAllSessions,
  saveStudents,
  saveSessions,
} from '../utils/storage';

interface SettingsViewProps {
  students: Student[];
  sessions: TherapySession[];
  onReloadData: () => void;
  onRestoreSession: (sessionId: string) => void;
  onPermanentDeleteSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  students,
  sessions,
  onReloadData,
  onRestoreSession,
  onPermanentDeleteSession,
  onClearAllSessions,
}) => {
  const [notification, setNotification] = useState<string | null>(null);

  const deletedSessions = sessions.filter((s) => s.is_deleted);
  const activeSessions = sessions.filter((s) => !s.is_deleted);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Export full JSON backup
  const handleExportJSON = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      students,
      sessions,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Buku_Catatan_Terapi_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif('Cadangan data JSON berhasil diunduh.');
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.sessions)) {
          saveStudents(parsed.students);
          saveSessions(parsed.sessions);
          onReloadData();
          showNotif('Data berhasil dipulihkan dari file backup.');
        } else {
          alert('Format file JSON backup tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file backup JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin memuat data contoh klinik (Pelangi)? Data contoh akan ditambahkan ke sistem.'
      )
    ) {
      resetDatabaseToDefault();
      onReloadData();
      showNotif('Data contoh klinik Pelangi berhasil dimuat.');
    }
  };

  const handleClearSessions = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin MENGHAPUS SEMUA DATA CATATAN sesi terapi? Seluruh catatan sesi akan dikosongkan.'
      )
    ) {
      clearAllSessions();
      onClearAllSessions();
      showNotif('Semua data catatan sesi berhasil dihilangkan.');
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'PERINGATAN: Semua data siswa dan catatan sesi terapi akan dihapus permanen. Lanjutkan?'
      )
    ) {
      clearAllDatabase();
      onReloadData();
      showNotif('Seluruh data database telah dikosongkan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-lg font-bold text-slate-800">
          PENGATURAN & PEMULIHAN DATA (SOFT DELETE)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola cadangan data, unduh format template spreadsheet, dan pulihkan catatan yang terhapus.
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid: 2 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Format Template Spreadsheet */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Template Format Spreadsheet</h2>
              <p className="text-xs text-slate-500">Unduh format acuan 7 kolom standar</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <p>Spreadsheet harus memiliki kolom berikut:</p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
              <div>1. Tanggal</div>
              <div>2. NAMA SISWA</div>
              <div>3. NAMA TERAPIS</div>
              <div>4. JENIS TERAPI</div>
              <div>5. Lembar Progres Sesi</div>
              <div>6. Program Intervensi</div>
              <div>7. Respon Ananda Terhadap Intervensi</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => downloadTemplateSpreadsheet('xlsx')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => downloadTemplateSpreadsheet('csv')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Download CSV (.csv)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Backup & Restore JSON */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Cadangan & Pemulihan Sistem</h2>
              <p className="text-xs text-slate-500">Simpan seluruh buku catatan ke file cadangan</p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Data tersimpan aman di penyimpanan lokal browser. Anda dapat mengekspor cadangan berkas untuk disimpan ke komputer atau diimpor di perangkat lain.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Backup JSON</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Impor Backup JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-teal-700 font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Data Contoh Klinik</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleClearSessions}
              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hilangkan Semua Catatan</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Seluruh Database</span>
            </button>
          </div>
        </div>
      </div>

      {/* Point 19: RECYCLE BIN (SOFT DELETE & PEMULIHAN) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Undo2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">
                TEMPAT SAMPAH / PEMULIHAN DATA (SOFT DELETE)
              </h2>
              <p className="text-xs text-slate-500">
                Sesuai aturan sistem: data yang dihapus disembunyikan dari buku catatan dan dapat dipulihkan kapan saja oleh admin.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {deletedSessions.length} Terhapus
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal Sesi</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Terapis</th>
                <th className="py-3 px-4">Jenis Terapi</th>
                <th className="py-3 px-4">Lembar Progres</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deletedSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Tempat sampah kosong. Tidak ada catatan terapi yang berstatus dihapus.
                  </td>
                </tr>
              ) : (
                deletedSessions.map((sess) => (
                  <tr key={sess.session_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 whitespace-nowrap">{sess.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{sess.student_name}</td>
                    <td className="py-3 px-4">{sess.therapist_name}</td>
                    <td className="py-3 px-4">{sess.therapy_type}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                      {sess.session_progress}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onRestoreSession(sess.session_id);
                            showNotif(`Catatan untuk ${sess.student_name} berhasil dipulihkan.`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold text-xs cursor-pointer"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Pulihkan</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus permanen catatan ini? Data tidak akan bisa dikembalikan lagi.')) {
                              onPermanentDeleteSession(sess.session_id);
                              showNotif('Catatan dihapus permanen.');
                            }
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
