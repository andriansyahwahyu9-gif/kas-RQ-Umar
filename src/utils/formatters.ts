import { Transaction } from '../types';

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

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
          <td colSpan="6" class="kop-title">${namaMajelis}</td>
        </tr>
        <tr>
          <td colSpan="6" class="kop-address">${alamatMajelis}</td>
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
          <td colSpan="6" class="doc-period">${periodText}</td>
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
              <td colSpan="6" class="text-center" style="padding: 20px; color: #94a3b8; italic: true;">
                Tidak ada data transaksi pada periode ini.
              </td>
            </tr>
          ` : transactions.map((t, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td class="text-left">${formatDateIndo(t.tanggal)}</td>
              <td class="text-left">${t.kategori}</td>
              <td class="text-left">${t.keterangan || '-'}</td>
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
            <strong>${namaKetua || 'Aziz Privatna'}</strong>
          </td>
          <td colSpan="3" style="width:50%; text-align:center;">
            Dibuat oleh,<br />
            <strong>Bendahara Kas</strong>
            <br /><br /><br /><br /><br />
            <strong>${namaBendahara || 'Wahyu Andriansyah'}</strong>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDataToJSON(data: any, filename: string = 'backup_kas_pengajian.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
