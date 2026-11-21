import React, { useMemo, useState } from 'react';
import {
  BookMarked,
  CheckCircle2,
  Clock,
  Edit2,
  List,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  HafalanKategori,
  HafalanPredikat,
  HafalanRecord,
  HafalanStatus,
  Member,
} from '../types';
import { formatDateIndo } from '../utils/formatters';

interface HafalanDashboardProps {
  records: HafalanRecord[];
  members: Member[];
  onSaveRecord: (record: HafalanRecord) => Promise<void> | void;
  onDeleteRecord: (id: string) => Promise<void> | void;
}

const KATEGORI_LIST: HafalanKategori[] = [
  "Al-Qur'an",
  'Hadits',
  'Doa Harian',
  'Bacaan Sholat & Dzikir',
];

const PREDIKAT_LIST: HafalanPredikat[] = [
  'Mumtaz (Sangat Baik)',
  'Jayyid Jiddan (Baik Sekali)',
  'Jayyid (Baik)',
  'Perlu Mengulang',
];

const STATUS_META: Record<
  HafalanStatus,
  { label: string; textClass: string; bgClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  lulus: {
    label: 'Lulus',
    textClass: 'text-emerald-800',
    bgClass: 'bg-emerald-50 border border-emerald-200',
    icon: CheckCircle2,
  },
  proses: {
    label: 'Proses',
    textClass: 'text-blue-800',
    bgClass: 'bg-blue-50 border border-blue-200',
    icon: Clock,
  },
  mengulang: {
    label: 'Mengulang',
    textClass: 'text-amber-800',
    bgClass: 'bg-amber-50 border border-amber-200',
    icon: RefreshCw,
  },
};

