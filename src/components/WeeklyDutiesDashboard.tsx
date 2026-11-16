import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Filter,
  LayoutGrid,
  List,
  Mic,
  BookOpen,
  MessageSquareText,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { DutyStatus, Member, PengajianConfig, WeeklyDuty } from '../types';
import { formatDateIndo } from '../utils/formatters';

interface WeeklyDutiesDashboardProps {
  duties: WeeklyDuty[];
  members: Member[];
  config: PengajianConfig;
  onSaveDuty: (duty: WeeklyDuty) => Promise<void> | void;
  onSaveDutiesBatch: (duties: WeeklyDuty[]) => Promise<void> | void;
  onDeleteDuty: (id: string) => Promise<void> | void;
}

const STATUS_META: Record<
  DutyStatus,
  { label: string; textClass: string; bgClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  terjadwal: {
    label: 'Terjadwal',
    textClass: 'text-amber-800',
    bgClass: 'bg-amber-50 border border-amber-200',
    icon: Clock,
  },
  selesai: {
    label: 'Selesai',
    textClass: 'text-emerald-800',
    bgClass: 'bg-emerald-50 border border-emerald-200',
    icon: CheckCircle2,
  },
  diganti: {
    label: 'Diganti',
    textClass: 'text-blue-800',
    bgClass: 'bg-blue-50 border border-blue-200',
    icon: RefreshCw,
  },
};

function getMonthLabel(ym: string): string {
  if (!ym || !ym.includes('-')) return ym;
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
}

function getFridaysOfMonth(ym: string): string[] {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return [];
  const dates: string[] = [];
  const daysInMonth = new Date(y, m, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dt = new Date(y, m - 1, day);
    if (dt.getDay() === 5) {
      const mm = String(m).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      dates.push(`${y}-${mm}-${dd}`);
    }
  }
  return dates.slice(0, 5);
}

