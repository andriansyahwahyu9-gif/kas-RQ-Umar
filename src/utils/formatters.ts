import { Transaction, Member, MemberDuesRecord, WeeklyDuty, HafalanRecord } from '../types';

function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatMonthYear(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function exportTransactionsToCSV(transactions: Transaction[], title: string = 'Laporan_Kas_Pengajian') {
  if (!transactions.length) return;

  const headers = ['No', 'Tanggal', 'Jenis', 'Kategori', 'Nominal (Rp)', 'Keterangan', 'Pembayar/Penerima', 'Metode'];
  
  const rows = transactions.map((t, idx) => [
    idx + 1,
    t.tanggal,
    t.jenis.toUpperCase(),
    `"${t.kategori}"`,
    t.nominal,
    `"${t.keterangan.replace(/"/g, '""')}"`,
    `"${(t.pembayarAtauPenerima || '-').replace(/"/g, '""')}"`,
    t.metode,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  downloadBlob(csvContent, 'text/csv;charset=utf-8;', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportToExcel(
  transactions: Transaction[], 
  title: string = 'Laporan_Kas',
  namaMajelis: string = 'YAYASAN USWATUNA CAHAYA NUSANTARA',
  alamatMajelis: string = 'Bandar Lampung',
  periodText: string = '',
  saldoAwal: number = 0,
  namaKetua: string = '',
  namaBendahara: string = ''
) {
  const totalMasuk = transactions.filter(t => t.jenis === 'pemasukan').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = transactions.filter(t => t.jenis === 'pengeluaran').reduce((a, b) => a + b.nominal, 0);
  const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan Pertanggungjawaban Kas</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; background-color: #ffffff; }
        .kop-title { font-size: 18pt; font-weight: 800; text-align: center; color: #064e3b; font-family: 'Times New Roman', Georgia, serif; text-transform: uppercase; letter-spacing: 0.5px; }
        .kop-address { font-size: 11pt; text-align: center; color: #475569; font-family: Arial, sans-serif; margin-top: 2px; }
        .doc-title { font-size: 13pt; font-weight: 800; text-align: center; text-transform: uppercase; font-family: Arial, sans-serif; letter-spacing: 0.5px; color: #0f172a; }
        .doc-period { font-size: 10pt; font-style: italic; text-align: center; color: #475569; font-family: Georgia, serif; }
        
        .summary-box-table {
          border-collapse: collapse;
          width: 100%;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          margin-top: 15px;
          margin-bottom: 20px;
        }
        .summary-box-table td {
          padding: 10px 14px;
          vertical-align: middle;
          border: 1px solid #e2e8f0;
          font-family: Arial, sans-serif;
        }
        .card-label {
          font-size: 8pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #64748b;
          display: block;
        }
        .card-val {
          font-size: 12pt;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2px;
        }
        .label-in { color: #047857; }
        .val-in { color: #047857; font-weight: bold; }
        .label-out { color: #b91c1c; }
        .val-out { color: #b91c1c; font-weight: bold; }
        
        .saldo-akhir-cell {
          background-color: #d1fae5 !important;
          border: 1.5px solid #10b981 !important;
        }
        .label-end { color: #064e3b; font-weight: bold; }
        .val-end { color: #064e3b; font-size: 13pt; font-weight: 900; }

        .section-header {
          font-size: 11pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #0f172a;
          font-family: 'Times New Roman', Georgia, serif;
          margin-top: 20px;
          margin-bottom: 5px;
          letter-spacing: 0.5px;
        }

        table.data-table {
          border-collapse: collapse;
          width: 100%;
          font-family: Arial, sans-serif;
          font-size: 9.5pt;
        }
        table.data-table th {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 8.5pt;
          color: #334155;
        }
        table.data-table td {
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          color: #1e293b;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        .row-total {
          background-color: #f8fafc;
          font-weight: bold;
        }
        .row-saldo-akhir {
          background-color: #e6f4ea;
          font-weight: bold;
        }

        .signature-table {
          width: 100%;
          margin-top: 40px;
          font-family: Arial, sans-serif;
          font-size: 10pt;
        }
        .signature-table td {
          text-align: center;
          vertical-align: top;
        }
      </style>
    </head>
    <body>
      <table style="width:100%;">
        <tr>
          <td colSpan="6" class="kop-title">${escapeHtml(namaMajelis)}</td>
        </tr>
        <tr>
          <td colSpan="6" class="kop-address">${escapeHtml(alamatMajelis)}</td>
        </tr>
        <tr>
          <td colSpan="6" style="border-bottom: 1px solid #e2e8f0; height: 5px;"></td>
        </tr>
        <tr>
          <td colSpan="6" style="height: 10px;"></td>
        </tr>
        <tr>
          <td colSpan="6" class="doc-title">LAPORAN PERTANGGUNGJAWABAN KAS</td>
        </tr>
        <tr>
          <td colSpan="6" class="doc-period">${escapeHtml(periodText)}</td>
        </tr>
        <tr>
          <td colSpan="6" style="border-bottom: 2px solid #064e3b; height: 5px;"></td>
        </tr>
      </table>

      <br />

      <!-- Summary Cards Box -->
      <table class="summary-box-table">
        <tr>
          <td style="width:25%;">
            <span class="card-label">SALDO AWAL PERIODE</span>
            <span class="card-val">${formatRupiah(saldoAwal)}</span>
          </td>
          <td style="width:25%;">
            <span class="card-label label-in">+ TOTAL PEMASUKAN</span>
            <span class="card-val val-in">${formatRupiah(totalMasuk)}</span>
          </td>
          <td style="width:25%;">
            <span class="card-label label-out">- TOTAL PENGELUARAN</span>
            <span class="card-val val-out">${formatRupiah(totalKeluar)}</span>
          </td>
          <td style="width:25%;" class="saldo-akhir-cell">
            <span class="card-label label-end">= SALDO AKHIR</span>
            <span class="card-val val-end">${formatRupiah(saldoAkhir)}</span>
          </td>
        </tr>
      </table>

      <div class="section-header">RINCIAN TRANSAKSI KAS</div>
      <table style="width:100%;">
        <tr>
          <td colSpan="6" style="border-bottom: 1px solid #cbd5e1; height: 2px;"></td>
        </tr>
      </table>
      <br />

      <!-- Transaction Data Table -->
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;" class="text-center">NO</th>
            <th style="width: 120px;" class="text-left">TANGGAL</th>
            <th style="width: 140px;" class="text-left">KATEGORI</th>
            <th style="width: 220px;" class="text-left">KETERANGAN</th>
            <th style="width: 130px;" class="text-right">MASUK (RP)</th>
            <th style="width: 130px;" class="text-right">KELUAR (RP)</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.length === 0 ? `
            <tr>
              <td colSpan="6" class="text-center" style="padding: 20px; color: #94a3b8; font-style: italic;">
                Tidak ada data transaksi pada periode ini.
              </td>
            </tr>
          ` : transactions.map((t, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td class="text-left">${escapeHtml(formatDateIndo(t.tanggal))}</td>
              <td class="text-left">${escapeHtml(t.kategori)}</td>
              <td class="text-left">${escapeHtml(t.keterangan || '-')}</td>
              <td class="text-right val-in">${t.jenis === 'pemasukan' ? formatRupiah(t.nominal) : '-'}</td>
              <td class="text-right val-out">${t.jenis === 'pengeluaran' ? formatRupiah(t.nominal) : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="row-total">
            <td colSpan="4" class="text-right" style="font-weight:bold;">TOTAL PERIODE INI</td>
            <td class="text-right val-in" style="font-weight:bold;">${formatRupiah(totalMasuk)}</td>
            <td class="text-right val-out" style="font-weight:bold;">${formatRupiah(totalKeluar)}</td>
          </tr>
          <tr class="row-saldo-akhir">
            <td colSpan="4" class="text-right" style="font-weight:bold; color:#064e3b; font-size: 10pt;">SALDO AKHIR PERIODE</td>
            <td colSpan="2" class="text-center val-end" style="text-align:center; font-weight:bold; color:#064e3b; font-size:12pt; background-color:#e6f4ea;">
              ${formatRupiah(saldoAkhir)}
            </td>
          </tr>
        </tfoot>
      </table>

      <br /><br /><br />

      <!-- Formal Signatures -->
      <table class="signature-table">
        <tr>
          <td colSpan="3" style="width:50%; text-align:center;">
            Mengetahui,<br />
            <strong>Ketua Majelis Taklim</strong>
            <br /><br /><br /><br /><br />
            <strong>${escapeHtml(namaKetua || 'Ketua Majelis')}</strong>
          </td>
          <td colSpan="3" style="width:50%; text-align:center;">
            Dibuat oleh,<br />
            <strong>Bendahara Kas</strong>
            <br /><br /><br /><br /><br />
            <strong>${escapeHtml(namaBendahara || 'Bendahara')}</strong>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  downloadBlob(excelHtml, 'application/vnd.ms-excel;charset=utf-8', `${title}_${new Date().toISOString().slice(0, 10)}.xls`);
}

export function exportHafalanToCSV(records: HafalanRecord[], title: string = 'Laporan_Hafalan_Pengajian') {
  if (!records.length) return;
  const headers = [
    'No',
    'Tanggal',
    'Nama Anggota',
    'Kategori',
    'Surah / Materi',
    'Juz / Bagian',
    'Ayat / Halaman',
    'Predikat',
    'Status',
    'Penyimak',
    'Catatan',
  ];
  const rows = records.map((r, idx) => [
    idx + 1,
    r.tanggal,
    `"${r.namaAnggota.replace(/"/g, '""')}"`,
    `"${r.kategori}"`,
    `"${r.surahAtauMateri.replace(/"/g, '""')}"`,
    `"${(r.juz || '-').replace(/"/g, '""')}"`,
    `"${(r.ayatAtauHalaman || '-').replace(/"/g, '""')}"`,
    `"${r.predikat}"`,
    r.statusLulus.toUpperCase(),
    `"${r.penyimak.replace(/"/g, '""')}"`,
    `"${(r.catatan || '-').replace(/"/g, '""')}"`,
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, 'text/csv;charset=utf-8;', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportHafalanToExcel(
  records: HafalanRecord[],
  title: string,
  namaMajelis: string,
  alamatMajelis: string,
  periodText: string,
  namaKetua: string,
  namaBendahara: string
) {
  const totalLulus = records.filter((r) => r.statusLulus === 'lulus').length;
  const totalProses = records.filter((r) => r.statusLulus === 'proses').length;
  const totalMengulang = records.filter((r) => r.statusLulus === 'mengulang').length;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; }
        .kop-title { font-size: 16pt; font-weight: 800; text-align: center; color: #064e3b; font-family: Georgia, serif; text-transform: uppercase; }
        .kop-address { font-size: 10pt; text-align: center; color: #475569; }
        .doc-title { font-size: 12pt; font-weight: 800; text-align: center; text-transform: uppercase; color: #0f172a; }
        .doc-period { font-size: 10pt; font-style: italic; text-align: center; color: #475569; }
        table.data-table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
        table.data-table th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 8px; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; }
        table.data-table td { border: 1px solid #e2e8f0; padding: 7px 8px; }
      </style>
    </head>
    <body>
      <table style="width:100%;">
        <tr><td colSpan="9" class="kop-title">${escapeHtml(namaMajelis)}</td></tr>
        <tr><td colSpan="9" class="kop-address">${escapeHtml(alamatMajelis)}</td></tr>
        <tr><td colSpan="9" class="doc-title">LAPORAN SETORAN & PROGRES HAFALAN JAMAAH</td></tr>
        <tr><td colSpan="9" class="doc-period">${escapeHtml(periodText)}</td></tr>
      </table>
      <br />
      <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
        <tr>
          <td style="border:1px solid #cbd5e1; padding:8px;"><strong>Total Setoran:</strong> ${records.length}</td>
          <td style="border:1px solid #cbd5e1; padding:8px; color:#047857;"><strong>Lulus:</strong> ${totalLulus}</td>
          <td style="border:1px solid #cbd5e1; padding:8px; color:#1d4ed8;"><strong>Proses:</strong> ${totalProses}</td>
          <td style="border:1px solid #cbd5e1; padding:8px; color:#b45309;"><strong>Mengulang:</strong> ${totalMengulang}</td>
        </tr>
      </table>
      <table class="data-table">
        <thead>
          <tr>
            <th>NO</th>
            <th>TANGGAL</th>
            <th>NAMA ANGGOTA</th>
            <th>KATEGORI</th>
            <th>SURAH / MATERI</th>
            <th>JUZ / AYAT</th>
            <th>PREDIKAT</th>
            <th>STATUS</th>
            <th>PENYIMAK</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((r, idx) => `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td>${escapeHtml(formatDateIndo(r.tanggal))}</td>
              <td>${escapeHtml(r.namaAnggota)}</td>
              <td>${escapeHtml(r.kategori)}</td>
              <td>${escapeHtml(r.surahAtauMateri)}</td>
              <td>${escapeHtml([r.juz, r.ayatAtauHalaman].filter(Boolean).join(' · ') || '-')}</td>
              <td>${escapeHtml(r.predikat)}</td>
              <td style="text-align:center; font-weight:bold;">${escapeHtml(r.statusLulus.toUpperCase())}</td>
              <td>${escapeHtml(r.penyimak)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br /><br />
      <table style="width:100%; text-align:center; font-size:10pt;">
        <tr>
          <td colSpan="4">Mengetahui,<br /><strong>Ketua Majelis Taklim</strong><br /><br /><br /><strong>${escapeHtml(namaKetua)}</strong></td>
          <td colSpan="5">Dibuat oleh,<br /><strong>Bendahara / Koordinator</strong><br /><br /><br /><strong>${escapeHtml(namaBendahara)}</strong></td>
        </tr>
      </table>
    </body>
    </html>
  `;
  downloadBlob(html, 'application/vnd.ms-excel;charset=utf-8', `${title}_${new Date().toISOString().slice(0, 10)}.xls`);
}

export function exportDutiesToCSV(duties: WeeklyDuty[], title: string = 'Laporan_Tugas_Pekanan') {
  if (!duties.length) return;
  const headers = [
    'No',
    'Bulan',
    'Pekan Ke',
    'Tanggal',
    'Waktu',
    'MC / Pembawa Acara',
    'Petugas Kultum',
    'Tema Kultum',
    'Petugas Khutbah',
    'Tema Khutbah',
    'Status',
    'Catatan',
  ];
  const rows = duties.map((d, idx) => [
    idx + 1,
    d.bulan,
    d.pekanKe,
    d.tanggal,
    `"${(d.waktu || '-').replace(/"/g, '""')}"`,
    `"${d.mc.replace(/"/g, '""')}"`,
    `"${d.kultum.replace(/"/g, '""')}"`,
    `"${(d.temaKultum || '-').replace(/"/g, '""')}"`,
    `"${d.khutbah.replace(/"/g, '""')}"`,
    `"${(d.temaKhutbah || '-').replace(/"/g, '""')}"`,
    d.status.toUpperCase(),
    `"${(d.catatan || '-').replace(/"/g, '""')}"`,
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, 'text/csv;charset=utf-8;', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportDutiesToExcel(
  duties: WeeklyDuty[],
  title: string,
  namaMajelis: string,
  alamatMajelis: string,
  periodText: string,
  namaKetua: string,
  namaBendahara: string
) {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; }
        .kop-title { font-size: 16pt; font-weight: 800; text-align: center; color: #064e3b; font-family: Georgia, serif; text-transform: uppercase; }
        .kop-address { font-size: 10pt; text-align: center; color: #475569; }
        .doc-title { font-size: 12pt; font-weight: 800; text-align: center; text-transform: uppercase; color: #0f172a; }
        .doc-period { font-size: 10pt; font-style: italic; text-align: center; color: #475569; }
        table.data-table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
        table.data-table th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 8px; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; }
        table.data-table td { border: 1px solid #e2e8f0; padding: 7px 8px; }
      </style>
    </head>
    <body>
      <table style="width:100%;">
        <tr><td colSpan="8" class="kop-title">${escapeHtml(namaMajelis)}</td></tr>
        <tr><td colSpan="8" class="kop-address">${escapeHtml(alamatMajelis)}</td></tr>
        <tr><td colSpan="8" class="doc-title">LAPORAN JADWAL TUGAS MC, KULTUM & KHUTBAH</td></tr>
        <tr><td colSpan="8" class="doc-period">${escapeHtml(periodText)}</td></tr>
      </table>
      <br />
      <table class="data-table">
        <thead>
          <tr>
            <th>NO</th>
            <th>PEKAN</th>
            <th>TANGGAL & WAKTU</th>
            <th>MC / PEMBAWA ACARA</th>
            <th>PETUGAS KULTUM</th>
            <th>TEMA KULTUM</th>
            <th>PETUGAS KHUTBAH</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${duties.map((d, idx) => `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td style="text-align:center;">Pekan ${d.pekanKe}</td>
              <td>${escapeHtml(formatDateIndo(d.tanggal))}${d.waktu ? ` (${escapeHtml(d.waktu)})` : ''}</td>
              <td>${escapeHtml(d.mc)}</td>
              <td>${escapeHtml(d.kultum)}</td>
              <td>${escapeHtml(d.temaKultum || '-')}</td>
              <td>${escapeHtml(d.khutbah)}${d.temaKhutbah ? ` — ${escapeHtml(d.temaKhutbah)}` : ''}</td>
              <td style="text-align:center; font-weight:bold;">${escapeHtml(d.status.toUpperCase())}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br /><br />
      <table style="width:100%; text-align:center; font-size:10pt;">
        <tr>
          <td colSpan="4">Mengetahui,<br /><strong>Ketua Majelis Taklim</strong><br /><br /><br /><strong>${escapeHtml(namaKetua)}</strong></td>
          <td colSpan="4">Dibuat oleh,<br /><strong>Sekretaris / Bendahara</strong><br /><br /><br /><strong>${escapeHtml(namaBendahara)}</strong></td>
        </tr>
      </table>
    </body>
    </html>
  `;
  downloadBlob(html, 'application/vnd.ms-excel;charset=utf-8', `${title}_${new Date().toISOString().slice(0, 10)}.xls`);
}

export interface RekapExportPayload {
  namaMajelis: string;
  alamatMajelis: string;
  periodText: string;
  namaKetua: string;
  namaBendahara: string;
  saldoAwal: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhir: number;
  categoryBreakdown: Array<{ kategori: string; jenis: string; jumlah: number; total: number }>;
  members: Member[];
  duesInPeriod: MemberDuesRecord[];
  dutiesInPeriod: WeeklyDuty[];
  hafalanInPeriod: HafalanRecord[];
}

export function exportRekapToCSV(payload: RekapExportPayload, title: string = 'Laporan_Rekap_Terpadu') {
  const aktifCount = payload.members.filter((m) => (m.statusAktif || 'aktif') === 'aktif').length;
  const totalIuran = payload.duesInPeriod.reduce((s, d) => s + d.nominal, 0);
  const dutiesDone = payload.dutiesInPeriod.filter((d) => d.status === 'selesai').length;
  const hafalanLulus = payload.hafalanInPeriod.filter((h) => h.statusLulus === 'lulus').length;

  const lines: string[] = [
    `LAPORAN REKAP TERPADU MAJELIS TAKLIM,${payload.namaMajelis}`,
    `Periode,"${payload.periodText}"`,
    '',
    'RINGKASAN EKSEKUTIF',
    'Bagian,Metrik,Nilai',
    `Keuangan,Saldo Awal Periode,${payload.saldoAwal}`,
    `Keuangan,Total Pemasukan,${payload.totalPemasukan}`,
    `Keuangan,Total Pengeluaran,${payload.totalPengeluaran}`,
    `Keuangan,Saldo Akhir Periode,${payload.saldoAkhir}`,
    `Anggota & Iuran,Total Master Anggota,${payload.members.length}`,
    `Anggota & Iuran,Anggota Aktif,${aktifCount}`,
    `Anggota & Iuran,Pembayaran Iuran Periode,${payload.duesInPeriod.length}`,
    `Anggota & Iuran,Total Nominal Iuran,${totalIuran}`,
    `Tugas Pekanan,Total Jadwal Tugas,${payload.dutiesInPeriod.length}`,
    `Tugas Pekanan,Tugas Terlaksana (Selesai),${dutiesDone}`,
    `Hafalan Jamaah,Total Setoran Hafalan,${payload.hafalanInPeriod.length}`,
    `Hafalan Jamaah,Setoran Lulus,${hafalanLulus}`,
    '',
    'REKAP KAS PER KATEGORI',
    'Kategori,Jenis,Jumlah Transaksi,Total Nominal (Rp)',
    ...payload.categoryBreakdown.map(
      (c) => `"${c.kategori}",${c.jenis.toUpperCase()},${c.jumlah},${c.total}`
    ),
  ];

  downloadBlob('\uFEFF' + lines.join('\n'), 'text/csv;charset=utf-8;', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportRekapToExcel(payload: RekapExportPayload, title: string = 'Laporan_Rekap_Terpadu') {
  const aktifCount = payload.members.filter((m) => (m.statusAktif || 'aktif') === 'aktif').length;
  const totalIuran = payload.duesInPeriod.reduce((s, d) => s + d.nominal, 0);
  const dutiesDone = payload.dutiesInPeriod.filter((d) => d.status === 'selesai').length;
  const hafalanLulus = payload.hafalanInPeriod.filter((h) => h.statusLulus === 'lulus').length;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; }
        .kop-title { font-size: 16pt; font-weight: 800; text-align: center; color: #064e3b; font-family: Georgia, serif; text-transform: uppercase; }
        .kop-address { font-size: 10pt; text-align: center; color: #475569; }
        .doc-title { font-size: 12pt; font-weight: 800; text-align: center; text-transform: uppercase; color: #0f172a; }
        .doc-period { font-size: 10pt; font-style: italic; text-align: center; color: #475569; }
        table.data-table { border-collapse: collapse; width: 100%; font-size: 9.5pt; margin-bottom: 16px; }
        table.data-table th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 8px; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; }
        table.data-table td { border: 1px solid #e2e8f0; padding: 7px 8px; }
      </style>
    </head>
    <body>
      <table style="width:100%;">
        <tr><td colSpan="4" class="kop-title">${escapeHtml(payload.namaMajelis)}</td></tr>
        <tr><td colSpan="4" class="kop-address">${escapeHtml(payload.alamatMajelis)}</td></tr>
        <tr><td colSpan="4" class="doc-title">LAPORAN REKAP TERPADU MAJELIS TAKLIM</td></tr>
        <tr><td colSpan="4" class="doc-period">${escapeHtml(payload.periodText)}</td></tr>
      </table>
      <br />
      <table class="data-table">
        <thead>
          <tr><th colSpan="4">1. RINGKASAN KEUANGAN & KEGIATAN</th></tr>
          <tr><th>BIDANG</th><th>INDIKATOR</th><th style="text-align:right;">JUMLAH / NILAI</th><th>KETERANGAN</th></tr>
        </thead>
        <tbody>
          <tr><td>Kas Majelis</td><td>Saldo Awal Periode</td><td style="text-align:right;">${formatRupiah(payload.saldoAwal)}</td><td>Posisi awal periode</td></tr>
          <tr><td>Kas Majelis</td><td>Total Pemasukan</td><td style="text-align:right; color:#047857; font-weight:bold;">${formatRupiah(payload.totalPemasukan)}</td><td>Akumulasi kas masuk</td></tr>
          <tr><td>Kas Majelis</td><td>Total Pengeluaran</td><td style="text-align:right; color:#b91c1c; font-weight:bold;">${formatRupiah(payload.totalPengeluaran)}</td><td>Akumulasi kas keluar</td></tr>
          <tr style="background:#e6f4ea; font-weight:bold;"><td>Kas Majelis</td><td>Saldo Akhir Periode</td><td style="text-align:right; color:#064e3b;">${formatRupiah(payload.saldoAkhir)}</td><td>Posisi kas akhir</td></tr>
          <tr><td>Anggota & Iuran</td><td>Total Anggota / Aktif</td><td style="text-align:right;">${payload.members.length} / ${aktifCount} Orang</td><td>Master data jamaah</td></tr>
          <tr><td>Anggota & Iuran</td><td>Setoran Iuran Periode</td><td style="text-align:right;">${formatRupiah(totalIuran)}</td><td>${payload.duesInPeriod.length} kali pembayaran</td></tr>
          <tr><td>Tugas Pekanan</td><td>Jadwal MC, Kultum & Khutbah</td><td style="text-align:right;">${payload.dutiesInPeriod.length} Jadwal</td><td>${dutiesDone} jadwal selesai</td></tr>
          <tr><td>Hafalan Jamaah</td><td>Setoran Hafalan</td><td style="text-align:right;">${payload.hafalanInPeriod.length} Setoran</td><td>${hafalanLulus} setoran lulus</td></tr>
        </tbody>
      </table>

      <table class="data-table">
        <thead>
          <tr><th colSpan="4">2. REKAPITULASI KAS PER KATEGORI</th></tr>
          <tr><th>KATEGORI</th><th>JENIS</th><th style="text-align:center;">JUMLAH TRANSAKSI</th><th style="text-align:right;">TOTAL (RP)</th></tr>
        </thead>
        <tbody>
          ${payload.categoryBreakdown.length === 0 ? `
            <tr><td colSpan="4" style="text-align:center;">Tidak ada transaksi pada periode ini.</td></tr>
          ` : payload.categoryBreakdown.map((c) => `
            <tr>
              <td>${escapeHtml(c.kategori)}</td>
              <td>${escapeHtml(c.jenis.toUpperCase())}</td>
              <td style="text-align:center;">${c.jumlah}</td>
              <td style="text-align:right; font-weight:bold;">${formatRupiah(c.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <br />
      <table style="width:100%; text-align:center; font-size:10pt;">
        <tr>
          <td colSpan="2">Mengetahui,<br /><strong>Ketua Majelis Taklim</strong><br /><br /><br /><strong>${escapeHtml(payload.namaKetua)}</strong></td>
          <td colSpan="2">Dibuat oleh,<br /><strong>Bendahara Kas</strong><br /><br /><br /><strong>${escapeHtml(payload.namaBendahara)}</strong></td>
        </tr>
      </table>
    </body>
    </html>
  `;
  downloadBlob(html, 'application/vnd.ms-excel;charset=utf-8', `${title}_${new Date().toISOString().slice(0, 10)}.xls`);
}

export function exportDataToJSON(data: any, filename: string = 'backup_kas_pengajian.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  downloadBlob(jsonStr, 'application/json', filename);
}

export function terbilang(n: number): string {
  if (isNaN(n) || n < 0) return '';
  if (n === 0) return 'Nol Rupiah';

  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function convert(num: number): string {
    if (num < 12) return satuan[num];
    if (num < 20) return convert(num - 10) + ' Belas';
    if (num < 100) return convert(Math.floor(num / 10)) + ' Puluh ' + convert(num % 10);
    if (num < 200) return 'Seratus ' + convert(num - 100);
    if (num < 1000) return convert(Math.floor(num / 100)) + ' Ratus ' + convert(num % 100);
    if (num < 2000) return 'Seribu ' + convert(num - 1000);
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Ribu ' + convert(num % 1000);
    if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Juta ' + convert(num % 1000000);
    if (num < 1000000000000) return convert(Math.floor(num / 1000000000)) + ' Miliar ' + convert(num % 1000000000);
    return num.toString();
  }

  const result = convert(n).replace(/\s+/g, ' ').trim();
  return result ? result + ' Rupiah' : '';
}
