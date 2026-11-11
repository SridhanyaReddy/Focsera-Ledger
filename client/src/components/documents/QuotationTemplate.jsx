import React, { useRef } from 'react';
import { Printer, Download, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatINR, formatDate, numberToIndianWords } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function QuotationTemplate({ quotation, company, onBack, onConvertToInvoice }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${quotation.quotationNumber || 'Quotation'}.pdf`);
  };

  if (!quotation) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </button>

        <div className="flex items-center gap-2">
          {quotation.status !== 'Converted' && onConvertToInvoice && (
            <button
              onClick={() => onConvertToInvoice(quotation)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
            >
              <span>Convert to Invoice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-focsera-600 hover:bg-focsera-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Quotation View */}
      <div
        ref={printRef}
        className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200/80 text-slate-800 print:p-0 print:border-none print:shadow-none"
      >
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-focsera-700 to-sky-500 flex items-center justify-center font-bold text-white text-2xl shadow-sm">
                F
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  {company?.legalName || 'Focsera Innovations Private Limited'}
                </h1>
                <p className="text-xs font-semibold text-focsera-600 uppercase tracking-widest">
                  Brand: {company?.brandName || 'Focsera'}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600 leading-relaxed max-w-sm">
              <p>{company?.registeredAddress?.street || 'Plot No. 42, Hitech City Main Road, Madhapur'}</p>
              <p>
                {company?.registeredAddress?.city || 'Hyderabad'}, {company?.registeredAddress?.state || 'Telangana'} - {company?.registeredAddress?.postalCode || '500081'}
              </p>
              <p>Phone: {company?.contactNumber || '+91 95158 03954'} | Email: {company?.businessEmail || 'info.focsera@gmail.com'}</p>
              <p>Website: {company?.website || 'https://www.focsera.in/'}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                PRICE QUOTATION
              </span>
              <StatusBadge status={quotation.status} type="quotation" />
            </div>
            <div className="text-xl font-bold text-slate-900">{quotation.quotationNumber}</div>
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              <p>
                <span className="text-slate-400">Date:</span>{' '}
                <span className="font-semibold text-slate-800">{formatDate(quotation.quotationDate)}</span>
              </p>
              <p>
                <span className="text-slate-400">Valid Until:</span>{' '}
                <span className="font-semibold text-rose-700">{formatDate(quotation.validUntil)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Client & Division */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-2">Quotation For</div>
            <div className="text-sm font-bold text-slate-900">{quotation.client?.name}</div>
            {quotation.client?.businessName && (
              <div className="font-semibold text-slate-700">{quotation.client.businessName}</div>
            )}
            <div className="text-slate-600 mt-1 space-y-0.5">
              <p>{quotation.client?.billingAddress?.street}</p>
              <p>{quotation.client?.billingAddress?.city}, {quotation.client?.state}</p>
              <p>Phone: {quotation.client?.phone}</p>
              {quotation.client?.email && <p>Email: {quotation.client.email}</p>}
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-2">Division & Project</div>
            <div className="text-sm font-bold text-focsera-700">{quotation.division?.name}</div>
            <p className="text-slate-500 text-[11px] mt-0.5">{quotation.division?.category}</p>
            {quotation.project?.name && (
              <p className="mt-2 text-slate-700">
                <span className="font-semibold">Associated Project:</span> {quotation.project.name}
              </p>
            )}
            {quotation.paymentSchedule && (
              <p className="mt-2 text-slate-700">
                <span className="font-semibold">Payment Terms:</span> {quotation.paymentSchedule}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 uppercase font-bold tracking-wider">
                <th className="py-3 px-2 w-10 text-center">#</th>
                <th className="py-3 px-3">Service & Description</th>
                <th className="py-3 px-2 text-right">Qty</th>
                <th className="py-3 px-2 text-right">Rate</th>
                <th className="py-3 px-2 text-right">Discount</th>
                <th className="py-3 px-2 text-right">Taxable</th>
                <th className="py-3 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotation.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-2 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{item.serviceName}</div>
                    {item.description && (
                      <div className="text-slate-500 mt-0.5 whitespace-pre-line text-[11px]">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {item.quantity} {item.unit || ''}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">{formatINR(item.rate, false)}</td>
                  <td className="py-3 px-2 text-right text-emerald-600 font-medium">
                    {item.discount > 0 ? `-${formatINR(item.discount, false)}` : '-'}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">{formatINR(item.taxableAmount, false)}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatINR(item.totalAmount, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">Total in Words</div>
            <div className="font-bold text-slate-900 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {numberToIndianWords(quotation.grandTotal)}
            </div>
            {quotation.notes && (
              <div className="mt-4">
                <span className="font-bold text-slate-700">Special Notes:</span>
                <p className="text-slate-600 mt-1">{quotation.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatINR(quotation.subtotal)}</span>
            </div>
            {quotation.invoiceDiscount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Special Discount:</span>
                <span>-{formatINR(quotation.invoiceDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-slate-700 font-medium">
              <span>Taxable Subtotal:</span>
              <span>{formatINR(quotation.taxableAmount)}</span>
            </div>
            {quotation.totalTax > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Applicable GST:</span>
                <span>{formatINR(quotation.totalTax)}</span>
              </div>
            )}
            {quotation.additionalChargesTotal > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Additional Charges:</span>
                <span>{formatINR(quotation.additionalChargesTotal)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-slate-900 border-b text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span>{formatINR(quotation.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="pt-8 mt-6 border-t border-slate-200 text-xs">
          <div className="font-bold text-slate-700 mb-1">Standard Terms:</div>
          <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
            {(quotation.termsAndConditions || []).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

