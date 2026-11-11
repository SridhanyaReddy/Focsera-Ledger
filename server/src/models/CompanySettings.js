import mongoose from 'mongoose';
import { DEFAULT_COMPANY_DETAILS } from '../config/constants.js';

const companySettingsSchema = new mongoose.Schema(
  {
    isSingleton: {
      type: Boolean,
      default: true,
      unique: true, // Guarantees only one company profile ever exists
    },
    legalName: {
      type: String,
      required: true,
      default: DEFAULT_COMPANY_DETAILS.legalName,
      trim: true,
    },
    brandName: {
      type: String,
      required: true,
      default: DEFAULT_COMPANY_DETAILS.brandName,
      trim: true,
    },
    tagline: {
      type: String,
      default: DEFAULT_COMPANY_DETAILS.tagline,
    },
    logo: {
      type: String, // Data URL or URL path
      default: '',
    },
    registeredAddress: {
      street: { type: String, default: DEFAULT_COMPANY_DETAILS.registeredAddress.street },
      city: { type: String, default: DEFAULT_COMPANY_DETAILS.registeredAddress.city },
      state: { type: String, default: DEFAULT_COMPANY_DETAILS.registeredAddress.state },
      stateCode: { type: String, default: DEFAULT_COMPANY_DETAILS.registeredAddress.stateCode },
      postalCode: { type: String, default: DEFAULT_COMPANY_DETAILS.registeredAddress.postalCode },
      country: { type: String, default: DEFAULT_COMPANY_DETAILS.registeredAddress.country },
    },
    contactNumber: {
      type: String,
      default: DEFAULT_COMPANY_DETAILS.contactNumber,
      trim: true,
    },
    businessEmail: {
      type: String,
      default: DEFAULT_COMPANY_DETAILS.businessEmail,
      trim: true,
    },
    website: {
      type: String,
      default: DEFAULT_COMPANY_DETAILS.website,
      trim: true,
    },
    gstin: {
      type: String,
      default: DEFAULT_COMPANY_DETAILS.gstin,
      trim: true,
    },
    state: {
      type: String,
      default: DEFAULT_COMPANY_DETAILS.state,
    },
    stateCode: {
      type: String,
      default: DEFAULT_COMPANY_DETAILS.stateCode,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    financialYear: {
      type: String,
      default: '2026-27',
    },
    bankDetails: {
      accountHolderName: { type: String, default: DEFAULT_COMPANY_DETAILS.bankDetails.accountHolderName },
      bankName: { type: String, default: DEFAULT_COMPANY_DETAILS.bankDetails.bankName },
      accountNumber: { type: String, default: DEFAULT_COMPANY_DETAILS.bankDetails.accountNumber },
      ifsc: { type: String, default: DEFAULT_COMPANY_DETAILS.bankDetails.ifsc },
      branch: { type: String, default: DEFAULT_COMPANY_DETAILS.bankDetails.branch },
      upiId: { type: String, default: DEFAULT_COMPANY_DETAILS.bankDetails.upiId },
      upiQrCode: { type: String, default: '' },
    },
    authorizedSignatory: {
      name: { type: String, default: DEFAULT_COMPANY_DETAILS.authorizedSignatory.name },
      designation: { type: String, default: DEFAULT_COMPANY_DETAILS.authorizedSignatory.designation },
      signatureImage: { type: String, default: '' },
      signatureText: { type: String, default: DEFAULT_COMPANY_DETAILS.authorizedSignatory.signatureText },
    },
    numberingPrefixes: {
      invoice: { type: String, default: 'FOC/INV' },
      quotation: { type: String, default: 'FOC/QUO' },
      receipt: { type: String, default: 'FOC/REC' },
      creditNote: { type: String, default: 'FOC/CN' },
      debitNote: { type: String, default: 'FOC/DN' },
      client: { type: String, default: 'CLI' },
      project: { type: String, default: 'PRJ' },
      payment: { type: String, default: 'PAY' },
      transaction: { type: String, default: 'TXN' },
    },
    defaultPaymentTerms: {
      type: String,
      default: DEFAULT_COMPANY_DETAILS.defaultPaymentTerms,
    },
    defaultTermsAndConditions: {
      type: [String],
      default: DEFAULT_COMPANY_DETAILS.defaultTermsAndConditions,
    },
    isConfigured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Method to fetch or create the single company settings doc
companySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isSingleton: true });
  if (!settings) {
    settings = await this.create({ isSingleton: true });
  }
  return settings;
};

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);
export default CompanySettings;