export const WeeklyDutiesDashboard: React.FC<WeeklyDutiesDashboardProps> = ({
  duties,
  members,
  config,
  onSaveDuty,
  onSaveDutiesBatch,
  onDeleteDuty,
}) => {
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [monthScope, setMonthScope] = useState<'month' | 'all'>('month');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'semua' | 'mc' | 'kultum' | 'khutbah'>('semua');
  const [pekanFilter, setPekanFilter] = useState<'semua' | number>('semua');
  const [petugasFilter, setPetugasFilter] = useState<string>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | DutyStatus>('semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Modal Add/Edit State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDuty, setEditingDuty] = useState<WeeklyDuty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeeklyDuty | null>(null);

  // Form State
  const [formBulan, setFormBulan] = useState<string>(currentMonthStr);
  const [formPekanKe, setFormPekanKe] = useState<number>(1);
  const [formTanggal, setFormTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formWaktu, setFormWaktu] = useState<string>('11:45 - 12:45 WIB');
  const [formMc, setFormMc] = useState<string>('');
  const [formKultum, setFormKultum] = useState<string>('');
  const [formTemaKultum, setFormTemaKultum] = useState<string>('');
  const [formKhutbah, setFormKhutbah] = useState<string>('');
  const [formTemaKhutbah, setFormTemaKhutbah] = useState<string>('');
  const [formStatus, setFormStatus] = useState<DutyStatus>('terjadwal');
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Available months & petugas list for filter dropdowns
  const availableMonths = useMemo(() => {
    const set = new Set<string>(duties.map((d) => d.bulan));
    set.add(selectedMonth);
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [duties, selectedMonth]);

  const availablePetugas = useMemo(() => {
    const names = new Set<string>();
    duties.forEach((d) => {
      if (roleFilter === 'semua' || roleFilter === 'mc') {
        if (d.mc?.trim()) names.add(d.mc.trim());
      }
      if (roleFilter === 'semua' || roleFilter === 'kultum') {
        if (d.kultum?.trim()) names.add(d.kultum.trim());
      }
      if (roleFilter === 'semua' || roleFilter === 'khutbah') {
        if (d.khutbah?.trim()) names.add(d.khutbah.trim());
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [duties, roleFilter]);

  // Base duties based on month scope
  const scopedDuties = useMemo(() => {
    const list =
      monthScope === 'all'
        ? [...duties]
        : duties.filter((d) => d.bulan === selectedMonth);

    return list.sort((a, b) => {
      if (a.bulan !== b.bulan) return b.bulan.localeCompare(a.bulan);
      if (a.pekanKe !== b.pekanKe) return a.pekanKe - b.pekanKe;
      return a.tanggal.localeCompare(b.tanggal);
    });
  }, [duties, monthScope, selectedMonth]);

  // Month-only duties (used for auto-generate & month copy)
  const monthDuties = useMemo(() => {
    return duties
      .filter((d) => d.bulan === selectedMonth)
      .sort((a, b) => {
        if (a.pekanKe !== b.pekanKe) return a.pekanKe - b.pekanKe;
        return a.tanggal.localeCompare(b.tanggal);
      });
  }, [duties, selectedMonth]);

  // Apply search + role + pekan + petugas + status filters
  const filteredDuties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedDuties.filter((d) => {
      if (statusFilter !== 'semua' && d.status !== statusFilter) return false;
      if (pekanFilter !== 'semua' && d.pekanKe !== pekanFilter) return false;

      if (petugasFilter !== 'semua') {
        const target = petugasFilter.toLowerCase();
        if (roleFilter === 'mc' && d.mc.trim().toLowerCase() !== target) return false;
        if (roleFilter === 'kultum' && d.kultum.trim().toLowerCase() !== target) return false;
        if (roleFilter === 'khutbah' && d.khutbah.trim().toLowerCase() !== target) return false;
        if (
          roleFilter === 'semua' &&
          d.mc.trim().toLowerCase() !== target &&
          d.kultum.trim().toLowerCase() !== target &&
          d.khutbah.trim().toLowerCase() !== target
        ) {
          return false;
        }
      }

      if (!q) return true;

      if (roleFilter === 'mc') {
        return d.mc.toLowerCase().includes(q) || (d.catatan || '').toLowerCase().includes(q);
      }
      if (roleFilter === 'kultum') {
        return (
          d.kultum.toLowerCase().includes(q) ||
          (d.temaKultum || '').toLowerCase().includes(q)
        );
      }
      if (roleFilter === 'khutbah') {
        return (
          d.khutbah.toLowerCase().includes(q) ||
          (d.temaKhutbah || '').toLowerCase().includes(q)
        );
      }

      return (
        d.mc.toLowerCase().includes(q) ||
        d.kultum.toLowerCase().includes(q) ||
        d.khutbah.toLowerCase().includes(q) ||
        (d.temaKultum || '').toLowerCase().includes(q) ||
        (d.temaKhutbah || '').toLowerCase().includes(q) ||
        (d.catatan || '').toLowerCase().includes(q) ||
        `pekan ${d.pekanKe}`.includes(q) ||
        getMonthLabel(d.bulan).toLowerCase().includes(q) ||
        d.tanggal.includes(q)
      );
    });
  }, [scopedDuties, searchQuery, roleFilter, pekanFilter, petugasFilter, statusFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    roleFilter !== 'semua' ||
    pekanFilter !== 'semua' ||
    petugasFilter !== 'semua' ||
    statusFilter !== 'semua' ||
    monthScope === 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setRoleFilter('semua');
    setPekanFilter('semua');
    setPetugasFilter('semua');
    setStatusFilter('semua');
    setMonthScope('month');
    setSelectedMonth(currentMonthStr);
  };

  // Stats for active scope
  const stats = useMemo(() => {
    const total = scopedDuties.length;
    const selesai = scopedDuties.filter((d) => d.status === 'selesai').length;
    const terjadwal = scopedDuties.filter((d) => d.status === 'terjadwal').length;
    const diganti = scopedDuties.filter((d) => d.status === 'diganti').length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const asc = [...scopedDuties].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const upcoming =
      asc.find((d) => d.status !== 'selesai' && d.tanggal >= todayStr) ||
      asc.find((d) => d.status !== 'selesai') ||
      asc[asc.length - 1] ||
      null;

    return { total, selesai, terjadwal, diganti, upcoming };
  }, [scopedDuties]);

  const openAddModal = () => {
    const nextPekan =
      monthDuties.length > 0
        ? Math.min(5, Math.max(...monthDuties.map((d) => d.pekanKe)) + 1)
        : 1;
    const fridays = getFridaysOfMonth(selectedMonth);
    const defaultDate = fridays[nextPekan - 1] || `${selectedMonth}-01`;

    setEditingDuty(null);
    setFormBulan(selectedMonth);
    setFormPekanKe(nextPekan);
    setFormTanggal(defaultDate);
    setFormWaktu('11:45 - 12:45 WIB');
    setFormMc('');
    setFormKultum('');
    setFormTemaKultum('');
    setFormKhutbah('');
    setFormTemaKhutbah('');
    setFormStatus('terjadwal');
    setFormCatatan('');
    setIsModalOpen(true);
  };

  const openEditModal = (duty: WeeklyDuty) => {
    setEditingDuty(duty);
    setFormBulan(duty.bulan);
    setFormPekanKe(duty.pekanKe);
    setFormTanggal(duty.tanggal);
    setFormWaktu(duty.waktu || '');
    setFormMc(duty.mc);
    setFormKultum(duty.kultum);
    setFormTemaKultum(duty.temaKultum || '');
    setFormKhutbah(duty.khutbah);
    setFormTemaKhutbah(duty.temaKhutbah || '');
    setFormStatus(duty.status);
    setFormCatatan(duty.catatan || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMc.trim() || !formKultum.trim() || !formKhutbah.trim()) return;

    setIsSaving(true);
    try {
      const payload: WeeklyDuty = {
        id: editingDuty ? editingDuty.id : `duty-${formBulan}-p${formPekanKe}-${Date.now()}`,
        bulan: formBulan,
        pekanKe: Number(formPekanKe),
        tanggal: formTanggal,
        waktu: formWaktu.trim(),
        mc: formMc.trim(),
        kultum: formKultum.trim(),
        temaKultum: formTemaKultum.trim(),
        khutbah: formKhutbah.trim(),
        temaKhutbah: formTemaKhutbah.trim(),
        status: formStatus,
        catatan: formCatatan.trim(),
        createdAt: editingDuty ? editingDuty.createdAt : Date.now(),
      };
      await onSaveDuty(payload);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (duty: WeeklyDuty) => {
    const nextStatus: DutyStatus = duty.status === 'selesai' ? 'terjadwal' : 'selesai';
    await onSaveDuty({ ...duty, status: nextStatus });
  };

  const handleAutoGenerateMonth = async () => {
    setIsGenerating(true);
    try {
      const fridays = getFridaysOfMonth(selectedMonth);
      const existingWeeks = new Set(monthDuties.map((d) => d.pekanKe));
      const newDuties: WeeklyDuty[] = [];
      const memberNames = members.map((m) => m.nama);

      const weeksToCreate = Math.min(4, fridays.length || 4);
      for (let i = 0; i < weeksToCreate; i++) {
        const pekan = i + 1;
        if (existingWeeks.has(pekan)) continue;

        const dateStr =
          fridays[i] || `${selectedMonth}-${String(Math.min(28, pekan * 7 - 2)).padStart(2, '0')}`;
        const mcSuggestion =
          memberNames.length > 0 ? memberNames[i % memberNames.length] : `Petugas MC Pekan ${pekan}`;
        const kultumSuggestion =
          memberNames.length > 1
            ? memberNames[(i + 1) % memberNames.length]
            : `Petugas Kultum Pekan ${pekan}`;

        newDuties.push({
          id: `duty-${selectedMonth}-p${pekan}-${Date.now()}-${i}`,
          bulan: selectedMonth,
          pekanKe: pekan,
          tanggal: dateStr,
          waktu: '11:45 - 12:45 WIB',
          mc: mcSuggestion,
          kultum: kultumSuggestion,
          temaKultum: '',
          khutbah: `Khatib Pekan ${pekan}`,
          temaKhutbah: '',
          status: 'terjadwal',
          catatan: '',
          createdAt: Date.now() + i,
        });
      }

      if (newDuties.length > 0) {
        await onSaveDutiesBatch(newDuties);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copySingleDutyToClipboard = async (duty: WeeklyDuty) => {
    const text = [
      `*JADWAL PETUGAS PENGAJIAN PEKAN KE-${duty.pekanKe}*`,
      `${config.namaMajelis}`,
      `Tanggal: ${formatDateIndo(duty.tanggal)}${duty.waktu ? ` (${duty.waktu})` : ''}`,
      '',
      `• *MC / Pembawa Acara:* ${duty.mc}`,
      `• *Kultum:* ${duty.kultum}${duty.temaKultum ? `\n  Tema: _${duty.temaKultum}_` : ''}`,
      `• *Khutbah / Khatib:* ${duty.khutbah}${duty.temaKhutbah ? `\n  Tema: _${duty.temaKhutbah}_` : ''}`,
      duty.catatan ? `\nCatatan: ${duty.catatan}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(duty.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  const copyMonthScheduleToClipboard = async () => {
    if (monthDuties.length === 0) return;
    const header = [
      `*JADWAL PETUGAS MC, KULTUM & KHUTBAH*`,
      `*${config.namaMajelis}*`,
      `Periode: ${getMonthLabel(selectedMonth)}`,
      '================================',
    ].join('\n');

    const body = monthDuties
      .map((d) =>
        [
          `*Pekan ke-${d.pekanKe}* (${formatDateIndo(d.tanggal)}${d.waktu ? `, ${d.waktu}` : ''})`,
          `- MC: ${d.mc}`,
          `- Kultum: ${d.kultum}${d.temaKultum ? ` (${d.temaKultum})` : ''}`,
          `- Khutbah: ${d.khutbah}${d.temaKhutbah ? ` (${d.temaKhutbah})` : ''}`,
        ].join('\n')
      )
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(`${header}\n\n${body}`);
      setCopiedId('month-all');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif">
            Dasbor Tugas MC, Kultum & Khutbah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penjadwalan petugas pembawa acara, penceramah kultum, dan khatib ({monthScope === 'all' ? 'Semua Bulan' : getMonthLabel(selectedMonth)})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setMonthScope('month')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                monthScope === 'month'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Bulan
            </button>
            <button
              onClick={() => setMonthScope('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                monthScope === 'all'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Bulan
            </button>
          </div>

          {monthScope === 'month' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                aria-label="Pilih Bulan Jadwal"
              />
            </div>
          )}

          {(monthScope === 'all' || selectedMonth !== currentMonthStr) && (
            <button
              onClick={() => {
                setMonthScope('month');
                setSelectedMonth(currentMonthStr);
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Bulan Ini
            </button>
          )}

          {monthDuties.length > 0 && monthScope === 'month' && (
            <button
              onClick={copyMonthScheduleToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Salin Jadwal Sebulan untuk WhatsApp"
            >
              {copiedId === 'month-all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-800">Jadwal Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin Jadwal WA</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Pekan</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Pekan Terjadwal</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.total} Pekan</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {monthScope === 'all' ? 'Semua bulan tercatat' : getMonthLabel(selectedMonth)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Sudah Terlaksana</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{stats.selesai} Pekan</p>
          <p className="text-[11px] text-slate-400 mt-1">Status selesai bertugas</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Menunggu Pelaksanaan</p>
          <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{stats.terjadwal} Pekan</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.diganti > 0 ? `${stats.diganti} pekan diganti petugas` : 'Jadwal aktif'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Agenda Terdekat</p>
          <p className="text-lg font-bold text-slate-900 mt-1 truncate">
            {stats.upcoming ? `Pekan ke-${stats.upcoming.pekanKe}` : 'Belum Ada'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {stats.upcoming ? formatDateIndo(stats.upcoming.tanggal) : 'Silakan tambah jadwal'}
          </p>
        </div>
      </div>

      {/* Spotlight Card for Nearest / Active Week */}
      {stats.upcoming && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-amber-300 font-serif text-sm">
                Sorotan Tugas Pekan ke-{stats.upcoming.pekanKe}
              </span>
              <span className="text-emerald-300" aria-hidden="true">·</span>
              <span className="text-emerald-100 font-medium">
                {formatDateIndo(stats.upcoming.tanggal)}
              </span>
              {stats.upcoming.waktu && (
                <>
                  <span className="text-emerald-300" aria-hidden="true">·</span>
                  <span className="text-emerald-200">{stats.upcoming.waktu}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copySingleDutyToClipboard(stats.upcoming!)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedId === stats.upcoming.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Info WA</span>
                  </>
                )}
              </button>
              <button
                onClick={() => openEditModal(stats.upcoming!)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah Petugas</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1.5">
                <Mic className="w-4 h-4" />
                <span>Tugas MC / Pembawa Acara</span>
              </div>
              <p className="text-base font-bold text-slate-900">{stats.upcoming.mc}</p>
              <p className="text-xs text-slate-500 mt-1">Memandu susunan acara pengajian</p>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1.5">
                <MessageSquareText className="w-4 h-4" />
                <span>Tugas Kultum</span>
              </div>
              <p className="text-base font-bold text-slate-900">{stats.upcoming.kultum}</p>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {stats.upcoming.temaKultum ? `Tema: ${stats.upcoming.temaKultum}` : 'Tema belum ditentukan'}
              </p>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Tugas Khutbah / Khatib</span>
              </div>
              <p className="text-base font-bold text-slate-900">{stats.upcoming.khutbah}</p>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {stats.upcoming.temaKhutbah ? `Tema: ${stats.upcoming.temaKhutbah}` : 'Tema belum ditentukan'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search, Multi-Criteria Filter & View Mode Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        {/* Row 1: Search Input + Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                roleFilter === 'mc'
                  ? 'Cari nama petugas MC atau catatan...'
                  : roleFilter === 'kultum'
                  ? 'Cari nama petugas atau tema kultum...'
                  : roleFilter === 'khutbah'
                  ? 'Cari nama khatib atau tema khutbah...'
                  : 'Cari petugas MC, kultum, khutbah, tema, atau pekan...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Bersihkan pencarian"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Bulan */}
          <div className="lg:col-span-2">
            <select
              value={monthScope === 'all' ? 'all' : selectedMonth}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setMonthScope('all');
                } else {
                  setMonthScope('month');
                  setSelectedMonth(val);
                }
              }}
              aria-label="Filter Bulan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="all">Semua Bulan</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {getMonthLabel(ym)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Jenis Tugas */}
          <div className="lg:col-span-2">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as 'semua' | 'mc' | 'kultum' | 'khutbah');
                setPetugasFilter('semua');
              }}
              aria-label="Filter Jenis Tugas"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="semua">Semua Tugas</option>
              <option value="mc">Tugas MC</option>
              <option value="kultum">Tugas Kultum</option>
              <option value="khutbah">Tugas Khutbah</option>
            </select>
          </div>

          {/* Filter by Petugas */}
          <div className="lg:col-span-2">
            <select
              value={petugasFilter}
              onChange={(e) => setPetugasFilter(e.target.value)}
              aria-label="Filter Nama Petugas"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="semua">Semua Petugas</option>
              {availablePetugas.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Pekan */}
          <div className="lg:col-span-1">
            <select
              value={pekanFilter}
              onChange={(e) =>
                setPekanFilter(e.target.value === 'semua' ? 'semua' : Number(e.target.value))
              }
              aria-label="Filter Pekan"
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="semua">Pekan</option>
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={p}>
                  Pekan {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Status Filter + Result Count + Reset + View Mode */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['semua', 'terjadwal', 'selesai', 'diganti'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'semua' ? 'Semua Status' : STATUS_META[st].label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 tabular-nums flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Menampilkan <strong className="text-slate-800">{filteredDuties.length}</strong> dari{' '}
                {scopedDuties.length} jadwal
              </span>
            </span>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Grid/Table Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu Pekanan"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Rekap"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Empty / Grid / Table */}
      {scopedDuties.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Belum Ada Jadwal Petugas {monthScope === 'all' ? 'Tersimpan' : `di ${getMonthLabel(selectedMonth)}`}
            </h3>
            <p className="text-xs text-slate-500">
              Buat jadwal tugas MC, Kultum, dan Khutbah untuk setiap pekan secara otomatis atau tambah satu per satu.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {monthScope === 'month' && (
              <button
                onClick={handleAutoGenerateMonth}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isGenerating ? 'Menyiapkan...' : 'Buat Template 4 Pekan Otomatis'}</span>
              </button>
            )}
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Manual</span>
            </button>
          </div>
        </div>
      ) : filteredDuties.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-xs border border-slate-200 space-y-3">
          <p>Tidak ada jadwal tugas yang cocok dengan filter atau kata kunci pencarian.</p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredDuties.map((duty) => {
            const meta = STATUS_META[duty.status];
            const StatusIcon = meta.icon;

            return (
              <div
                key={duty.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 text-sm font-serif">
                        Pekan ke-{duty.pekanKe}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="font-medium text-slate-600 tabular-nums">
                        {formatDateIndo(duty.tanggal)}
                      </span>
                      {duty.waktu && (
                        <>
                          <span className="text-slate-300" aria-hidden="true">·</span>
                          <span className="text-slate-500">{duty.waktu}</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleComplete(duty)}
                      title="Klik untuk ubah status pelaksanaan"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-85 whitespace-nowrap shrink-0 ${meta.bgClass} ${meta.textClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                    </button>
                  </div>

                  {/* Three Roles List separated by hairline dividers */}
                  <div className="divide-y divide-slate-100 px-5">
                    <div
                      className={`py-3 flex items-start justify-between gap-4 ${
                        roleFilter === 'mc' ? 'bg-emerald-50/70 -mx-5 px-5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0 w-28">
                        <Mic className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Petugas MC</span>
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-sm font-bold text-slate-900">{duty.mc}</p>
                      </div>
                    </div>

                    <div
                      className={`py-3 flex items-start justify-between gap-4 ${
                        roleFilter === 'kultum' ? 'bg-emerald-50/70 -mx-5 px-5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0 w-28">
                        <MessageSquareText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Kultum</span>
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-sm font-bold text-slate-900">{duty.kultum}</p>
                        {duty.temaKultum && (
                          <p className="text-xs text-slate-500 mt-0.5">Tema: {duty.temaKultum}</p>
                        )}
                      </div>
                    </div>

                    <div
                      className={`py-3 flex items-start justify-between gap-4 ${
                        roleFilter === 'khutbah' ? 'bg-emerald-50/70 -mx-5 px-5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0 w-28">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Khutbah</span>
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-sm font-bold text-slate-900">{duty.khutbah}</p>
                        {duty.temaKhutbah && (
                          <p className="text-xs text-slate-500 mt-0.5">Tema: {duty.temaKhutbah}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {duty.catatan && (
                    <div className="px-5 pb-3 pt-1">
                      <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        Catatan: {duty.catatan}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleComplete(duty)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      duty.status === 'selesai'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{duty.status === 'selesai' ? 'Buka Kembali' : 'Tandai Selesai'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copySingleDutyToClipboard(duty)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                      title="Salin info petugas pekan ini ke WhatsApp"
                    >
                      {copiedId === duty.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-emerald-800">Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin WA</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openEditModal(duty)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                      title="Edit Jadwal Pekan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeleteTarget(duty)}
                      className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                      title="Hapus Jadwal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-28">Pekan</th>
                  <th className="py-3 px-4">Tanggal & Waktu</th>
                  <th className={`py-3 px-4 ${roleFilter === 'mc' ? 'bg-emerald-50 text-emerald-900' : ''}`}>Tugas MC</th>
                  <th className={`py-3 px-4 ${roleFilter === 'kultum' ? 'bg-emerald-50 text-emerald-900' : ''}`}>Tugas Kultum & Tema</th>
                  <th className={`py-3 px-4 ${roleFilter === 'khutbah' ? 'bg-emerald-50 text-emerald-900' : ''}`}>Tugas Khutbah & Tema</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDuties.map((duty) => {
                  const meta = STATUS_META[duty.status];
                  const StatusIcon = meta.icon;

                  return (
                    <tr key={duty.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        <div>Pekan ke-{duty.pekanKe}</div>
                        {monthScope === 'all' && (
                          <div className="text-[11px] font-medium text-slate-500">
                            {getMonthLabel(duty.bulan)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 tabular-nums">
                          {formatDateIndo(duty.tanggal)}
                        </div>
                        {duty.waktu && (
                          <div className="text-[11px] text-slate-500">{duty.waktu}</div>
                        )}
                      </td>
                      <td className={`py-3.5 px-4 font-bold text-slate-900 ${roleFilter === 'mc' ? 'bg-emerald-50/50' : ''}`}>
                        {duty.mc}
                      </td>
                      <td className={`py-3.5 px-4 ${roleFilter === 'kultum' ? 'bg-emerald-50/50' : ''}`}>
                        <div className="font-bold text-slate-900">{duty.kultum}</div>
                        {duty.temaKultum && (
                          <div className="text-[11px] text-slate-500 max-w-xs truncate">
                            {duty.temaKultum}
                          </div>
                        )}
                      </td>
                      <td className={`py-3.5 px-4 ${roleFilter === 'khutbah' ? 'bg-emerald-50/50' : ''}`}>
                        <div className="font-bold text-slate-900">{duty.khutbah}</div>
                        {duty.temaKhutbah && (
                          <div className="text-[11px] text-slate-500 max-w-xs truncate">
                            {duty.temaKhutbah}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleComplete(duty)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap ${meta.bgClass} ${meta.textClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{meta.label}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => copySingleDutyToClipboard(duty)}
                            className="p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                            title="Salin Info WA"
                          >
                            {copiedId === duty.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(duty)}
                            className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(duty)}
                            className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title="Hapus Jadwal"
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
      )}

      {/* Member Datalist for Quick Petugas Input */}
      <datalist id="member-names-list">
        {members.map((m) => (
          <option key={m.id} value={m.nama} />
        ))}
      </datalist>

      {/* Add / Edit Weekly Duty Modal */}
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
              {editingDuty ? 'Edit Jadwal Tugas Pekanan' : 'Tambah Jadwal Tugas Pekanan'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tentukan petugas MC, Kultum, dan Khutbah untuk pekan pengajian
            </p>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bulan Periode *</label>
                  <input
                    type="month"
                    required
                    value={formBulan}
                    onChange={(e) => setFormBulan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekan Ke- *</label>
                  <select
                    value={formPekanKe}
                    onChange={(e) => setFormPekanKe(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {[1, 2, 3, 4, 5].map((p) => (
                      <option key={p} value={p}>
                        Pekan ke-{p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan *</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: 11:45 - 12:45 WIB"
                    value={formWaktu}
                    onChange={(e) => setFormWaktu(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Petugas MC / Pembawa Acara *
                  </label>
                  <input
                    type="text"
                    required
                    list="member-names-list"
                    placeholder="Pilih atau ketik nama petugas MC..."
                    value={formMc}
                    onChange={(e) => setFormMc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Petugas Kultum *</label>
                    <input
                      type="text"
                      required
                      list="member-names-list"
                      placeholder="Nama pemateri kultum..."
                      value={formKultum}
                      onChange={(e) => setFormKultum(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tema Kultum (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Judul / tema singkat..."
                      value={formTemaKultum}
                      onChange={(e) => setFormTemaKultum(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Petugas Khutbah / Khatib *
                    </label>
                    <input
                      type="text"
                      required
                      list="member-names-list"
                      placeholder="Nama khatib / ustadz..."
                      value={formKhutbah}
                      onChange={(e) => setFormKhutbah(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tema Khutbah (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Judul / materi khutbah..."
                      value={formTemaKhutbah}
                      onChange={(e) => setFormTemaKhutbah(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Pelaksanaan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as DutyStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="terjadwal">Terjadwal</option>
                    <option value="selesai">Selesai</option>
                    <option value="diganti">Diganti Petugas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Keterangan tambahan..."
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
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? 'Menyimpan...' : editingDuty ? 'Simpan Perubahan' : 'Simpan Jadwal'}
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
                <h3 className="text-base font-bold text-slate-900 font-serif">Hapus Jadwal Pekan?</h3>
                <p className="text-[11px] text-slate-500">
                  Pekan ke-{deleteTarget.pekanKe} ({formatDateIndo(deleteTarget.tanggal)})
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1 my-4">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">MC:</span>
                <span className="font-semibold text-slate-900 truncate">{deleteTarget.mc}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Kultum:</span>
                <span className="font-semibold text-slate-900 truncate">{deleteTarget.kultum}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Khutbah:</span>
                <span className="font-semibold text-slate-900 truncate">{deleteTarget.khutbah}</span>
              </div>
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
                  await onDeleteDuty(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
