/**
 * Focsera System Constants & Accounting Configurations
 * Single-Tenant, Single-Company Financial System
 */

export const PREDEFINED_DIVISIONS = [
  {
    name: 'Focsera Celebrate',
    code: 'focsera-celebrate',
    category: 'Events & Celebrations',
    description: 'Premier event planning, luxury weddings, stage design, celebrations, decor & guest coordination.',
    isPredefined: true
  },
  {
    name: 'Focsera Create',
    code: 'focsera-create',
    category: 'Studios, Photography & Content',
    description: 'Professional studio photography, reels, video production, portrait sessions & creative visual editing.',
    isPredefined: true
  },
  {
    name: 'Focsera Market',
    code: 'focsera-market',
    category: 'Marketing & Growth',
    description: 'Performance marketing, Meta/Google ads, brand strategy, SEO, influencer outreach & growth campaigns.',
    isPredefined: true
  },
  {
    name: 'Focsera Grow',
    code: 'focsera-grow',
    category: 'Business & Digital',
    description: 'Custom web development, mobile applications, cloud solutions, business automation & IT architecture.',
    isPredefined: true
  },
  {
    name: 'Focsera Interiors',
    code: 'focsera-interiors',
    category: 'Interior Design & Execution',
    description: 'End-to-end luxury home transformations, precision painting, modular wardrobes, bespoke lighting & flooring.',
    isPredefined: true
  },
  {
    name: 'Media and Branding',
    code: 'media-and-branding',
    category: 'Brand Strategy & Media',
    description: 'Corporate brand identity design, logo suites, packaging, PR storytelling & media communications.',
    isPredefined: true
  },
  {
    name: 'Pilo by Focsera',
    code: 'pilo-by-focsera',
    category: 'Curated Experiences & Lifestyle',
    description: 'Bespoke lifestyle concepts, intimate spaces & specialized experiential projects.',
    isPredefined: true
  },
  {
    name: 'Beyond by Focsera',
    code: 'beyond-by-focsera',
    category: 'Experimental & Future Ventures',
    description: 'Advanced incubation, multi-disciplinary creative ventures & innovation engagements.',
    isPredefined: true
  },
  {
    name: 'ArenaX',
    code: 'arenax',
    category: 'Sports & Entertainment Arenas',
    description: 'Sports arena planning, competitive gaming infrastructure, experiential staging & dynamic venue tech.',
    isPredefined: true
  }
];

export const DEFAULT_COMPANY_DETAILS = {
  legalName: 'Focsera Innovations Private Limited',
  brandName: 'Focsera',
  tagline: 'Events • Studios • Marketing • Digital • Interiors',
  logo: '',
  registeredAddress: {
    street: 'Plot No. 42, Hitech City Main Road, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    stateCode: '36',
    postalCode: '500081',
    country: 'India'
  },
  contactNumber: '+91 95158 03954',
  businessEmail: 'info.focsera@gmail.com',
  website: 'https://www.focsera.in/',
  gstin: '36AABCF9515M1Z9',
  state: 'Telangana',
  stateCode: '36',
  currency: 'INR',
  currencySymbol: '₹',
  financialYear: '2026-27',
  bankDetails: {
    accountHolderName: 'Focsera Innovations Private Limited',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088921432',
    ifsc: 'HDFC0001628',
    branch: 'Madhapur Branch, Hyderabad',
    upiId: 'focsera@hdfcbank'
  },
  authorizedSignatory: {
    name: 'Authorized Signatory',
    designation: 'Managing Director',
    signatureText: 'For Focsera Innovations Pvt Ltd'
  },
  numberingPrefixes: {
    invoice: 'FOC/INV',
    quotation: 'FOC/QUO',
    receipt: 'FOC/REC',
    creditNote: 'FOC/CN',
    debitNote: 'FOC/DN',
    client: 'CLI',
    project: 'PRJ',
    payment: 'PAY',
    transaction: 'TXN'
  },
  defaultPaymentTerms: 'Payment due within 15 days of invoice date. 50% advance required before project commencement.',
  defaultTermsAndConditions: [
    'All payments must be made in favor of Focsera Innovations Private Limited via NEFT/RTGS/UPI.',
    'Quotation is valid for 30 days from the date of issue unless specified otherwise.',
    'Any additional work or scope change will be invoiced separately with prior client approval.',
    'Disputes, if any, shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana.'
  ]
};

/**
 * Returns current Indian Financial Year string (e.g. "2026-27")
 * In India, FY starts on April 1 and ends on March 31.
 */
export function getFinancialYear(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 is January, 3 is April

  if (month >= 3) {
    // April to December
    const nextYearShort = (year + 1).toString().slice(-2);
    return `${year}-${nextYearShort}`;
  } else {
    // January to March
    const currYearShort = year.toString().slice(-2);
    return `${year - 1}-${currYearShort}`;
  }
}

/**
 * Convert number to Indian currency words format (e.g. 1,25,000 -> "One Lakh Twenty-Five Thousand Rupees Only")
 */
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

  if (crore > 0) {
    words.push(convertThreeDigits(crore) + ' Crore');
  }
  if (lakh > 0) {
    words.push(convertTwoDigits(lakh) + ' Lakh');
  }
  if (thousand > 0) {
    words.push(convertTwoDigits(thousand) + ' Thousand');
  }
  if (hundredAndRest > 0) {
    words.push(convertThreeDigits(hundredAndRest));
  }

  return words.join(' ') + ' Rupees Only';
}

