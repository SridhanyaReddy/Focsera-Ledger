import React, { useRef } from 'react';
import { Printer, Download, Share2, ArrowLeft } from 'lucide-react';
import { formatINR, formatDate, numberToIndianWords } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceTemplate({ invoice, company, onBack, onRecordPayment }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${invoice.invoiceNumber || 'Invoice'}.pdf`);
  };

  if (!invoice) return null;

  const isInterState = invoice.isInterState;
  const isPaid = invoice.outstandingBalance <= 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>
        <div className="flex items-center gap-2">
          {!isPaid && onRecordPayment && (
            <button
              onClick={() => onRecordPayment(invoice)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
            >
              Record Payment
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-focsera-600 hover:bg-focsera-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div
        ref={printRef}
        className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200/80 text-slate-800 print:p-0 print:border-none print:shadow-none print:m-0"
      >
        {/* Header */}
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
              {company?.gstin && (
                <p className="font-bold text-slate-900 mt-1">
                  GSTIN: {company.gstin} (State Code: {company.stateCode || '36'})
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-focsera-50 text-focsera-800 border border-focsera-200 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
              {invoice.invoiceType || 'TAX INVOICE'}
            </span>
            <div className="text-xl font-bold text-slate-900 tracking-tight">{invoice.invoiceNumber}</div>
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              <p>
                <span className="text-slate-400">Invoice Date:</span>{' '}
                <span className="font-semibold text-slate-800">{formatDate(invoice.invoiceDate)}</span>
              </p>
              <p>
                <span className="text-slate-400">Due Date:</span>{' '}
                <span className="font-semibold text-slate-800">{formatDate(invoice.dueDate)}</span>
              </p>
              <p>
                <span className="text-slate-400">Place of Supply:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {invoice.placeOfSupply || 'Telangana'} (Code: {invoice.placeOfSupplyStateCode || '36'})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To & Project Info */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</div>
            <div className="text-sm font-bold text-slate-900">{invoice.client?.name}</div>
            {invoice.client?.businessName && (
              <div className="font-semibold text-slate-700">{invoice.client.businessName}</div>
            )}
            <div className="text-slate-600 mt-1 space-y-0.5">
              <p>{invoice.client?.billingAddress?.street}</p>
              <p>
                {invoice.client?.billingAddress?.city}, {invoice.client?.state || invoice.client?.billingAddress?.state}
              </p>
              <p>Phone: {invoice.client?.phone}</p>
              {invoice.client?.email && <p>Email: {invoice.client.email}</p>}
              {invoice.client?.gstin && (
                <p className="font-bold text-slate-900 mt-1">GSTIN: {invoice.client.gstin}</p>
              )}
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-2">Project & Division</div>
            <div className="text-sm font-bold text-slate-900">{invoice.project?.name || 'General Project'}</div>
            <div className="mt-1 text-slate-600 space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Division:</span>{' '}
                <span className="text-focsera-700 font-semibold">{invoice.division?.name || 'Focsera'}</span>
              </p>
              {invoice.project?.projectId && (
                <p>
                  <span className="text-slate-500">Project ID:</span> {invoice.project.projectId}
                </p>
              )}
              {invoice.quotationReference?.quotationNumber && (
                <p>
                  <span className="text-slate-500">Quotation Ref:</span> {invoice.quotationReference.quotationNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 uppercase font-bold tracking-wider">
                <th className="py-3 px-2 w-10 text-center">#</th>
                <th className="py-3 px-3">Service / Description</th>
                <th className="py-3 px-2 text-right">Qty</th>
                <th className="py-3 px-2 text-right">Rate</th>
                <th className="py-3 px-2 text-right">Taxable</th>
                {!isInterState ? (
                  <>
                    <th className="py-3 px-2 text-right">CGST</th>
                    <th className="py-3 px-2 text-right">SGST</th>
                  </>
                ) : (
                  <th className="py-3 px-2 text-right">IGST</th>
                )}
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, idx) => (
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
                  <td className="py-3 px-2 text-right font-medium">{formatINR(item.taxableAmount, false)}</td>
                  {!isInterState ? (
                    <>
                      <td className="py-3 px-2 text-right text-slate-600">
                        {item.cgst > 0 ? formatINR(item.cgst, false) : '-'}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-600">
                        {item.sgst > 0 ? formatINR(item.sgst, false) : '-'}
                      </td>
                    </>
                  ) : (
                    <td className="py-3 px-2 text-right text-slate-600">
                      {item.igst > 0 ? formatINR(item.igst, false) : '-'}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatINR(item.totalAmount, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Additional Charges */}
          {invoice.additionalCharges?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs">
              <div className="font-semibold text-slate-700 mb-2">Additional Charges:</div>
              <div className="space-y-1">
                {invoice.additionalCharges.map((ch, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600 px-3">
                    <span>{ch.description}</span>
                    <span className="font-medium text-slate-800">{formatINR(ch.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calculation Summary & Bank Details */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
          {/* Left: Bank, UPI & Words */}
          <div className="text-xs space-y-4">
            <div>
              <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">Amount in Words</div>
              <div className="font-bold text-slate-900 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {numberToIndianWords(invoice.grandTotal)}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">
                Bank Payment Details
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-slate-600 text-[11px]">
                <span>Account Name:</span>
                <span className="font-semibold text-slate-800">
                  {company?.bankDetails?.accountHolderName || 'Focsera Innovations Private Limited'}
                </span>
                <span>Bank Name:</span>
                <span className="font-semibold text-slate-800">
                  {company?.bankDetails?.bankName || 'HDFC Bank Ltd'}
                </span>
                <span>Account Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {company?.bankDetails?.accountNumber || '50200088921432'}
                </span>
                <span>IFSC Code:</span>
                <span className="font-mono font-bold text-slate-900">
                  {company?.bankDetails?.ifsc || 'HDFC0001628'}
                </span>
                <span>Branch:</span>
                <span className="text-slate-800">{company?.bankDetails?.branch || 'Madhapur, Hyderabad'}</span>
                <span>UPI ID:</span>
                <span className="font-bold text-focsera-700">{company?.bankDetails?.upiId || 'focsera@hdfcbank'}</span>
              </div>
            </div>
          </div>

          {/* Right: Totals Breakdown */}
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatINR(invoice.subtotal)}</span>
            </div>
            {invoice.itemDiscountTotal > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Item Discounts:</span>
                <span>-{formatINR(invoice.itemDiscountTotal)}</span>
              </div>
            )}
            {invoice.invoiceDiscount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Invoice Discount:</span>
                <span>-{formatINR(invoice.invoiceDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-slate-700 font-medium">
              <span>Taxable Amount:</span>
              <span>{formatINR(invoice.taxableAmount)}</span>
            </div>
            {!isInterState ? (
              <>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>CGST:</span>
                  <span>{formatINR(invoice.cgst)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>SGST:</span>
                  <span>{formatINR(invoice.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-1 text-slate-600">
                <span>IGST:</span>
                <span>{formatINR(invoice.igst)}</span>
              </div>
            )}
            {invoice.additionalChargesTotal > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Additional Charges:</span>
                <span>{formatINR(invoice.additionalChargesTotal)}</span>
              </div>
            )}
            {invoice.roundOff !== 0 && (
              <div className="flex justify-between py-1 text-slate-500">
                <span>Round Off:</span>
                <span>{formatINR(invoice.roundOff)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex justify-between py-2 border-t-2 border-slate-900 border-b text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span>{formatINR(invoice.grandTotal)}</span>
            </div>

            {/* Advance & Payments Paid */}
            {invoice.advanceAdjusted > 0 && (
              <div className="flex justify-between py-1 text-teal-700 font-semibold">
                <span>Advance Adjusted:</span>
                <span>-{formatINR(invoice.advanceAdjusted)}</span>
              </div>
            )}
            {invoice.paidAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-700 font-semibold">
                <span>Paid Amount:</span>
                <span>-{formatINR(invoice.paidAmount)}</span>
              </div>
            )}

            {/* Outstanding Balance */}
            <div
              className={`flex justify-between p-2.5 rounded-lg text-sm font-bold ${
                invoice.outstandingBalance > 0
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span>Balance Due:</span>
              <span>{formatINR(invoice.outstandingBalance)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Signatory Footer */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-700 mb-1">Terms & Conditions:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
              {(invoice.termsAndConditions || company?.defaultTermsAndConditions || []).map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-end justify-end text-right">
            <div className="h-16 flex items-end">
              <span className="text-slate-300 italic text-[11px]">Digitally signed on generation</span>
            </div>
            <div className="border-t border-slate-400 w-48 pt-1">
              <p className="font-bold text-slate-900">
                {company?.authorizedSignatory?.name || 'Authorized Signatory'}
              </p>
              <p className="text-[10px] text-slate-500">
                For {company?.legalName || 'Focsera Innovations Pvt Ltd'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

