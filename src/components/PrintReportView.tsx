import React, { useMemo, useState } from 'react';
import {
  Printer,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Settings2,
  Receipt,
  ClipboardList,
  BookMarked,
  CalendarCheck,
} from 'lucide-react';
import {
  Transaction,
  PengajianConfig,
  Member,
  MemberDuesRecord,
  WeeklyDuty,
  HafalanRecord,
  HafalanKategori,
  HafalanStatus,
  DutyStatus,
} from '../types';
import {
  formatRupiah,
  formatDateIndo,
  exportTransactionsToCSV,
  exportToExcel,
  exportHafalanToCSV,
  exportHafalanToExcel,
  exportDutiesToCSV,
  exportDutiesToExcel,
  exportRekapToCSV,
  exportRekapToExcel,
} from '../utils/formatters';

interface PrintReportViewProps {
  transactions: Transaction[];
  config: PengajianConfig;
  members: Member[];
  duesRecords: MemberDuesRecord[];
  weeklyDuties: WeeklyDuty[];
  hafalanRecords: HafalanRecord[];
}

type ReportKind = 'kas' | 'rekap' | 'hafalan' | 'tugas';

const HAFALAN_CATEGORIES: HafalanKategori[] = [
  "Al-Qur'an",
  'Hadits',
  'Doa Harian',
  'Bacaan Sholat & Dzikir',
];

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  transactions,
  config,
  members,
  duesRecords,
  weeklyDuties,
  hafalanRecords,
}) => {
  const [reportType, setReportType] = useState<ReportKind>('kas');

  const [reportPeriod, setReportPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  // Extra filters for Hafalan & Tugas reports
  const [hafalanCategoryFilter, setHafalanCategoryFilter] = useState<'semua' | HafalanKategori>('semua');
  const [hafalanStatusFilter, setHafalanStatusFilter] = useState<'semua' | HafalanStatus>('semua');
  const [dutyStatusFilter, setDutyStatusFilter] = useState<'semua' | DutyStatus>('semua');

  // Toggle options for document elements
  const [showSummary, setShowSummary] = useState(true);
  const [showKeterangan, setShowKeterangan] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  // Filter transactions by chosen range
  const filteredTrx = useMemo(
    () =>
      transactions
        .filter((t) => t.tanggal >= startDate && t.tanggal <= endDate)
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    [transactions, startDate, endDate]
  );

  // Transactions PRIOR to startDate to compute starting balance for this period
  const saldoAwalPeriode = useMemo(() => {
    const priorTrx = transactions.filter((t) => t.tanggal < startDate);
    const priorIncome = priorTrx
      .filter((t) => t.jenis === 'pemasukan')
      .reduce((a, b) => a + b.nominal, 0);
    const priorExpense = priorTrx
      .filter((t) => t.jenis === 'pengeluaran')
      .reduce((a, b) => a + b.nominal, 0);
    return config.saldoAwal + priorIncome - priorExpense;
  }, [transactions, startDate, config.saldoAwal]);

  const totalPemasukan = useMemo(
    () => filteredTrx.filter((t) => t.jenis === 'pemasukan').reduce((a, b) => a + b.nominal, 0),
    [filteredTrx]
  );

  const totalPengeluaran = useMemo(
    () => filteredTrx.filter((t) => t.jenis === 'pengeluaran').reduce((a, b) => a + b.nominal, 0),
    [filteredTrx]
  );

  const saldoAkhirPeriode = saldoAwalPeriode + totalPemasukan - totalPengeluaran;

  // Filtered Dues in period
  const filteredDues = useMemo(
    () => duesRecords.filter((d) => d.tanggalBayar >= startDate && d.tanggalBayar <= endDate),
    [duesRecords, startDate, endDate]
  );

  // Filtered Hafalan
  const filteredHafalan = useMemo(() => {
    return hafalanRecords
      .filter((r) => {
        if (r.tanggal < startDate || r.tanggal > endDate) return false;
        if (reportType === 'hafalan') {
          if (hafalanCategoryFilter !== 'semua' && r.kategori !== hafalanCategoryFilter) return false;
          if (hafalanStatusFilter !== 'semua' && r.statusLulus !== hafalanStatusFilter) return false;
        }
        return true;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [hafalanRecords, startDate, endDate, reportType, hafalanCategoryFilter, hafalanStatusFilter]);

  // Filtered Weekly Duties
  const filteredDuties = useMemo(() => {
    return weeklyDuties
      .filter((d) => {
        if (d.tanggal < startDate || d.tanggal > endDate) return false;
        if (reportType === 'tugas' && dutyStatusFilter !== 'semua' && d.status !== dutyStatusFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [weeklyDuties, startDate, endDate, reportType, dutyStatusFilter]);

  // Category Breakdown for Rekap
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { kategori: string; jenis: string; jumlah: number; total: number }>();
    filteredTrx.forEach((t) => {
      const key = `${t.jenis}::${t.kategori}`;
      const existing = map.get(key);
      if (existing) {
        existing.jumlah += 1;
        existing.total += t.nominal;
      } else {
        map.set(key, {
          kategori: t.kategori,
          jenis: t.jenis,
          jumlah: 1,
          total: t.nominal,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.jenis !== b.jenis) return a.jenis.localeCompare(b.jenis);
      return b.total - a.total;
    });
  }, [filteredTrx]);

  // Member Hafalan Aggregation for Laporan Hafalan
  const hafalanStats = useMemo(() => {
    const total = filteredHafalan.length;
    const lulus = filteredHafalan.filter((r) => r.statusLulus === 'lulus').length;
    const proses = filteredHafalan.filter((r) => r.statusLulus === 'proses').length;
    const mengulang = filteredHafalan.filter((r) => r.statusLulus === 'mengulang').length;
    return { total, lulus, proses, mengulang };
  }, [filteredHafalan]);

  const dutyStats = useMemo(() => {
    const total = filteredDuties.length;
    const selesai = filteredDuties.filter((d) => d.status === 'selesai').length;
    const terjadwal = filteredDuties.filter((d) => d.status === 'terjadwal').length;
    const diganti = filteredDuties.filter((d) => d.status === 'diganti').length;
    return { total, selesai, terjadwal, diganti };
  }, [filteredDuties]);

  const periodName =
    startDate.slice(0, 7) === endDate.slice(0, 7)
      ? startDate.slice(0, 7)
      : `${startDate}_s_d_${endDate}`;

  const periodTextFormatted = `${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`;

  const namaMajelis = config.namaMajelis || 'YAYASAN USWATUNA CAHAYA NUSANTARA';
  const alamatMajelis = config.alamatMajelis || 'Bandar Lampung';
  const namaKetua = config.namaKetua || 'Aziz Privatna';
  const namaBendahara = config.namaBendahara || 'Wahyu Andriansyah';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reportType === 'kas') {
      exportTransactionsToCSV(filteredTrx, `Laporan_Kas_Pengajian_${periodName}`);
    } else if (reportType === 'rekap') {
      exportRekapToCSV(
        {
          namaMajelis,
          alamatMajelis,
          periodText: `Periode: ${periodTextFormatted}`,
          namaKetua,
          namaBendahara,
          saldoAwal: saldoAwalPeriode,
          totalPemasukan,
          totalPengeluaran,
          saldoAkhir: saldoAkhirPeriode,
          categoryBreakdown,
          members,
          duesInPeriod: filteredDues,
          dutiesInPeriod: filteredDuties,
          hafalanInPeriod: filteredHafalan,
        },
        `Laporan_Rekap_Terpadu_${periodName}`
      );
    } else if (reportType === 'hafalan') {
      exportHafalanToCSV(filteredHafalan, `Laporan_Hafalan_${periodName}`);
    } else {
      exportDutiesToCSV(filteredDuties, `Laporan_Tugas_Pekanan_${periodName}`);
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'kas') {
      exportToExcel(
        filteredTrx,
        `Laporan_Kas_${periodName}`,
        namaMajelis,
        alamatMajelis,
        `Periode: ${periodTextFormatted}`,
        saldoAwalPeriode,
        namaKetua,
        namaBendahara
      );
    } else if (reportType === 'rekap') {
      exportRekapToExcel(
        {
          namaMajelis,
          alamatMajelis,
          periodText: `Periode: ${periodTextFormatted}`,
          namaKetua,
          namaBendahara,
          saldoAwal: saldoAwalPeriode,
          totalPemasukan,
          totalPengeluaran,
          saldoAkhir: saldoAkhirPeriode,
          categoryBreakdown,
          members,
          duesInPeriod: filteredDues,
          dutiesInPeriod: filteredDuties,
          hafalanInPeriod: filteredHafalan,
        },
        `Laporan_Rekap_Terpadu_${periodName}`
      );
    } else if (reportType === 'hafalan') {
      exportHafalanToExcel(
        filteredHafalan,
        `Laporan_Hafalan_${periodName}`,
        namaMajelis,
        alamatMajelis,
        `Periode: ${periodTextFormatted}`,
        namaKetua,
        namaBendahara
      );
    } else {
      exportDutiesToExcel(
        filteredDuties,
        `Laporan_Tugas_Pekanan_${periodName}`,
        namaMajelis,
        alamatMajelis,
        `Periode: ${periodTextFormatted}`,
        namaKetua,
        namaBendahara
      );
    }
  };

  const handleQuickPreset = (preset: 'thisMonth' | 'lastMonth' | '3months' | 'thisYear' | 'all') => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = d.getMonth();

    if (preset === 'thisMonth') {
      const start = `${yr}-${String(mo + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(yr, mo + 1, 0).getDate();
      const end = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
      setReportPeriod(`${yr}-${String(mo + 1).padStart(2, '0')}`);
    } else if (preset === 'lastMonth') {
      const prevMoDate = new Date(yr, mo - 1, 1);
      const prevYr = prevMoDate.getFullYear();
      const prevMo = prevMoDate.getMonth();
      const start = `${prevYr}-${String(prevMo + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(prevYr, prevMo + 1, 0).getDate();
      const end = `${prevYr}-${String(prevMo + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
      setReportPeriod(`${prevYr}-${String(prevMo + 1).padStart(2, '0')}`);
    } else if (preset === '3months') {
      const threeMoAgo = new Date(yr, mo - 2, 1);
      const start = `${threeMoAgo.getFullYear()}-${String(threeMoAgo.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(yr, mo + 1, 0).getDate();
      const end = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'thisYear') {
      setStartDate(`${yr}-01-01`);
      setEndDate(`${yr}-12-31`);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    }
  };

  const handleSetMonth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReportPeriod(val);
    if (val) {
      const [yr, mo] = val.split('-').map(Number);
      const start = `${yr}-${String(mo).padStart(2, '0')}-01`;
      const lastDay = new Date(yr, mo, 0).getDate();
      const end = `${yr}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    }
  };

  const reportTabs: Array<{ id: ReportKind; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'kas', label: 'Laporan Kas', icon: Receipt },
    { id: 'rekap', label: 'Laporan Rekap', icon: ClipboardList },
    { id: 'hafalan', label: 'Laporan Hafalan', icon: BookMarked },
    { id: 'tugas', label: 'Laporan Tugas', icon: CalendarCheck },
  ];

  const reportTitles: Record<ReportKind, string> = {
    kas: 'LAPORAN PERTANGGUNGJAWABAN KAS',
    rekap: 'LAPORAN REKAP TERPADU MAJELIS TAKLIM',
    hafalan: 'LAPORAN SETORAN & PROGRES HAFALAN JAMAAH',
    tugas: 'LAPORAN JADWAL TUGAS MC, KULTUM & KHUTBAH',
  };

  const activeDataCount =
    reportType === 'kas'
      ? filteredTrx.length
      : reportType === 'rekap'
      ? filteredTrx.length + filteredDues.length + filteredDuties.length + filteredHafalan.length
      : reportType === 'hafalan'
      ? filteredHafalan.length
      : filteredDuties.length;

  const activeCountLabel =
    reportType === 'kas'
      ? 'Total Transaksi'
      : reportType === 'rekap'
      ? 'Total Aktivitas Periode'
      : reportType === 'hafalan'
      ? 'Total Setoran Hafalan'
      : 'Total Jadwal Tugas';

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden during printing) */}
      <div className="print:hidden space-y-4">
        {/* Top Action Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-800" />
                <span>Pusat Laporan & Cetak Dokumen</span>
              </h2>
              <p className="text-xs text-slate-500">
                Pilih jenis laporan (Kas, Rekap Terpadu, Hafalan, atau Jadwal Tugas), lalu cetak PDF atau unduh Excel / CSV
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-all border border-emerald-200 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Unduh Excel (.xls)</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all border border-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4 text-slate-700" />
                <span>Unduh CSV (.csv)</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Report Kind Switcher */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = reportType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setReportType(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters & Customization Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          {/* Filter Range Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Pilihan Cepat Periode:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleQuickPreset('thisMonth')}
                  className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Bulan Ini
                </button>
                <button
                  onClick={() => handleQuickPreset('lastMonth')}
                  className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Bulan Lalu
                </button>
                <button
                  onClick={() => handleQuickPreset('3months')}
                  className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  3 Bulan Terakhir
                </button>
                <button
                  onClick={() => handleQuickPreset('thisYear')}
                  className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Tahun Ini
                </button>
                <button
                  onClick={() => handleQuickPreset('all')}
                  className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Semua Data
                </button>
              </div>
            </div>

            {/* Custom Range Input */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Bulan:</span>
                <input
                  type="month"
                  value={reportPeriod}
                  onChange={handleSetMonth}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                />
                <span className="text-xs font-semibold text-slate-600">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Extra Filters when Hafalan or Tugas is selected */}
          {reportType === 'hafalan' && (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4 text-xs">
              <span className="font-bold text-slate-700">Filter Laporan Hafalan:</span>
              <select
                value={hafalanCategoryFilter}
                onChange={(e) => setHafalanCategoryFilter(e.target.value as 'semua' | HafalanKategori)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 cursor-pointer"
              >
                <option value="semua">Semua Kategori</option>
                {HAFALAN_CATEGORIES.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>

              <select
                value={hafalanStatusFilter}
                onChange={(e) => setHafalanStatusFilter(e.target.value as 'semua' | HafalanStatus)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 cursor-pointer"
              >
                <option value="semua">Semua Status Kelulusan</option>
                <option value="lulus">Lulus</option>
                <option value="proses">Proses</option>
                <option value="mengulang">Mengulang</option>
              </select>
            </div>
          )}

          {reportType === 'tugas' && (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4 text-xs">
              <span className="font-bold text-slate-700">Filter Laporan Tugas:</span>
              <select
                value={dutyStatusFilter}
                onChange={(e) => setDutyStatusFilter(e.target.value as 'semua' | DutyStatus)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 cursor-pointer"
              >
                <option value="semua">Semua Status Tugas</option>
                <option value="terjadwal">Terjadwal</option>
                <option value="selesai">Selesai</option>
                <option value="diganti">Diganti</option>
              </select>
            </div>
          )}

          {/* Toggle Options Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-emerald-800" />
                Tampilkan di Dokumen Cetak:
              </span>

              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSummary}
                  onChange={(e) => setShowSummary(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-800 cursor-pointer"
                />
                <span>Box Ringkasan</span>
              </label>

              {reportType === 'kas' && (
                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showKeterangan}
                    onChange={(e) => setShowKeterangan(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-800 cursor-pointer"
                  />
                  <span>Kolom Keterangan</span>
                </label>
              )}

              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-800 cursor-pointer"
                />
                <span>Kolom Tanda Tangan (Ketua & Bendahara)</span>
              </label>
            </div>

            <div className="font-semibold bg-emerald-50 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-100 tabular-nums">
              {activeCountLabel}: <strong className="text-slate-900">{activeDataCount}</strong>
            </div>
          </div>
        </div>

        {/* Tip Banner for PDF saving */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Panduan Cara Simpan Sebagai PDF:</p>
            <p className="text-amber-800 leading-relaxed">
              Klik tombol <strong>&ldquo;Cetak Dokumen / Simpan PDF&rdquo;</strong> di atas. Pada jendela cetak browser yang muncul, ubah pilihan <strong>Tujuan / Destination / Printer</strong> menjadi <strong>&ldquo;Simpan sebagai PDF&rdquo; (Save as PDF)</strong>, lalu klik tombol Simpan.
            </p>
          </div>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-md border border-slate-200 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:w-full">
        {/* Formal Kop Header */}
        <div className="text-center pb-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-serif uppercase tracking-tight">
            {namaMajelis}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">{alamatMajelis}</p>
          <div className="border-b border-slate-200 my-4"></div>

          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900 font-sans">
            {reportTitles[reportType]}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-serif italic mt-0.5">
            Periode: {periodTextFormatted}
          </p>
          <div className="border-b-2 border-emerald-950 mt-4 mb-6"></div>
        </div>

        {/* ===================== 1. LAPORAN KAS ===================== */}
        {reportType === 'kas' && (
          <>
            {showSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 bg-slate-50/80 p-5 rounded-xl border border-slate-200/90 text-xs items-center">
                <div className="space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">
                    SALDO AWAL PERIODE
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base block tabular-nums">
                    {formatRupiah(saldoAwalPeriode)}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-emerald-700 uppercase text-[10px] font-bold tracking-wider block">
                    + TOTAL PEMASUKAN
                  </span>
                  <span className="font-extrabold text-emerald-800 text-sm sm:text-base block tabular-nums">
                    {formatRupiah(totalPemasukan)}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-rose-700 uppercase text-[10px] font-bold tracking-wider block">
                    - TOTAL PENGELUARAN
                  </span>
                  <span className="font-extrabold text-rose-800 text-sm sm:text-base block tabular-nums">
                    {formatRupiah(totalPengeluaran)}
                  </span>
                </div>

                <div className="bg-emerald-100/90 p-3 rounded-lg border border-emerald-300/80 space-y-0.5">
                  <span className="text-emerald-950 uppercase text-[10px] font-bold tracking-wider block">
                    = SALDO AKHIR
                  </span>
                  <span className="font-black text-emerald-950 text-base sm:text-lg block tabular-nums">
                    {formatRupiah(saldoAkhirPeriode)}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif mb-2 uppercase tracking-wide">
                RINCIAN TRANSAKSI KAS
              </h3>
              <div className="border-b border-slate-300 mb-3"></div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 font-bold uppercase text-slate-700 text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">NO</th>
                    <th className="py-2.5 px-3 w-32 border-r border-slate-200">TANGGAL</th>
                    <th className="py-2.5 px-3 w-36 border-r border-slate-200">KATEGORI</th>
                    {showKeterangan && <th className="py-2.5 px-3 border-r border-slate-200">KETERANGAN</th>}
                    <th className="py-2.5 px-3 text-right border-r border-slate-200 w-36">MASUK (RP)</th>
                    <th className="py-2.5 px-3 text-right w-36">KELUAR (RP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTrx.length === 0 ? (
                    <tr>
                      <td colSpan={showKeterangan ? 6 : 5} className="py-8 text-center text-slate-400 italic">
                        Tidak ada transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredTrx.map((t, idx) => (
                      <tr key={t.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium border-r border-slate-200 whitespace-nowrap text-slate-900">
                          {formatDateIndo(t.tanggal)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold border-r border-slate-200 text-slate-800">
                          {t.kategori}
                        </td>
                        {showKeterangan && (
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">
                            {t.keterangan || '-'}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700 border-r border-slate-200 tabular-nums">
                          {t.jenis === 'pemasukan' ? formatRupiah(t.nominal) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700 tabular-nums">
                          {t.jenis === 'pengeluaran' ? formatRupiah(t.nominal) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                    <td
                      colSpan={showKeterangan ? 4 : 3}
                      className="py-2.5 px-3 text-right uppercase border-r border-slate-300"
                    >
                      TOTAL PERIODE INI
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-800 font-extrabold border-r border-slate-300 tabular-nums">
                      {formatRupiah(totalPemasukan)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-800 font-extrabold tabular-nums">
                      {formatRupiah(totalPengeluaran)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/80 font-extrabold border-t border-slate-300 text-slate-950">
                    <td
                      colSpan={showKeterangan ? 4 : 3}
                      className="py-3 px-3 text-right uppercase border-r border-slate-300 text-xs tracking-wider"
                    >
                      SALDO AKHIR PERIODE
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-emerald-950 text-sm font-black tabular-nums">
                      {formatRupiah(saldoAkhirPeriode)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* ===================== 2. LAPORAN REKAP TERPADU ===================== */}
        {reportType === 'rekap' && (
          <div className="space-y-7 mb-8">
            {showSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">SALDO AKHIR KAS</span>
                  <span className="font-extrabold text-emerald-900 text-sm block tabular-nums">
                    {formatRupiah(saldoAkhirPeriode)}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">ANGGOTA AKTIF</span>
                  <span className="font-extrabold text-slate-900 text-sm block tabular-nums">
                    {members.filter((m) => (m.statusAktif || 'aktif') === 'aktif').length} / {members.length} Orang
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">JADWAL TUGAS</span>
                  <span className="font-extrabold text-slate-900 text-sm block tabular-nums">
                    {dutyStats.selesai} / {dutyStats.total} Selesai
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">SETORAN HAFALAN</span>
                  <span className="font-extrabold text-slate-900 text-sm block tabular-nums">
                    {hafalanStats.lulus} / {hafalanStats.total} Lulus
                  </span>
                </div>
              </div>
            )}

            {/* A. Rekap Kas per Kategori */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif mb-2 uppercase tracking-wide border-b border-slate-300 pb-1.5">
                A. REKAPITULASI KAS PER KATEGORI
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 font-bold uppercase text-slate-700 text-[11px]">
                    <th className="py-2 px-3 w-10 text-center border-r border-slate-200">NO</th>
                    <th className="py-2 px-3 border-r border-slate-200">KATEGORI TRANSAKSI</th>
                    <th className="py-2 px-3 w-28 text-center border-r border-slate-200">JENIS</th>
                    <th className="py-2 px-3 w-28 text-center border-r border-slate-200">JUMLAH TRX</th>
                    <th className="py-2 px-3 w-40 text-right">TOTAL NOMINAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {categoryBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        Tidak ada transaksi kas pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    categoryBreakdown.map((item, idx) => (
                      <tr key={`${item.jenis}-${item.kategori}`} className="border-b border-slate-200">
                        <td className="py-2 px-3 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                          {item.kategori}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 uppercase text-[11px] font-bold">
                          <span className={item.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}>
                            {item.jenis}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center tabular-nums border-r border-slate-200">
                          {item.jumlah}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold tabular-nums ${
                            item.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* B. Rekap Aktivitas Anggota, Tugas & Hafalan */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif mb-2 uppercase tracking-wide border-b border-slate-300 pb-1.5">
                B. REKAPITULASI KEANGGOTAAN, TUGAS PEKANAN & HAFALAN
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 font-bold uppercase text-slate-700 text-[11px]">
                    <th className="py-2 px-3 border-r border-slate-200">BIDANG PROGRAM</th>
                    <th className="py-2 px-3 border-r border-slate-200">RINGKASAN CAPAIAN</th>
                    <th className="py-2 px-3 text-right">ANGKA / NILAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-3 font-semibold border-r border-slate-200">Master Data Anggota</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      Total anggota terdaftar ({members.filter((m) => (m.statusAktif || 'aktif') === 'aktif').length} aktif,{' '}
                      {members.filter((m) => m.statusAktif === 'nonaktif').length} non-aktif)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums">{members.length} Orang</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-3 font-semibold border-r border-slate-200">Iuran Anggota Periode Ini</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      {filteredDues.length} kali pembayaran iuran anggota tercatat
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 tabular-nums">
                      {formatRupiah(filteredDues.reduce((s, d) => s + d.nominal, 0))}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-3 font-semibold border-r border-slate-200">Tugas MC, Kultum & Khutbah</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      {dutyStats.selesai} selesai, {dutyStats.terjadwal} terjadwal, {dutyStats.diganti} diganti
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums">{dutyStats.total} Jadwal</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-3 font-semibold border-r border-slate-200">Setoran Hafalan Jamaah</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      {hafalanStats.lulus} lulus, {hafalanStats.proses} proses, {hafalanStats.mengulang} mengulang
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums">{hafalanStats.total} Setoran</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== 3. LAPORAN HAFALAN ===================== */}
        {reportType === 'hafalan' && (
          <div className="mb-8">
            {showSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">TOTAL SETORAN</span>
                  <span className="font-extrabold text-slate-900 text-base tabular-nums">{hafalanStats.total}</span>
                </div>
                <div>
                  <span className="text-emerald-700 uppercase text-[10px] font-bold block">LULUS</span>
                  <span className="font-extrabold text-emerald-800 text-base tabular-nums">{hafalanStats.lulus}</span>
                </div>
                <div>
                  <span className="text-blue-700 uppercase text-[10px] font-bold block">PROSES</span>
                  <span className="font-extrabold text-blue-800 text-base tabular-nums">{hafalanStats.proses}</span>
                </div>
                <div>
                  <span className="text-amber-700 uppercase text-[10px] font-bold block">MENGULANG</span>
                  <span className="font-extrabold text-amber-800 text-base tabular-nums">{hafalanStats.mengulang}</span>
                </div>
              </div>
            )}

            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif mb-2 uppercase tracking-wide">
              RINCIAN SETORAN HAFALAN JAMAAH
            </h3>
            <div className="border-b border-slate-300 mb-3"></div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 font-bold uppercase text-slate-700 text-[11px]">
                  <th className="py-2.5 px-2.5 w-9 text-center border-r border-slate-200">NO</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">TANGGAL</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">NAMA ANGGOTA</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">KATEGORI</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">SURAH / MATERI</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">PREDIKAT & PENYIMAK</th>
                  <th className="py-2.5 px-2.5 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredHafalan.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Tidak ada catatan hafalan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredHafalan.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-200">
                      <td className="py-2.5 px-2.5 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap border-r border-slate-200">
                        {formatDateIndo(r.tanggal)}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-slate-900 border-r border-slate-200">
                        {r.namaAnggota}
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-slate-200">{r.kategori}</td>
                      <td className="py-2.5 px-2.5 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{r.surahAtauMateri}</div>
                        <div className="text-[11px] text-slate-500">
                          {[r.juz, r.ayatAtauHalaman].filter(Boolean).join(' · ') || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-slate-200">
                        <div className="font-medium text-slate-800">{r.predikat}</div>
                        <div className="text-[11px] text-slate-500">{r.penyimak}</div>
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-bold uppercase text-[11px]">
                        <span
                          className={
                            r.statusLulus === 'lulus'
                              ? 'text-emerald-700'
                              : r.statusLulus === 'mengulang'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }
                        >
                          {r.statusLulus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== 4. LAPORAN TUGAS PEKANAN ===================== */}
        {reportType === 'tugas' && (
          <div className="mb-8">
            {showSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">TOTAL JADWAL</span>
                  <span className="font-extrabold text-slate-900 text-base tabular-nums">{dutyStats.total}</span>
                </div>
                <div>
                  <span className="text-emerald-700 uppercase text-[10px] font-bold block">SELESAI</span>
                  <span className="font-extrabold text-emerald-800 text-base tabular-nums">{dutyStats.selesai}</span>
                </div>
                <div>
                  <span className="text-blue-700 uppercase text-[10px] font-bold block">TERJADWAL</span>
                  <span className="font-extrabold text-blue-800 text-base tabular-nums">{dutyStats.terjadwal}</span>
                </div>
                <div>
                  <span className="text-amber-700 uppercase text-[10px] font-bold block">DIGANTI</span>
                  <span className="font-extrabold text-amber-800 text-base tabular-nums">{dutyStats.diganti}</span>
                </div>
              </div>
            )}

            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif mb-2 uppercase tracking-wide">
              RINCIAN JADWAL PETUGAS PEKANAN
            </h3>
            <div className="border-b border-slate-300 mb-3"></div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 font-bold uppercase text-slate-700 text-[11px]">
                  <th className="py-2.5 px-2.5 w-16 text-center border-r border-slate-200">PEKAN</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">TANGGAL & WAKTU</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">MC / PEMBAWA ACARA</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">KULTUM & TEMA</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">KHUTBAH & TEMA</th>
                  <th className="py-2.5 px-2.5 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDuties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Tidak ada jadwal tugas pekanan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredDuties.map((d) => (
                    <tr key={d.id} className="border-b border-slate-200">
                      <td className="py-2.5 px-2.5 text-center font-bold border-r border-slate-200">
                        Pekan {d.pekanKe}
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-slate-200 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{formatDateIndo(d.tanggal)}</div>
                        {d.waktu && <div className="text-[11px] text-slate-500">{d.waktu}</div>}
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-900 border-r border-slate-200">
                        {d.mc}
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{d.kultum}</div>
                        {d.temaKultum && <div className="text-[11px] text-slate-500">{d.temaKultum}</div>}
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{d.khutbah}</div>
                        {d.temaKhutbah && <div className="text-[11px] text-slate-500">{d.temaKhutbah}</div>}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-bold uppercase text-[11px]">
                        <span
                          className={
                            d.status === 'selesai'
                              ? 'text-emerald-700'
                              : d.status === 'diganti'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Formal Signatures Section */}
        {showSignatures && (
          <div className="pt-10 border-t border-slate-200 mt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-800">
            <div>
              <p className="text-slate-600 mb-16">
                Mengetahui,
                <br />
                <strong className="text-slate-900">Ketua Majelis Taklim</strong>
              </p>
              <p className="font-bold border-b border-slate-400 inline-block px-8 pb-1 text-slate-900">
                {namaKetua}
              </p>
            </div>

            <div>
              <p className="text-slate-600 mb-16">
                Dibuat oleh,
                <br />
                <strong className="text-slate-900">Bendahara Kas</strong>
              </p>
              <p className="font-bold border-b border-slate-400 inline-block px-8 pb-1 text-slate-900">
                {namaBendahara}
              </p>
            </div>
          </div>
        )}

        <div className="mt-10 text-center text-[10px] text-slate-400 italic print:block">
          Dicetak resmi melalui Sistem Buku Kas Pengajian pada {new Date().toLocaleString('id-ID')}
        </div>
      </div>
    </div>
  );
};
