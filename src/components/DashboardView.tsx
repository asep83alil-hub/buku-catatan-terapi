import React from 'react';
import {
  Users,
  CalendarDays,
  Activity,
  UserCheck,
  BookOpen,
  ArrowRight,
  Upload,
  PlusCircle,
  FileSpreadsheet,
  Clock,
  Sparkles
} from 'lucide-react';
import { Student, TherapySession, ViewTab } from '../types';
import { formatDisplayDate } from '../utils/excelParser';

interface DashboardViewProps {
  students: Student[];
  sessions: TherapySession[];
  onOpenStudentBook: (student: Student) => void;
  onOpenUpload: () => void;
  onOpenAddSession: () => void;
  setActiveTab: (tab: ViewTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  sessions,
  onOpenStudentBook,
  onOpenUpload,
  onOpenAddSession,
  setActiveTab,
}) => {
  const activeStudents = students.filter((s) => !s.is_deleted);
  const activeSessions = sessions.filter((s) => !s.is_deleted);

  // Group by Therapy Type
  const therapyCounts: { [type: string]: number } = {};
  activeSessions.forEach((s) => {
    const type = s.therapy_type?.trim() || 'Lainnya';
    therapyCounts[type] = (therapyCounts[type] || 0) + 1;
  });

  const sortedTherapies = Object.entries(therapyCounts).sort(
    (a, b) => b[1] - a[1]
  );

  // Group by Therapist
  const therapistCounts: { [therapist: string]: number } = {};
  activeSessions.forEach((s) => {
    const name = s.therapist_name?.trim() || 'Tidak Tercatat';
    therapistCounts[name] = (therapistCounts[name] || 0) + 1;
  });

  const sortedTherapists = Object.entries(therapistCounts).sort(
    (a, b) => b[1] - a[1]
  );

  // Recent 5 sessions
  const recentSessions = [...activeSessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Helper colors for therapy types
  const getBadgeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('okupasi')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (t.includes('wicara')) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (t.includes('fisio')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (t.includes('sensori')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Summary */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-600/50 text-teal-100 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Sistem Buku Catatan Digital</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Rekam Medis & Terapi Tumbuh Kembang Anak
          </h1>
          <p className="text-sm text-teal-100/90 mt-1 max-w-xl">
            Satu siswa memiliki satu buku catatan digital terpadu. Impor dari Google Drive, Google Spreadsheet, atau file Excel/CSV, kelola riwayat sesi terapi, dan cetak dokumen A4 siap edar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            id="dash-upload-btn"
            onClick={onOpenUpload}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-teal-900 rounded-xl font-semibold text-xs hover:bg-teal-50 transition-all shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-teal-600" />
            <span>Impor Drive / Sheets</span>
          </button>
          <button
            id="dash-add-session-btn"
            onClick={onOpenAddSession}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catatan Terapi</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Data Siswa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Data Siswa
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {activeStudents.length}
              <span className="text-sm font-normal text-slate-500 ml-1.5">Siswa</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tiap siswa memiliki 1 buku catatan digital
            </p>
          </div>
        </div>

        {/* Stat 2: Total Sesi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Sesi
            </span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {activeSessions.length}
              <span className="text-sm font-normal text-slate-500 ml-1.5">Sesi</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Catatan terapi tersimpan & terverifikasi
            </p>
          </div>
        </div>

        {/* Stat 3: Jenis Terapi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kategori Terapi
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {sortedTherapies.length}
              <span className="text-sm font-normal text-slate-500 ml-1.5">Jenis</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Okupasi, Wicara, Fisioterapi, dll.
            </p>
          </div>
        </div>

        {/* Stat 4: Terapis Aktif */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Terapis Terdaftar
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {sortedTherapists.length}
              <span className="text-sm font-normal text-slate-500 ml-1.5">Terapis</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Menangani intervensi klinis siswa
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 2 Breakdown Cards (Terapi & Terapis) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TERAPI Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-800">DISTRIBUSI JENIS TERAPI</h2>
              <p className="text-xs text-slate-500">Jumlah sesi berdasarkan bidang intervensi</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {sortedTherapies.length} Kategori
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {sortedTherapies.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada data sesi terapi.
              </p>
            ) : (
              sortedTherapies.map(([type, count]) => {
                const percent = activeSessions.length > 0 ? Math.round((count / activeSessions.length) * 100) : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-semibold border ${getBadgeColor(type)}`}>
                          {type}
                        </span>
                      </div>
                      <span className="font-bold text-slate-700">
                        {count} sesi <span className="text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* TERAPIS Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-800">SESI BERDASARKAN TERAPIS</h2>
              <p className="text-xs text-slate-500">Beban rekam jejak setiap terapis</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {sortedTherapists.length} Terapis
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {sortedTherapists.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada data sesi terapi.
              </p>
            ) : (
              sortedTherapists.map(([therapist, count]) => {
                const percent = activeSessions.length > 0 ? Math.round((count / activeSessions.length) * 100) : 0;
                return (
                  <div key={therapist} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {therapist.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{therapist}</span>
                      </div>
                      <span className="font-bold text-slate-700">
                        {count} sesi <span className="text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Access to Student Books */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-sm text-slate-800">BUKU CATATAN DIGITAL SISWA</h2>
            <p className="text-xs text-slate-500">
              Pilih siswa untuk membuka buku catatan terapi lengkap (1 Siswa = 1 Buku)
            </p>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Siswa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4">
          {activeStudents.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Data Catatan Siswa</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Semua data catatan telah dikosongkan. Anda dapat mengunggah file spreadsheet baru atau menambahkan catatan sesi manual.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={onOpenUpload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Spreadsheet</span>
                </button>
                <button
                  onClick={onOpenAddSession}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Catat Sesi Baru</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {activeStudents.map((student) => {
                const studentSessions = activeSessions.filter(
                  (s) => s.student_id === student.student_id
                );
                const latestSession = studentSessions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                return (
                  <div
                    key={student.student_id}
                    onClick={() => onOpenStudentBook(student)}
                    className="group relative p-4 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/30 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {student.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 group-hover:text-teal-800 transition-colors">
                            {student.student_name}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {student.custom_id || student.student_id}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {studentSessions.length} Sesi
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
                      <span>Terapi Terakhir:</span>
                      <span className="font-medium text-slate-700">
                        {latestSession ? latestSession.therapy_type : 'Belum Ada'}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Buka Buku Catatan</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-800">RIWAYAT CATATAN TERAPI TERBARU</h2>
            <p className="text-xs text-slate-500">5 sesi terapi yang terakhir dicatat atau diimpor</p>
          </div>
          <button
            onClick={() => setActiveTab('sessions')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Semua Sesi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Terapis</th>
                <th className="py-3 px-4">Jenis Terapi</th>
                <th className="py-3 px-4">Progres Sesi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Belum ada data catatan sesi terapi.
                  </td>
                </tr>
              ) : (
                recentSessions.map((session) => {
                const matchedStudent = students.find((s) => s.student_id === session.student_id);
                return (
                  <tr key={session.session_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {formatDisplayDate(session.date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-teal-900 whitespace-nowrap">
                      {session.student_name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{session.therapist_name}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-medium border ${getBadgeColor(session.therapy_type)}`}>
                        {session.therapy_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                      {session.session_progress}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {matchedStudent && (
                        <button
                          onClick={() => onOpenStudentBook(matchedStudent)}
                          className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Buka Buku</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
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
