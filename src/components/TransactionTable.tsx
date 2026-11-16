import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  Calendar, 
  Tag, 
  User, 
  Eye, 
  X,
  FileSpreadsheet,
  Printer,
  CheckSquare,
  Square,
  RotateCcw,
  Receipt
} from 'lucide-react';
import { Transaction, FilterOptions, PengajianConfig } from '../types';
import { formatRupiah, formatDateIndo, exportTransactionsToCSV, exportToExcel, terbilang } from '../utils/formatters';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../data/initialData';

interface TransactionTableProps {
  transactions: Transaction[];
  config?: PengajianConfig;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteAll?: () => void;
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  config,
  onEdit,
  onDelete,
  onDeleteAll,
  onOpenIncomeModal,
  onOpenExpenseModal,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    jenis: 'semua',
    kategori: '',
    startDate: '',
    endDate: '',
  });

  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'nominal-desc' | 'nominal-asc'>('date-desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [kwitansiTransaction, setKwitansiTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<Transaction | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search query
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          const matchKet = t.keterangan.toLowerCase().includes(q);
          const matchKat = t.kategori.toLowerCase().includes(q);
          const matchName = (t.pembayarAtauPenerima || '').toLowerCase().includes(q);
          if (!matchKet && !matchKat && !matchName) return false;
        }

        // Jenis
        if (filters.jenis !== 'semua' && t.jenis !== filters.jenis) {
          return false;
        }

        // Kategori
        if (filters.kategori && t.kategori !== filters.kategori) {
          return false;
        }

        // Date range
        if (filters.startDate && t.tanggal < filters.startDate) return false;
        if (filters.endDate && t.tanggal > filters.endDate) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.tanggal.localeCompare(a.tanggal) || b.createdAt - a.createdAt;
        if (sortBy === 'date-asc') return a.tanggal.localeCompare(b.tanggal) || a.createdAt - b.createdAt;
        if (sortBy === 'nominal-desc') return b.nominal - a.nominal;
        if (sortBy === 'nominal-asc') return a.nominal - b.nominal;
        return 0;
      });
  }, [transactions, filters, sortBy]);

  // Total calculation for current filtered view
  const { filteredIncome, filteredExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.jenis === 'pemasukan') income += t.nominal;
      else expense += t.nominal;
    });
    return { filteredIncome: income, filteredExpense: expense };
  }, [filteredTransactions]);

  const handleQuickDateFilter = (preset: 'month' | 'prevMonth' | 'year' | 'all') => {
    const now = new Date();
    if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    } else if (preset === 'prevMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    } else if (preset === 'year') {
      const start = `${now.getFullYear()}-01-01`;
      const end = `${now.getFullYear()}-12-31`;
      setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    } else {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      jenis: 'semua',
      kategori: '',
      startDate: '',
      endDate: '',
    });
    setSortBy('date-desc');
  };

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedList = transactions.filter((t) => selectedIds.includes(t.id));
    exportTransactionsToCSV(selectedList, 'Buku_Kas_Terpilih');
  };

  const handlePrintKwitansi = (t: Transaction) => {
    setKwitansiTransaction(t);
  };

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden relative">
      
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            Catatan Buku Kas
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {filteredTransactions.length} transaksi
            </span>
          </h2>
          <p className="text-xs text-slate-500">Daftar riwayat seluruh pencatatan pemasukan & pengeluaran kas majelis</p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenIncomeModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Pemasukan
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <Minus className="w-4 h-4" />
            + Pengeluaran
          </button>
          <button
            onClick={() => exportToExcel(
              filteredTransactions,
              'Buku_Kas_Pengajian',
              config?.namaMajelis || 'YAYASAN USWATUNA CAHAYA NUSANTARA',
              config?.alamatMajelis || 'Bandar Lampung',
              'Laporan Transaksi Kas',
              config?.saldoAwal || 0,
              config?.namaKetua || 'Aziz Privatna',
              config?.namaBendahara || 'Wahyu Andriansyah'
            )}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold cursor-pointer transition-colors border border-emerald-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Export Excel
          </button>
          <button
            onClick={() => exportTransactionsToCSV(filteredTransactions, 'Buku_Kas_Pengajian')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors border border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-700" />
            Export CSV
          </button>
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Hapus Seluruh Data Transaksi Buku Kas"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Hapus Semua
          </button>
          {(filters.searchQuery || filters.jenis !== 'semua' || filters.kategori || filters.startDate || filters.endDate) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold cursor-pointer transition-colors border border-amber-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200/60 space-y-3">
        
        {/* Search & Jenis Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari keterangan / nama / kategori..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Jenis Segment */}
          <div className="flex bg-white border border-slate-300 rounded-xl p-1 text-xs font-medium">
            {(['semua', 'pemasukan', 'pengeluaran'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilters(prev => ({ ...prev, jenis: type, kategori: '' }))}
                className={`flex-1 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  filters.jenis === type
                    ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Kategori Select */}
          <div>
            <select
              value={filters.kategori}
              onChange={(e) => setFilters(prev => ({ ...prev, kategori: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">Semua Kategori</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter & Quick Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/40 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Periode:
            </span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
            />

            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => handleQuickDateFilter('month')}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
              >
                Bulan Ini
              </button>
              <button
                onClick={() => handleQuickDateFilter('prevMonth')}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
              >
                Bulan Lalu
              </button>
              <button
                onClick={() => handleQuickDateFilter('all')}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
              >
                Semua
              </button>
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Urutan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="date-desc">Tanggal Terbaru</option>
              <option value="date-asc">Tanggal Terlama</option>
              <option value="nominal-desc">Nominal Terbesar</option>
              <option value="nominal-asc">Nominal Terkecil</option>
            </select>
          </div>

        </div>

      </div>

      {/* Table Summary Line */}
      <div className="bg-emerald-50/70 px-5 py-2.5 border-b border-emerald-100 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2 font-medium">
        <div>
          Menampilkan <span className="font-bold text-slate-900">{filteredTransactions.length}</span> transaksi
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-emerald-800">
            Pemasukan: <strong className="font-bold">{formatRupiah(filteredIncome)}</strong>
          </span>
          <span className="text-rose-800">
            Pengeluaran: <strong className="font-bold">{formatRupiah(filteredExpense)}</strong>
          </span>
          <span className={`font-bold ${filteredIncome - filteredExpense >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
            Selisih: {formatRupiah(filteredIncome - filteredExpense)}
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 uppercase font-bold border-b border-slate-200 tracking-wider">
              <th className="py-3 px-3 w-10 text-center">
                <button
                  onClick={handleToggleSelectAll}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                  title={selectedIds.length === filteredTransactions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                >
                  {filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 w-10 text-center">No</th>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Jenis</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Keterangan</th>
              <th className="py-3 px-4">Dari / Kepada</th>
              <th className="py-3 px-4 text-right">Nominal</th>
              <th className="py-3 px-4 w-40 text-center bg-slate-200/60 font-serif">Tombol Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  Tidak ada transaksi kas yang sesuai filter
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t, idx) => {
                const isSelected = selectedIds.includes(t.id);
                return (
                  <tr 
                    key={t.id} 
                    className={`transition-colors ${isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/90'}`}
                  >
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleSelect(t.id)}
                        className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      {formatDateIndo(t.tanggal)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.jenis === 'pemasukan' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          <Plus className="w-3 h-3 text-emerald-600" /> Pemasukan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                          <Minus className="w-3 h-3 text-rose-600" /> Pengeluaran
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {t.kategori}
                    </td>
                    <td className="py-3 px-4 font-normal text-slate-700 max-w-xs truncate">
                      {t.keterangan}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {t.pembayarAtauPenerima || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                      <span className={t.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}>
                        {t.jenis === 'pemasukan' ? '+' : '-'} {formatRupiah(t.nominal)}
                      </span>
                    </td>

                    {/* Activated Prominent Action Buttons Column */}
                    <td className="py-2 px-3 text-center whitespace-nowrap bg-slate-50/50">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedTransaction(t)}
                          title="Lihat Rincian Detail"
                          className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-[11px] border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Detail</span>
                        </button>

                        <button
                          onClick={() => handlePrintKwitansi(t)}
                          title="Cetak Kwitansi / Bukti Kas"
                          className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-[11px] border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5 text-amber-700" />
                          <span>Kwitansi</span>
                        </button>

                        <button
                          onClick={() => onEdit(t)}
                          title="Edit Data Transaksi"
                          className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium text-[11px] border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmTransaction(t)}
                          title="Hapus Transaksi Kas"
                          className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium text-[11px] border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="block md:hidden divide-y divide-slate-100">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada transaksi kas yang sesuai filter
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isSelected = selectedIds.includes(t.id);
            return (
              <div key={t.id} className={`p-4 space-y-3 ${isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSelect(t.id)}
                      className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-slate-500 font-medium">{formatDateIndo(t.tanggal)}</span>
                  </div>
                  {t.jenis === 'pemasukan' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      + Pemasukan
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                      - Pengeluaran
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{t.kategori}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{t.keterangan}</p>
                    {t.pembayarAtauPenerima && (
                      <p className="text-[11px] text-slate-400 mt-0.5">Oleh: {t.pembayarAtauPenerima}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${t.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {t.jenis === 'pemasukan' ? '+' : '-'} {formatRupiah(t.nominal)}
                    </span>
                    <p className="text-[10px] text-slate-400">{t.metode}</p>
                  </div>
                </div>

                {/* Mobile Tombol Aksi Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tombol Aksi:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedTransaction(t)}
                      className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => handlePrintKwitansi(t)}
                      className="px-2 py-1 rounded-lg bg-amber-50 text-amber-900 font-semibold text-[11px] border border-amber-200"
                    >
                      Kwitansi
                    </button>
                    <button
                      onClick={() => onEdit(t)}
                      className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold text-[11px] border border-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmTransaction(t)}
                      className="px-2 py-1 rounded-lg bg-rose-50 text-rose-800 font-semibold text-[11px] border border-rose-200"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 mx-4 my-2 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in z-30">
          <div className="flex items-center gap-2 text-xs">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{selectedIds.length} transaksi terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelected}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-600"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Export Terpilih
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Terpilih
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${
                selectedTransaction.jenis === 'pemasukan' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {selectedTransaction.jenis === 'pemasukan' ? <Plus className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
              </div>
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  selectedTransaction.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Detail {selectedTransaction.jenis}
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-serif">
                  {selectedTransaction.kategori}
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 text-xs text-slate-700 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-500 font-medium">Nominal</span>
                <span className={`font-extrabold text-base ${
                  selectedTransaction.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatRupiah(selectedTransaction.nominal)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-500 font-medium">Tanggal</span>
                <span className="font-semibold text-slate-900">{formatDateIndo(selectedTransaction.tanggal)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-500 font-medium">Keterangan</span>
                <span className="font-semibold text-slate-900 text-right max-w-xs">{selectedTransaction.keterangan}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-500 font-medium">
                  {selectedTransaction.jenis === 'pemasukan' ? 'Diterima dari' : 'Diserahkan kepada'}
                </span>
                <span className="font-semibold text-slate-900">{selectedTransaction.pembayarAtauPenerima || '-'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-500 font-medium">Terbilang</span>
                <span className="font-semibold text-slate-900 text-right italic max-w-xs">{terbilang(selectedTransaction.nominal)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Metode Pembayaran</span>
                <span className="font-semibold text-slate-900">{selectedTransaction.metode}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => {
                  const t = selectedTransaction;
                  setSelectedTransaction(null);
                  handlePrintKwitansi(t);
                }}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-700" />
                Cetak Kwitansi
              </button>
              <button
                onClick={() => {
                  const t = selectedTransaction;
                  setSelectedTransaction(null);
                  onEdit(t);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Transaksi
              </button>
              <button
                onClick={() => {
                  const t = selectedTransaction;
                  setSelectedTransaction(null);
                  setDeleteConfirmTransaction(t);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kwitansi / Bukti Kas Printable Modal */}
      {kwitansiTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
            <button
              onClick={() => setKwitansiTransaction(null)}
              className="print:hidden absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Kwitansi Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800">MAJELIS TAKLIM</h4>
              <h2 className="text-lg font-black text-slate-900 font-serif uppercase tracking-wide">
                {kwitansiTransaction.jenis === 'pemasukan' ? 'BUKTI KAS MASUK (KWITANSI)' : 'BUKTI KAS KELUAR'}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                No. Ref: {kwitansiTransaction.jenis === 'pemasukan' ? 'BKM' : 'BKK'}-{kwitansiTransaction.tanggal.replace(/-/g, '')}-{kwitansiTransaction.id.slice(-4)}
              </p>
            </div>

            {/* Kwitansi Content Table */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-3 font-medium mb-6">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Telah {kwitansiTransaction.jenis === 'pemasukan' ? 'Diterima Dari' : 'Diserahkan Kepada'}</span>
                <span className="col-span-2 font-bold text-slate-900">{kwitansiTransaction.pembayarAtauPenerima || 'Jamaah Majelis Taklim'}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Uang Sejumlah</span>
                <span className="col-span-2 font-black text-emerald-800 text-sm">{formatRupiah(kwitansiTransaction.nominal)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Terbilang</span>
                <span className="col-span-2 font-semibold italic text-slate-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                  # {terbilang(kwitansiTransaction.nominal)} #
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Untuk Keperluan</span>
                <span className="col-span-2 font-semibold text-slate-900">[{kwitansiTransaction.kategori}] - {kwitansiTransaction.keterangan}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1">
                <span className="text-slate-500 font-semibold">Metode & Tanggal</span>
                <span className="col-span-2 font-semibold text-slate-900">{kwitansiTransaction.metode} — {formatDateIndo(kwitansiTransaction.tanggal)}</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 text-center text-xs pt-4 border-t border-slate-200">
              <div>
                <p className="text-slate-500 mb-10">Yang menyerahkan,</p>
                <p className="font-bold text-slate-900 underline">{kwitansiTransaction.pembayarAtauPenerima || '(............................)'}</p>
              </div>

              <div>
                <p className="text-slate-500 mb-10">Bendahara Kas,</p>
                <p className="font-bold text-slate-900 underline">Bendahara Majelis Taklim</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="print:hidden mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setKwitansiTransaction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Kwitansi PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Transaction Custom Delete Confirmation Modal */}
      {deleteConfirmTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setDeleteConfirmTransaction(null)}
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
                <p className="text-[11px] text-slate-500">Tindakan penghapusan tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5 my-4 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-bold text-slate-900">{deleteConfirmTransaction.kategori}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan:</span>
                <span className="font-semibold text-slate-900 max-w-[180px] truncate text-right">{deleteConfirmTransaction.keterangan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className={`font-extrabold ${deleteConfirmTransaction.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatRupiah(deleteConfirmTransaction.nominal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="text-slate-800">{formatDateIndo(deleteConfirmTransaction.tanggal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmTransaction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmTransaction.id);
                  setDeleteConfirmTransaction(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Custom Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">Hapus {selectedIds.length} Transaksi Terpilih?</h3>
                <p className="text-[11px] text-slate-500">Seluruh data yang dipilih akan terhapus permanen dari Buku Kas</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  selectedIds.forEach((id) => onDelete(id));
                  setSelectedIds([]);
                  setShowBulkDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Transactions Custom Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowDeleteAllConfirm(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">Hapus SEMUA Transaksi?</h3>
                <p className="text-[11px] text-slate-500">Seluruh {transactions.length} data transaksi kas akan terhapus permanen</p>
              </div>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 my-4 font-medium">
              ⚠️ Warning: Tindakan ini akan menghapus seluruh catatan transaksi di Firestore secara real-time dan tidak dapat dibatalkan!
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (onDeleteAll) onDeleteAll();
                  setSelectedIds([]);
                  setShowDeleteAllConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Semua Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
