import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { TherapySession } from '../types';
import { formatDisplayDate } from '../utils/excelParser';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TherapySession | null;
  onConfirmDelete: (sessionId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  session,
  onConfirmDelete,
}) => {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base text-slate-800">
              Konfirmasi Hapus Catatan Sesi
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan ini? Data yang dihapus tidak akan tampil dalam buku catatan.
            </p>

            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div>
                <span className="text-slate-400">Siswa:</span>{' '}
                <strong className="text-slate-800">{session.student_name}</strong>
              </div>
              <div>
                <span className="text-slate-400">Tanggal:</span>{' '}
                <strong className="text-slate-800">{formatDisplayDate(session.date)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Jenis:</span>{' '}
                <strong className="text-slate-800">{session.therapy_type}</strong> ({session.therapist_name})
              </div>
            </div>

            <p className="text-[11px] text-teal-700 font-medium mt-2.5">
              🛡️ Fitur Aman: Data ini diarsip dengan <strong>Soft Delete</strong> dan sewaktu-waktu dapat dipulihkan oleh admin di menu Pengaturan & Pemulihan.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(session.session_id);
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus Catatan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
