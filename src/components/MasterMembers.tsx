import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Edit2,
  LayoutGrid,
  List,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { Member, MemberActiveStatus, MemberGender, MemberRole } from '../types';
import { formatDateIndo } from '../utils/formatters';

interface MasterMembersProps {
  members: Member[];
  onAddMember: (memberData: Omit<Member, 'id'>) => Promise<void> | void;
  onEditMember: (member: Member) => Promise<void> | void;
  onDeleteMember: (id: string) => Promise<void> | void;
}

const ROLES: MemberRole[] = ['Jamaah', 'Pengurus', 'Ustadz / Pengajar', 'Remaja Masjid'];

export const MasterMembers: React.FC<MasterMembersProps> = ({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | MemberActiveStatus>('semua');
  const [roleFilter, setRoleFilter] = useState<'semua' | MemberRole>('semua');
  const [genderFilter, setGenderFilter] = useState<'semua' | MemberGender>('semua');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formGender, setFormGender] = useState<MemberGender>('Perempuan');
  const [formPeran, setFormPeran] = useState<MemberRole>('Jamaah');
  const [formKelompok, setFormKelompok] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formTanggalGabung, setFormTanggalGabung] = useState(new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<MemberActiveStatus>('aktif');
  const [formCatatan, setFormCatatan] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const stats = useMemo(() => {
    const total = members.length;
    const aktif = members.filter((m) => (m.statusAktif || 'aktif') === 'aktif').length;
    const pengurusDanPengajar = members.filter(
      (m) => m.peran === 'Pengurus' || m.peran === 'Ustadz / Pengajar'
    ).length;
    const kelompokSet = new Set(
      members.map((m) => (m.kelompok || '').trim()).filter(Boolean)
    );
    return { total, aktif, pengurusDanPengajar, totalKelompok: kelompokSet.size };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const mStatus: MemberActiveStatus = m.statusAktif || 'aktif';
      if (statusFilter !== 'semua' && mStatus !== statusFilter) return false;
      if (roleFilter !== 'semua' && (m.peran || 'Jamaah') !== roleFilter) return false;
      if (genderFilter !== 'semua' && m.jenisKelamin !== genderFilter) return false;
      if (!q) return true;
      return (
        m.nama.toLowerCase().includes(q) ||
        (m.kodeAnggota || '').toLowerCase().includes(q) ||
        (m.noHp || '').toLowerCase().includes(q) ||
        (m.alamat || '').toLowerCase().includes(q) ||
        (m.kelompok || '').toLowerCase().includes(q) ||
        (m.peran || '').toLowerCase().includes(q)
      );
    });
  }, [members, searchQuery, statusFilter, roleFilter, genderFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'semua' ||
    roleFilter !== 'semua' ||
    genderFilter !== 'semua';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('semua');
    setRoleFilter('semua');
    setGenderFilter('semua');
  };

  const openAddModal = () => {
    const nextNum = String(members.length + 1).padStart(3, '0');
    setEditingMember(null);
    setFormKode(`ANG-${nextNum}`);
    setFormNama('');
    setFormGender('Perempuan');
    setFormPeran('Jamaah');
    setFormKelompok('Majelis Ibu-Ibu');
    setFormNoHp('');
    setFormAlamat('');
    setFormTanggalGabung(new Date().toISOString().slice(0, 10));
    setFormStatus('aktif');
    setFormCatatan('');
    setIsModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormKode(m.kodeAnggota || '');
    setFormNama(m.nama);
    setFormGender(m.jenisKelamin || 'Perempuan');
    setFormPeran(m.peran || 'Jamaah');
    setFormKelompok(m.kelompok || '');
    setFormNoHp(m.noHp || '');
    setFormAlamat(m.alamat || '');
    setFormTanggalGabung(m.tanggalBergabung || new Date().toISOString().slice(0, 10));
    setFormStatus(m.statusAktif || 'aktif');
    setFormCatatan(m.catatan || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    setIsSaving(true);
    try {
      const payload: Omit<Member, 'id'> = {
        kodeAnggota: formKode.trim() || undefined,
        nama: formNama.trim(),
        jenisKelamin: formGender,
        peran: formPeran,
        kelompok: formKelompok.trim() || undefined,
        noHp: formNoHp.trim() || undefined,
        alamat: formAlamat.trim() || undefined,
        tanggalBergabung: formTanggalGabung,
        statusAktif: formStatus,
        catatan: formCatatan.trim() || undefined,
      };

      if (editingMember) {
        await onEditMember({ ...editingMember, ...payload });
      } else {
        await onAddMember(payload);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (m: Member) => {
    const current: MemberActiveStatus = m.statusAktif || 'aktif';
    const next: MemberActiveStatus = current === 'aktif' ? 'nonaktif' : 'aktif';
    await onEditMember({ ...m, statusAktif: next });
  };

  const exportMembersCSV = () => {
    if (!filteredMembers.length) return;
    const headers = [
      'No',
      'Kode Anggota',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Peran',
      'Kelompok / Halaqah',
      'No. HP / WA',
      'Alamat',
      'Tanggal Bergabung',
      'Status',
    ];
    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      `"${(m.kodeAnggota || '-').replace(/"/g, '""')}"`,
      `"${m.nama.replace(/"/g, '""')}"`,
      m.jenisKelamin || '-',
      m.peran || 'Jamaah',
      `"${(m.kelompok || '-').replace(/"/g, '""')}"`,
      `"${(m.noHp || '-').replace(/"/g, '""')}"`,
      `"${(m.alamat || '-').replace(/"/g, '""')}"`,
      m.tanggalBergabung,
      (m.statusAktif || 'aktif').toUpperCase(),
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Master_Data_Anggota_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            <span>Master Data Anggota Pengajian</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Basis data induk jamaah, pengurus, ustadz/pengajar, dan kelompok halaqah majelis taklim
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportMembersCSV}
            disabled={filteredMembers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV Anggota</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Anggota Terdaftar</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.total} Orang</p>
          <p className="text-[11px] text-slate-400 mt-1">Seluruh master data anggota</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Anggota Aktif</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{stats.aktif} Orang</p>
          <p className="text-[11px] text-slate-400 mt-1">Mengikuti kegiatan pengajian</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Pengurus & Pengajar</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.pengurusDanPengajar} Orang</p>
          <p className="text-[11px] text-slate-400 mt-1">Struktur majelis & pembimbing</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Kelompok / Halaqah</p>
          <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{stats.totalKelompok} Kelompok</p>
          <p className="text-[11px] text-slate-400 mt-1">Pembagian kelas pengajian</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, kode anggota, no HP, kelompok, atau alamat..."
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
              onChange={(e) => setRoleFilter(e.target.value as 'semua' | MemberRole)}
              aria-label="Filter Peran"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="semua">Semua Peran</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as 'semua' | MemberGender)}
              aria-label="Filter Jenis Kelamin"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="semua">Semua Gender</option>
              <option value="Perempuan">Perempuan</option>
              <option value="Laki-laki">Laki-laki</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'semua' | MemberActiveStatus)}
              aria-label="Filter Status Keanggotaan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non-Aktif</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="text-slate-500 tabular-nums">
              Menampilkan <strong className="text-slate-800">{filteredMembers.length}</strong> dari {members.length} anggota
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

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Master Data List */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-xs border border-slate-200 space-y-3">
          <p>Tidak ada data anggota yang cocok dengan filter pencarian.</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-semibold text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Anggota</th>
                  <th className="py-3 px-4">Peran & Kelompok</th>
                  <th className="py-3 px-4">Kontak & Alamat</th>
                  <th className="py-3 px-4 text-center">Bergabung</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMembers.map((m, idx) => {
                  const isAktif = (m.statusAktif || 'aktif') === 'aktif';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {m.kodeAnggota || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.nama}</div>
                        {m.jenisKelamin && (
                          <div className="text-[11px] text-slate-400">{m.jenisKelamin}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{m.peran || 'Jamaah'}</div>
                        <div className="text-[11px] text-slate-500">{m.kelompok || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{m.noHp || '-'}</span>
                        </div>
                        {m.alamat && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {m.alamat}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDateIndo(m.tanggalBergabung)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          title="Klik untuk ubah status aktif/nonaktif"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                            isAktif
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                            title="Edit Master Data Anggota"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(m)}
                            className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            title="Hapus Anggota"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => {
            const isAktif = (m.statusAktif || 'aktif') === 'aktif';
            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono font-semibold">{m.kodeAnggota || 'ANG'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{m.peran || 'Jamaah'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{m.nama}</h4>
                      {m.kelompok && (
                        <p className="text-xs text-emerald-800 font-medium">{m.kelompok}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleStatus(m)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        isAktif
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isAktif ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                      <span>{isAktif ? 'Aktif' : 'Non-Aktif'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{m.noHp || 'Belum ada No. HP'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{m.alamat || 'Alamat belum diisi'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Gabung: {formatDateIndo(m.tanggalBergabung)}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(m)}
                      className="px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-semibold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="p-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Master Member Modal */}
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
              {editingMember ? 'Edit Master Data Anggota' : 'Tambah Anggota Pengajian Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Lengkapi identitas anggota, peran dalam majelis, serta kelompok pengajian
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Anggota</label>
                  <input
                    type="text"
                    placeholder="ANG-001"
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ibu Hj. Fatimah"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as MemberGender)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Perempuan">Perempuan</option>
                    <option value="Laki-laki">Laki-laki</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran di Majelis</label>
                  <select
                    value={formPeran}
                    onChange={(e) => setFormPeran(e.target.value as MemberRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MemberActiveStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelompok / Halaqah</label>
                  <input
                    type="text"
                    placeholder="Contoh: Majelis Ibu-Ibu / Tahsin"
                    value={formKelompok}
                    onChange={(e) => setFormKelompok(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={formNoHp}
                    onChange={(e) => setFormNoHp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Blok A No. 12, RT 04/02"
                    value={formAlamat}
                    onChange={(e) => setFormAlamat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Bergabung</label>
                  <input
                    type="date"
                    value={formTanggalGabung}
                    onChange={(e) => setFormTanggalGabung(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Catatan khusus mengenai anggota..."
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
                  {isSaving ? 'Menyimpan...' : editingMember ? 'Simpan Perubahan' : 'Simpan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
                <h3 className="text-base font-bold text-slate-900 font-serif">Hapus Data Anggota?</h3>
                <p className="text-[11px] text-slate-500">Data akan dihapus dari master anggota</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 my-4">
              <p>Nama: <strong className="text-slate-900">{deleteTarget.nama}</strong></p>
              {deleteTarget.kodeAnggota && (
                <p className="text-slate-500 mt-1">Kode: {deleteTarget.kodeAnggota}</p>
              )}
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
                  await onDeleteMember(deleteTarget.id);
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