export const HafalanDashboard: React.FC<HafalanDashboardProps> = ({
  records,
  members,
  onSaveRecord,
  onDeleteRecord,
}) => {
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [subView, setSubView] = useState<'riwayat' | 'rekap-anggota'>('riwayat');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [kategoriFilter, setKategoriFilter] = useState<'semua' | HafalanKategori>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | HafalanStatus>('semua');
  const [memberFilter, setMemberFilter] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Add/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HafalanRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HafalanRecord | null>(null);

  const [formMemberId, setFormMemberId] = useState<string>('');
  const [formNamaAnggota, setFormNamaAnggota] = useState<string>('');
  const [formTanggal, setFormTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formKategori, setFormKategori] = useState<HafalanKategori>("Al-Qur'an");
  const [formSurah, setFormSurah] = useState<string>('');
  const [formJuz, setFormJuz] = useState<string>('');
  const [formAyat, setFormAyat] = useState<string>('');
  const [formPredikat, setFormPredikat] = useState<HafalanPredikat>('Mumtaz (Sangat Baik)');
  const [formStatus, setFormStatus] = useState<HafalanStatus>('lulus');
  const [formPenyimak, setFormPenyimak] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const availableMonths = useMemo(() => {
    const set = new Set<string>(records.map((r) => r.tanggal.slice(0, 7)));
    set.add(currentMonthStr);
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records, currentMonthStr]);

  const availableNames = useMemo(() => {
    const set = new Set<string>(records.map((r) => r.namaAnggota));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (monthFilter !== 'all' && !r.tanggal.startsWith(monthFilter)) return false;
      if (kategoriFilter !== 'semua' && r.kategori !== kategoriFilter) return false;
      if (statusFilter !== 'semua' && r.statusLulus !== statusFilter) return false;
      if (memberFilter !== 'semua' && r.namaAnggota !== memberFilter) return false;
      if (!q) return true;
      return (
        r.namaAnggota.toLowerCase().includes(q) ||
        r.surahAtauMateri.toLowerCase().includes(q) ||
        r.penyimak.toLowerCase().includes(q) ||
        (r.juz || '').toLowerCase().includes(q) ||
        (r.catatan || '').toLowerCase().includes(q)
      );
    });
  }, [records, monthFilter, kategoriFilter, statusFilter, memberFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const lulus = filteredRecords.filter((r) => r.statusLulus === 'lulus').length;
    const mengulang = filteredRecords.filter((r) => r.statusLulus === 'mengulang').length;
    const pesertaSet = new Set(filteredRecords.map((r) => r.namaAnggota));
    return { total, lulus, mengulang, totalPeserta: pesertaSet.size };
  }, [filteredRecords]);

  // Member progress aggregation
  const memberSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        nama: string;
        totalSetoran: number;
        lulus: number;
        mengulang: number;
        materiTerakhir: string;
        tanggalTerakhir: string;
        predikatTerakhir: string;
      }
    >();

    filteredRecords.forEach((r) => {
      const existing = map.get(r.namaAnggota);
      if (!existing) {
        map.set(r.namaAnggota, {
          nama: r.namaAnggota,
          totalSetoran: 1,
          lulus: r.statusLulus === 'lulus' ? 1 : 0,
          mengulang: r.statusLulus === 'mengulang' ? 1 : 0,
          materiTerakhir: r.surahAtauMateri,
          tanggalTerakhir: r.tanggal,
          predikatTerakhir: r.predikat,
        });
      } else {
        existing.totalSetoran += 1;
        if (r.statusLulus === 'lulus') existing.lulus += 1;
        if (r.statusLulus === 'mengulang') existing.mengulang += 1;
        if (r.tanggal > existing.tanggalTerakhir) {
          existing.tanggalTerakhir = r.tanggal;
          existing.materiTerakhir = r.surahAtauMateri;
          existing.predikatTerakhir = r.predikat;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [filteredRecords]);

  const hasActiveFilters =
    monthFilter !== 'all' ||
    kategoriFilter !== 'semua' ||
    statusFilter !== 'semua' ||
    memberFilter !== 'semua' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    setMonthFilter('all');
    setKategoriFilter('semua');
    setStatusFilter('semua');
    setMemberFilter('semua');
    setSearchQuery('');
  };

  const openAddModal = () => {
    const firstMember = members[0];
    setEditingRecord(null);
    setFormMemberId(firstMember ? firstMember.id : '');
    setFormNamaAnggota(firstMember ? firstMember.nama : '');
    setFormTanggal(new Date().toISOString().slice(0, 10));
    setFormKategori("Al-Qur'an");
    setFormSurah('');
    setFormJuz('Juz 30');
    setFormAyat('');
    setFormPredikat('Jayyid Jiddan (Baik Sekali)');
    setFormStatus('lulus');
    setFormPenyimak('Ibu Hj. Maryam');
    setFormCatatan('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: HafalanRecord) => {
    setEditingRecord(r);
    setFormMemberId(r.memberId || '');
    setFormNamaAnggota(r.namaAnggota);
    setFormTanggal(r.tanggal);
    setFormKategori(r.kategori);
    setFormSurah(r.surahAtauMateri);
    setFormJuz(r.juz || '');
    setFormAyat(r.ayatAtauHalaman || '');
    setFormPredikat(r.predikat);
    setFormStatus(r.statusLulus);
    setFormPenyimak(r.penyimak);
    setFormCatatan(r.catatan || '');
    setIsModalOpen(true);
  };

  const handleSelectMember = (memberId: string) => {
    setFormMemberId(memberId);
    const found = members.find((m) => m.id === memberId);
    if (found) {
      setFormNamaAnggota(found.nama);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaAnggota.trim() || !formSurah.trim() || !formPenyimak.trim()) return;

    setIsSaving(true);
    try {
      const payload: HafalanRecord = {
        id: editingRecord ? editingRecord.id : `haf-${Date.now()}`,
        memberId: formMemberId || undefined,
        namaAnggota: formNamaAnggota.trim(),
        tanggal: formTanggal,
        kategori: formKategori,
        surahAtauMateri: formSurah.trim(),
        juz: formJuz.trim() || undefined,
        ayatAtauHalaman: formAyat.trim() || undefined,
        predikat: formPredikat,
        statusLulus: formStatus,
        penyimak: formPenyimak.trim(),
        catatan: formCatatan.trim() || undefined,
        createdAt: editingRecord ? editingRecord.createdAt : Date.now(),
      };
      await onSaveRecord(payload);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCycleStatus = async (r: HafalanRecord) => {
    const order: HafalanStatus[] = ['lulus', 'proses', 'mengulang'];
    const next = order[(order.indexOf(r.statusLulus) + 1) % order.length];
    await onSaveRecord({ ...r, statusLulus: next });
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-emerald-800" />
            <span>Catatan & Laporan Hafalan Jamaah</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau setoran hafalan Al-Qur&apos;an, Hadits, Doa Harian, serta progres kelulusan tiap anggota pengajian
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setSubView('riwayat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                subView === 'riwayat' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Riwayat Setoran</span>
            </button>
            <button
              onClick={() => setSubView('rekap-anggota')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                subView === 'rekap-anggota' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rekap per Anggota</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Setoran Hafalan</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Setoran</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.total} Setoran</p>
          <p className="text-[11px] text-slate-400 mt-1">Sesuai filter aktif</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Dinyatakan Lulus</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{stats.lulus} Setoran</p>
          <p className="text-[11px] text-slate-400 mt-1">Siap lanjut materi berikutnya</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Perlu Muraja&apos;ah / Mengulang</p>
          <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{stats.mengulang} Setoran</p>
          <p className="text-[11px] text-slate-400 mt-1">Perlu pendampingan ulang</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Peserta Aktif Menghafal</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.totalPeserta} Orang</p>
          <p className="text-[11px] text-slate-400 mt-1">Jamaah yang menyetor hafalan</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama anggota, surah/materi, atau penyimak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="lg:col-span-2">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="Filter Bulan Hafalan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="all">Semua Bulan</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {ym}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value as 'semua' | HafalanKategori)}
              aria-label="Filter Kategori Hafalan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="semua">Semua Kategori</option>
              {KATEGORI_LIST.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              aria-label="Filter Anggota"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="semua">Semua Anggota</option>
              {availableNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'semua' | HafalanStatus)}
              aria-label="Filter Status Hafalan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="lulus">Lulus</option>
              <option value="proses">Proses</option>
              <option value="mengulang">Mengulang</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 tabular-nums">
            Menampilkan <strong className="text-slate-800">{filteredRecords.length}</strong> dari {records.length} catatan hafalan
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

      {/* Main Table Content */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-xs border border-slate-200 space-y-3">
          <p>Belum ada catatan setoran hafalan yang sesuai filter.</p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-semibold text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          ) : (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-semibold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Setoran Pertama</span>
            </button>
          )}
        </div>
      ) : subView === 'riwayat' ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Anggota</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Surah / Materi Hafalan</th>
                  <th className="py-3 px-4">Penyimak & Predikat</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((r) => {
                  const meta = STATUS_META[r.statusLulus];
                  const StatusIcon = meta.icon;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 tabular-nums">
                        {formatDateIndo(r.tanggal)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.namaAnggota}</td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">{r.kategori}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.surahAtauMateri}</div>
                        <div className="text-[11px] text-slate-500">
                          {[r.juz && r.juz !== '-' ? r.juz : '', r.ayatAtauHalaman]
                            .filter(Boolean)
                            .join(' · ') || '-'}
                        </div>
                        {r.catatan && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 max-w-xs truncate">
                            {r.catatan}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{r.predikat}</div>
                        <div className="text-[11px] text-slate-500">Penyimak: {r.penyimak}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleCycleStatus(r)}
                          title="Klik untuk ubah status kelulusan"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap ${meta.bgClass} ${meta.textClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{meta.label}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                            title="Edit Setoran"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            title="Hapus Setoran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Rekap per Anggota */
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Anggota</th>
                  <th className="py-3 px-4 text-center">Total Setoran</th>
                  <th className="py-3 px-4 text-center">Lulus</th>
                  <th className="py-3 px-4 text-center">Mengulang</th>
                  <th className="py-3 px-4">Materi Setoran Terakhir</th>
                  <th className="py-3 px-4">Tanggal Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {memberSummary.map((row, idx) => (
                  <tr key={row.nama} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{row.nama}</td>
                    <td className="py-3 px-4 text-center font-bold tabular-nums text-slate-900">
                      {row.totalSetoran}
                    </td>
                    <td className="py-3 px-4 text-center font-bold tabular-nums text-emerald-700">
                      {row.lulus}
                    </td>
                    <td className="py-3 px-4 text-center font-bold tabular-nums text-amber-700">
                      {row.mengulang}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{row.materiTerakhir}</div>
                      <div className="text-[11px] text-slate-500">{row.predikatTerakhir}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDateIndo(row.tanggalTerakhir)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Hafalan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 font-serif mb-1">
              {editingRecord ? 'Edit Catatan Hafalan' : 'Catat Setoran Hafalan Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Catat perkembangan hafalan anggota pengajian beserta nilai dan penyimaknya
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {members.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pilih dari Master Anggota
                  </label>
                  <select
                    value={formMemberId}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">-- Input Nama Manual --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} {m.kelompok ? `(${m.kelompok})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Anggota *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama penyetor hafalan..."
                    value={formNamaAnggota}
                    onChange={(e) => setFormNamaAnggota(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Setoran *</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Hafalan *</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as HafalanKategori)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {KATEGORI_LIST.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Juz / Bagian (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Juz 30"
                    value={formJuz}
                    onChange={(e) => setFormJuz(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Surah / Materi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: QS. An-Naba"
                    value={formSurah}
                    onChange={(e) => setFormSurah(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ayat / Halaman</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ayat 1 - 40"
                    value={formAyat}
                    onChange={(e) => setFormAyat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Predikat Penilaian *</label>
                  <select
                    value={formPredikat}
                    onChange={(e) => setFormPredikat(e.target.value as HafalanPredikat)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {PREDIKAT_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kelulusan *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as HafalanStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="lulus">Lulus</option>
                    <option value="proses">Sedang Proses</option>
                    <option value="mengulang">Perlu Mengulang</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ustadz / Penyimak *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama penyimak setoran..."
                    value={formPenyimak}
                    onChange={(e) => setFormPenyimak(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Catatan tajwid / kelancaran..."
                    value={formCatatan}
                    onChange={(e) => setFormCatatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
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
                  {isSaving ? 'Menyimpan...' : editingRecord ? 'Simpan Perubahan' : 'Simpan Setoran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
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
                <h3 className="text-base font-bold text-slate-900 font-serif">Hapus Catatan Hafalan?</h3>
                <p className="text-[11px] text-slate-500">{formatDateIndo(deleteTarget.tanggal)}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 my-4 space-y-1">
              <p>Anggota: <strong className="text-slate-900">{deleteTarget.namaAnggota}</strong></p>
              <p>Materi: <strong className="text-slate-900">{deleteTarget.surahAtauMateri}</strong></p>
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
                  await onDeleteRecord(deleteTarget.id);
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
