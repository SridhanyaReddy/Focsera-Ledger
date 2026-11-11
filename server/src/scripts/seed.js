import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from '../config/db.js';
import Admin from '../models/Admin.js';
import CompanySettings from '../models/CompanySettings.js';
import Division from '../models/Division.js';
import Service from '../models/Service.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import PaymentAllocation from '../models/PaymentAllocation.js';
import Receipt from '../models/Receipt.js';
import { PREDEFINED_DIVISIONS, DEFAULT_COMPANY_DETAILS, numberToIndianWords } from '../config/constants.js';
import { getNextSequenceNumber } from '../services/numberingService.js';
import { calculateDocumentFinancials } from '../services/calculationService.js';
import { recordInvoiceInLedger, recordPaymentInLedger } from '../services/ledgerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SAMPLE_SERVICES = [
  // Events
  {
    name: 'Luxury Stage & Mandap Decoration',
    divisionCode: 'focsera-celebrate',
    category: 'Events',
    description: 'Bespoke floral, crystal, and ambient stage setup with thematic lighting.',
    defaultRate: 75000,
    unitType: 'per event',
    taxPercentage: 18,
  },
  {
    name: 'Wedding Photography & Cinematic Film',
    divisionCode: 'focsera-celebrate',
    category: 'Events',
    description: 'Full team 2-day candid coverage, drone footage, traditional videography, and teaser reel.',
    defaultRate: 120000,
    unitType: 'per event',
    taxPercentage: 18,
  },
  {
    name: 'DJ & Sound Staging with Intelligent Lighting',
    divisionCode: 'focsera-celebrate',
    category: 'Events',
    description: 'Line array audio setup, DJ booth, trussing, beam moving heads, and smoke effects.',
    defaultRate: 35000,
    unitType: 'per evening',
    taxPercentage: 18,
  },
  // Studios
  {
    name: 'Commercial Product Photography & Styling',
    divisionCode: 'focsera-create',
    category: 'Studios',
    description: 'High-res studio catalog and creative lifestyle composition shoots with retouching.',
    defaultRate: 45000,
    unitType: 'per shoot',
    taxPercentage: 18,
  },
  {
    name: 'Instagram Reels & Short-form Video Pack (10 Reels)',
    divisionCode: 'focsera-create',
    category: 'Studios',
    description: 'Scripting, 4K shoot, color grading, sound design, and viral-hook editing.',
    defaultRate: 30000,
    unitType: 'package',
    taxPercentage: 18,
  },
  // Marketing
  {
    name: 'Social Media Growth & Content Retainer',
    divisionCode: 'focsera-market',
    category: 'Marketing',
    description: 'Monthly strategy, 20 high-fidelity creatives, community management & audience expansion.',
    defaultRate: 40000,
    unitType: 'per month',
    taxPercentage: 18,
  },
  {
    name: 'Performance Ad Campaign Management (Meta & Google)',
    divisionCode: 'focsera-market',
    category: 'Marketing',
    description: 'Audience testing, conversion tracking, ROAS optimization, and weekly reporting.',
    defaultRate: 25000,
    unitType: 'per month',
    taxPercentage: 18,
  },
  // Digital
  {
    name: 'Full-Stack Custom Web Application Development',
    divisionCode: 'focsera-grow',
    category: 'Digital',
    description: 'Modern responsive web platform, API integrations, cloud hosting deployment, and security hardening.',
    defaultRate: 85000,
    unitType: 'per project',
    taxPercentage: 18,
  },
  {
    name: 'Corporate Brand Identity & Visual Design System',
    divisionCode: 'media-and-branding',
    category: 'Digital',
    description: 'Primary logo, iconography, brand guidelines book, stationary, and digital assets.',
    defaultRate: 35000,
    unitType: 'per package',
    taxPercentage: 18,
  },
  // Interiors
  {
    name: 'Luxury Residential Interior Turnkey Execution',
    divisionCode: 'focsera-interiors',
    category: 'Interiors',
    description: 'Living room, modular kitchen, acrylic wardrobes, acoustic false ceiling, and bespoke lighting.',
    defaultRate: 450000,
    unitType: 'per apartment',
    taxPercentage: 18,
  },
];

