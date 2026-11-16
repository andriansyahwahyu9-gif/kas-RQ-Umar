import React, { useState } from 'react';
import { 
  Printer, 
  HelpCircle,
  FileSpreadsheet,
  Download,
  Settings2
} from 'lucide-react';
import { Transaction, PengajianConfig } from '../types';
import { formatRupiah, formatDateIndo, exportTransactionsToCSV, exportToExcel } from '../utils/formatters';

interface PrintReportViewProps {
  transactions: Transaction[];
  config: PengajianConfig;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ transactions, config }) => {
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
  });

  // Toggle options for document elements
  const [showSummary, setShowSummary] = useState(true);
  const [showKeterangan, setShowKeterangan] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  // Filter transactions by chosen range
  const filteredTrx = transactions
    .filter((t) => t.tanggal >= startDate && t.tanggal <= endDate)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Transactions PRIOR to startDate to compute starting balance for this period
  const priorTrx = transactions.filter((t) => t.tanggal < startDate);
  const priorIncome = priorTrx.filter((t) => t.jenis === 'pemasukan').reduce((a, b) => a + b.nominal, 0);
  const priorExpense = priorTrx.filter((t) => t.jenis === 'pengeluaran').reduce((a, b) => a + b.nominal, 0);
  
  const saldoAwalPeriode = config.saldoAwal + priorIncome - priorExpense;

  const totalPemasukan = filteredTrx.filter((t) => t.jenis === 'pemasukan').reduce((a, b) => a + b.nominal, 0);
  const totalPengeluaran = filteredTrx.filter((t) => t.jenis === 'pengeluaran').reduce((a, b) => a + b.nominal, 0);
  const saldoAkhirPeriode = saldoAwalPeriode + totalPemasukan - totalPengeluaran;

  const handlePrint = () => {
    window.print();
  };

  const periodName = startDate.slice(0, 7) === endDate.slice(0, 7) 
    ? startDate.slice(0, 7) 
    : `${startDate}_s_d_${endDate}`;

  const periodTextFormatted = `${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`;

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTrx, `Laporan_Kas_Pengajian_${periodName}`);
  };

  const handleExportExcel = () => {
    exportToExcel(
      filteredTrx,
      `Laporan_Kas_${periodName}`,
      config.namaMajelis || 'YAYASAN USWATUNA CAHAYA NUSANTARA',
      config.alamatMajelis || 'Bandar Lampung',
      `Periode: ${periodTextFormatted}`,
      saldoAwalPeriode,
      config.namaKetua || 'Aziz Privatna',
      config.namaBendahara || 'Wahyu Andriansyah'
    );
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

  return (
    <div className="space-y-6">
      
      {/* Control Panel (Hidden during printing) */}
      <div className="print:hidden space-y-4">
        
        {/* Top Action Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-800" />
              Laporan & Cetak Dokumen Kas
            </h2>
            <p className="text-xs text-slate-500">
              Pilih tanggal, sesuaikan format laporan, lalu cetak fisik, simpan sebagai PDF, atau unduh Excel / CSV
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-all border border-emerald-200 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Unduh Excel (.xls)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all border border-slate-200 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-700" />
              <span>Unduh CSV (.csv)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Filters & Customization Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          
          {/* Filter Range Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            
            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pilihan Cepat Periode:</span>
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
                <span>Box Ringkasan Saldo</span>
              </label>

              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKeterangan}
                  onChange={(e) => setShowKeterangan(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-800 cursor-pointer"
                />
                <span>Kolom Keterangan</span>
              </label>

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

            <div className="text-slate-500 font-semibold bg-emerald-50 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-100">
              Total Transaksi: <strong className="text-slate-900">{filteredTrx.length}</strong>
            </div>
          </div>

        </div>

        {/* Tip Banner for PDF saving */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Panduan Cara Simpan Sebagai PDF:</p>
            <p className="text-amber-800 leading-relaxed">
              Klik tombol <strong>"Cetak Dokumen / Simpan PDF"</strong> di atas. Pada jendela cetak browser yang muncul, ubah pilihan <strong>Tujuan / Destination / Printer</strong> menjadi <strong>"Simpan sebagai PDF" (Save as PDF)</strong>, lalu klik tombol Simpan.
            </p>
          </div>
        </div>

      </div>

      {/* Printable Report Document Card (Designed exactly as pictured) */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-md border border-slate-200 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:w-full">
        
        {/* Formal Header matching the user's uploaded image */}
        <div className="text-center pb-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-serif uppercase tracking-tight">
            {config.namaMajelis || 'YAYASAN USWATUNA CAHAYA NUSANTARA'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            {config.alamatMajelis || 'Bandar Lampung'}
          </p>
          <div className="border-b border-slate-200 my-4"></div>

          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900 font-sans">
            LAPORAN PERTANGGUNGJAWABAN KAS
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-serif italic mt-0.5">
            Periode: {formatDateIndo(startDate)} s/d {formatDateIndo(endDate)}
          </p>
          <div className="border-b-2 border-emerald-950 mt-4 mb-6"></div>
        </div>

        {/* Ringkasan Saldo Box - Exact image replica */}
        {showSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 bg-slate-50/80 p-5 rounded-xl border border-slate-200/90 text-xs items-center">
            <div className="space-y-1">
              <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">SALDO AWAL PERIODE</span>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base block">{formatRupiah(saldoAwalPeriode)}</span>
            </div>

            <div className="space-y-1">
              <span className="text-emerald-700 uppercase text-[10px] font-bold tracking-wider block">+ TOTAL PEMASUKAN</span>
              <span className="font-extrabold text-emerald-800 text-sm sm:text-base block">{formatRupiah(totalPemasukan)}</span>
            </div>

            <div className="space-y-1">
              <span className="text-rose-700 uppercase text-[10px] font-bold tracking-wider block">- TOTAL PENGELUARAN</span>
              <span className="font-extrabold text-rose-800 text-sm sm:text-base block">{formatRupiah(totalPengeluaran)}</span>
            </div>

            <div className="bg-emerald-100/90 p-3 rounded-lg border border-emerald-300/80 space-y-0.5">
              <span className="text-emerald-950 uppercase text-[10px] font-bold tracking-wider block">= SALDO AKHIR</span>
              <span className="font-black text-emerald-950 text-base sm:text-lg block">{formatRupiah(saldoAkhirPeriode)}</span>
            </div>
          </div>
        )}

        {/* Rincian Transaksi Kas Section */}
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
                    <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium border-r border-slate-200 whitespace-nowrap text-slate-900">{formatDateIndo(t.tanggal)}</td>
                    <td className="py-2.5 px-3 font-semibold border-r border-slate-200 text-slate-800">{t.kategori}</td>
                    {showKeterangan && <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">{t.keterangan || '-'}</td>}
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 border-r border-slate-200">
                      {t.jenis === 'pemasukan' ? formatRupiah(t.nominal) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                      {t.jenis === 'pengeluaran' ? formatRupiah(t.nominal) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                <td colSpan={showKeterangan ? 4 : 3} className="py-2.5 px-3 text-right uppercase border-r border-slate-300">TOTAL PERIODE INI</td>
                <td className="py-2.5 px-3 text-right text-emerald-800 font-extrabold border-r border-slate-300">{formatRupiah(totalPemasukan)}</td>
                <td className="py-2.5 px-3 text-right text-rose-800 font-extrabold">{formatRupiah(totalPengeluaran)}</td>
              </tr>
              <tr className="bg-emerald-50/80 font-extrabold border-t border-slate-300 text-slate-950">
                <td colSpan={showKeterangan ? 4 : 3} className="py-3 px-3 text-right uppercase border-r border-slate-300 text-xs tracking-wider">SALDO AKHIR PERIODE</td>
                <td colSpan={2} className="py-3 px-3 text-center text-emerald-950 text-sm font-black">
                  {formatRupiah(saldoAkhirPeriode)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Formal Signatures Section */}
        {showSignatures && (
          <div className="pt-10 border-t border-slate-200 mt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-800">
            <div>
              <p className="text-slate-600 mb-16">Mengetahui,<br /><strong className="text-slate-900">Ketua Majelis Taklim</strong></p>
              <p className="font-bold border-b border-slate-400 inline-block px-8 pb-1 text-slate-900">
                {config.namaKetua || 'H. Ahmad Subarkah, S.Ag'}
              </p>
            </div>

            <div>
              <p className="text-slate-600 mb-16">Dibuat oleh,<br /><strong className="text-slate-900">Bendahara Kas</strong></p>
              <p className="font-bold border-b border-slate-400 inline-block px-8 pb-1 text-slate-900">
                {config.namaBendahara || 'Hj. Siti Rahmah'}
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

