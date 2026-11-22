import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import {
  AppSessionUser,
  MasterLoginRecord,
  MasterLoginRole,
  MemberActiveStatus,
} from '../types';
import { normalizeLoginId } from '../services/kasService';
import { formatDateIndo } from '../utils/formatters';

interface MasterLoginProps {
  logins: MasterLoginRecord[];
  currentUser: AppSessionUser;
  onSaveLogin: (record: MasterLoginRecord, newPassword?: string) => Promise<void> | void;
  onDeleteLogin: (record: MasterLoginRecord) => Promise<void> | void;
}

const ROLES: MasterLoginRole[] = ['Admin', 'Ketua', 'Bendahara', 'Pengurus'];

export const MasterLogin: React.FC<MasterLoginProps> = ({
  logins,
  currentUser,
  onSaveLogin,
  onDeleteLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'semua' | MasterLoginRole>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | MemberActiveStatus>('semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MasterLoginRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MasterLoginRecord | null>(null);

  const [formLoginId, setFormLoginId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formNama, setFormNama] = useState('');
  const [formPeran, setFormPeran] = useState<MasterLoginRole>('Pengurus');
  const [formStatus, setFormStatus] = useState<MemberActiveStatus>('aktif');
  const [formCatatan, setFormCatatan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isAdminUser = currentUser.peran === 'Admin';

  const stats = useMemo(() => {
    const total = logins.length;
    const aktif = logins.filter((l) => l.statusAktif === 'aktif').length;
    const adminDanKetua = logins.filter((l) => l.peran === 'Admin' || l.peran === 'Ketua').length;
    const bendaharaDanPengurus = logins.filter(
      (l) => l.peran === 'Bendahara' || l.peran === 'Pengurus'
    ).length;
    return { total, aktif, adminDanKetua, bendaharaDanPengurus };
  }, [logins]);

  const filteredLogins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logins.filter((l) => {
      if (roleFilter !== 'semua' && l.peran !== roleFilter) return false;
      if (statusFilter !== 'semua' && l.statusAktif !== statusFilter) return false;
      if (!q) return true;
      return (
        l.loginId.toLowerCase().includes(q) ||
        l.namaLengkap.toLowerCase().includes(q) ||
        l.peran.toLowerCase().includes(q)
      );
    });
  }, [logins, searchQuery, roleFilter, statusFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || roleFilter !== 'semua' || statusFilter !== 'semua';

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('semua');
    setStatusFilter('semua');
  };

  const openAddModal = () => {
    if (!isAdminUser) return;
    setEditingRecord(null);
    setFormLoginId('');
    setFormPassword('');
    setShowPassword(false);
    setFormNama('');
    setFormPeran('Bendahara');
    setFormStatus('aktif');
    setFormCatatan('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record: MasterLoginRecord) => {
    if (!isAdminUser) return;
    setEditingRecord(record);
    setFormLoginId(record.loginId);
    setFormPassword('');
    setShowPassword(false);
    setFormNama(record.namaLengkap);
    setFormPeran(record.peran);
    setFormStatus(record.statusAktif);
    setFormCatatan(record.catatan || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const isCurrentUserRecord = (record: MasterLoginRecord) =>
    record.id === currentUser.id ||
    record.loginId.trim().toLowerCase() === currentUser.loginId.trim().toLowerCase();

  const handleToggleStatus = async (record: MasterLoginRecord) => {
    if (!isAdminUser) return;
    if (isCurrentUserRecord(record) && record.statusAktif === 'aktif') {
      return;
    }
    const nextStatus: MemberActiveStatus = record.statusAktif === 'aktif' ? 'nonaktif' : 'aktif';
    await onSaveLogin({ ...record, statusAktif: nextStatus });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminUser) return;
    setFormError(null);

    if (!formNama.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }

    if (editingRecord) {
      if (formPassword && formPassword.length < 6) {
        setFormError('Password baru minimal harus 6 karakter.');
        return;
      }

      setIsSaving(true);
      try {
        await onSaveLogin(
          {
            ...editingRecord,
            namaLengkap: formNama.trim(),
            peran: isCurrentUserRecord(editingRecord) ? 'Admin' : formPeran,
            statusAktif: isCurrentUserRecord(editingRecord) ? 'aktif' : formStatus,
            catatan: formCatatan.trim() || undefined,
          },
          formPassword || undefined
        );
        setIsModalOpen(false);
        setSuccessMsg(
          formPassword
            ? `Data dan password akun "${editingRecord.loginId}" berhasil diperbarui.`
            : `Data akun "${editingRecord.loginId}" berhasil diperbarui.`
        );
      } catch (err: any) {
        setFormError(err?.message || 'Gagal menyimpan perubahan akun.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Create new ID & Password account (strictly without email)
    if (formLoginId.includes('@')) {
      setFormError('ID Login tidak menggunakan email. Cukup masukkan ID singkat, contoh: bendahara.');
      return;
    }

    const normalizedKey = normalizeLoginId(formLoginId);
    if (!normalizedKey) {
      setFormError(
        'ID Login tidak valid. Gunakan 2–50 karakter huruf, angka, titik (.), garis bawah (_), atau tanda hubung (-) tanpa spasi.'
      );
      return;
    }
    if (formPassword.length < 6) {
      setFormError('Password minimal harus 6 karakter.');
      return;
    }

    const duplicate = logins.some(
      (l) => normalizeLoginId(l.loginId) === normalizedKey || l.loginId.trim().toLowerCase() === normalizedKey
    );
    if (duplicate) {
      setFormError('ID Login tersebut sudah terdaftar di Master Login.');
      return;
    }

    setIsSaving(true);
    try {
      const newRecord: MasterLoginRecord = {
        id: `login-${Date.now()}`,
        loginId: formLoginId.trim(),
        namaLengkap: formNama.trim(),
        peran: formPeran,
        statusAktif: formStatus,
        hasPassword: true,
        catatan: formCatatan.trim() || undefined,
        createdAt: Date.now(),
      };
      await onSaveLogin(newRecord, formPassword);
      setIsModalOpen(false);
      setSuccessMsg(`Akun login "${formLoginId.trim()}" berhasil dibuat dan siap digunakan.`);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal membuat akun login baru.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-800" />
            <span>Master Data Login Pengurus</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola ID Login dan Password pengurus untuk masuk ke aplikasi (tanpa email)
          </p>
        </div>

        {isAdminUser && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0 self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Login</span>
          </button>
        )}
      </div>

      {!isAdminUser && (
        <div className="rounded-2xl p-4 border bg-amber-50 border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Anda masuk dengan peran <strong>{currentUser.peran}</strong>. Penambahan, perubahan password, dan penghapusan akun login hanya dapat dilakukan oleh akun <strong>Admin</strong>.
          </span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl p-4 border bg-emerald-50 border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
            aria-label="Tutup pemberitahuan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Akun Terdaftar</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.total} Akun</p>
          <p className="text-[11px] text-slate-400 mt-1">Tercatat di Master Login</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Akun Aktif</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{stats.aktif} Akun</p>
          <p className="text-[11px] text-slate-400 mt-1">Memiliki izin akses dasbor</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Admin &amp; Ketua</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.adminDanKetua} Akun
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Pengelola utama majelis</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Bendahara &amp; Pengurus</p>
          <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
            {stats.bendaharaDanPengurus} Akun
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Operator kas &amp; kegiatan</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-6">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID Login, nama pengurus, atau peran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="lg:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'semua' | MasterLoginRole)}
              aria-label="Filter Peran Login"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="semua">Semua Peran</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'semua' | MemberActiveStatus)}
              aria-label="Filter Status Akun"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non-Aktif</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 tabular-nums">
            Menampilkan <strong className="text-slate-800">{filteredLogins.length}</strong> dari{' '}
            {logins.length} akun login
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Accounts Table */}
      {filteredLogins.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-xs border border-slate-200 space-y-3">
          <p>Belum ada data akun login yang sesuai filter.</p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-semibold text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          ) : isAdminUser ? (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-semibold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Akun Login Pertama</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">ID Login</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4 text-center">Kredensial</th>
                  <th className="py-3 px-4 text-center">Terdaftar</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {isAdminUser && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogins.map((item, idx) => {
                  const isSelf = isCurrentUserRecord(item);
                  const isAktif = item.statusAktif === 'aktif';
                  const hasPwd = item.hasPassword === true;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-bold tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{item.loginId}</div>
                        {isSelf && (
                          <span className="text-[10px] font-semibold text-emerald-700 block">
                            Akun sedang digunakan
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.namaLengkap}</div>
                        {item.catatan && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 max-w-xs truncate">
                            {item.catatan}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-[11px]">
                          <Shield className="w-3 h-3 text-emerald-700" />
                          <span>{item.peran}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                            hasPwd
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>{hasPwd ? 'Password Aktif' : 'Belum Diatur'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDateIndo(new Date(item.createdAt).toISOString().slice(0, 10))}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={!isAdminUser || Boolean(isSelf && isAktif)}
                          title={
                            !isAdminUser
                              ? 'Hanya Admin yang dapat mengubah status'
                              : isSelf
                              ? 'Akun Anda sendiri tidak dapat dinonaktifkan'
                              : 'Klik untuk ubah status aktif/nonaktif'
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                            !isAdminUser || isSelf
                              ? isAktif
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 cursor-default'
                              : isAktif
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer'
                          }`}
                        >
                          {isAktif ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <UserX className="w-3 h-3 text-slate-500" />
                          )}
                          <span>{isAktif ? 'Aktif' : 'Non-Aktif'}</span>
                        </button>
                      </td>
                      {isAdminUser && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                              title="Edit Akun & Password"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              disabled={Boolean(isSelf)}
                              className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title={isSelf ? 'Tidak dapat menghapus akun yang sedang aktif' : 'Hapus dari Master Login'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && isAdminUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 font-serif mb-1">
              {editingRecord ? 'Edit Data Akun Login' : 'Tambah Akun Login Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingRecord
                ? 'Perbarui data pengurus atau tetapkan password baru untuk akun ini.'
                : 'Buat ID Login dan password baru untuk pengurus agar dapat masuk ke aplikasi.'}
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ID Login *</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingRecord)}
                  placeholder="Contoh: bendahara atau ketua"
                  value={formLoginId}
                  onChange={(e) => setFormLoginId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                />
                {!editingRecord && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hanya ID Login (tanpa email), contoh: <span className="font-mono">bendahara</span>, <span className="font-mono">ketua1</span>.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingRecord ? 'Password Baru (Opsional)' : 'Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingRecord}
                    minLength={editingRecord && !formPassword ? undefined : 6}
                    placeholder={
                      editingRecord
                        ? 'Kosongkan jika tidak ingin mengubah password'
                        : 'Minimal 6 karakter'
                    }
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Pengurus *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hj. Siti Rahmah"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Hak Akses</label>
                  <select
                    value={formPeran}
                    disabled={Boolean(editingRecord && isCurrentUserRecord(editingRecord))}
                    onChange={(e) => setFormPeran(e.target.value as MasterLoginRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={formStatus}
                    disabled={Boolean(editingRecord && isCurrentUserRecord(editingRecord))}
                    onChange={(e) => setFormStatus(e.target.value as MemberActiveStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan akun..."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? 'Menyimpan...' : editingRecord ? 'Simpan Perubahan' : 'Buat Akun Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && isAdminUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">Hapus Akun dari Master Login?</h3>
                <p className="text-[11px] text-slate-500">Akun dan password akan dihapus permanen</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 my-4 space-y-1">
              <p>ID Login: <strong className="font-mono text-slate-900">{deleteTarget.loginId}</strong></p>
              <p>Nama: <strong className="text-slate-900">{deleteTarget.namaLengkap}</strong></p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await onDeleteLogin(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