export async function runSeed() {
  console.log('--- Initializing Focsera Seed Process ---');
  await connectDB();

  // 1. Seed or verify Company Profile
  let company = await CompanySettings.findOne({ isSingleton: true });
  if (!company) {
    company = await CompanySettings.create({
      isSingleton: true,
      ...DEFAULT_COMPANY_DETAILS,
      isConfigured: true,
    });
    console.log('✓ Created Focsera singleton company settings profile.');
  } else {
    company.isConfigured = true;
    await company.save();
    console.log('✓ Verified Focsera company profile is configured.');
  }

  // 2. Seed Divisions
  const divisionMap = {};
  for (const div of PREDEFINED_DIVISIONS) {
    const record = await Division.findOneAndUpdate(
      { code: div.code },
      { ...div, isActive: true },
      { upsert: true, new: true }
    );
    divisionMap[div.code] = record;
  }
  console.log(`✓ Seeded ${PREDEFINED_DIVISIONS.length} Focsera business divisions.`);

  // 3. Seed Admin User
  let admin = await Admin.findOne({ email: 'admin@focsera.in' });
  if (!admin) {
    const passwordHash = await Admin.hashPassword('Admin@Focsera2026');
    admin = await Admin.create({
      email: 'admin@focsera.in',
      name: 'Focsera Administrator',
      passwordHash,
      role: 'ADMIN',
      lastLogin: new Date(),
    });
    console.log('✓ Created default administrator: admin@focsera.in / Admin@Focsera2026');
  } else {
    console.log('✓ Focsera Administrator already exists.');
  }

  // 4. Seed Services
  for (const svc of SAMPLE_SERVICES) {
    const div = divisionMap[svc.divisionCode];
    if (div) {
      await Service.findOneAndUpdate(
        { name: svc.name },
        {
          name: svc.name,
          division: div._id,
          category: svc.category,
          description: svc.description,
          defaultRate: svc.defaultRate,
          unitType: svc.unitType,
          taxPercentage: svc.taxPercentage,
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }
  }
  console.log(`✓ Seeded ${SAMPLE_SERVICES.length} standard service packages.`);

  // 5. Seed Demonstration Clients if database is fresh
  const clientCount = await Client.countDocuments();
  if (clientCount === 0) {
    console.log('--- Seeding Demonstration Clients, Projects & Invoices ---');

    // Client 1: Hyderabad Wedding Client
    const client1Id = await getNextSequenceNumber('client');
    const client1 = await Client.create({
      clientId: client1Id,
      name: 'Dr. Ramesh & Sunita Verma',
      companyName: 'Verma Healthcare & Diagnostics',
      email: 'dr.verma@vermahealth.in',
      phone: '+91 98490 12345',
      clientType: 'Individual',
      billingAddress: {
        street: 'Villa 14, Palm Meadows, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        stateCode: '36',
        postalCode: '500033',
        country: 'India',
      },
      gstin: '36AABCU9603R1ZM',
      state: 'Telangana',
      stateCode: '36',
    });

    // Project 1: Verma Grand Wedding Celebration
    const proj1Id = await getNextSequenceNumber('project');
    const proj1 = await Project.create({
      projectId: proj1Id,
      name: 'The Verma Grand Jubilee Wedding & Reception',
      client: client1._id,
      division: divisionMap['focsera-celebrate']._id,
      serviceCategory: 'Events & Celebrations',
      description: 'End-to-end luxury wedding decor, cinematic coverage, and DJ coordination at Taj Krishna.',
      startDate: new Date('2026-04-10'),
      expectedCompletionDate: new Date('2026-04-15'),
      agreedProjectValue: 250000,
      paymentTerms: '50% advance booking, 30% pre-event, 20% on delivery of deliverables.',
      status: 'In Progress',
    });

    // Invoice for Project 1
    const inv1Num = await getNextSequenceNumber('invoice');
    const calc = calculateDocumentFinancials({
      items: [
        {
          serviceName: 'Luxury Stage & Mandap Decoration',
          description: 'Custom royal theme with fresh exotic floral arches and ambient lighting.',
          quantity: 1,
          rate: 120000,
          discount: 10000,
          taxPercentage: 18,
        },
        {
          serviceName: 'Wedding Photography & Cinematic Film',
          description: '3-day 4K coverage, drone, candid cinematography, and customized luxury album.',
          quantity: 1,
          rate: 130000,
          discount: 0,
          taxPercentage: 18,
        },
      ],
      companyStateCode: '36',
      placeOfSupplyStateCode: '36',
      invoiceDiscount: 0,
      additionalCharges: [],
      advanceAdjusted: 0,
      paidAmount: 0,
    });

    const invoice1 = await Invoice.create({
      invoiceNumber: inv1Num,
      invoiceType: 'Tax Invoice',
      client: client1._id,
      project: proj1._id,
      division: divisionMap['focsera-celebrate']._id,
      invoiceDate: new Date('2026-04-02'),
      dueDate: new Date('2026-04-20'),
      items: calc.items,
      subtotal: calc.subtotal,
      itemDiscountTotal: calc.itemDiscountTotal,
      invoiceDiscount: calc.invoiceDiscount,
      taxableAmount: calc.taxableAmount,
      cgst: calc.cgst,
      sgst: calc.sgst,
      igst: calc.igst,
      totalTax: calc.totalTax,
      additionalCharges: calc.additionalCharges,
      additionalChargesTotal: calc.additionalChargesTotal,
      roundOff: calc.roundOff,
      grandTotal: calc.grandTotal,
      advanceAdjusted: 0,
      paidAmount: 0,
      outstandingBalance: calc.grandTotal,
      status: 'Issued',
      notes: 'Thank you for choosing Focsera Celebrate for your wedding occasion.',
      termsAndConditions: company.defaultPaymentTerms || 'Payment due within 15 days.',
    });

    await recordInvoiceInLedger({
      invoice: invoice1,
      client: client1,
      project: proj1,
      division: divisionMap['focsera-celebrate'],
    });

    // Advance Payment of ₹1,00,000 for Invoice 1
    const pay1Num = await getNextSequenceNumber('payment');
    const txn1Num = await getNextSequenceNumber('transaction');
    const rec1Num = await getNextSequenceNumber('receipt');

    const payment1 = await Payment.create({
      paymentNumber: pay1Num,
      transactionId: txn1Num,
      client: client1._id,
      project: proj1._id,
      invoice: invoice1._id,
      amount: 100000,
      allocatedAmount: 100000,
      unallocatedAmount: 0,
      paymentDate: new Date('2026-04-03'),
      paymentMethod: 'Bank Transfer',
      paymentType: 'Advance',
      referenceNumber: 'HDFC-TXN-90214812',
      notes: 'Initial booking advance paid via NEFT.',
    });

    invoice1.paidAmount = 100000;
    invoice1.outstandingBalance = invoice1.grandTotal - 100000;
    invoice1.status = 'Partially Paid';
    await invoice1.save();

    const receipt1 = await Receipt.create({
      receiptNumber: rec1Num,
      receiptDate: new Date('2026-04-03'),
      payment: payment1._id,
      client: client1._id,
      project: proj1._id,
      invoice: invoice1._id,
      amount: 100000,
      amountInWords: numberToIndianWords(100000),
      paymentMethod: 'Bank Transfer',
      transactionReference: 'HDFC-TXN-90214812',
      remainingBalance: invoice1.outstandingBalance,
      notes: 'Initial booking advance paid via NEFT.',
    });

    payment1.receipt = receipt1._id;
    await payment1.save();

    await PaymentAllocation.create({
      payment: payment1._id,
      invoice: invoice1._id,
      client: client1._id,
      project: proj1._id,
      amount: 100000,
      allocatedDate: new Date('2026-04-03'),
      notes: `Direct payment allocation from ${payment1.paymentNumber}`,
    });

    await recordPaymentInLedger({
      payment: payment1,
      client: client1,
      project: proj1,
      invoice: invoice1,
      division: divisionMap['focsera-celebrate'],
    });

    // Client 2: Corporate Digital & Marketing Client
    const client2Id = await getNextSequenceNumber('client');
    const client2 = await Client.create({
      clientId: client2Id,
      name: 'AeroTech Systems Pvt Ltd',
      companyName: 'AeroTech Systems',
      email: 'finance@aerotechsys.com',
      phone: '+91 99887 76655',
      clientType: 'Business',
      billingAddress: {
        street: '8th Floor, Cyber Towers, HITEC City',
        city: 'Hyderabad',
        state: 'Telangana',
        stateCode: '36',
        postalCode: '500081',
        country: 'India',
      },
      gstin: '36AAACA1122B1Z8',
      state: 'Telangana',
      stateCode: '36',
    });

    // Project 2: AeroTech Website & Branding
    const proj2Id = await getNextSequenceNumber('project');
    const proj2 = await Project.create({
      projectId: proj2Id,
      name: 'AeroTech Corporate Web Platform & Brand Relaunch',
      client: client2._id,
      division: divisionMap['focsera-grow']._id,
      serviceCategory: 'Business & Digital',
      description: 'Brand identity system, cloud dashboard, and interactive responsive company website.',
      startDate: new Date('2026-04-05'),
      expectedCompletionDate: new Date('2026-05-15'),
      agreedProjectValue: 120000,
      status: 'Approved',
    });

    // Quotation for Project 2
    const quo1Num = await getNextSequenceNumber('quotation');
    const quoCalc = calculateDocumentFinancials({
      items: [
        {
          serviceName: 'Full-Stack Custom Web Application Development',
          description: 'Scalable corporate web portal with headless CMS.',
          quantity: 1,
          rate: 85000,
          discount: 0,
          taxPercentage: 18,
        },
        {
          serviceName: 'Corporate Brand Identity & Visual Design System',
          description: 'Comprehensive design guidelines and vector library.',
          quantity: 1,
          rate: 35000,
          discount: 0,
          taxPercentage: 18,
        },
      ],
      companyStateCode: '36',
      placeOfSupplyStateCode: '36',
    });

    await Quotation.create({
      quotationNumber: quo1Num,
      client: client2._id,
      project: proj2._id,
      division: divisionMap['focsera-grow']._id,
      quotationDate: new Date('2026-04-05'),
      validUntil: new Date('2026-05-05'),
      status: 'Accepted',
      items: quoCalc.items,
      subtotal: quoCalc.subtotal,
      itemDiscountTotal: quoCalc.itemDiscountTotal,
      invoiceDiscount: quoCalc.invoiceDiscount,
      taxableAmount: quoCalc.taxableAmount,
      cgst: quoCalc.cgst,
      sgst: quoCalc.sgst,
      igst: quoCalc.igst,
      totalTax: quoCalc.totalTax,
      additionalCharges: quoCalc.additionalCharges,
      additionalChargesTotal: quoCalc.additionalChargesTotal,
      roundOff: quoCalc.roundOff,
      grandTotal: quoCalc.grandTotal,
      paymentTerms: '50% advance, 50% on final launch.',
      termsAndConditions: 'All project code belongs to client upon full payment.',
    });

    console.log('✓ Created demonstration client profiles, projects, invoices, payments, and quotations.');
  }

  console.log('=== Focsera Seed Completed Successfully ===');
  process.exit(0);
}

// Auto-run if executed directly
if (process.argv[1] === __filename) {
  runSeed().catch((err) => {
    console.error('Seed execution error:', err);
    process.exit(1);
  });
}
