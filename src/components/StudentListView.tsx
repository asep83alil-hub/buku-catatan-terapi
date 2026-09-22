import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  FileDown,
  UserPlus,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { Student, TherapySession } from '../types';
import { formatDisplayDate } from '../utils/excelParser';
import { downloadStudentBookPDF } from '../utils/pdfExport';

interface StudentListViewProps {
  students: Student[];
  sessions: TherapySession[];
  onOpenStudentBook: (student: Student) => void;
  onAddNewStudent: (name: string, customId?: string) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  sessions,
  onOpenStudentBook,
  onAddNewStudent,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCustomId, setNewStudentCustomId] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const activeStudents = useMemo(() => {
    return students.filter((s) => !s.is_deleted);
  }, [students]);

  const activeSessions = useMemo(() => {
    return sessions.filter((s) => !s.is_deleted);
  }, [sessions]);

  // Check for duplicate student names (Poin 4 requirement)
  const duplicateNameWarnings = useMemo(() => {
    const nameCounts: { [name: string]: number } = {};
    activeStudents.forEach((s) => {
      const norm = s.student_name.trim().toLowerCase();
      nameCounts[norm] = (nameCounts[norm] || 0) + 1;
    });

    const duplicates = Object.keys(nameCounts).filter((k) => nameCounts[k] > 1);
    return duplicates;
  }, [activeStudents]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return activeStudents.filter((s) => {
      const q = searchTerm.toLowerCase();
      const nameMatch = s.student_name.toLowerCase().includes(q);
      const idMatch = (s.custom_id || '').toLowerCase().includes(q);
      return nameMatch || idMatch;
    });
  }, [activeStudents, searchTerm]);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    onAddNewStudent(newStudentName.trim(), newStudentCustomId.trim() || undefined);
    setNewStudentName('');
    setNewStudentCustomId('');
    setShowAddModal(false);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.student_name.trim()) return;
    onUpdateStudent(editingStudent);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            DATA SISWA & BUKU CATATAN DIGITAL
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh siswa terdaftar. Klik "Buka Buku" untuk melihat seluruh riwayat sesi terapi.
          </p>
        </div>
        <button
          id="btn-add-new-student"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Siswa Baru</span>
        </button>
      </div>

      {/* Duplicate Name Warning Banner (Poin 4) */}
      {duplicateNameWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-800">
              ⚠️ Peringatan Identitas Siswa: Terdapat nama siswa yang sama!
            </p>
            <p className="text-amber-700">
              Sistem tidak menggabungkan data secara otomatis. Silakan gunakan <strong>ID Siswa (Nomor Rekam Medis)</strong> untuk membedakan data siswa bernama sama:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {duplicateNameWarnings.map((name) => (
                <span key={name} className="px-2 py-0.5 bg-amber-200/80 rounded font-semibold text-amber-900 capitalize">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-student-input"
            type="text"
            placeholder="Cari nama siswa atau ID rekam medis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 text-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <span className="font-bold text-slate-800">{filteredStudents.length}</span> dari {activeStudents.length} siswa
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-4">ID Siswa</th>
                <th className="py-3.5 px-4 text-center">Jumlah Sesi</th>
                <th className="py-3.5 px-4">Terapi Terakhir</th>
                <th className="py-3.5 px-4">Terapis Terakhir</th>
                <th className="py-3.5 px-4">Tanggal Terakhir</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    {searchTerm ? 'Tidak ada siswa yang sesuai dengan pencarian.' : 'Belum ada data siswa. Silakan upload spreadsheet atau tambah siswa baru.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const studentSessions = activeSessions
                    .filter((s) => s.student_id === student.student_id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  const latestSession = studentSessions[0];
                  const sessionCount = studentSessions.length;

                  return (
                    <tr
                      key={student.student_id}
                      className="hover:bg-teal-50/20 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Nama Siswa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {student.student_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 group-hover:text-teal-700 text-sm">
                                {student.student_name}
                              </span>
                              {student.nickname && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                  {student.nickname}
                                </span>
                              )}
                            </div>
                            {student.guardian_name && (
                              <p className="text-[10px] text-slate-400">
                                Wali: {student.guardian_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ID Siswa */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {student.custom_id || student.student_id}
                      </td>

                      {/* Jumlah Sesi */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-xs bg-teal-50 text-teal-700 border border-teal-200">
                          {sessionCount} Sesi
                        </span>
                      </td>

                      {/* Terapi Terakhir */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {latestSession ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {latestSession.therapy_type}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Terapis Terakhir */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {latestSession ? latestSession.therapist_name : <span className="text-slate-400 italic">-</span>}
                      </td>

                      {/* Tanggal Terakhir */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {latestSession ? formatDisplayDate(latestSession.date, latestSession.time_str) : <span className="text-slate-400 italic">-</span>}
                      </td>

                      {/* Aksi Kolom */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* BUKA BUKU */}
                          <button
                            id={`btn-open-book-${student.student_id}`}
                            onClick={() => onOpenStudentBook(student)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                            title="Buka Buku Catatan Digital Siswa"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>BUKA BUKU</span>
                          </button>

                          {/* Fast Export PDF */}
                          <button
                            onClick={() => downloadStudentBookPDF({ student, sessions: studentSessions })}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Download PDF Seluruh Catatan Siswa Ini"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Student Info */}
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Edit Data Identitas Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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

      {/* Modal Add Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Tambah Siswa Baru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Satu siswa akan memiliki satu buku catatan terapi digital.
            </p>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-teal-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID Siswa / No. Rekam Medis (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RM-2026-004"
                  value={newStudentCustomId}
                  onChange={(e) => setNewStudentCustomId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Berguna untuk membedakan apabila ada siswa dengan nama serupa.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Simpan & Buat Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Student */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Edit Data Siswa
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui nama siswa, ID rekam medis, atau catatan wali.
            </p>

            <form onSubmit={handleSaveEditStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.student_name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, student_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID Siswa / No. Rekam Medis
                </label>
                <input
                  type="text"
                  value={editingStudent.custom_id || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, custom_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Orang Tua / Wali
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Budi & Ibu Siti"
                  value={editingStudent.guardian_name || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, guardian_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
