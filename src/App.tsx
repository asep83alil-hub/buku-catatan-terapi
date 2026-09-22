import React, { useState, useEffect } from 'react';
import {
  Student,
  TherapySession,
  ViewTab,
  ParsedSpreadsheetRow,
  ImportCommitResult
} from './types';
import {
  getStoredStudents,
  saveStudents,
  getStoredSessions,
  saveSessions,
  getOrCreateStudent,
  generateSessionKey,
  generateSessionHash,
  deduplicateSessionsList
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StudentListView } from './components/StudentListView';
import { StudentBookView } from './components/StudentBookView';
import { AllSessionsView } from './components/AllSessionsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { UploadModal } from './components/UploadModal';
import { SessionModal } from './components/SessionModal';
import { PrintModal } from './components/PrintModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TherapySession | null>(null);
  const [defaultStudentForModal, setDefaultStudentForModal] = useState<Student | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSingleSession, setPrintSingleSession] = useState<TherapySession | null>(null);
  const [deletingSession, setDeletingSession] = useState<TherapySession | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize data from LocalStorage (or sample data on first run)
  useEffect(() => {
    const loadedStudents = getStoredStudents();
    const loadedSessions = getStoredSessions();
    setStudents(loadedStudents);
    setSessions(loadedSessions);

    if (loadedStudents.length > 0 && !selectedStudent) {
      setSelectedStudent(loadedStudents[0]);
    }
  }, []);

  // Sync to localStorage
  const updateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents);
  };

  const updateSessions = (newSessions: TherapySession[]) => {
    setSessions(newSessions);
    saveSessions(newSessions);
  };

  const handleClearAllSessions = () => {
    updateSessions([]);
  };

  const handleReloadData = () => {
    const s = getStoredStudents();
    const sess = getStoredSessions();
    setStudents(s);
    setSessions(sess);
    if (s.length > 0) {
      setSelectedStudent(s[0]);
    } else {
      setSelectedStudent(null);
    }
  };

  // Open Student Book
  const handleOpenStudentBook = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab('book');
  };

  // Add / Edit Therapy Session
  const handleSaveSession = (data: {
    student_id?: string;
    student_name: string;
    date: string;
    therapist_name: string;
    therapy_type: string;
    session_progress: string;
    intervention_program: string;
    child_response: string;
  }) => {
    const hash = generateSessionHash(
      data.date,
      data.student_name,
      data.therapist_name,
      data.therapy_type,
      data.session_progress,
      data.intervention_program,
      data.child_response
    );

    let targetStudent: Student;
    let currentStudents = [...students];

    if (data.student_id) {
      const found = currentStudents.find((s) => s.student_id === data.student_id);
      if (found) {
        targetStudent = found;
      } else {
        const res = getOrCreateStudent(currentStudents, data.student_name);
        targetStudent = res.student;
        currentStudents = res.updatedStudents;
        updateStudents(currentStudents);
      }
    } else {
      const res = getOrCreateStudent(currentStudents, data.student_name);
      targetStudent = res.student;
      currentStudents = res.updatedStudents;
      updateStudents(currentStudents);
    }

    if (editingSession) {
      // Update existing
      const updated = sessions.map((s) => {
        if (s.session_id === editingSession.session_id) {
          return {
            ...s,
            student_id: targetStudent.student_id,
            student_name: targetStudent.student_name,
            date: data.date,
            therapist_name: data.therapist_name,
            therapy_type: data.therapy_type,
            session_progress: data.session_progress,
            intervention_program: data.intervention_program,
            child_response: data.child_response,
            signature_hash: hash,
            updated_at: new Date().toISOString(),
          };
        }
        return s;
      });
      const { deduped } = deduplicateSessionsList(updated);
      updateSessions(deduped);
    } else {
      // Periksa apakah sesi dengan kunci identitas unik yang sama sudah ada di database
      const newKey = generateSessionKey(
        data.date,
        targetStudent.student_name,
        data.therapist_name,
        data.therapy_type
      );
      const existingMatchIdx = sessions.findIndex(
        (s) =>
          !s.is_deleted &&
          generateSessionKey(
            s.date,
            s.student_name,
            s.therapist_name,
            s.therapy_type,
            s.session_schedule,
            s.time_str
          ) === newKey
      );

      if (existingMatchIdx !== -1) {
        // Data sudah ada: perbarui baris yang sudah ada, jangan membuat baris ganda
        const updated = [...sessions];
        const existing = updated[existingMatchIdx];
        updated[existingMatchIdx] = {
          ...existing,
          session_progress: data.session_progress || existing.session_progress,
          intervention_program: data.intervention_program || existing.intervention_program,
          child_response: data.child_response || existing.child_response,
          updated_at: new Date().toISOString(),
        };
        const { deduped } = deduplicateSessionsList(updated);
        updateSessions(deduped);
      } else {
        // Add new
        const newSession: TherapySession = {
          session_id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          student_id: targetStudent.student_id,
          student_name: targetStudent.student_name,
          date: data.date,
          therapist_name: data.therapist_name,
          therapy_type: data.therapy_type,
          session_progress: data.session_progress,
          intervention_program: data.intervention_program,
          child_response: data.child_response,
          signature_hash: hash,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { deduped } = deduplicateSessionsList([newSession, ...sessions]);
        updateSessions(deduped);
      }
    }

    // Set active student book
    setSelectedStudent(targetStudent);
    setEditingSession(null);
  };

  // Commit Spreadsheet Import with Anti-Duplication & In-Place Update Logic
  const handleCommitImport = (validRows: ParsedSpreadsheetRow[]): ImportCommitResult => {
    let currentStudents = [...students];
    let currentSessions = [...sessions];

    // Indeks sesi yang ada berdasarkan kunci identitas unik:
    // (Tanggal + Nama Siswa + Nama Terapis + Jenis Terapi + Sesi)
    const sessionIndexByKey = new Map<string, number>();
    currentSessions.forEach((s, idx) => {
      if (!s.is_deleted) {
        const key = generateSessionKey(
          s.date,
          s.student_name,
          s.therapist_name,
          s.therapy_type,
          s.session_schedule,
          s.time_str
        );
        sessionIndexByKey.set(key, idx);
      }
    });

    let addedCount = 0;
    let updatedCount = 0;
    let exactDupCount = 0;
    const affectedStudentNames = new Set<string>();

    validRows.forEach((row) => {
      const key = generateSessionKey(
        row.date,
        row.studentName,
        row.therapistName,
        row.therapyType,
        row.sessionSchedule,
        row.timeStr
      );

      // Get or create 1 buku catatan untuk siswa ini (1 Siswa = 1 Buku Catatan)
      const res = getOrCreateStudent(currentStudents, row.studentName);
      const studentObj = res.student;
      currentStudents = res.updatedStudents;
      affectedStudentNames.add(studentObj.student_name);

      if (sessionIndexByKey.has(key)) {
        // DATA SUDAH ADA!
        // Aturan: "Jika data yang akan dimasukkan sudah tersedia, jangan membuat baris baru. Gunakan data yang sudah ada."
        // "Jika data lama perlu diperbarui, update baris yang sudah ada, bukan membuat baris baru."
        const existingIdx = sessionIndexByKey.get(key)!;
        const existingSession = currentSessions[existingIdx];

        const hasContentChange =
          (row.sessionProgress && row.sessionProgress.trim() !== (existingSession.session_progress || '').trim()) ||
          (row.interventionProgram && row.interventionProgram.trim() !== (existingSession.intervention_program || '').trim()) ||
          (row.childResponse && row.childResponse.trim() !== (existingSession.child_response || '').trim());

        if (hasContentChange) {
          // Update baris yang sudah ada secara in-place!
          currentSessions[existingIdx] = {
            ...existingSession,
            session_progress: row.sessionProgress || existingSession.session_progress,
            intervention_program: row.interventionProgram || existingSession.intervention_program,
            child_response: row.childResponse || existingSession.child_response,
            time_str: row.timeStr || existingSession.time_str,
            session_schedule: row.sessionSchedule || existingSession.session_schedule,
            raw_timestamp: row.rawTimestamp || existingSession.raw_timestamp,
            updated_at: new Date().toISOString(),
          };
          updatedCount++;
        } else {
          // Data persis sama, dipertahankan satu data tanpa duplikasi
          exactDupCount++;
        }
      } else {
        // DATA BELUM ADA: Tambahkan sebagai sesi baru
        const newSession: TherapySession = {
          session_id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          student_id: studentObj.student_id,
          student_name: studentObj.student_name,
          nickname: studentObj.nickname,
          date: row.date,
          time_str: row.timeStr,
          session_schedule: row.sessionSchedule,
          raw_timestamp: row.rawTimestamp,
          therapist_name: row.therapistName,
          therapy_type: row.therapyType,
          session_progress: row.sessionProgress,
          intervention_program: row.interventionProgram,
          child_response: row.childResponse,
          signature_hash: key,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        currentSessions.unshift(newSession);
        // Daftarkan ke lookup agar baris berikutnya di file yang sama tidak menduplikasi
        sessionIndexByKey.set(key, 0);
        for (const [k, oldIdx] of sessionIndexByKey.entries()) {
          if (k !== key) sessionIndexByKey.set(k, oldIdx + 1);
        }
        addedCount++;
      }
    });

    // Aturan Mandat: "Sebelum menyimpan hasil akhir, lakukan pemeriksaan duplikasi otomatis."
    // "Jumlah data setelah proses harus sesuai dengan jumlah data unik yang sebenarnya, bukan jumlah data yang ter-input berulang."
    const { deduped, removedDuplicatesCount } = deduplicateSessionsList(currentSessions);
    const finalSessions = deduped;

    // Simpan ke state dan localStorage
    updateStudents(currentStudents);
    updateSessions(finalSessions);

    // Arahkan ke buku siswa yang terdampak
    const firstAffected = currentStudents.find((s) =>
      affectedStudentNames.has(s.student_name)
    );
    if (firstAffected) {
      setSelectedStudent(firstAffected);
    }

    return {
      addedSessionsCount: addedCount,
      updatedSessionsCount: updatedCount,
      exactDuplicateCount: exactDupCount + removedDuplicatesCount,
      potentialDuplicatesCount: validRows.filter((r) => r.matchType === 'potential_duplicate').length,
      affectedStudents: Array.from(affectedStudentNames),
      totalSessionsAfter: finalSessions.filter((s) => !s.is_deleted).length,
    };
  };

  // Add new student manually
  const handleAddNewStudent = (name: string, customId?: string) => {
    const res = getOrCreateStudent(students, name, customId);
    updateStudents(res.updatedStudents);
    setSelectedStudent(res.student);
    setActiveTab('book');
  };

  // Update student identity
  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) =>
      s.student_id === updatedStudent.student_id ? updatedStudent : s
    );
    updateStudents(updated);
    if (selectedStudent?.student_id === updatedStudent.student_id) {
      setSelectedStudent(updatedStudent);
    }
  };

  // Soft delete student
  const handleDeleteStudent = (target: Student) => {
    if (window.confirm(`Hapus buku catatan siswa ${target.student_name}?`)) {
      const updated = students.map((s) =>
        s.student_id === target.student_id ? { ...s, is_deleted: true } : s
      );
      updateStudents(updated);
      const remaining = updated.filter((s) => !s.is_deleted);
      setSelectedStudent(remaining[0] || null);
    }
  };

  // Soft delete session (Point 19)
  const handleConfirmSoftDeleteSession = (sessionId: string) => {
    const updated = sessions.map((s) =>
      s.session_id === sessionId
        ? { ...s, is_deleted: true, deleted_at: new Date().toISOString() }
        : s
    );
    updateSessions(updated);
  };

  // Restore soft-deleted session
  const handleRestoreSession = (sessionId: string) => {
    const updated = sessions.map((s) =>
      s.session_id === sessionId ? { ...s, is_deleted: false, deleted_at: undefined } : s
    );
    updateSessions(updated);
  };

  // Permanent delete from recycle bin
  const handlePermanentDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.session_id !== sessionId);
    updateSessions(updated);
  };

  // Open modals
  const handleOpenAddSession = (defaultStudentParam?: Student | null) => {
    setEditingSession(null);
    setDefaultStudentForModal(defaultStudentParam || selectedStudent || null);
    setIsSessionModalOpen(true);
  };

  const handleOpenEditSession = (session: TherapySession) => {
    setEditingSession(session);
    setIsSessionModalOpen(true);
  };

  const handleOpenPrintModal = (student: Student, session?: TherapySession) => {
    setSelectedStudent(student);
    setPrintSingleSession(session || null);
    setIsPrintModalOpen(true);
  };

  const activeStudentsList = students.filter((s) => !s.is_deleted);
  const activeSessionsList = sessions.filter((s) => !s.is_deleted);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sidebar Navigation (Poin 20) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={activeStudentsList.length}
        sessionCount={activeSessionsList.length}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAddSession={() => handleOpenAddSession(selectedStudent)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenAddSession={() => handleOpenAddSession(selectedStudent)}
          selectedStudent={selectedStudent}
          students={activeStudentsList}
          onSelectStudent={(s) => setSelectedStudent(s)}
        />

        {/* View Switcher Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              sessions={sessions}
              onOpenStudentBook={handleOpenStudentBook}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenAddSession={() => handleOpenAddSession(null)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'students' && (
            <StudentListView
              students={students}
              sessions={sessions}
              onOpenStudentBook={handleOpenStudentBook}
              onAddNewStudent={handleAddNewStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          )}

          {activeTab === 'book' && (
            selectedStudent ? (
              <StudentBookView
                student={selectedStudent}
                sessions={sessions}
                onBackToStudents={() => setActiveTab('students')}
                onOpenAddSessionForStudent={(st) => handleOpenAddSession(st)}
                onEditSession={handleOpenEditSession}
                onDeleteSession={(sess) => setDeletingSession(sess)}
                onOpenPrintModal={handleOpenPrintModal}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                <p className="text-slate-500 text-sm">
                  Belum ada siswa yang dipilih. Silakan buka menu Data Siswa untuk memilih buku catatan.
                </p>
                <button
                  onClick={() => setActiveTab('students')}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold"
                >
                  Pilih Siswa
                </button>
              </div>
            )
          )}

          {activeTab === 'sessions' && (
            <AllSessionsView
              students={students}
              sessions={sessions}
              onOpenStudentBook={handleOpenStudentBook}
              onEditSession={handleOpenEditSession}
              onDeleteSession={(sess) => setDeletingSession(sess)}
              onOpenAddSession={() => handleOpenAddSession(null)}
              onClearAllSessions={handleClearAllSessions}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              students={students}
              sessions={sessions}
              onOpenPrintModal={handleOpenPrintModal}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              students={students}
              sessions={sessions}
              onReloadData={handleReloadData}
              onRestoreSession={handleRestoreSession}
              onPermanentDeleteSession={handlePermanentDeleteSession}
              onClearAllSessions={handleClearAllSessions}
            />
          )}
        </main>
      </div>

      {/* Modal 1: Upload Spreadsheet (Point 2) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        existingSessions={sessions}
        onCommitImport={handleCommitImport}
      />

      {/* Modal 2: Add / Edit Session (Point 10 & 11) */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => {
          setIsSessionModalOpen(false);
          setEditingSession(null);
        }}
        editingSession={editingSession}
        defaultStudent={defaultStudentForModal}
        students={activeStudentsList}
        onSaveSession={handleSaveSession}
      />

      {/* Modal 3: Print & Export PDF (Point 14 & 15) */}
      {selectedStudent && (
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setPrintSingleSession(null);
          }}
          student={selectedStudent}
          allSessions={sessions}
          selectedSingleSession={printSingleSession}
          allStudents={activeStudentsList}
        />
      )}

      {/* Modal 4: Delete Confirmation with Soft-Delete (Point 19) */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        session={deletingSession}
        onConfirmDelete={handleConfirmSoftDeleteSession}
      />
    </div>
  );
}
