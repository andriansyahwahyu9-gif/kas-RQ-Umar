import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  saldoAwal: number;
  totalTransactionsCount: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalIncome,
  totalExpense,
  saldoAwal,
  totalTransactionsCount,
  thisMonthIncome,
  thisMonthExpense,
  onOpenIncomeModal,
  onOpenExpenseModal,
}) => {
  const currentBalance = saldoAwal + totalIncome - totalExpense;
  const isPositive = currentBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Saldo Kas */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-5 shadow-lg border border-emerald-800 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-amber-300 uppercase">
              Total Saldo Kas
            </span>
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatRupiah(currentBalance)}
          </p>
        </div>
        
        <div className="mt-4 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-xs text-emerald-200">
          <span>Saldo Awal: {formatRupiah(saldoAwal)}</span>
          <span className="bg-emerald-800 text-amber-300 px-2 py-0.5 rounded text-[11px] font-medium">
            Status: {isPositive ? 'Aman' : 'Defisit'}
          </span>
        </div>
      </div>

      {/* Total Pemasukan */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              Total Pemasukan
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {formatRupiah(totalIncome)}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Bulan Ini: {formatRupiah(thisMonthIncome)}
          </span>
          <button
            onClick={onOpenIncomeModal}
            className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs hover:underline cursor-pointer"
          >
            + Tambah
          </button>
        </div>
      </div>

      {/* Total Pengeluaran */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-rose-700 uppercase">
              Total Pengeluaran
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {formatRupiah(totalExpense)}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-rose-600 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Bulan Ini: {formatRupiah(thisMonthExpense)}
          </span>
          <button
            onClick={onOpenExpenseModal}
            className="text-rose-700 hover:text-rose-800 font-semibold text-xs hover:underline cursor-pointer"
          >
            + Catat
          </button>
        </div>
      </div>

      {/* Ringkasan Aktivitas */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
              Aktivitas Kas
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {totalTransactionsCount} <span className="text-sm font-normal text-slate-500">Transaksi</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Net Bulan Ini:</span>
          <span className={`font-bold ${thisMonthIncome - thisMonthExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatRupiah(thisMonthIncome - thisMonthExpense)}
          </span>
        </div>
      </div>
    </div>
  );
};
