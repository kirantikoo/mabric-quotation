import { useRef } from 'react';
import { Download, X, Printer, FileSpreadsheet } from 'lucide-react';
import { Quotation } from '../../lib/supabase';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import logo from '/images/logo.png';

interface QuotationPreviewProps {
  quotation: Quotation;
  onClose: () => void;
}

export default function QuotationPreview({ quotation, onClose }: QuotationPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // ✅ PDF DOWNLOAD FUNCTION
  const handleDownloadPDF = () => {
    if (!previewRef.current) return;
    const element = previewRef.current;

    const options = {
      margin: [15, 10, 15, 10],
      filename: `${quotation.quotation_number || 'quotation'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    html2pdf()
      .set(options)
      .from(element)
      .save();
  };

  // ✅ PRINT FUNCTION (SAME FORMAT AS PDF)
  const handlePrint = () => {
    if (!previewRef.current) return;
    const printContent = previewRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>${quotation.quotation_number || 'Quotation'}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              background: white;
              padding: 40px;
              color: #111827;
            }
            .gradient-header {
              background: linear-gradient(to right, #9333ea, #2563eb, #ec4899);
              color: white;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1rem;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
            }
            th {
              background: linear-gradient(to right, #9333ea, #2563eb, #ec4899);
              color: white;
              text-align: center;
            }
            td:nth-child(n+2) {
              text-align: right;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // ✅ EXCEL DOWNLOAD FUNCTION
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const header: any[][] = [
      ['Mabric Interio — Quotation'],
      [],
      ['Quotation Number', quotation.quotation_number],
      ['Date', new Date(quotation.created_at).toLocaleDateString('en-IN')],
      ['Valid Until', new Date(quotation.valid_until).toLocaleDateString('en-IN')],
      [],
      ['Client Details'],
      ['Client Name', quotation.client_name || '-'],
      ['Company', quotation.client_company || '-'],
      ['Email', quotation.client_email || '-'],
      ['Phone', quotation.client_phone || '-'],
      ['Address', quotation.client_address || '-'],
      [],
      ['Quotation Items'],
      ['Particulars', 'Length', 'Width', 'Total Sqft', 'Price/Sqft (INR)', 'Amount (INR)'],
    ];

    quotation.items.forEach((item) => {
      header.push([
        item.particulars,
        item.length,
        item.width,
        item.total_sqft,
        item.price_sqft,
        item.amount,
      ]);
    });

    header.push([]);
    header.push(['', '', '', '', 'Grand Total (INR)', quotation.grand_total]);

    const ws = XLSX.utils.aoa_to_sheet(header);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Quotation');
    XLSX.writeFile(wb, `${quotation.quotation_number || 'quotation'}.xlsx`);
  };

  // ✅ Helper formatters
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header Buttons */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-lg font-semibold text-gray-800">Quotation Preview</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        <div ref={previewRef} className="p-10 bg-white text-gray-800">
          {/* Company Header */}
          <div className="mb-8 border-b-4 border-gradient-to-r from-purple-600 via-blue-600 to-pink-600 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img src={logo} alt="Mabric Logo" className="h-16" />
                <div>
                  <h1 className="text-3xl font-bold text-purple-700">Mabric</h1>
                  <p className="text-sm text-gray-600 leading-snug">
                    Sy. No. 245/2, 1st Cross Rd,<br />
                    Near Purvi Symphony Apartment,<br />
                    Varthur, Bengaluru, Karnataka 560087
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>www.mabric.in</p>
                <p>hello@mabric.in</p>
                <p>support@mabric.in</p>
                <p>+91 96067 38877</p>
                <p>+91 96067 48877</p>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Client Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 text-gray-900 font-medium">
                {quotation.client_name}
                {quotation.client_company ? ` (${quotation.client_company})` : ''}
              </div>
              {quotation.client_email && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Email:</p>
                  <p>{quotation.client_email}</p>
                </div>
              )}
              {quotation.client_phone && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Phone:</p>
                  <p>{quotation.client_phone}</p>
                </div>
              )}
              {quotation.client_address && (
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-600">Address:</p>
                  <p>{quotation.client_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Info */}
          <div className="mb-8 grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Quotation Number:</p>
              <p className="text-lg font-bold text-purple-600">{quotation.quotation_number}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Date:</p>
              <p className="text-lg text-gray-800">{formatDate(quotation.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Valid Until:</p>
              <p className="text-lg text-gray-800">{formatDate(quotation.valid_until)}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="gradient-header">
                <th className="px-4 py-3 text-left font-semibold">Particulars</th>
                <th className="px-4 py-3 text-center font-semibold">Length</th>
                <th className="px-4 py-3 text-center font-semibold">Width</th>
                <th className="px-4 py-3 text-center font-semibold">Total Sqft</th>
                <th className="px-4 py-3 text-center font-semibold">Price/Sqft</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3">{item.particulars}</td>
                  <td className="px-4 py-3 text-center">{item.length}</td>
                  <td className="px-4 py-3 text-center">{item.width}</td>
                  <td className="px-4 py-3 text-center">{item.total_sqft}</td>
                  <td className="px-4 py-3 text-center">{formatCurrency(item.price_sqft)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-80 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-300">
                <span className="text-gray-700 font-medium">Grand Total:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(quotation.grand_total)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t-2 border-gray-300 mt-10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600 mb-1">Thank you for your business!</p>
                <p className="text-xs text-gray-500">
                  For any queries, contact us at contact@mabric.in
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 mb-1">Authorized Signature</p>
                <div className="w-48 border-t-2 border-gray-800 mt-8 pt-2">
                  <p className="text-sm text-gray-700">Mabric</p>
                  <p className="text-xs text-gray-500">Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
