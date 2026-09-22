import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck2,
  BarChart3,
  Settings,
  Sparkles,
  HeartHandshake,
  FileSpreadsheet,
  PlusCircle,
  X
} from 'lucide-react';
import { ViewTab } from '../types';
import { PelangiLogo } from './PelangiLogo';

interface SidebarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  studentCount: number;
  sessionCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenUpload: () => void;
  onOpenAddSession: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  sessionCount,
  isOpenMobile,
  setIsOpenMobile,
  onOpenUpload,
  onOpenAddSession,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ViewTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'students' as ViewTab,
      label: 'Data Siswa',
      icon: Users,
      badge: `${studentCount}`,
    },
    {
      id: 'book' as ViewTab,
      label: 'Buku Catatan',
      icon: BookOpen,
      badge: 'Digital',
    },
    {
      id: 'sessions' as ViewTab,
      label: 'Jadwal / Sesi Terapi',
      icon: CalendarCheck2,
      badge: `${sessionCount}`,
    },
    {
      id: 'reports' as ViewTab,
      label: 'Laporan & Ekspor',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as ViewTab,
      label: 'Pengaturan & Backup',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelect = (tab: ViewTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Header Branding */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <PelangiLogo className="h-9 w-auto" />
            </div>
            <div>
              <h1 className="font-extrabold text-xs uppercase tracking-wider text-teal-800">
                PUSAT TERAPI TUMBUH KEMBANG ANAK
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Buku Catatan Terapi Digital
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-4 space-y-2 border-b border-slate-100 bg-slate-50/70">
          <button
            id="sidebar-add-session-btn"
            onClick={onOpenAddSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Catatan</span>
          </button>
          <button
            id="sidebar-upload-spreadsheet-btn"
            onClick={onOpenUpload}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Drive & Spreadsheet</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold border-l-3 border-teal-600 pl-3'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-teal-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Clinic Info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Sistem Aktif</span>
              <p className="text-[11px] text-slate-400">Database Lokal Tersinkron</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
