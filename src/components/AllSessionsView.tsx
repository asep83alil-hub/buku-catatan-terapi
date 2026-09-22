import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  BookOpen,
  Edit,
  Trash2,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Student, TherapySession } from '../types';
import { formatDisplayDate } from '../utils/excelParser';

interface AllSessionsViewProps {
  students: Student[];
  sessions: TherapySession[];
  onOpenStudentBook: (student: Student) => void;
  onEditSession: (session: TherapySession) => void;
  onDeleteSession: (session: TherapySession) => void;
  onOpenAddSession: () => void;
  onClearAllSessions?: () => void;
}

function getTherapyBadgeClass(type: string): string {
  const norm = (type || '').toLowerCase();
  if (norm.includes('wicara')) {
    return 'bg-sky-100 text-sky-800 border-sky-200';
  }
  if (norm.includes('okupasi') || norm.includes('si')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (norm.includes('fisio')) {
    return 'bg-purple-100 text-purple-800 border-purple-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export const AllSessionsView: React.FC<AllSessionsViewProps> = ({
  students,
  sessions,
  onOpenStudentBook,
  onEditSession,
  onDeleteSession,
  onOpenAddSession,
  onClearAllSessions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [selectedTherapy, setSelectedTherapy] = useState('all');
  const [selectedTherapist, setSelectedTherapist] = useState('all');

  const activeStudents = useMemo(() => students.filter((s) => !s.is_deleted), [students]);
  const activeSessions = useMemo(() => sessions.filter((s) => !s.is_deleted), [sessions]);

  const therapies = useMemo(() => {
    const s = new Set<string>();
    activeSessions.forEach((sess) => {
      if (sess.therapy_type) s.add(sess.therapy_type.trim());
    });
    return Array.from(s);
  }, [activeSessions]);

  const therapists = useMemo(() => {
    const s = new Set<string>();
    activeSessions.forEach((sess) => {
      if (sess.therapist_name) s.add(sess.therapist_name.trim());
    });
    return Array.from(s);
  }, [activeSessions]);

  const filteredSessions = useMemo(() => {
    return activeSessions
      .filter((sess) => {
        if (selectedStudentId !== 'all' && sess.student_id !== selectedStudentId) return false;
        if (selectedTherapy !== 'all' && sess.therapy_type.trim().toLowerCase() !== selectedTherapy.toLowerCase()) return false;
        if (selectedTherapist !== 'all' && sess.therapist_name.trim().toLowerCase() !== selectedTherapist.toLowerCase()) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          return (
            sess.student_name.toLowerCase().includes(q) ||
            sess.therapist_name.toLowerCase().includes(q) ||
            sess.therapy_type.toLowerCase().includes(q) ||
            sess.session_progress.toLowerCase().includes(q) ||
            sess.intervention_program.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeSessions, selectedStudentId, selectedTherapy, selectedTherapist, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            JADWAL & RIWAYAT SELURUH SESI TERAPI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log master seluruh sesi terapi dari semua siswa terdaftar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onClearAllSessions && activeSessions.length > 0 && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Apakah Anda yakin ingin menghapus/menghilangkan semua data catatan sesi terapi? Semua catatan riwayat akan dikosongkan.'
                  )
                ) {
                  onClearAllSessions();
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hilangkan Semua Catatan</span>
            </button>
          )}
          <button
            onClick={onOpenAddSession}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Catatan Terapi</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Catatan:</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Siswa, terapis, atau isi catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Siswa:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500"
          >
            <option value="all">Semua Siswa</option>
            {activeStudents.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.student_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Terapi:</label>
          <select
            value={selectedTherapy}
            onChange={(e) => setSelectedTherapy(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500"
          >
            <option value="all">Semua Jenis Terapi</option>
            {therapies.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Terapis:</label>
          <select
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500"
          >
            <option value="all">Semua Terapis</option>
            {therapists.map((th) => (
              <option key={th} value={th}>
                {th}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Terapis</th>
                <th className="py-3 px-4">Jenis Terapi</th>
                <th className="py-3 px-4">Lembar Progres Sesi</th>
                <th className="py-3 px-4">Program Intervensi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    Tidak ada sesi terapi yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess, i) => {
                  const student = activeStudents.find((s) => s.student_id === sess.student_id);
                  return (
                    <tr key={sess.session_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {formatDisplayDate(sess.date, sess.time_str)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {student ? (
                          <button
                            onClick={() => onOpenStudentBook(student)}
                            className="font-bold text-teal-700 hover:underline inline-flex items-center gap-1.5 cursor-pointer text-left"
                          >
                            <span>📕 {sess.student_name}</span>
                            {sess.nickname && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                {sess.nickname}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="font-bold text-slate-800">{sess.student_name}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">{sess.therapist_name}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getTherapyBadgeClass(sess.therapy_type)}`}>
                          {sess.therapy_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {sess.session_progress}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {sess.intervention_program}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {student && (
                            <button
                              onClick={() => onOpenStudentBook(student)}
                              className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded"
                              title="Buka Buku Siswa"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditSession(sess)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Edit Sesi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteSession(sess)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
