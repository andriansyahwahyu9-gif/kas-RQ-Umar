export type TransactionType = 'pemasukan' | 'pengeluaran';

export type IncomeCategory = 
  | 'Iuran Anggota'
  | 'Infak & Sedekah'
  | 'Donatur / Hamba Allah'
  | 'Kolekte / Tromol'
  | 'Hasil Usaha / Kantin'
  | 'Lain-lain (Pemasukan)';

export type ExpenseCategory = 
  | 'Penceramah / Ustadz'
  | 'Konsumsi & Snack'
  | 'Peralatan & Sound System'
  | 'Kebersihan & Keamanan'
  | 'Bantuan Sosial / Santunan'
  | 'Cetak & Alat Tulis'
  | 'Lain-lain (Pengeluaran)';

export type Category = IncomeCategory | ExpenseCategory;

export interface Transaction {
  id: string;
  tanggal: string; // ISO format YYYY-MM-DD
  jenis: TransactionType;
  kategori: Category;
  nominal: number;
  keterangan: string;
  pembayarAtauPenerima?: string;
  metode: 'Tunai' | 'Transfer Bank' | 'E-Wallet / QRIS';
  createdAt: number;
}

export type MemberRole = 'Jamaah' | 'Pengurus' | 'Ustadz / Pengajar' | 'Remaja Masjid';
export type MemberGender = 'Laki-laki' | 'Perempuan';
export type MemberActiveStatus = 'aktif' | 'nonaktif';

export interface Member {
  id: string;
  kodeAnggota?: string;
  nama: string;
  jenisKelamin?: MemberGender;
  peran?: MemberRole;
  kelompok?: string;
  noHp?: string;
  alamat?: string;
  tanggalBergabung: string;
  statusAktif?: MemberActiveStatus;
  catatan?: string;
}

export interface MemberDuesRecord {
  id: string;
  memberId: string;
  periode: string; // e.g. "2026-08" or "Minggu 1 Aug 2026"
  tanggalBayar: string;
  nominal: number;
  catatan?: string;
}

export interface PengajianConfig {
  namaMajelis: string;
  alamatMajelis: string;
  namaKetua: string;
  namaBendahara: string;
  saldoAwal: number;
  iuranDefault: number;
  periodeIuran: 'Mingguan' | 'Bulanan';
}

export interface FilterOptions {
  searchQuery: string;
  jenis: 'semua' | 'pemasukan' | 'pengeluaran';
  kategori: string;
  startDate: string;
  endDate: string;
}

export type DutyStatus = 'terjadwal' | 'selesai' | 'diganti';

export interface WeeklyDuty {
  id: string;
  bulan: string; // YYYY-MM e.g. "2026-11"
  pekanKe: number; // 1..5
  tanggal: string; // YYYY-MM-DD
  waktu?: string; // e.g. "08:00 - 10:00 WIB"
  mc: string;
  kultum: string;
  temaKultum?: string;
  khutbah: string;
  temaKhutbah?: string;
  status: DutyStatus;
  catatan?: string;
  createdAt: number;
}

export type HafalanKategori =
  | "Al-Qur'an"
  | 'Hadits'
  | 'Doa Harian'
  | 'Bacaan Sholat & Dzikir';

export type HafalanPredikat =
  | 'Mumtaz (Sangat Baik)'
  | 'Jayyid Jiddan (Baik Sekali)'
  | 'Jayyid (Baik)'
  | 'Perlu Mengulang';

export type HafalanStatus = 'lulus' | 'proses' | 'mengulang';

export interface HafalanRecord {
  id: string;
  memberId?: string;
  namaAnggota: string;
  tanggal: string; // YYYY-MM-DD
  kategori: HafalanKategori;
  surahAtauMateri: string;
  juz?: string;
  ayatAtauHalaman?: string;
  predikat: HafalanPredikat;
  statusLulus: HafalanStatus;
  penyimak: string;
  catatan?: string;
  createdAt: number;
}

export type MasterLoginRole = 'Admin' | 'Ketua' | 'Bendahara' | 'Pengurus';

export interface MasterLoginRecord {
  id: string;
  uid?: string;
  loginId: string;
  email: string;
  namaLengkap: string;
  peran: MasterLoginRole;
  statusAktif: MemberActiveStatus;
  catatan?: string;
  createdAt: number;
}
