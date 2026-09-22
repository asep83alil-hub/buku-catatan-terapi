import { Student, TherapySession } from '../types';
import { parseInitialPelangiData } from '../data/pelangiData';
import { parseStudentName } from './excelParser';

const STORAGE_KEY_STUDENTS = 'terapi_siswa_students_v3';
const STORAGE_KEY_SESSIONS = 'terapi_siswa_sessions_v3';

/**
 * Normalisasi Jadwal / Sesi
 * Jika berupa format jam HH:MM:SS atau HH:MM, diseragamkan ke format HH:MM
 * sehingga perbedaan detik tidak membuat data terduplikasi secara keliru.
 * Jika berupa nama sesi (Sesi 1, Pagi, dsb), dibersihkan dari spasi berlebih.
 */
export function normalizeSessionSchedule(schedule?: string, timeStr?: string): string {
  const raw = (schedule || timeStr || '').trim().toLowerCase();
  if (!raw) return 'sesi-1';
  const timeMatch = raw.match(/(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?/);
  if (timeMatch) {
    const hh = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
    const mm = timeMatch[2];
    return `${hh}:${mm}`;
  }
  return raw.replace(/\s+/g, ' ');
}

/**
 * IDENTITAS UNIK SESI (Aturan Utama Sistem Anti-Duplikasi):
 * Kombinasi: Tanggal + Nama Siswa + Nama Terapis + Jenis Terapi + Jadwal/Sesi
 * Digunakan sebagai kunci unik mutlak untuk menentukan apakah suatu data
 * merupakan sesi baru atau duplikat/pembaruan sesi yang sudah ada.
 */
export function generateSessionKey(
  date: string,
  studentName: string,
  therapistName: string,
  therapyType: string,
  sessionSchedule?: string,
  timeStr?: string
): string {
  const normDate = (date || '').trim();
  const parsedStudent = parseStudentName(studentName);
  const normStudent = (parsedStudent.fullName || studentName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normTherapist = (therapistName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normTherapy = (therapyType || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normSession = normalizeSessionSchedule(sessionSchedule, timeStr);

  return `${normDate}__${normStudent}__${normTherapist}__${normTherapy}__${normSession}`;
}

/**
 * Kunci Deteksi Potensi Duplikat:
 * Menandai potensi jika Siswa, Tanggal, dan Jenis Terapi sama persis pada hari yang sama,
 * namun terdapat sedikit variasi pada penulisan terapis atau jam sesi.
 */
export function generatePotentialDuplicateKey(
  date: string,
  studentName: string,
  therapyType: string
): string {
  const normDate = (date || '').trim();
  const parsedStudent = parseStudentName(studentName);
  const normStudent = (parsedStudent.fullName || studentName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normTherapy = (therapyType || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${normDate}__${normStudent}__${normTherapy}`;
}

// Canonical hash backward compatibility
export function generateSessionHash(
  date: string,
  studentName: string,
  therapistName: string,
  therapyType: string,
  progress?: string,
  intervention?: string,
  response?: string,
  sessionSchedule?: string,
  timeStr?: string
): string {
  return generateSessionKey(date, studentName, therapistName, therapyType, sessionSchedule, timeStr);
}

// Default dataset initialized to empty as requested (all notes cleared)
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_SESSIONS: TherapySession[] = [];

// Sample Pelangi clinic dataset for optional reload in Settings
export function getSamplePelangiData(): { students: Student[]; sessions: TherapySession[] } {
  return parseInitialPelangiData();
}

/**
 * Fungsi Audit dan Pembersihan Duplikasi Otomatis:
 * Memastikan tidak ada dua sesi aktif yang memiliki kombinasi
 * (Tanggal + Nama Siswa + Nama Terapis + Jenis Terapi + Sesi) yang sama.
 * Jika ditemukan data ganda, hanya 1 data yang dipertahankan dengan konten terlengkap.
 */
export function deduplicateSessionsList(sessions: TherapySession[]): {
  deduped: TherapySession[];
  removedDuplicatesCount: number;
} {
  const seenMap = new Map<string, TherapySession>();
  let removedDuplicatesCount = 0;

  // Urutkan dari yang terbaru diperbarui
  const sorted = [...sessions].sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  sorted.forEach((s) => {
    if (s.is_deleted) return;
    const key = generateSessionKey(
      s.date,
      s.student_name,
      s.therapist_name,
      s.therapy_type,
      s.session_schedule,
      s.time_str
    );

    if (seenMap.has(key)) {
      removedDuplicatesCount++;
      const existing = seenMap.get(key)!;
      // Perbarui jika catatan data yang baru diperiksa memiliki isi yang lebih lengkap
      const existingLen =
        (existing.session_progress?.length || 0) +
        (existing.intervention_program?.length || 0) +
        (existing.child_response?.length || 0);
      const currentLen =
        (s.session_progress?.length || 0) +
        (s.intervention_program?.length || 0) +
        (s.child_response?.length || 0);

      if (currentLen > existingLen) {
        seenMap.set(key, {
          ...existing,
          session_progress: s.session_progress || existing.session_progress,
          intervention_program: s.intervention_program || existing.intervention_program,
          child_response: s.child_response || existing.child_response,
          time_str: s.time_str || existing.time_str,
          session_schedule: s.session_schedule || existing.session_schedule,
          updated_at: s.updated_at || existing.updated_at,
        });
      }
    } else {
      seenMap.set(key, s);
    }
  });

  const nonDeleted = Array.from(seenMap.values());
  const deleted = sessions.filter((s) => s.is_deleted);

  return {
    deduped: [...nonDeleted, ...deleted],
    removedDuplicatesCount,
  };
}

export function getStoredStudents(): Student[] {
  try {
    // Bersihkan key lama jika ada
    if (localStorage.getItem('terapi_siswa_students_v2')) {
      localStorage.removeItem('terapi_siswa_students_v2');
    }
    if (localStorage.getItem('terapi_siswa_students_v1')) {
      localStorage.removeItem('terapi_siswa_students_v1');
    }

    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return INITIAL_STUDENTS;
  } catch (err) {
    console.error('Failed to parse students from localStorage:', err);
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.error('Failed to save students:', err);
  }
}

export function getStoredSessions(): TherapySession[] {
  try {
    // Bersihkan key lama jika ada
    if (localStorage.getItem('terapi_siswa_sessions_v2')) {
      localStorage.removeItem('terapi_siswa_sessions_v2');
    }
    if (localStorage.getItem('terapi_siswa_sessions_v1')) {
      localStorage.removeItem('terapi_siswa_sessions_v1');
    }

    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    let loaded: TherapySession[] = INITIAL_SESSIONS;
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        loaded = parsed;
      }
    }

    // Auto-audit dan pembersihan duplikasi otomatis pada saat memuat data
    const { deduped, removedDuplicatesCount } = deduplicateSessionsList(loaded);
    if (removedDuplicatesCount > 0) {
      saveSessions(deduped);
    }
    return deduped;
  } catch (err) {
    console.error('Failed to parse sessions from localStorage:', err);
    return INITIAL_SESSIONS;
  }
}

export function saveSessions(sessions: TherapySession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save sessions:', err);
  }
}

// Clear all session notes only
export function clearAllSessions(): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify([]));
  } catch (err) {
    console.error('Failed to clear sessions:', err);
  }
}

// Check if student exists or create
export function getOrCreateStudent(
  students: Student[],
  rawName: string,
  customId?: string
): { student: Student; isNew: boolean; updatedStudents: Student[]; nameConflictWarning?: string } {
  const trimmed = rawName.trim();
  const parsed = parseStudentName(trimmed);
  const normalizedFull = parsed.fullName.toLowerCase();

  // Match by exact original name, or by full name
  const existing = students.find((s) => {
    if (s.is_deleted) return false;
    const sParsed = parseStudentName(s.student_name);
    return (
      s.student_name.trim().toLowerCase() === trimmed.toLowerCase() ||
      sParsed.fullName.toLowerCase() === normalizedFull
    );
  });

  if (existing) {
    let warning: string | undefined;
    if (customId && existing.custom_id && existing.custom_id !== customId) {
      warning = `Terdapat nama siswa yang sama "${trimmed}" dengan ID berbeda (${existing.custom_id} vs ${customId}). Silakan gunakan ID Siswa untuk membedakan data.`;
    }
    return { student: existing, isNew: false, updatedStudents: students, nameConflictWarning: warning };
  }

  // Create new student
  const newId = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newStudent: Student = {
    student_id: newId,
    student_name: trimmed,
    nickname: parsed.nickname,
    custom_id: customId || `RM-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_deleted: false,
  };

  const updatedStudents = [...students, newStudent];
  return { student: newStudent, isNew: true, updatedStudents };
}

// Reset data to demo sample (Klinik Pelangi)
export function resetDatabaseToDefault(): { students: Student[]; sessions: TherapySession[] } {
  const sample = getSamplePelangiData();
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(sample.students));
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sample.sessions));
  return { students: sample.students, sessions: sample.sessions };
}

// Clear all data
export function clearAllDatabase(): void {
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify([]));
}
