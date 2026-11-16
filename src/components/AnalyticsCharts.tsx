import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  PieChart,
  CheckCircle2
} from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/formatters';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  saldoAwal: number;
}

type TimeRange = '3m' | '6m' | 'year' | 'all';

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');

  // Filter transactions by range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    if (timeRange === '3m') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return transactions.filter(t => new Date(t.tanggal) >= threeMonthsAgo);
    }
    if (timeRange === '6m') {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return transactions.filter(t => new Date(t.tanggal) >= sixMonthsAgo);
    }
    if (timeRange === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return transactions.filter(t => new Date(t.tanggal) >= startOfYear);
    }
    return transactions;
  }, [transactions, timeRange]);

  // Monthly totals calculation
  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number; monthName: string }> = {};

    const monthsCount = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d);
      map[key] = { income: 0, expense: 0, monthName };
    }

    filteredTransactions.forEach((t) => {
      const monthKey = t.tanggal.slice(0, 7);
      if (map[monthKey]) {
        if (t.jenis === 'pemasukan') map[monthKey].income += t.nominal;
        else map[monthKey].expense += t.nominal;
      }
    });

    return Object.keys(map).map((k) => ({
      key: k,
      ...map[k],
    }));
  }, [filteredTransactions, timeRange]);

  // Max value for bar scaling
  const maxMonthlyVal = useMemo(() => {
    let max = 100000;
    monthlyData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max;
  }, [monthlyData]);

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExp = 0;

    filteredTransactions.forEach((t) => {
      if (t.jenis === 'pengeluaran') {
        map[t.kategori] = (map[t.kategori] || 0) + t.nominal;
        totalExp += t.nominal;
      }
    });

    return Object.entries(map)
      .map(([kategori, total]) => ({
        kategori,
        total,
        percentage: totalExp > 0 ? (total / totalExp) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  // Income breakdown by category
  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    let totalInc = 0;

    filteredTransactions.forEach((t) => {
      if (t.jenis === 'pemasukan') {
        map[t.kategori] = (map[t.kategori] || 0) + t.nominal;
        totalInc += t.nominal;
      }
    });

    return Object.entries(map)
      .map(([kategori, total]) => ({
        kategori,
        total,
        percentage: totalInc > 0 ? (total / totalInc) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  const totalFilteredIncome = filteredTransactions.filter(t => t.jenis === 'pemasukan').reduce((a, b) => a + b.nominal, 0);
  const totalFilteredExpense = filteredTransactions.filter(t => t.jenis === 'pengeluaran').reduce((a, b) => a + b.nominal, 0);
  const netCashflow = totalFilteredIncome - totalFilteredExpense;
  const expenseRatio = totalFilteredIncome > 0 ? Math.round((totalFilteredExpense / totalFilteredIncome) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-800" />
            Analisis & Grafik Kas
          </h2>
          <p className="text-xs text-slate-500">
            Rangkuman performa keuangan, perbandingan bulanan, dan alokasi kas
          </p>
        </div>

        {/* Time Period Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/70">
          <button
            onClick={() => setTimeRange('3m')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              timeRange === '3m' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3 Bulan
          </button>
          <button
            onClick={() => setTimeRange('6m')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              timeRange === '6m' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6 Bulan
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              timeRange === 'year' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tahun Ini
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              timeRange === 'all' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income KPI */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan</span>
            <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-slate-900">
            {formatRupiah(totalFilteredIncome)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{filteredTransactions.filter(t => t.jenis === 'pemasukan').length} Transaksi</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">Masuk</span>
          </div>
        </div>

        {/* Total Expense KPI */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</span>
            <div className="p-2 rounded-xl bg-rose-100/80 text-rose-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-slate-900">
            {formatRupiah(totalFilteredExpense)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{filteredTransactions.filter(t => t.jenis === 'pengeluaran').length} Transaksi</span>
            <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md">Keluar</span>
          </div>
        </div>

        {/* Net Cashflow KPI */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surplus / Net Kas</span>
            <div className={`p-2 rounded-xl ${netCashflow >= 0 ? 'bg-blue-100/80 text-blue-700' : 'bg-amber-100/80 text-amber-700'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg font-extrabold ${netCashflow >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
            {netCashflow >= 0 ? '+' : ''}{formatRupiah(netCashflow)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Arus Bersih</span>
            <span className={`font-bold px-1.5 py-0.5 rounded-md ${netCashflow >= 0 ? 'text-blue-700 bg-blue-50' : 'text-amber-700 bg-amber-50'}`}>
              {netCashflow >= 0 ? 'Positif' : 'Defisit'}
            </span>
          </div>
        </div>

        {/* Efficiency KPI */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rasio Pengeluaran</span>
            <div className="p-2 rounded-xl bg-purple-100/80 text-purple-700">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-slate-900">
            {expenseRatio}%
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dari Total Masuk</span>
            <span className={`font-bold px-1.5 py-0.5 rounded-md ${expenseRatio <= 75 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
              {expenseRatio <= 75 ? 'Sangat Aman' : 'Perlu Kontrol'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base font-serif flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-800" />
              Perbandingan Kas Bulanan
            </h3>
            <p className="text-xs text-slate-500">Grafik perbandingan pemasukan vs pengeluaran per bulan</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-700 shadow-2xs" />
              <span className="text-slate-700">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-600 shadow-2xs" />
              <span className="text-slate-700">Pengeluaran</span>
            </div>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="relative pt-6">
          {/* Background grid lines */}
          <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
          </div>

          <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-300/80 pb-2 relative z-10">
            {monthlyData.map((d) => {
              const incPct = (d.income / maxMonthlyVal) * 100;
              const expPct = (d.expense / maxMonthlyVal) * 100;

              return (
                <div key={d.key} className="flex-1 flex flex-col items-center h-full justify-end group">
                  
                  {/* Floating tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl mb-2 shadow-xl z-20 pointer-events-none text-center whitespace-nowrap transform translate-y-1 group-hover:translate-y-0">
                    <div className="font-extrabold text-amber-300 border-b border-slate-700 pb-1 mb-1">{d.monthName}</div>
                    <div className="text-emerald-400 font-semibold">Masuk: {formatRupiah(d.income)}</div>
                    <div className="text-rose-400 font-semibold">Keluar: {formatRupiah(d.expense)}</div>
                  </div>

                  {/* Dual Bar Container */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full max-w-[90px]">
                    
                    {/* Income Bar */}
                    <div className="flex-1 h-full flex flex-col justify-end items-center group/bar">
                      {d.income > 0 && (
                        <span className="text-[9px] font-bold text-emerald-800 mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity hidden sm:block">
                          {formatRupiah(d.income)}
                        </span>
                      )}
                      <div
                        style={{ height: `${Math.max(6, incPct)}%` }}
                        className="w-full bg-gradient-to-t from-emerald-800 via-emerald-700 to-emerald-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-xs"
                      />
                    </div>

                    {/* Expense Bar */}
                    <div className="flex-1 h-full flex flex-col justify-end items-center group/bar">
                      {d.expense > 0 && (
                        <span className="text-[9px] font-bold text-rose-800 mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity hidden sm:block">
                          {formatRupiah(d.expense)}
                        </span>
                      )}
                      <div
                        style={{ height: `${Math.max(6, expPct)}%` }}
                        className="w-full bg-gradient-to-t from-rose-800 via-rose-600 to-rose-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-xs"
                      />
                    </div>

                  </div>

                  <span className="text-xs font-bold text-slate-700 mt-3 truncate max-w-full">
                    {d.monthName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Distribution Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm font-serif flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Sumber Pemasukan
            </h3>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              {formatRupiah(totalFilteredIncome)}
            </span>
          </div>

          <div className="space-y-3.5">
            {incomeByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center italic">Belum ada data pemasukan pada periode ini</p>
            ) : (
              incomeByCategory.map((cat, idx) => (
                <div key={cat.kategori} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800">{cat.kategori}</span>
                      {idx === 0 && (
                        <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full border border-amber-200">
                          Dominan
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 font-extrabold mr-1.5">{formatRupiah(cat.total)}</span>
                      <span className="text-slate-500 text-[11px]">({cat.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className="h-full bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm font-serif flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              Alokasi Pengeluaran
            </h3>
            <span className="text-xs font-extrabold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
              {formatRupiah(totalFilteredExpense)}
            </span>
          </div>

          <div className="space-y-3.5">
            {expenseByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center italic">Belum ada data pengeluaran pada periode ini</p>
            ) : (
              expenseByCategory.map((cat, idx) => (
                <div key={cat.kategori} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800">{cat.kategori}</span>
                      {idx === 0 && (
                        <span className="text-[9px] font-extrabold bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded-full border border-rose-200">
                          Tertinggi
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 font-extrabold mr-1.5">{formatRupiah(cat.total)}</span>
                      <span className="text-slate-500 text-[11px]">({cat.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className="h-full bg-gradient-to-r from-rose-700 to-rose-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Islami Financial Insight Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/60 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Insight Keuangan Pengajian
            </span>
            <span className="text-slate-400 text-xs font-medium">| Amanah & Transparan</span>
          </div>

          <h4 className="text-xl font-bold font-serif text-white">
            {expenseRatio <= 70
              ? 'Arus Kas Majelis Sangat Sehat'
              : expenseRatio <= 90
              ? 'Pengelolaan Kas Terkendali dengan Baik'
              : 'Memerlukan Efisiensi Pengeluaran'}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            {expenseRatio <= 70
              ? 'MasyaAllah, cadangan kas berjalan stabil. Dana amanah jamaah teralokasi dengan baik dan siap untuk kegiatan taklim maupun santunan.'
              : expenseRatio <= 90
              ? 'Pengeluaran operasional pengajian seimbang dengan insentif penceramah dan konsumsi. Tetap pertahankan pencatatan rutin.'
              : 'Perhatian: Pengeluaran bulan ini hampir mendekati total infak. Disarankan mengoptimalkan penarikan iuran anggota dan donatur.'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center min-w-[200px] shrink-0 relative z-10 space-y-1">
          <span className="text-[11px] text-slate-300 block font-medium">Rata-rata Inflow / Bln</span>
          <span className="text-lg font-black text-amber-300 font-mono">
            {formatRupiah(totalFilteredIncome / Math.max(1, monthlyData.length))}
          </span>
          <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-1 text-[10px] text-emerald-300 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Terverifikasi Otomatis
          </div>
        </div>
      </div>

    </div>
  );
};
