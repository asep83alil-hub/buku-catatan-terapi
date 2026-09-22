export interface Student {
  student_id: string;
  student_name: string;
  nickname?: string; // e.g. 'Adnan' from 'Adnan Lutfan Malik (Adnan)'
  custom_id?: string; // Optional official ID (e.g. RM-001)
  birth_date?: string;
  guardian_name?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
}

export interface TherapySession {
  session_id: string;
  student_id: string;
  student_name: string;
  nickname?: string;
  date: string; // YYYY-MM-DD
  time_str?: string; // e.g. 09:39:18
  session_schedule?: string; // Jadwal / Sesi e.g. '09:00 - 10:00' or 'Sesi 1'
  raw_timestamp?: string; // e.g. 9/16/2026 9:39:18
  therapist_name: string;
  therapy_type: string; // e.g., 'Terapi Wicara', 'Okupasi Terapi /SI', 'Fisioterapi', etc.
  session_progress: string; // Lembar Progres Sesi
  intervention_program: string; // Program Intervensi
  child_response: string; // Respon Ananda Terhadap Intervensi
  signature_hash?: string; // For duplicate prevention
  is_deleted?: boolean; // Soft delete
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SpreadsheetRowRaw {
  [key: string]: any;
}

export interface ParsedSpreadsheetRow {
  rowIndex: number;
  date: string;
  timeStr?: string;
  sessionSchedule?: string; // Sesi / Jadwal
  rawTimestamp?: string;
  studentName: string;
  therapistName: string;
  therapyType: string;
  sessionProgress: string;
  interventionProgram: string;
  childResponse: string;
  isValid: boolean;
  validationErrors: string[];
  isDuplicate?: boolean;
  matchType?: 'new' | 'update' | 'exact_match' | 'potential_duplicate';
  matchedSessionId?: string;
  matchDetails?: string;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  newSessionsCount: number;
  updatedSessionsCount: number;
  exactDuplicateCount: number;
  potentialDuplicatesCount: number;
  newStudentsCount: number;
}

export interface ImportCommitResult {
  addedSessionsCount: number;
  updatedSessionsCount: number;
  exactDuplicateCount: number;
  potentialDuplicatesCount: number;
  affectedStudents: string[];
  totalSessionsAfter: number;
}

export type ViewTab = 'dashboard' | 'students' | 'sessions' | 'book' | 'reports' | 'settings';

export interface FilterOptions {
  search: string;
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  therapyType: string;
  therapist: string;
  sortBy: 'newest' | 'oldest';
}
