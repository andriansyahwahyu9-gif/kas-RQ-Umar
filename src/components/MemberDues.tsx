import React, { useState } from 'react';
import { Users, UserPlus, CheckCircle2, Clock, Search, Trash2, Edit2, Calendar, DollarSign, Plus, Phone, MapPin, X, LayoutGrid, List } from 'lucide-react';
import { Member, MemberDuesRecord } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface MemberDuesProps {
  members: Member[];
  duesRecords: MemberDuesRecord[];
  onAddMember: (memberData: Omit<Member, 'id'>) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onRecordDues: (dues: Omit<MemberDuesRecord, 'id'>) => void;
  defaultIuranNominal: number;
}

export const MemberDues: React.FC<MemberDuesProps> = ({
  members,
  duesRecords,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onRecordDues,
  defaultIuranNominal,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newNoHp, setNewNoHp] = useState('');
  const [newAlamat, setNewAlamat] = useState('');

  // Edit member state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editNoHp, setEditNoHp] = useState('');
  const [editAlamat, setEditAlamat] = useState('');
  const [editTanggalBergabung, setEditTanggalBergabung] = useState('');

  const [payModalMember, setPayModalMember] = useState<Member | null>(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<Member | null>(null);
  const [payNominal, setPayNominal] = useState(defaultIuranNominal.toString());
  const [payCatatan, setPayCatatan] = useState('');

  // Search filtered members
  const filteredMembers = members.filter((m) =>
    m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.alamat && m.alamat.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.noHp && m.noHp.includes(searchQuery))
  );

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    onAddMember({
      nama: newNama.trim(),
      noHp: newNoHp.trim() || undefined,
      alamat: newAlamat.trim() || undefined,
      tanggalBergabung: new Date().toISOString().slice(0, 10),
    });

    setNewNama('');
    setNewNoHp('');
    setNewAlamat('');
    setIsAddMemberOpen(false);
  };

  const handleOpenEditMember = (m: Member) => {
    setEditingMember(m);
    setEditNama(m.nama);
    setEditNoHp(m.noHp || '');
    setEditAlamat(m.alamat || '');
    setEditTanggalBergabung(m.tanggalBergabung || new Date().toISOString().slice(0, 10));
  };

  const handleUpdateMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editNama.trim()) return;

    onEditMember({
      ...editingMember,
      nama: editNama.trim(),
      noHp: editNoHp.trim() || undefined,
      alamat: editAlamat.trim() || undefined,
      tanggalBergabung: editTanggalBergabung || editingMember.tanggalBergabung,
    });

    setEditingMember(null);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalMember) return;
    const amount = parseFloat(payNominal.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) return;

    onRecordDues({
      memberId: payModalMember.id,
      periode: selectedMonth,
      tanggalBayar: new Date().toISOString().slice(0, 10),
      nominal: amount,
      catatan: payCatatan.trim() || `Iuran periode ${selectedMonth} - ${payModalMember.nama}`,
    });

    setPayModalMember(null);
    setPayNominal(defaultIuranNominal.toString());
    setPayCatatan('');
  };

  // Check if member paid in current selectedMonth
  const getMemberPaymentStatus = (memberId: string) => {
    const paidRecords = duesRecords.filter(
      (r) => r.memberId === memberId && r.periode === selectedMonth
    );
    const totalPaid = paidRecords.reduce((sum, r) => sum + r.nominal, 0);
    return {
      hasPaid: totalPaid >= defaultIuranNominal,
      totalPaid,
      records: paidRecords,
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            Pencatatan Iuran Kas Anggota
          </h2>
          <p className="text-xs text-slate-500">
            Kelola daftar anggota pengajian dan pantau status pembayaran iuran kas bulanan / mingguan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Filter & Month Selector & View Mode */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama anggota / alamat / no HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" /> Periode Iuran:
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid / Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200">
              Belum ada data anggota yang cocok dengan pencarian
            </div>
          ) : (
            filteredMembers.map((member) => {
              const status = getMemberPaymentStatus(member.id);

              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md flex flex-col justify-between ${
                    status.hasPaid
                      ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/20 to-white'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          status.hasPaid 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {member.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{member.nama}</h4>
                          {member.noHp && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {member.noHp}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditMember(member)}
                          title="Edit Data Anggota"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer text-[11px] font-semibold"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmMember(member)}
                          title="Hapus Anggota"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer text-[11px] font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {member.alamat && (
                      <p className="text-xs text-slate-600 flex items-center gap-1 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.alamat}</span>
                      </p>
                    )}

                    {/* Status Badge & Amount */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs my-2">
                      <span className="text-slate-500">Iuran Periode Ini:</span>
                      {status.hasPaid ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Lunas ({formatRupiah(status.totalPaid)})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> 
                          {status.totalPaid > 0 ? `Tercatat ${formatRupiah(status.totalPaid)}` : 'Belum Bayar'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Bergabung: {formatDateIndo(member.tanggalBergabung)}
                    </span>

                    <button
                      onClick={() => {
                        setPayModalMember(member);
                        setPayNominal(defaultIuranNominal.toString());
                        setPayCatatan(`Iuran kas periode ${selectedMonth} - ${member.nama}`);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Bayar Iuran
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">NO</th>
                  <th className="py-3 px-4">NAMA ANGGOTA</th>
                  <th className="py-3 px-4">NO. HP / WA</th>
                  <th className="py-3 px-4">ALAMAT</th>
                  <th className="py-3 px-4 text-center">STATUS PERIODE</th>
                  <th className="py-3 px-4 text-center">TGL BERGABUNG</th>
                  <th className="py-3 px-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                      Belum ada data anggota yang cocok dengan pencarian
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member, idx) => {
                    const status = getMemberPaymentStatus(member.id);

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {member.nama.charAt(0).toUpperCase()}
                            </div>
                            <span>{member.nama}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {member.noHp ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {member.noHp}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {member.alamat ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{member.alamat}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {status.hasPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lunas ({formatRupiah(status.totalPaid)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {status.totalPaid > 0 ? `Tercatat ${formatRupiah(status.totalPaid)}` : 'Belum Bayar'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">
                          {formatDateIndo(member.tanggalBergabung)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setPayModalMember(member);
                                setPayNominal(defaultIuranNominal.toString());
                                setPayCatatan(`Iuran kas periode ${selectedMonth} - ${member.nama}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-[11px] cursor-pointer transition-colors shadow-2xs"
                              title="Bayar Iuran Kas"
                            >
                              + Bayar
                            </button>
                            <button
                              onClick={() => handleOpenEditMember(member)}
                              className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                              title="Edit Data Anggota"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmMember(member)}
                              className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 font-serif mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-800" />
              Tambah Anggota Pengajian
            </h3>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Hj. Fatimah"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={newNoHp}
                  onChange={(e) => setNewNoHp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alamat / RT RW</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Mawar RT 02/05"
                  value={newAlamat}
                  onChange={(e) => setNewAlamat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-sm"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 font-serif mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Edit Data Anggota
            </h3>

            <form onSubmit={handleUpdateMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Hj. Fatimah"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={editNoHp}
                  onChange={(e) => setEditNoHp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alamat / RT RW</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Mawar RT 02/05"
                  value={editAlamat}
                  onChange={(e) => setEditAlamat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Bergabung</label>
                <input
                  type="date"
                  value={editTanggalBergabung}
                  onChange={(e) => setEditTanggalBergabung(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Dues Modal */}
      {payModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 font-serif mb-1">
              Catat Iuran Kas Anggota
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pembayaran iuran dari <strong className="text-slate-800">{payModalMember.nama}</strong>
            </p>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Periode Dues</label>
                <input
                  type="text"
                  disabled
                  value={selectedMonth}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nominal Iuran (Rp)</label>
                <input
                  type="text"
                  required
                  value={payNominal}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPayNominal(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catatan</label>
                <input
                  type="text"
                  value={payCatatan}
                  onChange={(e) => setPayCatatan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 font-medium">
                ⓘ Pembayaran ini akan otomatis dicatat ke Buku Kas Utama sebagai <strong>Pemasukan (Iuran Anggota)</strong>.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-sm"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Custom Modal */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setDeleteConfirmMember(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">Hapus Anggota?</h3>
                <p className="text-[11px] text-slate-500">Hapus data anggota dari daftar pengajian</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 my-4 font-medium">
              <p>Nama: <strong className="text-slate-900">{deleteConfirmMember.nama}</strong></p>
              {deleteConfirmMember.alamat && <p className="text-slate-500 mt-1">Alamat: {deleteConfirmMember.alamat}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteMember(deleteConfirmMember.id);
                  setDeleteConfirmMember(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Anggota
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
