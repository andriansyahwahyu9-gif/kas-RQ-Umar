import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { TransactionTable } from './components/TransactionTable';
import { TransactionModal } from './components/TransactionModal';
import { MemberDues } from './components/MemberDues';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { PrintReportView } from './components/PrintReportView';
import { SettingsModal } from './components/SettingsModal';
import { WeeklyDutiesDashboard } from './components/WeeklyDutiesDashboard';

import { Transaction, Member, MemberDuesRecord, PengajianConfig, TransactionType, WeeklyDuty } from './types';
import { DEFAULT_CONFIG, INITIAL_MEMBERS, INITIAL_TRANSACTIONS } from './data/initialData';
import { exportDataToJSON, formatRupiah, formatDateIndo } from './utils/formatters';
import { Plus, Minus, ArrowRight, ShieldCheck, HeartHandshake, BookOpen, Edit3, Trash2, X, Mic, MessageSquareText, CalendarCheck } from 'lucide-react';
import {
  subscribeConfig,
  subscribeTransactions,
  subscribeMembers,
  subscribeDuesRecords,
  subscribeWeeklyDuties,
  saveConfig,
  saveTransaction,
  deleteTransaction,
  deleteAllTransactions,
  saveMember,
  deleteMember,
  recordDuesAndTransaction,
  saveWeeklyDuty,
  saveWeeklyDutiesBatch,
  deleteWeeklyDuty,
  importAllData,
  resetDataToDefault,
} from './services/kasService';

