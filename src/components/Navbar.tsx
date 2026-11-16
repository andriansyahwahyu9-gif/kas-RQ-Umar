import React from 'react';
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
  CalendarCheck
} from 'lucide-react';
import { PengajianConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: PengajianConfig;
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  onOpenIncomeModal,
  onOpenExpenseModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Buku Kas', icon: Receipt },
    { id: 'members', label: 'Iuran Anggota', icon: Users },
    { id: 'duties', label: 'Jadwal Tugas', icon: CalendarCheck },
    { id: 'analytics', label: 'Analisis', icon: BarChart3 },
    { id: 'report', label: 'Laporan & Cetak', icon: Printer },
  ];

  return (
    <header className="print:hidden bg-emerald-900 text-white shadow-lg sticky top-0 z-30 border-b border-emerald-800">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center font-bold shadow-md shadow-emerald-950/40">
              <BookOpen className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-amber-100 font-serif">
                  {config.namaMajelis || 'Buku Kas Pengajian'}
                </h1>
                <span className="bg-emerald-800/80 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-400/20 font-medium">
                  Kas Majelis
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 line-clamp-1">
                {config.alamatMajelis || 'Sistem Pencatatan Transaksi Pemasukan & Pengeluaran Kas'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenIncomeModal}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer border border-emerald-400/30"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>Pemasukan</span>
            </button>

            <button
              onClick={onOpenExpenseModal}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer border border-rose-400/30"
            >
              <Minus className="w-4 h-4 text-rose-200" />
              <span>Pengeluaran</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              title="Pengaturan Kas"
              className={`p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors ${
                activeTab === 'settings' ? 'bg-emerald-800 text-amber-300' : ''
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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
