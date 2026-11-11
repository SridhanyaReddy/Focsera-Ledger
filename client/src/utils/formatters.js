/**
 * Formatting Utilities for Focsera Financial System
 */

export function formatINR(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const num = Number(amount);
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  return showSymbol ? `₹${formatted}` : formatted;
}

export function formatDate(dateStr, includeTime = false) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('en-IN', options);
}

export function numberToIndianWords(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Zero Rupees Only';
  const num = Math.round(Number(amount));
  if (num === 0) return 'Zero Rupees Only';
  if (num < 0) return 'Minus ' + numberToIndianWords(Math.abs(num));

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 20) return units[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit > 0 ? ' ' + units[unit] : '');
  }

  function convertThreeDigits(n) {
    let str = '';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    if (hundred > 0) {
      str += units[hundred] + ' Hundred';
      if (rest > 0) str += ' and ';
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundredAndRest = remainder % 1000;

  let words = [];
  if (crore > 0) words.push(convertThreeDigits(crore) + ' Crore');
  if (lakh > 0) words.push(convertTwoDigits(lakh) + ' Lakh');
  if (thousand > 0) words.push(convertTwoDigits(thousand) + ' Thousand');
  if (hundredAndRest > 0) words.push(convertThreeDigits(hundredAndRest));

  return words.join(' ') + ' Rupees Only';
}

