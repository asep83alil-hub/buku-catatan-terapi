import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  User,
  Activity,
  Printer,
  FileDown,
  PlusCircle,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  Search,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';
import { Student, TherapySession, FilterOptions } from '../types';
import { formatDisplayDate } from '../utils/excelParser';
import { PelangiLogo } from './PelangiLogo';

interface StudentBookViewProps {
  student: Student;
  sessions: TherapySession[];
  onBackToStudents: () => void;
  onOpenAddSessionForStudent: (student: Student) => void;
  onEditSession: (session: TherapySession) => void;
  onDeleteSession: (session: TherapySession) => void;
  onOpenPrintModal: (student: Student, session?: TherapySession) => void;
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
  return 'bg-teal-100 text-teal-800 border-teal-200';
}

export const StudentBookView: React.FC<StudentBookViewProps> = ({
  student,
  sessions,
  onBackToStudents,
  onOpenAddSessionForStudent,
  onEditSession,
  onDeleteSession,
  onOpenPrintModal,
}) => {
  // Filters state (Point 13 & 8)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [therapyTypeFilter, setTherapyTypeFilter] = useState('all');
  const [therapistFilter, setTherapistFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Active sessions for this student only (Point 1 & 7)
  const studentSessions = useMemo(() => {
    return sessions.filter(
      (s) => s.student_id === student.student_id && !s.is_deleted
    );
  }, [sessions, student.student_id]);

  // Distinct Therapy Types for this student
  const availableTherapyTypes = useMemo(() => {
    const set = new Set<string>();
    studentSessions.forEach((s) => {
      if (s.therapy_type) set.add(s.therapy_type.trim());
    });
    return Array.from(set);
  }, [studentSessions]);

  // Distinct Therapists for this student
  const availableTherapists = useMemo(() => {
    const set = new Set<string>();
    studentSessions.forEach((s) => {
      if (s.therapist_name) set.add(s.therapist_name.trim());
    });
    return Array.from(set);
  }, [studentSessions]);

  // Calculate Period summary (Point 7: "Periode: September 2026")
  const periodSummary = useMemo(() => {
    if (studentSessions.length === 0) return 'Belum Ada Sesi';
    const dates = studentSessions
      .map((s) => s.date)
      .filter(Boolean)
      .sort();
    if (dates.length === 0) return 'Belum Ada Sesi';

    const first = formatDisplayDate(dates[0]);
    const last = formatDisplayDate(dates[dates.length - 1]);
    return first === last ? first : `${first} — ${last}`;
  }, [studentSessions]);

  // Filtered and Sorted Sessions
  const displayedSessions = useMemo(() => {
    let result = [...studentSessions];

    // Search keyword across notes
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (s) =>
          s.session_progress.toLowerCase().includes(q) ||
          s.intervention_program.toLowerCase().includes(q) ||
          s.child_response.toLowerCase().includes(q) ||
          s.therapy_type.toLowerCase().includes(q) ||
          s.therapist_name.toLowerCase().includes(q) ||
          s.date.toLowerCase().includes(q)
      );
    }

    // Therapy Type Filter
    if (therapyTypeFilter !== 'all') {
      result = result.filter((s) => s.therapy_type.trim().toLowerCase() === therapyTypeFilter.toLowerCase());
    }

    // Therapist Filter
    if (therapistFilter !== 'all') {
      result = result.filter((s) => s.therapist_name.trim().toLowerCase() === therapistFilter.toLowerCase());
    }

    // Date Range Filter (Point 13)
    const now = new Date();
    if (dateFilter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      result = result.filter((s) => s.date === todayStr);
    } else if (dateFilter === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      result = result.filter((s) => new Date(s.date) >= startOfWeek);
    } else if (dateFilter === 'this_month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      result = result.filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (dateFilter === 'custom') {
      if (startDate) {
        result = result.filter((s) => s.date >= startDate);
      }
      if (endDate) {
        result = result.filter((s) => s.date <= endDate);
      }
    }

    // Sort order (Point 8: Default: Urutan terbaru → terlama, but with toggle)
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return result;
  }, [
    studentSessions,
    searchKeyword,
    therapyTypeFilter,
    therapistFilter,
    dateFilter,
    startDate,
    endDate,
    sortOrder,
  ]);

  const resetFilters = () => {
    setSearchKeyword('');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setTherapyTypeFilter('all');
    setTherapistFilter('all');
    setSortOrder('newest');
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <button
          onClick={onBackToStudents}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Siswa</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* CETAK BUKU */}
          <button
            id="btn-print-student-book"
            onClick={() => onOpenPrintModal(student)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>CETAK BUKU (A4)</span>
          </button>

          {/* EXPORT PDF */}
          <button
            id="btn-export-student-pdf"
            onClick={() => onOpenPrintModal(student)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-sky-600" />
            <span>EXPORT PDF</span>
          </button>

          {/* TAMBAH CATATAN TERAPI */}
          <button
            id="btn-add-session-in-book"
            onClick={() => onOpenAddSessionForStudent(student)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ TAMBAH CATATAN TERAPI</span>
          </button>
        </div>
      </div>

      {/* Point 7: BUKU CATATAN TERAPI & INFORMASI RINGKASAN */}
      <div className="bg-white rounded-2xl border-2 border-teal-600/30 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-bl-full pointer-events-none" />

        {/* Brand Banner: Pusat Terapi Tumbuh Kembang Anak - Pelangi Lazuardi */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl shadow-2xs">
              <PelangiLogo variant="horizontal" className="h-10 sm:h-12 w-auto" />
            </div>
            <div className="h-9 w-[1px] bg-slate-200 hidden sm:block" />
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-800 block">
                PUSAT TERAPI TUMBUH KEMBANG ANAK
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span>Pelangi Lazuardi</span>
                <span>•</span>
                <span className="text-teal-700 font-semibold">Buku Catatan Terapi Siswa</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Rekam Resmi Pelangi Lazuardi Terverifikasi</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-teal-200 p-1.5 flex items-center justify-center shadow-xs shrink-0">
              <PelangiLogo variant="icon" className="h-10 w-auto" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Buku Catatan Digital
                </span>
                {student.nickname && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Panggilan: {student.nickname}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  ID: {student.custom_id || student.student_id}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
                BUKU CATATAN TERAPI {student.student_name.toUpperCase()}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekam jejak perkembangan dan intervensi terapi siswa secara berkesinambungan • Pelangi Lazuardi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Dokumen</span>
              <span className="text-xs font-bold text-teal-800">Buku Catatan Terverifikasi</span>
            </div>
          </div>
        </div>

        {/* Informasi Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 text-xs">
          {/* Status Catatan (Menggantikan Total Sesi Tercatat) */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-emerald-700 text-[11px] font-semibold block">Status Catatan:</span>
            <span className="font-bold text-emerald-900 text-xs mt-0.5 block flex items-center gap-1.5">
              <span>✓ Rekam Resmi Pelangi Lazuardi Terverifikasi</span>
            </span>
          </div>

          {/* Jenis Terapi */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[11px] font-medium block">Jenis Terapi:</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
              {availableTherapyTypes.length > 0
                ? availableTherapyTypes.join(', ')
                : 'Belum Ada'}
            </span>
          </div>

          {/* Terapis */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[11px] font-medium block">Terapis Pembimbing:</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
              {availableTherapists.length > 0
                ? availableTherapists.join(', ')
                : 'Belum Ada'}
            </span>
          </div>

          {/* Periode */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[11px] font-medium block">Periode Catatan:</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
              {periodSummary}
            </span>
          </div>
        </div>
      </div>

      {/* Point 13: FILTER & SORTING CONTROL BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Filter & Urutan Catatan</span>
          </div>
          {(dateFilter !== 'all' || therapyTypeFilter !== 'all' || therapistFilter !== 'all' || searchKeyword) && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Keyword Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Kata Kunci:</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari materi, respon, atau progres..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500"
              />
            </div>
          </div>

          {/* Date Filter (Point 13) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Berdasarkan Tanggal:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-medium text-slate-700"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="this_week">Minggu Ini</option>
              <option value="this_month">Bulan Ini</option>
              <option value="custom">Rentang Tanggal Khusus</option>
            </select>
          </div>

          {/* Jenis Terapi Filter (Point 13) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Terapi:</label>
            <select
              value={therapyTypeFilter}
              onChange={(e) => setTherapyTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-medium text-slate-700"
            >
              <option value="all">Semua Jenis Terapi</option>
              {availableTherapyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Terapis Filter (Point 13) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Terapis:</label>
            <select
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-medium text-slate-700"
            >
              <option value="all">Semua Terapis</option>
              {availableTherapists.map((therapist) => (
                <option key={therapist} value={therapist}>
                  {therapist}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if selected */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded-md bg-white text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded-md bg-white text-xs"
              />
            </div>
          </div>
        )}

        {/* Sort Order Selector (Point 8) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Urutan Sesi:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setSortOrder('newest')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  sortOrder === 'newest'
                    ? 'bg-white text-teal-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Terbaru → Terlama (Default)
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('oldest')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  sortOrder === 'oldest'
                    ? 'bg-white text-teal-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Terlama → Terbaru
              </button>
            </div>
          </div>

          <div className="text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{displayedSessions.length}</span> dari {studentSessions.length} sesi
          </div>
        </div>
      </div>

      {/* Point 8: DAFTAR KARTU SESI TERAPI */}
      <div className="space-y-4">
        {displayedSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Tidak ada sesi terapi</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {studentSessions.length === 0
                ? `Buku catatan ${student.student_name} masih kosong. Silakan tambah catatan manual atau import spreadsheet.`
                : 'Tidak ada sesi yang cocok dengan filter yang Anda pilih.'}
            </p>
            {studentSessions.length === 0 && (
              <button
                onClick={() => onOpenAddSessionForStudent(student)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Buat Catatan Sesi Pertama</span>
              </button>
            )}
          </div>
        ) : (
          displayedSessions.map((session, index) => {
            const sessionNum = sortOrder === 'newest'
              ? displayedSessions.length - index
              : index + 1;

            return (
              <div
                key={session.session_id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all overflow-hidden print-session-card"
              >
                {/* Session Card Header (Point 8 Format) */}
                <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      #{sessionNum}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800 tracking-wide flex items-center gap-1.5">
                        <PelangiLogo variant="icon" className="h-4 w-auto" />
                        <span>CATATAN SESI TERAPI</span>
                        <span className="text-teal-700 font-semibold text-[10px] hidden sm:inline">• Pelangi Lazuardi</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-teal-800">
                          Tanggal: {formatDisplayDate(session.date)}
                        </span>
                        <span>•</span>
                        <span>Terapis: <strong className="text-slate-700">{session.therapist_name}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Therapy Type Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTherapyBadgeClass(session.therapy_type)}`}>
                      {session.therapy_type}
                    </span>

                    {/* Actions: Edit, Print, Hapus (Point 11, 14, 19) */}
                    <div className="flex items-center gap-1 no-print">
                      <button
                        onClick={() => onOpenPrintModal(student, session)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                        title="Cetak Catatan Sesi Ini"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-edit-session-${session.session_id}`}
                        onClick={() => onEditSession(session)}
                        className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Catatan Sesi Ini"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-delete-session-${session.session_id}`}
                        onClick={() => onDeleteSession(session)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Catatan Sesi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Card Body (Exact 3 Sections - Point 8 & 9) */}
                <div className="p-5 space-y-4 text-xs">
                  {/* 1. LEMBAR PROGRES SESI */}
                  <div className="space-y-1 bg-amber-50/40 p-3.5 rounded-lg border border-amber-100/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                      LEMBAR PROGRES SESI
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                      {session.session_progress || '-'}
                    </p>
                  </div>

                  {/* 2. PROGRAM INTERVENSI */}
                  <div className="space-y-1 bg-sky-50/40 p-3.5 rounded-lg border border-sky-100/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 block">
                      PROGRAM INTERVENSI
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                      {session.intervention_program || '-'}
                    </p>
                  </div>

                  {/* 3. RESPON ANANDA TERHADAP INTERVENSI */}
                  <div className="space-y-1 bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-100/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
                      RESPON ANANDA TERHADAP INTERVENSI
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                      {session.child_response || '-'}
                    </p>
                  </div>

                  {/* Paraf Terapis */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      <span>Dicatat pada: {new Date(session.created_at || session.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="text-right">
                      <span>Paraf Terapis: <strong>{session.therapist_name}</strong></span>
                      <div className="w-32 border-b border-dashed border-slate-400 mt-3 ml-auto" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