export default function App() {
  // Config State
  const [config, setConfig] = useState<PengajianConfig>(DEFAULT_CONFIG);

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Members State
  const [members, setMembers] = useState<Member[]>([]);

  // Member Dues Records State
  const [duesRecords, setDuesRecords] = useState<MemberDuesRecord[]>([]);

  // Weekly Duties State
  const [weeklyDuties, setWeeklyDuties] = useState<WeeklyDuty[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<TransactionType>('pemasukan');
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [dashboardDeleteTrx, setDashboardDeleteTrx] = useState<Transaction | null>(null);

  // Subscribe to Realtime Firestore Synchronization
  useEffect(() => {
    const unsubConfig = subscribeConfig((data) => setConfig(data));
    const unsubTransactions = subscribeTransactions((data) => setTransactions(data));
    const unsubMembers = subscribeMembers((data) => setMembers(data));
    const unsubDues = subscribeDuesRecords((data) => setDuesRecords(data));
    const unsubDuties = subscribeWeeklyDuties((data) => setWeeklyDuties(data));

    return () => {
      unsubConfig();
      unsubTransactions();
      unsubMembers();
      unsubDues();
      unsubDuties();
    };
  }, []);

  // Calculations
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.jenis === 'pemasukan')
      .reduce((sum, t) => sum + t.nominal, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.jenis === 'pengeluaran')
      .reduce((sum, t) => sum + t.nominal, 0);
  }, [transactions]);

  // This month calculation
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const thisMonthIncome = useMemo(() => {
    return transactions
      .filter((t) => t.jenis === 'pemasukan' && t.tanggal.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.nominal, 0);
  }, [transactions, currentMonthStr]);

  const thisMonthExpense = useMemo(() => {
    return transactions
      .filter((t) => t.jenis === 'pengeluaran' && t.tanggal.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.nominal, 0);
  }, [transactions, currentMonthStr]);

  // Transaction Handlers
  const handleOpenIncomeModal = () => {
    setModalType('pemasukan');
    setEditingTrx(null);
    setIsModalOpen(true);
  };

  const handleOpenExpenseModal = () => {
    setModalType('pengeluaran');
    setEditingTrx(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (trx: Transaction) => {
    setEditingTrx(trx);
    setModalType(trx.jenis);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleDeleteAllTransactions = async () => {
    await deleteAllTransactions();
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTrx) {
      await saveTransaction({
        ...editingTrx,
        ...data,
      });
    } else {
      const newTrx: Transaction = {
        ...data,
        id: `trx-${Date.now()}`,
        createdAt: Date.now(),
      };
      await saveTransaction(newTrx);
    }
  };

  // Member Handlers
  const handleAddMember = async (memberData: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...memberData,
      id: `m-${Date.now()}`,
    };
    await saveMember(newMember);
  };

  const handleDeleteMember = async (id: string) => {
    await deleteMember(id);
  };

  const handleEditMember = async (updatedMember: Member) => {
    await saveMember(updatedMember);
  };

  const handleRecordDues = async (duesData: Omit<MemberDuesRecord, 'id'>) => {
    const member = members.find((m) => m.id === duesData.memberId);
    const memberName = member ? member.nama : 'Anggota';
    await recordDuesAndTransaction(duesData, memberName);
  };

  const handleSaveConfig = async (newConfig: PengajianConfig) => {
    await saveConfig(newConfig);
  };

  // Weekly Duties Handlers
  const handleSaveWeeklyDuty = async (duty: WeeklyDuty) => {
    await saveWeeklyDuty(duty);
  };

  const handleSaveWeeklyDutiesBatch = async (duties: WeeklyDuty[]) => {
    await saveWeeklyDutiesBatch(duties);
  };

  const handleDeleteWeeklyDuty = async (id: string) => {
    await deleteWeeklyDuty(id);
  };

  // Upcoming or latest weekly duty for Dashboard preview
  const nextWeeklyDuty = useMemo(() => {
    if (weeklyDuties.length === 0) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const sortedAsc = [...weeklyDuties].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    return (
      sortedAsc.find((d) => d.status !== 'selesai' && d.tanggal >= todayStr) ||
      sortedAsc.find((d) => d.status !== 'selesai') ||
      sortedAsc[sortedAsc.length - 1]
    );
  }, [weeklyDuties]);

  // Backup/Restore
  const handleExportAll = () => {
    const backupObj = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      config,
      transactions,
      members,
      duesRecords,
      weeklyDuties,
    };
    exportDataToJSON(backupObj, `Backup_Kas_Pengajian_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportAll = async (json: any) => {
    await importAllData(json);
  };

  const handleResetData = async () => {
    await resetDataToDefault();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        onOpenIncomeModal={handleOpenIncomeModal}
        onOpenExpenseModal={handleOpenExpenseModal}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Cards */}
            <SummaryCards
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              saldoAwal={config.saldoAwal}
              totalTransactionsCount={transactions.length}
              thisMonthIncome={thisMonthIncome}
              thisMonthExpense={thisMonthExpense}
              onOpenIncomeModal={handleOpenIncomeModal}
              onOpenExpenseModal={handleOpenExpenseModal}
            />

            {/* Quick Greeting & Recent Transactions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Transactions List (2 Cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base font-serif">
                    Transaksi Terbaru Kas
                  </h3>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-emerald-800 hover:text-emerald-900 font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    Lihat Semua Buku Kas <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl font-bold shrink-0 ${
                          t.jenis === 'pemasukan' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.jenis === 'pemasukan' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">{t.kategori}</h4>
                          <p className="text-xs text-slate-500 line-clamp-1">{t.keterangan}</p>
                          <span className="text-[10px] text-slate-400">{formatDateIndo(t.tanggal)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className={`text-sm font-extrabold ${
                            t.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {t.jenis === 'pemasukan' ? '+' : '-'} {formatRupiah(t.nominal)}
                          </span>
                          <p className="text-[10px] text-slate-400">{t.metode}</p>
                        </div>

                        {/* Action buttons on Dashboard */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditTransaction(t)}
                            title="Edit Transaksi"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDashboardDeleteTrx(t)}
                            title="Hapus Transaksi"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Info & Quick Shortcuts */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md border border-emerald-800 relative overflow-hidden space-y-4">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Inspirasi & Amanah Kas</span>
                  </div>

                  <blockquote className="font-serif italic text-sm text-emerald-100 leading-relaxed">
                    "Infak yang diberikan dengan tulus dan dikelola secara amanah serta transparan akan membawa keberkahan bagi seluruh jamaah majelis taklim."
                  </blockquote>

                  <div className="pt-3 border-t border-emerald-800 text-xs text-emerald-200 flex items-center justify-between">
                    <span>Bendahara: <strong>{config.namaBendahara}</strong></span>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 font-serif border-b border-slate-100 pb-2">
                    Akses Cepat Fitur
                  </h4>

                  <button
                    onClick={() => setActiveTab('members')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 font-medium transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Catat Iuran Kas Anggota</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('duties')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 font-medium transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Kelola Tugas MC, Kultum & Khutbah</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('report')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 font-medium transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Cetak Laporan Keuangan PDF</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 font-medium transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Grafik Perbandingan Pemasukan</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

            </div>

            {/* Weekly Duties Preview Card on Dashboard */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-serif flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-700" />
                    <span>Jadwal Tugas MC, Kultum & Khutbah Pekan Terdekat</span>
                  </h3>
                  {nextWeeklyDuty && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pekan ke-{nextWeeklyDuty.pekanKe} · {formatDateIndo(nextWeeklyDuty.tanggal)}
                      {nextWeeklyDuty.waktu ? ` · ${nextWeeklyDuty.waktu}` : ''}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('duties')}
                  className="text-emerald-800 hover:text-emerald-900 font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Buka Dasbor Jadwal Tugas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {nextWeeklyDuty ? (
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
                      <Mic className="w-3.5 h-3.5" />
                      <span>MC / Pembawa Acara</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{nextWeeklyDuty.mc}</p>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
                      <MessageSquareText className="w-3.5 h-3.5" />
                      <span>Kultum</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{nextWeeklyDuty.kultum}</p>
                    {nextWeeklyDuty.temaKultum && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Tema: {nextWeeklyDuty.temaKultum}
                      </p>
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Khutbah / Khatib</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{nextWeeklyDuty.khutbah}</p>
                    {nextWeeklyDuty.temaKhutbah && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Tema: {nextWeeklyDuty.temaKhutbah}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Belum ada jadwal petugas pekanan. Klik &ldquo;Buka Dasbor Jadwal Tugas&rdquo; untuk menambahkan jadwal.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <TransactionTable
            transactions={transactions}
            config={config}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onDeleteAll={handleDeleteAllTransactions}
            onOpenIncomeModal={handleOpenIncomeModal}
            onOpenExpenseModal={handleOpenExpenseModal}
          />
        )}

        {/* Member Dues Tab */}
        {activeTab === 'members' && (
          <MemberDues
            members={members}
            duesRecords={duesRecords}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onRecordDues={handleRecordDues}
            defaultIuranNominal={config.iuranDefault}
          />
        )}

        {/* Weekly Duties Tab (MC, Kultum & Khutbah) */}
        {activeTab === 'duties' && (
          <WeeklyDutiesDashboard
            duties={weeklyDuties}
            members={members}
            config={config}
            onSaveDuty={handleSaveWeeklyDuty}
            onSaveDutiesBatch={handleSaveWeeklyDutiesBatch}
            onDeleteDuty={handleDeleteWeeklyDuty}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsCharts
            transactions={transactions}
            saldoAwal={config.saldoAwal}
          />
        )}

        {/* Report & Print Tab */}
        {activeTab === 'report' && (
          <PrintReportView
            transactions={transactions}
            config={config}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsModal
            config={config}
            onSaveConfig={handleSaveConfig}
            onExportAll={handleExportAll}
            onImportAll={handleImportAll}
            onResetData={handleResetData}
          />
        )}

      </main>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialType={modalType}
        editingTransaction={editingTrx}
      />

      {/* Custom Dashboard Delete Confirmation Modal */}
      {dashboardDeleteTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setDashboardDeleteTrx(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">Hapus Transaksi Kas?</h3>
                <p className="text-[11px] text-slate-500">Data akan dihapus dari Buku Kas</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5 my-4 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-bold text-slate-900">{dashboardDeleteTrx.kategori}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan:</span>
                <span className="font-semibold text-slate-900 max-w-[180px] truncate text-right">{dashboardDeleteTrx.keterangan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className={`font-extrabold ${dashboardDeleteTrx.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatRupiah(dashboardDeleteTrx.nominal)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDashboardDeleteTrx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleDeleteTransaction(dashboardDeleteTrx.id);
                  setDashboardDeleteTrx(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-700">
            {config.namaMajelis} &copy; {new Date().getFullYear()} — Buku Kas Majelis Taklim
          </p>
          <p className="text-slate-400">
            Pencatatan Pemasukan, Pengeluaran & Laporan Kas Pengajian
          </p>
        </div>
      </footer>

    </div>
  );
}
