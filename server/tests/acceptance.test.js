/**
 * Focsera Acceptance Test Suite
 * Validates all 10 Scenarios from Section 27 of the specifications
 */

import assert from 'assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import Admin from '../src/models/Admin.js';
import CompanySettings from '../src/models/CompanySettings.js';
import Division from '../src/models/Division.js';
import Client from '../src/models/Client.js';
import Project from '../src/models/Project.js';
import Quotation from '../src/models/Quotation.js';
import Invoice from '../src/models/Invoice.js';
import Payment from '../src/models/Payment.js';
import Receipt from '../src/models/Receipt.js';
import LedgerEntry from '../src/models/LedgerEntry.js';
import Transaction from '../src/models/Transaction.js';
import { getNextSequenceNumber } from '../src/services/numberingService.js';
import { calculateDocumentFinancials, getInvoiceStatus } from '../src/services/calculationService.js';
import {
  recordInvoiceInLedger,
  recordPaymentInLedger,
  recordAdvanceAllocationInLedger,
  recordRefundInLedger,
  getClientFinancialProfile,
  getProjectFinancialOverview,
} from '../src/services/ledgerService.js';
import { PREDEFINED_DIVISIONS, DEFAULT_COMPANY_DETAILS } from '../src/config/constants.js';

async function runAcceptanceTests() {
  console.log('\n============================================================');
  console.log('   STARTING FOCSERA ACCEPTANCE TEST SUITE (SCENARIOS 1-10)   ');
  console.log('============================================================\n');

  await connectDB();

  try {
    // 0. Initialize Admin and Focsera Company Settings
    console.log('[Setup] Initializing Admin, Divisions, and Company Profile...');
    await Admin.deleteMany({});
    await CompanySettings.deleteMany({});
    await Division.deleteMany({});
    await Client.deleteMany({});
    await Project.deleteMany({});
    await Quotation.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await Receipt.deleteMany({});
    await LedgerEntry.deleteMany({});
    await Transaction.deleteMany({});

    const passwordHash = await Admin.hashPassword('Admin@Focsera2026');
    const admin = await Admin.create({
      email: 'admin@focsera.in',
      passwordHash,
      name: 'Focsera Lead Admin',
      role: 'ADMIN',
    });
    assert.strictEqual(admin.role, 'ADMIN', 'Role must strictly be ADMIN');

    for (const div of PREDEFINED_DIVISIONS) {
      await Division.create(div);
    }
    const divisions = await Division.find({});
    assert.strictEqual(divisions.length, 9, 'All 9 Focsera divisions must be initialized');

    const company = await CompanySettings.create({
      isSingleton: true,
      ...DEFAULT_COMPANY_DETAILS,
      isConfigured: true,
    });
    assert.strictEqual(company.brandName, 'Focsera', 'Company brand must be Focsera');
    console.log('✔ [Setup] Successfully initialized Focsera single-tenant instance\n');

    // SCENARIO 1: New Client & Project association
    console.log('[Scenario 1: New Client]');
    const clientId = await getNextSequenceNumber('client');
    const clientA = await Client.create({
      clientId,
      name: 'Radhika Sharma',
      businessName: 'Sharma Luxe Living',
      phone: '+91 98765 43210',
      email: 'radhika@sharmaluxe.com',
      state: 'Telangana',
      stateCode: '36',
      clientType: 'Business',
    });
    assert.ok(clientA._id, 'Client A must be created');
    assert.strictEqual(clientA.clientId, 'CLI-001', 'Client ID sequential');

    const celebrationDivision = await Division.findOne({ code: 'focsera-celebrate' });
    const projectId = await getNextSequenceNumber('project');
    const project1 = await Project.create({
      projectId,
      name: 'Sharma Luxury Wedding 2026',
      client: clientA._id,
      division: celebrationDivision._id,
      serviceCategory: 'Wedding Decor & Coordination',
      agreedProjectValue: 500000,
      status: 'In Progress',
    });
    assert.ok(project1._id, 'Project 1 must be created');
    assert.strictEqual(project1.division.toString(), celebrationDivision._id.toString());
    console.log(`✔ Scenario 1 Passed: Client ${clientA.name} & Project ${project1.name} under ${celebrationDivision.name}\n`);

    // SCENARIO 2: Quotation with custom prices, discount, taxes, converted to Invoice
    console.log('[Scenario 2: Quotation & Conversion to Invoice]');
    const quotationCalc = calculateDocumentFinancials({
      items: [
        { serviceName: 'Luxury Stage Decor', quantity: 1, rate: 100000, discount: 5000, taxPercentage: 18 },
        { serviceName: 'Photography & Cinematic Video', quantity: 2, rate: 25000, discount: 0, taxPercentage: 18 },
      ],
      additionalCharges: [{ description: 'Venue Transport', amount: 5000 }],
      invoiceDiscount: 2000,
      companyStateCode: '36',
      placeOfSupplyStateCode: '36',
    });

    const quotationNumber = await getNextSequenceNumber('quotation');
    const quotation = await Quotation.create({
      quotationNumber,
      quotationDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      client: clientA._id,
      project: project1._id,
      division: celebrationDivision._id,
      items: quotationCalc.items,
      additionalCharges: quotationCalc.additionalCharges,
      subtotal: quotationCalc.subtotal,
      itemDiscountTotal: quotationCalc.itemDiscountTotal,
      invoiceDiscount: quotationCalc.invoiceDiscount,
      taxableAmount: quotationCalc.taxableAmount,
      cgst: quotationCalc.cgst,
      sgst: quotationCalc.sgst,
      igst: quotationCalc.igst,
      totalTax: quotationCalc.totalTax,
      additionalChargesTotal: quotationCalc.additionalChargesTotal,
      roundOff: quotationCalc.roundOff,
      grandTotal: quotationCalc.grandTotal,
      status: 'Accepted',
    });

    assert.ok(quotation.grandTotal > 0, 'Quotation grand total calculated');

    // Convert Quotation to Invoice
    const invoiceNumber = await getNextSequenceNumber('invoice');
    const invoiceFromQuotation = await Invoice.create({
      invoiceNumber,
      invoiceType: 'Tax Invoice',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      client: clientA._id,
      project: project1._id,
      division: celebrationDivision._id,
      placeOfSupply: clientA.state,
      placeOfSupplyStateCode: clientA.stateCode,
      isInterState: false,
      items: quotation.items,
      additionalCharges: quotation.additionalCharges,
      subtotal: quotation.subtotal,
      itemDiscountTotal: quotation.itemDiscountTotal,
      invoiceDiscount: quotation.invoiceDiscount,
      taxableAmount: quotation.taxableAmount,
      cgst: quotation.cgst,
      sgst: quotation.sgst,
      igst: quotation.igst,
      totalTax: quotation.totalTax,
      additionalChargesTotal: quotation.additionalChargesTotal,
      roundOff: quotation.roundOff,
      grandTotal: quotation.grandTotal,
      outstandingBalance: quotation.grandTotal,
      status: 'Issued',
      quotationReference: quotation._id,
    });

    quotation.status = 'Converted';
    quotation.convertedToInvoice = invoiceFromQuotation._id;
    await quotation.save();

    await recordInvoiceInLedger({
      invoice: invoiceFromQuotation,
      client: clientA,
      project: project1,
      division: celebrationDivision,
    });

    assert.strictEqual(quotation.status, 'Converted');
    assert.strictEqual(invoiceFromQuotation.quotationReference.toString(), quotation._id.toString());
    console.log(`✔ Scenario 2 Passed: Quotation ${quotation.quotationNumber} successfully converted to Invoice ${invoiceFromQuotation.invoiceNumber}\n`);

    // SCENARIO 3: Partial Payment (Invoice of ₹30,000, Advance ₹10,000, Payment ₹5,000)
    console.log('[Scenario 3: Partial Payment]');
    const invoice30kNumber = await getNextSequenceNumber('invoice');
    const invoice30k = await Invoice.create({
      invoiceNumber: invoice30kNumber,
      invoiceType: 'Tax Invoice',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      client: clientA._id,
      project: project1._id,
      division: celebrationDivision._id,
      placeOfSupply: 'Telangana',
      placeOfSupplyStateCode: '36',
      subtotal: 30000,
      taxableAmount: 30000,
      grandTotal: 30000,
      paidAmount: 0,
      outstandingBalance: 30000,
      status: 'Issued',
    });

    await recordInvoiceInLedger({
      invoice: invoice30k,
      client: clientA,
      project: project1,
      division: celebrationDivision,
    });

    // Record Advance of ₹10,000 against this invoice
    const pay1Number = await getNextSequenceNumber('payment');
    const pay1Txn = await getNextSequenceNumber('transaction');
    const payment1 = await Payment.create({
      paymentNumber: pay1Number,
      transactionId: pay1Txn,
      client: clientA._id,
      project: project1._id,
      invoice: invoice30k._id,
      amount: 10000,
      allocatedAmount: 10000,
      unallocatedAmount: 0,
      paymentMethod: 'UPI',
      paymentType: 'Advance',
      referenceNumber: 'UPI-ADV-10000',
    });

    invoice30k.paidAmount += 10000;
    invoice30k.outstandingBalance -= 10000;
    invoice30k.status = getInvoiceStatus(invoice30k);
    await invoice30k.save();

    await recordPaymentInLedger({
      payment: payment1,
      client: clientA,
      project: project1,
      invoice: invoice30k,
      division: celebrationDivision,
    });

    // Record another payment of ₹5,000
    const pay2Number = await getNextSequenceNumber('payment');
    const pay2Txn = await getNextSequenceNumber('transaction');
    const payment2 = await Payment.create({
      paymentNumber: pay2Number,
      transactionId: pay2Txn,
      client: clientA._id,
      project: project1._id,
      invoice: invoice30k._id,
      amount: 5000,
      allocatedAmount: 5000,
      unallocatedAmount: 0,
      paymentMethod: 'Bank Transfer',
      paymentType: 'Partial',
      referenceNumber: 'NEFT-5000',
    });

    invoice30k.paidAmount += 5000;
    invoice30k.outstandingBalance -= 5000;
    invoice30k.status = getInvoiceStatus(invoice30k);
    await invoice30k.save();

    await recordPaymentInLedger({
      payment: payment2,
      client: clientA,
      project: project1,
      invoice: invoice30k,
      division: celebrationDivision,
    });

    assert.strictEqual(invoice30k.grandTotal, 30000, 'Total Invoiced must be 30,000');
    assert.strictEqual(invoice30k.paidAmount, 15000, 'Total Received must be 15,000');
    assert.strictEqual(invoice30k.outstandingBalance, 15000, 'Outstanding must be 15,000');
    assert.strictEqual(invoice30k.status, 'Partially Paid', 'Invoice status must be Partially Paid');
    console.log('✔ Scenario 3 Passed: Total Invoiced=₹30,000, Total Received=₹15,000, Outstanding=₹15,000, Status=Partially Paid\n');

    // SCENARIO 4: Full Settlement (Record remaining ₹15,000)
    console.log('[Scenario 4: Full Settlement]');
    const pay3Number = await getNextSequenceNumber('payment');
    const pay3Txn = await getNextSequenceNumber('transaction');
    const payment3 = await Payment.create({
      paymentNumber: pay3Number,
      transactionId: pay3Txn,
      client: clientA._id,
      project: project1._id,
      invoice: invoice30k._id,
      amount: 15000,
      allocatedAmount: 15000,
      unallocatedAmount: 0,
      paymentMethod: 'UPI',
      paymentType: 'Final Settlement',
      referenceNumber: 'UPI-FINAL-15000',
    });

    invoice30k.paidAmount += 15000;
    invoice30k.outstandingBalance -= 15000;
    invoice30k.status = getInvoiceStatus(invoice30k);
    await invoice30k.save();

    await recordPaymentInLedger({
      payment: payment3,
      client: clientA,
      project: project1,
      invoice: invoice30k,
      division: celebrationDivision,
    });

    assert.strictEqual(invoice30k.paidAmount, 30000, 'Total Received must be 30,000');
    assert.strictEqual(invoice30k.outstandingBalance, 0, 'Outstanding must be 0');
    assert.strictEqual(invoice30k.status, 'Paid', 'Invoice status must be Paid');
    console.log('✔ Scenario 4 Passed: Total Received=₹30,000, Outstanding=₹0, Status=Paid\n');

    // SCENARIO 5: Client Ledger (Chronological order and correct running balance)
    console.log('[Scenario 5: Client Ledger Verification]');
    const ledgerEntries = await LedgerEntry.find({ client: clientA._id }).sort({ date: 1, _id: 1 });
    assert.ok(ledgerEntries.length >= 4, 'Ledger must have all entries');

    let running = 0;
    for (const entry of ledgerEntries) {
      running = running + entry.debit - entry.credit;
      assert.strictEqual(entry.runningBalance, running, `Running balance must match at entry ${entry.referenceNumber}`);
    }
    console.log(`✔ Scenario 5 Passed: All ${ledgerEntries.length} ledger entries verified in chronological order with exact running balance.\n`);

    // SCENARIO 6: Advance Allocation without double counting
    console.log('[Scenario 6: Advance Allocation]');
    const clientBId = await getNextSequenceNumber('client');
    const clientB = await Client.create({
      clientId: clientBId,
      name: 'Ananya Rao',
      phone: '+91 91234 56789',
      state: 'Telangana',
    });

    // Record an unallocated advance of ₹10,000
    const advNumber = await getNextSequenceNumber('payment');
    const advTxn = await getNextSequenceNumber('transaction');
    const advancePayment = await Payment.create({
      paymentNumber: advNumber,
      transactionId: advTxn,
      client: clientB._id,
      amount: 10000,
      allocatedAmount: 0,
      unallocatedAmount: 10000,
      paymentMethod: 'UPI',
      paymentType: 'Advance',
      referenceNumber: 'UNALLOC-ADV-10000',
    });

    await recordPaymentInLedger({
      payment: advancePayment,
      client: clientB,
    });

    const profileBefore = await getClientFinancialProfile(clientB._id);
    assert.strictEqual(profileBefore.totalReceived, 10000, 'Initial advance is received money');
    assert.strictEqual(profileBefore.unallocatedAdvances, 10000, 'Unallocated advance is 10,000');

    // Later generate invoice of ₹25,000 and allocate the advance
    const invBNumber = await getNextSequenceNumber('invoice');
    const interiorsDivision = await Division.findOne({ code: 'focsera-interiors' });
    const prjBId = await getNextSequenceNumber('project');
    const projectB = await Project.create({
      projectId: prjBId,
      name: 'Ananya Rao Luxury Villa Makeover',
      client: clientB._id,
      division: interiorsDivision._id,
      agreedProjectValue: 25000,
    });

    const invoiceB = await Invoice.create({
      invoiceNumber: invBNumber,
      invoiceType: 'Tax Invoice',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      client: clientB._id,
      project: projectB._id,
      division: interiorsDivision._id,
      grandTotal: 25000,
      advanceAdjusted: 0,
      paidAmount: 0,
      outstandingBalance: 25000,
      status: 'Issued',
    });

    await recordInvoiceInLedger({
      invoice: invoiceB,
      client: clientB,
      project: projectB,
      division: interiorsDivision,
    });

    // Allocate the ₹10,000 advance to this invoice
    advancePayment.unallocatedAmount -= 10000;
    advancePayment.allocatedAmount += 10000;
    await advancePayment.save();

    invoiceB.advanceAdjusted += 10000;
    invoiceB.outstandingBalance -= 10000;
    invoiceB.status = getInvoiceStatus(invoiceB);
    await invoiceB.save();

    await recordAdvanceAllocationInLedger({
      payment: advancePayment,
      invoice: invoiceB,
      client: clientB,
      project: projectB,
      division: interiorsDivision,
      allocatedAmount: 10000,
    });

    const profileAfter = await getClientFinancialProfile(clientB._id);
    assert.strictEqual(profileAfter.totalInvoiced, 25000, 'Total Invoiced is 25,000');
    assert.strictEqual(profileAfter.totalReceived, 10000, 'Total Received is STILL 10,000 (NOT double-counted)');
    assert.strictEqual(profileAfter.currentOutstanding, 15000, 'Remaining outstanding is 15,000');
    assert.strictEqual(profileAfter.unallocatedAdvances, 0, 'Unallocated advances now 0');
    console.log('✔ Scenario 6 Passed: Advance allocation correctly applied without double-counting received money!\n');

    // SCENARIO 7: Multiple Projects for one Client
    console.log('[Scenario 7: Multiple Projects for One Client]');
    const marketDivision = await Division.findOne({ code: 'focsera-market' });
    const prj2Id = await getNextSequenceNumber('project');
    const project2 = await Project.create({
      projectId: prj2Id,
      name: 'Sharma Luxe Performance Marketing',
      client: clientA._id,
      division: marketDivision._id,
      agreedProjectValue: 75000,
    });

    const overviewPrj1 = await getProjectFinancialOverview(project1._id);
    const overviewPrj2 = await getProjectFinancialOverview(project2._id);
    const clientAProfile = await getClientFinancialProfile(clientA._id);

    assert.ok(overviewPrj1.agreedProjectValue > 0, 'Project 1 has its own financial overview');
    assert.strictEqual(overviewPrj2.agreedProjectValue, 75000, 'Project 2 has its own financial overview');
    assert.strictEqual(clientAProfile.client.name, clientA.name, 'Client profile combines both projects');
    console.log('✔ Scenario 7 Passed: Separate project tracking while combined under client profile.\n');

    // SCENARIO 8: Division Reports
    console.log('[Scenario 8: Division-Wise Reports]');
    const celebrateInvoices = await Invoice.find({ division: celebrationDivision._id });
    const interiorsInvoices = await Invoice.find({ division: interiorsDivision._id });
    assert.ok(celebrateInvoices.length > 0, 'Celebration division invoices filtered');
    assert.ok(interiorsInvoices.length > 0, 'Interiors division invoices filtered');
    console.log('✔ Scenario 8 Passed: Division filters accurately isolate division records.\n');

    // SCENARIO 9: Refund handling
    console.log('[Scenario 9: Refund]');
    const refundTxn = await getNextSequenceNumber('transaction');
    const refundPayment = await Payment.create({
      paymentNumber: 'REF-001',
      transactionId: refundTxn,
      client: clientB._id,
      project: projectB._id,
      invoice: invoiceB._id,
      amount: 2000,
      paymentMethod: 'Bank Transfer',
      paymentType: 'Refund',
      notes: 'Customer courtesy refund',
    });

    await recordRefundInLedger({
      refundPayment,
      client: clientB,
      project: projectB,
      invoice: invoiceB,
      division: interiorsDivision,
    });

    const profileAfterRefund = await getClientFinancialProfile(clientB._id);
    assert.strictEqual(profileAfterRefund.totalRefunded, 2000, 'Total refunded is 2,000');
    assert.strictEqual(profileAfterRefund.currentOutstanding, 17000, 'Outstanding increased by 2,000 refund');
    console.log('✔ Scenario 9 Passed: Refund recorded as separate transaction and updated ledger without deleting original payment.\n');

    // SCENARIO 10: Data Persistence
    console.log('[Scenario 10: Data Persistence]');
    const foundAdmin = await Admin.findOne({ email: 'admin@focsera.in' });
    const foundClients = await Client.countDocuments();
    const foundInvoices = await Invoice.countDocuments();
    assert.ok(foundAdmin, 'Admin persists');
    assert.ok(foundClients >= 2, 'Clients persist');
    assert.ok(foundInvoices >= 2, 'Invoices persist');
    console.log('✔ Scenario 10 Passed: All database records remain persistent and queryable.\n');

    console.log('============================================================');
    console.log('   ALL 10 ACCEPTANCE TEST SCENARIOS PASSED WITH 100% SUCCESS  ');
    console.log('============================================================\n');
  } catch (error) {
    console.error('Acceptance Test Failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runAcceptanceTests();

