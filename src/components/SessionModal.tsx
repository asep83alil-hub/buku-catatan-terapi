import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Activity, FileText, CheckCircle2 } from 'lucide-react';
import { Student, TherapySession } from '../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSession: TherapySession | null;
  defaultStudent?: Student | null;
  students: Student[];
  onSaveSession: (sessionData: {
    student_id?: string;
    student_name: string;
    date: string;
    therapist_name: string;
    therapy_type: string;
    session_progress: string;
    intervention_program: string;
    child_response: string;
  }) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  editingSession,
  defaultStudent,
  students,
  onSaveSession,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [isNewStudent, setIsNewStudent] = useState<boolean>(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [therapistName, setTherapistName] = useState<string>('Siti');
  const [therapyType, setTherapyType] = useState<string>('Okupasi');
  const [sessionProgress, setSessionProgress] = useState<string>('');
  const [interventionProgram, setInterventionProgram] = useState<string>('');
  const [childResponse, setChildResponse] = useState<string>('');

  const activeStudents = students.filter((s) => !s.is_deleted);

  useEffect(() => {
    if (editingSession) {
      setSelectedStudentId(editingSession.student_id);
      setCustomStudentName(editingSession.student_name);
      setIsNewStudent(false);
      setDate(editingSession.date);
      setTherapistName(editingSession.therapist_name);
      setTherapyType(editingSession.therapy_type);
      setSessionProgress(editingSession.session_progress);
      setInterventionProgram(editingSession.intervention_program);
      setChildResponse(editingSession.child_response);
    } else if (defaultStudent) {
      setSelectedStudentId(defaultStudent.student_id);
      setCustomStudentName(defaultStudent.student_name);
      setIsNewStudent(false);
      setDate(new Date().toISOString().split('T')[0]);
      setTherapistName('');
      setTherapyType('Okupasi');
      setSessionProgress('');
      setInterventionProgram('');
      setChildResponse('');
    } else {
      setSelectedStudentId(activeStudents[0]?.student_id || '');
      setCustomStudentName('');
      setIsNewStudent(false);
      setDate(new Date().toISOString().split('T')[0]);
      setTherapistName('');
      setTherapyType('Okupasi');
      setSessionProgress('');
      setInterventionProgram('');
      setChildResponse('');
    }
  }, [editingSession, defaultStudent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalStudentName = '';
    let finalStudentId: string | undefined = undefined;

    if (isNewStudent) {
      if (!customStudentName.trim()) {
        alert('Silakan masukkan nama siswa baru.');
        return;
      }
      finalStudentName = customStudentName.trim();
    } else {
      const studentObj = activeStudents.find((s) => s.student_id === selectedStudentId);
      if (!studentObj) {
        alert('Silakan pilih siswa.');
        return;
      }
      finalStudentId = studentObj.student_id;
      finalStudentName = studentObj.student_name;
    }

    if (!therapistName.trim()) {
      alert('Silakan isi nama terapis.');
      return;
    }

    if (!therapyType.trim()) {
      alert('Silakan pilih jenis terapi.');
      return;
    }

    if (!sessionProgress.trim()) {
      alert('Silakan isi Lembar Progres Sesi.');
      return;
    }

    onSaveSession({
      student_id: finalStudentId,
      student_name: finalStudentName,
      date,
      therapist_name: therapistName.trim(),
      therapy_type: therapyType.trim(),
      session_progress: sessionProgress.trim(),
      intervention_program: interventionProgram.trim(),
      child_response: childResponse.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="font-bold text-base text-slate-800">
              {editingSession ? 'EDIT CATATAN TERAPI' : '+ TAMBAH CATATAN TERAPI'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingSession
                ? 'Perbaiki rincian lembar progres, intervensi, atau respon ananda.'
                : 'Catatan otomatis masuk ke Buku Catatan Siswa yang dipilih.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Student Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">
                Nama Siswa <span className="text-rose-500">*</span>
              </label>
              {!editingSession && (
                <button
                  type="button"
                  onClick={() => setIsNewStudent(!isNewStudent)}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 underline cursor-pointer"
                >
                  {isNewStudent ? 'Pilih dari daftar siswa yang ada' : '+ Siswa Baru'}
                </button>
              )}
            </div>

            {isNewStudent ? (
              <div>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama lengkap siswa baru (contoh: Dimas)..."
                  value={customStudentName}
                  onChange={(e) => setCustomStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-teal-500 font-bold text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem akan otomatis membuat 1 Buku Catatan Digital baru untuk siswa ini.
                </p>
              </div>
            ) : (
              <select
                required
                disabled={Boolean(editingSession)}
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-teal-500 font-bold text-slate-800"
              >
                {activeStudents.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    📕 {s.student_name} ({s.custom_id || s.student_id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Row 2: Tanggal, Terapis, Jenis Terapi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Terapis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Siti, Rina"
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jenis Terapi <span className="text-rose-500">*</span>
              </label>
              <select
                value={therapyType}
                onChange={(e) => setTherapyType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-teal-500 font-medium"
              >
                <option value="Okupasi">Okupasi</option>
                <option value="Wicara">Wicara</option>
                <option value="Fisioterapi">Fisioterapi</option>
                <option value="Sensori Integrasi">Sensori Integrasi</option>
                <option value="Perilaku (ABA)">Perilaku (ABA)</option>
                <option value="Remedial / Edukasi">Remedial / Edukasi</option>
              </select>
            </div>
          </div>

          {/* Section 1: Lembar Progres Sesi */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800">
              Lembar Progres Sesi <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan capaian dan progres klinis ananda selama sesi berlangsung..."
              value={sessionProgress}
              onChange={(e) => setSessionProgress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-teal-500 leading-relaxed"
            />
          </div>

          {/* Section 2: Program Intervensi */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800">
              Program Intervensi <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Tuliskan program latihan, stimulasi, dan aktivitas terapeutik yang diberikan..."
              value={interventionProgram}
              onChange={(e) => setInterventionProgram(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-teal-500 leading-relaxed"
            />
          </div>

          {/* Section 3: Respon Ananda Terhadap Intervensi */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800">
              Respon Ananda Terhadap Intervensi <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Catat bagaimana ananda merespons, tingkat keaktifan, kepatuhan instruksi, dan kestabilan emosi..."
              value={childResponse}
              onChange={(e) => setChildResponse(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-teal-500 leading-relaxed"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              id="btn-submit-session"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SIMPAN CATATAN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
