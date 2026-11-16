import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Minus, Calendar, Tag, CreditCard, User, AlignLeft, Sparkles } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../data/initialData';
import { formatRupiah } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'pemasukan',
  editingTransaction = null,
}) => {
  const [jenis, setJenis] = useState<TransactionType>(initialType);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [kategori, setKategori] = useState<Category>(INCOME_CATEGORIES[0]);
  const [nominal, setNominal] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [pembayarAtauPenerima, setPembayarAtauPenerima] = useState<string>('');
  const [metode, setMetode] = useState<'Tunai' | 'Transfer Bank' | 'E-Wallet / QRIS'>('Tunai');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setJenis(editingTransaction.jenis);
      setTanggal(editingTransaction.tanggal);
      setKategori(editingTransaction.kategori);
      setNominal(editingTransaction.nominal.toString());
      setKeterangan(editingTransaction.keterangan);
      setPembayarAtauPenerima(editingTransaction.pembayarAtauPenerima || '');
      setMetode(editingTransaction.metode);
    } else {
      setJenis(initialType);
      setTanggal(new Date().toISOString().slice(0, 10));
      setKategori(initialType === 'pemasukan' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
      setNominal('');
      setKeterangan('');
      setPembayarAtauPenerima('');
      setMetode('Tunai');
    }
    setError('');
  }, [isOpen, editingTransaction, initialType]);

  // Handle category adjustment when switching type
  const handleTypeChange = (newType: TransactionType) => {
    setJenis(newType);
    if (newType === 'pemasukan') {
      setKategori(INCOME_CATEGORIES[0]);
    } else {
      setKategori(EXPENSE_CATEGORIES[0]);
    }
  };

  const handleApplyPreset = (presetCategory: Category, presetNominal: number, presetKet: string) => {
    setKategori(presetCategory);
    setNominal(presetNominal.toString());
    if (!keterangan) {
      setKeterangan(presetKet);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedNominal = parseFloat(nominal.replace(/[^0-9]/g, ''));
    
    if (isNaN(parsedNominal) || parsedNominal <= 0) {
      setError('Nominal harus berupa angka lebih dari 0.');
      return;
    }

    if (!keterangan.trim()) {
      setError('Mohon isi keterangan transaksi.');
      return;
    }

    onSave({
      tanggal,
      jenis,
      kategori,
      nominal: parsedNominal,
      keterangan: keterangan.trim(),
      pembayarAtauPenerima: pembayarAtauPenerima.trim() || undefined,
      metode,
    });

    onClose();
  };

  if (!isOpen) return null;

  const presetsIncome = [
    { label: 'Iuran Minggu Ini', cat: 'Iuran Anggota' as Category, amount: 200000, ket: 'Iuran mingguan anggota pengajian' },
    { label: 'Infak Kotak/Tromol', cat: 'Infak & Sedekah' as Category, amount: 150000, ket: 'Infak tromol pengajian' },
    { label: 'Donatur Hamba Allah', cat: 'Donatur / Hamba Allah' as Category, amount: 500000, ket: 'Sedekah Hamba Allah' },
  ];

  const presetsExpense = [
    { label: 'Bisyarah Ustadz', cat: 'Penceramah / Ustadz' as Category, amount: 500000, ket: 'Bisyarah penceramah pengajian' },
    { label: 'Snack & Konsumsi', cat: 'Konsumsi & Snack' as Category, amount: 150000, ket: 'Konsumsi jamaah pengajian' },
    { label: 'Kebersihan/Lainnya', cat: 'Kebersihan & Keamanan' as Category, amount: 50000, ket: 'Uang kebersihan tempat' },
  ];

  const currentPresets = jenis === 'pemasukan' ? presetsIncome : presetsExpense;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${
          jenis === 'pemasukan' ? 'bg-emerald-800' : 'bg-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {jenis === 'pemasukan' ? (
              <div className="p-1.5 bg-emerald-700 rounded-lg">
                <Plus className="w-5 h-5 text-emerald-200" />
              </div>
            ) : (
              <div className="p-1.5 bg-rose-700 rounded-lg">
                <Minus className="w-5 h-5 text-rose-200" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg font-serif">
                {editingTransaction 
                  ? 'Edit Transaksi Kas' 
                  : jenis === 'pemasukan' ? 'Tambah Pemasukan Kas' : 'Catat Pengeluaran Kas'}
              </h3>
              <p className="text-xs opacity-80">Isi rincian transaksi dengan lengkap dan jelas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Toggle Jenis */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl text-sm font-medium">
            <button
              type="button"
              onClick={() => handleTypeChange('pemasukan')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                jenis === 'pemasukan'
                  ? 'bg-emerald-700 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('pengeluaran')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                jenis === 'pengeluaran'
                  ? 'bg-rose-700 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="w-4 h-4" />
              Pengeluaran
            </button>
          </div>

          {/* Quick Presets */}
          {!editingTransaction && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilihan Cepat (Preset):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p.cat, p.amount, p.ket)}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:border-emerald-500 hover:text-emerald-700 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    {p.label} ({formatRupiah(p.amount)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nominal */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                Rp
              </span>
              <input
                type="text"
                required
                placeholder="0"
                value={nominal}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setNominal(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tanggal & Kategori Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as Category)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {(jenis === 'pemasukan' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" /> Keterangan / Catatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Bisyarah KH. Mansur / Iuran mingguan jamaah"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Pembayar/Penerima & Metode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> {jenis === 'pemasukan' ? 'Dari (Pembayar)' : 'Kepada (Penerima)'}
              </label>
              <input
                type="text"
                placeholder={jenis === 'pemasukan' ? 'Contoh: Ibu Hj. Aminah' : 'Contoh: Toko Barokah'}
                value={pembayarAtauPenerima}
                onChange={(e) => setPembayarAtauPenerima(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Metode Pembayaran
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Tunai">Tunai (Cash)</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="E-Wallet / QRIS">E-Wallet / QRIS</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold text-sm shadow-md transition-all cursor-pointer ${
                jenis === 'pemasukan' 
                  ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20' 
                  : 'bg-rose-700 hover:bg-rose-800 shadow-rose-700/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
