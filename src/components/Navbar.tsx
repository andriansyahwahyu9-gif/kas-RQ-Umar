import React from 'react';
import { User } from 'firebase/auth';
import {
  BookOpen,
  LayoutDashboard,
  Receipt,
  Users,
  BarChart3,
  Printer,
  Settings,
  Plus,
  Minus,
  CalendarCheck,
  BookMarked,
  UserCheck,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { PengajianConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: PengajianConfig;
  user: User;
  onSignOut: () => void;
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  user,
  onSignOut,
  onOpenIncomeModal,
  onOpenExpenseModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Buku Kas', icon: Receipt },
    { id: 'master-members', label: 'Data Anggota', icon: UserCheck },
    { id: 'members', label: 'Iuran Kas', icon: Users },
    { id: 'duties', label: 'Jadwal Tugas', icon: CalendarCheck },
    { id: 'hafalan', label: 'Hafalan', icon: BookMarked },
    { id: 'analytics', label: 'Analisis', icon: BarChart3 },
    { id: 'report', label: 'Laporan & Cetak', icon: Printer },
    { id: 'master-login', label: 'Master Login', icon: KeyRound },
  ];

  const userInitial = (user.displayName || user.email || 'P').charAt(0).toUpperCase();

  return (
    <header className="print:hidden bg-emerald-900 text-white shadow-lg sticky top-0 z-30 border-b border-emerald-800">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center font-bold shadow-md shadow-emerald-950/40 shrink-0">
              <BookOpen className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-amber-100 font-serif">
                  {config.namaMajelis || 'Buku Kas Pengajian'}
                </h1>
                <span className="bg-emerald-800/80 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-400/20 font-medium whitespace-nowrap">
                  Kas Majelis
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 line-clamp-1">
                {config.alamatMajelis || 'Sistem Pencatatan Transaksi Pemasukan & Pengeluaran Kas'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons + Account */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenIncomeModal}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer border border-emerald-400/30 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>Pemasukan</span>
            </button>

            <button
              onClick={onOpenExpenseModal}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer border border-rose-400/30 whitespace-nowrap shrink-0"
            >
              <Minus className="w-4 h-4 text-rose-200" />
              <span>Pengeluaran</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              title="Pengaturan Kas"
              className={`p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'settings' ? 'bg-emerald-800 text-amber-300' : ''
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-emerald-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Pengurus'}
                  className="w-8 h-8 rounded-full border border-emerald-700 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-700 flex items-center justify-center text-xs font-bold text-amber-200 shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="hidden xl:block text-left max-w-[140px]">
                <p className="text-xs font-semibold text-white truncate">
                  {user.displayName || 'Pengurus'}
                </p>
                <p className="text-[10px] text-emerald-200/80 truncate">{user.email}</p>
              </div>
              <button
                onClick={onSignOut}
                title="Keluar dari akun"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 border border-emerald-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 mt-4 overflow-x-auto pb-1 scrollbar-none border-t border-emerald-800/60 pt-2 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-emerald-950 font-semibold shadow-sm'
                    : 'text-emerald-100/90 hover:text-white hover:bg-emerald-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-950' : 'text-emerald-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
