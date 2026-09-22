import React from 'react';
import { Menu, Plus, Upload, FileDown, BookOpen, Search } from 'lucide-react';
import { ViewTab, Student } from '../types';
import { downloadTemplateSpreadsheet } from '../utils/excelParser';

interface NavbarProps {
  activeTab: ViewTab;
  onOpenMobileMenu: () => void;
  onOpenUpload: () => void;
  onOpenAddSession: () => void;
  selectedStudent: Student | null;
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenUpload,
  onOpenAddSession,
  selectedStudent,
  students,
  onSelectStudent,
}) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Pusat Terapi Tumbuh Kembang';
      case 'students':
        return 'Data Siswa & Buku Digital';
      case 'book':
        return selectedStudent
          ? `Buku Catatan Terapi: ${selectedStudent.student_name}`
          : 'Buku Catatan Siswa';
      case 'sessions':
        return 'Jadwal & Riwayat Seluruh Sesi';
      case 'reports':
        return 'Laporan & Statistik Terapi';
      case 'settings':
        return 'Pengaturan & Cadangan Data';
      default:
        return 'Buku Catatan Terapi';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              {getTitle()}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-teal-800">Pelangi Lazuardi</span>
              <span>•</span>
              <span>Pusat Terapi Tumbuh Kembang Anak</span>
            </div>
          </div>
        </div>

        {/* Middle/Right: Quick Switcher if on Book tab */}
        {activeTab === 'book' && students.length > 0 && (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Ganti Siswa:</span>
            <select
              value={selectedStudent?.student_id || ''}
              onChange={(e) => {
                const found = students.find((s) => s.student_id === e.target.value);
                if (found) onSelectStudent(found);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-teal-500"
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  📕 {s.student_name} ({s.custom_id || s.student_id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            id="navbar-download-template-btn"
            onClick={() => downloadTemplateSpreadsheet('xlsx')}
            title="Download Template Format Spreadsheet (XLSX)"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>Format Excel</span>
          </button>

          <button
            id="navbar-upload-btn"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Upload / Google Drive</span>
            <span className="sm:hidden">Upload</span>
          </button>

          <button
            id="navbar-add-session-btn"
            onClick={onOpenAddSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catatan Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
