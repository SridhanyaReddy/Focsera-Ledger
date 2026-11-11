import React, { useRef } from 'react';
import { Printer, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { formatINR, formatDate, numberToIndianWords } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReceiptTemplate({ receipt, company, onBack }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a5'); // A5 format for payment receipts
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${receipt.receiptNumber || 'Receipt'}.pdf`);
  };

  if (!receipt) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top Action Bar */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payments</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt View */}
      <div
        ref={printRef}
        className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200/80 text-slate-800 print:p-0 print:border-none print:shadow-none"
      >
        {/* Receipt Header */}
        <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white text-xl shadow-sm">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {company?.legalName || 'Focsera Innovations Private Limited'}
              </h1>
              <p className="text-xs text-slate-500">
                Brand: {company?.brandName || 'Focsera'} | Hyderabad, Telangana
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold uppercase tracking-wider mb-1">
              OFFICIAL PAYMENT RECEIPT
            </span>
            <div className="text-base font-bold text-slate-900">{receipt.receiptNumber}</div>
            <div className="text-xs text-slate-500 mt-1">Date: {formatDate(receipt.receiptDate)}</div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="py-6 space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Received From
              </span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{receipt.client?.name}</div>
              {receipt.client?.businessName && (
                <div className="font-medium text-slate-700">{receipt.client.businessName}</div>
              )}
              <div className="text-slate-500 mt-1">{receipt.client?.phone}</div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Applied Against
              </span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {receipt.invoice?.invoiceNumber ? `Invoice: ${receipt.invoice.invoiceNumber}` : 'Client Advance'}
              </div>
              {receipt.project?.name && (
                <div className="text-slate-600 mt-0.5">Project: {receipt.project.name}</div>
              )}
              {receipt.transactionReference && (
                <div className="text-slate-500 mt-1 font-mono">Ref: {receipt.transactionReference}</div>
              )}
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                Amount Received
              </span>
              <div className="text-3xl font-black text-emerald-950 mt-1">
                {formatINR(receipt.amount)}
              </div>
              <div className="text-xs text-emerald-800 italic mt-1 font-medium">
                {receipt.amountInWords || numberToIndianWords(receipt.amount)}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{receipt.paymentMethod || 'UPI'}</span>
              </span>
            </div>
          </div>

          {/* Balance remaining if against invoice */}
          {receipt.invoice && (
            <div className="flex justify-between items-center py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
              <span className="text-slate-600">Remaining Balance on Invoice:</span>
              <span className={receipt.remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                {formatINR(receipt.remainingBalance)}
              </span>
            </div>
          )}

          {receipt.notes && (
            <div className="pt-2 text-slate-600 text-xs">
              <span className="font-semibold text-slate-700">Remarks:</span> {receipt.notes}
            </div>
          )}
        </div>

        {/* Footer Signatory */}
        <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
          <div className="text-slate-400 text-[11px] leading-relaxed max-w-xs">
            This is an authentic computer-generated receipt issued by Focsera. Payments are subject to bank clearance.
          </div>
          <div className="text-right border-t border-slate-400 pt-1 w-44">
            <p className="font-bold text-slate-900">
              {company?.authorizedSignatory?.name || 'Authorized Signatory'}
            </p>
            <p className="text-[10px] text-slate-500">For Focsera</p>
          </div>
        </div>
      </div>
    </div>
  );
}

