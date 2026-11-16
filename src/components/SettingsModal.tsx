import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Download, Upload, ShieldAlert, Check, X } from 'lucide-react';
import { PengajianConfig } from '../types';
import { exportDataToJSON } from '../utils/formatters';

interface SettingsModalProps {
  config: PengajianConfig;
  onSaveConfig: (newConfig: PengajianConfig) => void;
  onExportAll: () => void;
  onImportAll: (data: any) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSaveConfig,
  onExportAll,
  onImportAll,
  onResetData,
}) => {
  const [formData, setFormData] = useState<PengajianConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingRestoreJson, setPendingRestoreJson] = useState<any | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setPendingRestoreJson(json);
      } catch (err) {
        setNotificationMsg('File JSON tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-800" />
          Pengaturan Aplikasi & Informasi Majelis
        </h2>
        <p className="text-xs text-slate-500">
          Ubah nama majelis, saldo awal kas, pengurus, serta kelola cadangan data (backup/restore)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <h3 className="text-sm font-bold text-slate-900 font-serif mb-4 pb-2 border-b border-slate-100">
            Profil & Organisasi Pengajian
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Nama Majelis / Pengajian *</label>
              <input
                type="text"
                required
                value={formData.namaMajelis}
                onChange={(e) => setFormData({ ...formData, namaMajelis: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Alamat Lengkap Majelis</label>
              <input
                type="text"
                value={formData.alamatMajelis}
                onChange={(e) => setFormData({ ...formData, alamatMajelis: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Ketua Majelis</label>
                <input
                  type="text"
                  value={formData.namaKetua}
                  onChange={(e) => setFormData({ ...formData, namaKetua: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Bendahara Kas</label>
                <input
                  type="text"
                  value={formData.namaBendahara}
                  onChange={(e) => setFormData({ ...formData, namaBendahara: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Saldo Awal Kas (Rp)</label>
                <input
                  type="text"
                  value={formData.saldoAwal}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0;
                    setFormData({ ...formData, saldoAwal: val });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Besaran Iuran Standar (Rp)</label>
                <input
                  type="text"
                  value={formData.iuranDefault}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0;
                    setFormData({ ...formData, iuranDefault: val });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Pengaturan berhasil disimpan!</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>

          </form>
        </div>

        {/* Backup & Restore Side Panel */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-serif pb-2 border-b border-slate-100">
              Cadangkan & Pemulihan Data
            </h3>
            
            <p className="text-xs text-slate-500">
              Simpan berkas cadangan data kas Anda atau muat kembali file cadangan JSON yang tersimpan.
            </p>

            <button
              onClick={onExportAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors border border-slate-200"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Unduh Backup Data (JSON)</span>
            </button>

            <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors border border-slate-200">
              <Upload className="w-4 h-4 text-blue-700" />
              <span>Restore Data dari File JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="bg-rose-50 rounded-2xl p-6 border border-rose-200 space-y-3">
            <h3 className="text-sm font-bold text-rose-900 font-serif flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              Reset Data Demo
            </h3>
            <p className="text-xs text-rose-700">
              Kembalikan aplikasi ke data contoh bawaan. Seluruh data transaksi yang dibuat saat ini akan dihapus.
            </p>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Ke Data Sampel Awal</span>
            </button>
          </div>

        </div>

      </div>

      {/* Notification Toast Modal */}
      {notificationMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 text-center space-y-4">
            <p className="text-sm font-bold text-slate-800">{notificationMsg}</p>
            <button
              onClick={() => setNotificationMsg(null)}
              className="px-5 py-2 bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Restore JSON Confirm Modal */}
      {pendingRestoreJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-serif mb-2">Restore Data Kas?</h3>
            <p className="text-xs text-slate-600 mb-4">
              Apakah Anda yakin ingin memulihkan (restore) data dari file backup JSON ini? Seluruh data kas saat ini akan digantikan.
            </p>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setPendingRestoreJson(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onImportAll(pendingRestoreJson);
                  setPendingRestoreJson(null);
                  setNotificationMsg('Data kas berhasil dipulihkan!');
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
              >
                Ya, Restore Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <h3 className="text-base font-bold text-rose-900 font-serif mb-2">Reset Data Kas Ke Sampel Awal?</h3>
            <p className="text-xs text-slate-600 mb-4">
              Semua transaksi dan data anggota yang tersimpan saat ini akan dihapus dan dikembalikan ke data sampel awal.
            </p>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                  setNotificationMsg('Data kas telah di-reset ke data sampel awal.');
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
