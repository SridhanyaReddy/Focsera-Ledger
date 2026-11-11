/**
 * Backend Financial Calculation & Tax Validation Engine
 */

export function round(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates line items and invoice financial totals with GST support
 */
export function calculateDocumentFinancials({
  items = [],
  additionalCharges = [],
  invoiceDiscount = 0,
  companyStateCode = '36', // Telangana default
  placeOfSupplyStateCode = '36',
  advanceAdjusted = 0,
  paidAmount = 0,
}) {
  const isInterState =
    String(companyStateCode || '').trim() !== String(placeOfSupplyStateCode || '').trim();

  let subtotal = 0;
  let itemDiscountTotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const processedItems = items.map((item) => {
    const qty = round(Number(item.quantity) || 1);
    const rate = round(Number(item.rate) || 0);
    const discount = round(Number(item.discount) || 0);
    const taxPercentage = round(Number(item.taxPercentage) || 0);

    const lineGross = round(qty * rate);
    const lineTaxable = Math.max(0, round(lineGross - discount));

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let taxAmount = 0;

    if (taxPercentage > 0) {
      if (isInterState) {
        igst = round((lineTaxable * taxPercentage) / 100);
        taxAmount = igst;
      } else {
        cgst = round((lineTaxable * (taxPercentage / 2)) / 100);
        sgst = round((lineTaxable * (taxPercentage / 2)) / 100);
        taxAmount = round(cgst + sgst);
      }
    }

    const totalAmount = round(lineTaxable + taxAmount);

    subtotal = round(subtotal + lineGross);
    itemDiscountTotal = round(itemDiscountTotal + discount);
    totalCGST = round(totalCGST + cgst);
    totalSGST = round(totalSGST + sgst);
    totalIGST = round(totalIGST + igst);

    return {
      service: item.service || null,
      serviceName: item.serviceName || 'Custom Service',
      description: item.description || '',
      quantity: qty,
      unit: item.unit || 'units',
      rate,
      discount,
      taxPercentage,
      taxableAmount: lineTaxable,
      cgst,
      sgst,
      igst,
      taxAmount,
      totalAmount,
    };
  });

  const parsedInvoiceDiscount = Math.max(0, round(Number(invoiceDiscount) || 0));
  const rawTaxable = Math.max(0, round(subtotal - itemDiscountTotal - parsedInvoiceDiscount));

  let additionalChargesTotal = 0;
  const processedCharges = additionalCharges.map((ch) => {
    const amt = round(Number(ch.amount) || 0);
    additionalChargesTotal = round(additionalChargesTotal + amt);
    return {
      description: ch.description || 'Additional Charge',
      amount: amt,
    };
  });

  const totalTax = round(totalCGST + totalSGST + totalIGST);
  const rawGrandTotal = round(rawTaxable + totalTax + additionalChargesTotal);

  // Optional nearest-rupee round-off
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = round(roundedGrandTotal - rawGrandTotal);
  const grandTotal = roundedGrandTotal;

  const parsedAdvance = round(Number(advanceAdjusted) || 0);
  const parsedPaid = round(Number(paidAmount) || 0);
  const outstandingBalance = Math.max(0, round(grandTotal - parsedAdvance - parsedPaid));

  return {
    items: processedItems,
    additionalCharges: processedCharges,
    subtotal,
    itemDiscountTotal,
    invoiceDiscount: parsedInvoiceDiscount,
    taxableAmount: rawTaxable,
    cgst: totalCGST,
    sgst: totalSGST,
    igst: totalIGST,
    totalTax,
    additionalChargesTotal,
    roundOff,
    grandTotal,
    advanceAdjusted: parsedAdvance,
    paidAmount: parsedPaid,
    outstandingBalance,
    isInterState,
  };
}

/**
 * Computes live invoice status
 */
export function getInvoiceStatus(invoice) {
  const grandTotal = round(invoice.grandTotal || 0);
  const paidAndAdvance = round((invoice.paidAmount || 0) + (invoice.advanceAdjusted || 0));
  const balance = Math.max(0, round(grandTotal - paidAndAdvance));

  if (invoice.status === 'Cancelled') {
    return 'Cancelled';
  }

  if (invoice.status === 'Refunded') {
    return 'Refunded';
  }

  if (invoice.status === 'Partially Refunded') {
    return 'Partially Refunded';
  }

  if (balance <= 0 && grandTotal > 0) {
    return 'Paid';
  }

  if (paidAndAdvance > 0 && balance > 0) {
    return 'Partially Paid';
  }

  if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && balance > 0) {
    return 'Overdue';
  }

  return 'Issued';
}

