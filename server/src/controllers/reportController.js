import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Division from '../models/Division.js';
import Quotation from '../models/Quotation.js';
import CreditNote from '../models/CreditNote.js';
import Transaction from '../models/Transaction.js';
import { round } from '../services/calculationService.js';

/**
 * Helper to build date range filters based on period selection
 */
function getDateRangeFromPeriod(period, startDate, endDate) {
  const now = new Date();
  let start = null;
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'this_quarter': {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
      break;
    }
    case 'this_fy': {
      // Indian FY starts April 1
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(year, 3, 1, 0, 0, 0, 0);
      end = new Date(year + 1, 2, 31, 23, 59, 59, 999);
      break;
    }
    case 'custom':
      if (startDate) start = new Date(startDate);
      if (endDate) end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      break;
    default:
      start = null;
  }

  return { start, end };
}

/**
 * Dashboard Metrics & Charts API
 */
export async function getDashboardData(req, res) {
  try {
    const { period = 'this_fy', startDate, endDate, division } = req.query;
    const { start, end } = getDateRangeFromPeriod(period, startDate, endDate);

    const invFilter = { status: { $nin: ['Cancelled', 'Draft'] } };
    const payFilter = { isReversed: false, paymentType: { $nin: ['Refund', 'Reversal'] } };
    const quoFilter = {};
    const prjFilter = { isArchived: false };

    if (start && end) {
      invFilter.invoiceDate = { $gte: start, $lte: end };
      payFilter.paymentDate = { $gte: start, $lte: end };
      quoFilter.quotationDate = { $gte: start, $lte: end };
    }

    if (division && division !== 'all') {
      invFilter.division = division;
      prjFilter.division = division;
    }

    // 1. Financial Totals
    const [invoices, payments, clientsCount, activeProjectsCount, quotationsCount] = await Promise.all([
      Invoice.find(invFilter).populate('division project client'),
      Payment.find(payFilter).populate('client project invoice'),
      Client.countDocuments({ isArchived: false }),
      Project.countDocuments({ ...prjFilter, status: { $in: ['In Progress', 'Approved'] } }),
      Quotation.countDocuments({ ...quoFilter, status: { $in: ['Sent', 'Draft', 'Viewed'] } }),
    ]);

    const totalInvoiced = round(invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
    const totalReceived = round(payments.reduce((acc, pay) => acc + (pay.amount || 0), 0));
    const totalOutstanding = round(invoices.reduce((acc, inv) => acc + (inv.outstandingBalance || 0), 0));

    // Overdue amount
    const now = new Date();
    const overdueInvoices = invoices.filter(
      (inv) => inv.dueDate && new Date(inv.dueDate) < now && inv.outstandingBalance > 0
    );
    const overdueAmount = round(overdueInvoices.reduce((acc, inv) => acc + (inv.outstandingBalance || 0), 0));

    // 2. Monthly Trend Data (Last 6-12 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyMap[key] = { month: key, invoiced: 0, received: 0 };
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.invoiceDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyMap[key]) {
        monthlyMap[key].invoiced = round(monthlyMap[key].invoiced + inv.grandTotal);
      }
    });

    payments.forEach((pay) => {
      const d = new Date(pay.paymentDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyMap[key]) {
        monthlyMap[key].received = round(monthlyMap[key].received + pay.amount);
      }
    });

    const monthlyTrends = Object.values(monthlyMap);

    // 3. Division-wise revenue breakdown
    const allDivisions = await Division.find({ isActive: true });
    const divisionRevenueMap = {};
    allDivisions.forEach((d) => {
      divisionRevenueMap[d._id.toString()] = { name: d.name, amount: 0 };
    });

    invoices.forEach((inv) => {
      const divId = inv.division?._id?.toString() || inv.division?.toString();
      if (divId && divisionRevenueMap[divId]) {
        divisionRevenueMap[divId].amount = round(divisionRevenueMap[divId].amount + inv.grandTotal);
      }
    });

    const divisionRevenue = Object.values(divisionRevenueMap).filter((d) => d.amount > 0);

    // 4. Recent Activities
    const [recentInvoices, recentPayments, recentQuotations, recentProjects] = await Promise.all([
      Invoice.find(invFilter).populate('client project division').sort({ invoiceDate: -1, createdAt: -1 }).limit(5),
      Payment.find(payFilter).populate('client invoice project').sort({ paymentDate: -1, createdAt: -1 }).limit(5),
      Quotation.find(quoFilter).populate('client division').sort({ quotationDate: -1, createdAt: -1 }).limit(5),
      Project.find(prjFilter).populate('client division').sort({ createdAt: -1 }).limit(5),
    ]);

    return res.json({
      success: true,
      data: {
        metrics: {
          totalInvoiced,
          totalReceived,
          totalOutstanding,
          overdueAmount,
          activeProjects: activeProjectsCount,
          totalClients: clientsCount,
          totalInvoices: invoices.length,
          pendingQuotations: quotationsCount,
        },
        charts: {
          monthlyTrends,
          divisionRevenue,
          outstandingVsReceived: [
            { name: 'Received', value: totalReceived },
            { name: 'Outstanding', value: totalOutstanding },
          ],
        },
        recent: {
          invoices: recentInvoices,
          payments: recentPayments,
          quotations: recentQuotations,
          projects: recentProjects,
          overdueInvoices: overdueInvoices.slice(0, 5),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 14 Detailed Financial Reports API
 */
export async function getFinancialReports(req, res) {
  try {
    const { reportType, period = 'this_fy', startDate, endDate, division, client } = req.query;
    const { start, end } = getDateRangeFromPeriod(period, startDate, endDate);

    const baseInvFilter = { status: { $nin: ['Cancelled', 'Draft'] } };
    const basePayFilter = { isReversed: false };

    if (start && end) {
      baseInvFilter.invoiceDate = { $gte: start, $lte: end };
      basePayFilter.paymentDate = { $gte: start, $lte: end };
    }

    if (division && division !== 'all') {
      baseInvFilter.division = division;
    }

    if (client && client !== 'all') {
      baseInvFilter.client = client;
      basePayFilter.client = client;
    }

    switch (reportType) {
      // 1. Monthly Invoicing Report
      case 'monthly_invoicing': {
        const invoices = await Invoice.find(baseInvFilter).populate('client division project').sort({ invoiceDate: 1 });
        const grouped = {};
        invoices.forEach((inv) => {
          const m = new Date(inv.invoiceDate).toISOString().slice(0, 7); // YYYY-MM
          if (!grouped[m]) grouped[m] = { month: m, count: 0, taxable: 0, tax: 0, total: 0 };
          grouped[m].count += 1;
          grouped[m].taxable = round(grouped[m].taxable + inv.taxableAmount);
          grouped[m].tax = round(grouped[m].tax + inv.totalTax);
          grouped[m].total = round(grouped[m].total + inv.grandTotal);
        });
        return res.json({ success: true, data: Object.values(grouped), invoices });
      }

      // 2. Annual Invoicing Report
      case 'annual_invoicing': {
        const invoices = await Invoice.find({ status: { $nin: ['Cancelled', 'Draft'] } }).sort({ invoiceDate: 1 });
        const grouped = {};
        invoices.forEach((inv) => {
          const yr = new Date(inv.invoiceDate).getFullYear();
          if (!grouped[yr]) grouped[yr] = { year: yr, count: 0, taxable: 0, tax: 0, total: 0 };
          grouped[yr].count += 1;
          grouped[yr].taxable = round(grouped[yr].taxable + inv.taxableAmount);
          grouped[yr].tax = round(grouped[yr].tax + inv.totalTax);
          grouped[yr].total = round(grouped[yr].total + inv.grandTotal);
        });
        return res.json({ success: true, data: Object.values(grouped) });
      }

      // 3. Monthly Collection Report
      case 'monthly_collection': {
        const payments = await Payment.find({ ...basePayFilter, paymentType: { $nin: ['Refund', 'Reversal'] } })
          .populate('client project invoice')
          .sort({ paymentDate: 1 });
        const grouped = {};
        payments.forEach((p) => {
          const m = new Date(p.paymentDate).toISOString().slice(0, 7);
          if (!grouped[m]) grouped[m] = { month: m, count: 0, totalCollected: 0, upi: 0, bank: 0, cash: 0, other: 0 };
          grouped[m].count += 1;
          grouped[m].totalCollected = round(grouped[m].totalCollected + p.amount);
          if (p.paymentMethod === 'UPI') grouped[m].upi = round(grouped[m].upi + p.amount);
          else if (['Bank Transfer', 'NEFT', 'RTGS', 'IMPS'].includes(p.paymentMethod))
            grouped[m].bank = round(grouped[m].bank + p.amount);
          else if (p.paymentMethod === 'Cash') grouped[m].cash = round(grouped[m].cash + p.amount);
          else grouped[m].other = round(grouped[m].other + p.amount);
        });
        return res.json({ success: true, data: Object.values(grouped), payments });
      }

      // 4. Client-Wise Revenue
      case 'client_revenue': {
        const invoices = await Invoice.find(baseInvFilter).populate('client');
        const grouped = {};
        invoices.forEach((inv) => {
          const cId = inv.client?._id?.toString();
          if (!cId) return;
          if (!grouped[cId]) {
            grouped[cId] = {
              clientId: inv.client.clientId,
              clientName: inv.client.name,
              businessName: inv.client.businessName,
              invoiceCount: 0,
              totalInvoiced: 0,
              paidAmount: 0,
              outstanding: 0,
            };
          }
          grouped[cId].invoiceCount += 1;
          grouped[cId].totalInvoiced = round(grouped[cId].totalInvoiced + inv.grandTotal);
          grouped[cId].paidAmount = round(grouped[cId].paidAmount + inv.paidAmount + inv.advanceAdjusted);
          grouped[cId].outstanding = round(grouped[cId].outstanding + inv.outstandingBalance);
        });
        return res.json({ success: true, data: Object.values(grouped) });
      }

      // 5. Division-Wise Revenue
      case 'division_revenue': {
        const invoices = await Invoice.find(baseInvFilter).populate('division');
        const grouped = {};
        invoices.forEach((inv) => {
          const dId = inv.division?._id?.toString();
          if (!dId) return;
          if (!grouped[dId]) {
            grouped[dId] = {
              divisionName: inv.division.name,
              category: inv.division.category,
              invoiceCount: 0,
              totalInvoiced: 0,
              paidAmount: 0,
              outstanding: 0,
            };
          }
          grouped[dId].invoiceCount += 1;
          grouped[dId].totalInvoiced = round(grouped[dId].totalInvoiced + inv.grandTotal);
          grouped[dId].paidAmount = round(grouped[dId].paidAmount + inv.paidAmount + inv.advanceAdjusted);
          grouped[dId].outstanding = round(grouped[dId].outstanding + inv.outstandingBalance);
        });
        return res.json({ success: true, data: Object.values(grouped) });
      }

      // 6. Project-Wise Financial Report
      case 'project_financials': {
        const projects = await Project.find({ isArchived: false }).populate('client division');
        const data = await Promise.all(
          projects.map(async (prj) => {
            const prjInvoices = await Invoice.find({ project: prj._id, status: { $nin: ['Cancelled', 'Draft'] } });
            const prjPayments = await Payment.find({ project: prj._id, isReversed: false, paymentType: { $ne: 'Refund' } });
            const invoiced = round(prjInvoices.reduce((a, b) => a + (b.grandTotal || 0), 0));
            const received = round(prjPayments.reduce((a, b) => a + (b.amount || 0), 0));
            return {
              projectId: prj.projectId,
              projectName: prj.name,
              clientName: prj.client?.name,
              divisionName: prj.division?.name,
              agreedValue: prj.agreedProjectValue,
              invoiced,
              received,
              outstanding: Math.max(0, round(prj.agreedProjectValue - received)),
              status: prj.status,
            };
          })
        );
        return res.json({ success: true, data });
      }

      // 7. Outstanding Payments
      case 'outstanding_payments': {
        const invoices = await Invoice.find({ ...baseInvFilter, outstandingBalance: { $gt: 0 } })
          .populate('client project division')
          .sort({ dueDate: 1 });
        return res.json({ success: true, data: invoices });
      }

      // 8. Overdue Invoices
      case 'overdue_invoices': {
        const now = new Date();
        const invoices = await Invoice.find({
          ...baseInvFilter,
          dueDate: { $lt: now },
          outstandingBalance: { $gt: 0 },
        })
          .populate('client project division')
          .sort({ dueDate: 1 });
        return res.json({ success: true, data: invoices });
      }

      // 9. Advance Payments
      case 'advance_payments': {
        const payments = await Payment.find({
          ...basePayFilter,
          paymentType: 'Advance',
        }).populate('client project invoice');
        return res.json({ success: true, data: payments });
      }

      // 10. Refund Report
      case 'refund_report': {
        const refunds = await Payment.find({ paymentType: 'Refund' }).populate('client project invoice');
        return res.json({ success: true, data: refunds });
      }

      // 11. Credit Note Report
      case 'credit_note_report': {
        const notes = await CreditNote.find().populate('client project division originalInvoice');
        return res.json({ success: true, data: notes });
      }

      // 12. Tax Summary
      case 'tax_summary': {
        const invoices = await Invoice.find(baseInvFilter);
        let totalTaxable = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalTax = 0;

        invoices.forEach((inv) => {
          totalTaxable = round(totalTaxable + (inv.taxableAmount || 0));
          totalCGST = round(totalCGST + (inv.cgst || 0));
          totalSGST = round(totalSGST + (inv.sgst || 0));
          totalIGST = round(totalIGST + (inv.igst || 0));
          totalTax = round(totalTax + (inv.totalTax || 0));
        });

        return res.json({
          success: true,
          data: {
            totalTaxable,
            totalCGST,
            totalSGST,
            totalIGST,
            totalTax,
            invoiceCount: invoices.length,
          },
        });
      }

      // 13. Transaction History
      case 'transaction_history': {
        const txns = await Transaction.find().populate('client project division').sort({ date: -1 });
        return res.json({ success: true, data: txns });
      }

      // 14. Receivables Aging Report (Section 19: Not Due, 1-30, 31-60, 61-90, 90+ days)
      case 'receivables_aging':
      default: {
        const now = new Date();
        const invoices = await Invoice.find({
          status: { $nin: ['Cancelled', 'Draft', 'Paid'] },
          outstandingBalance: { $gt: 0 },
        }).populate('client project division');

        const buckets = {
          notDue: { label: 'Not Due', count: 0, amount: 0, invoices: [] },
          days1_30: { label: '1–30 Days Overdue', count: 0, amount: 0, invoices: [] },
          days31_60: { label: '31–60 Days Overdue', count: 0, amount: 0, invoices: [] },
          days61_90: { label: '61–90 Days Overdue', count: 0, amount: 0, invoices: [] },
          days90Plus: { label: 'More Than 90 Days Overdue', count: 0, amount: 0, invoices: [] },
        };

        invoices.forEach((inv) => {
          const due = new Date(inv.dueDate);
          const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));
          const balance = inv.outstandingBalance;

          if (diffDays <= 0) {
            buckets.notDue.count++;
            buckets.notDue.amount = round(buckets.notDue.amount + balance);
            buckets.notDue.invoices.push(inv);
          } else if (diffDays <= 30) {
            buckets.days1_30.count++;
            buckets.days1_30.amount = round(buckets.days1_30.amount + balance);
            buckets.days1_30.invoices.push(inv);
          } else if (diffDays <= 60) {
            buckets.days31_60.count++;
            buckets.days31_60.amount = round(buckets.days31_60.amount + balance);
            buckets.days31_60.invoices.push(inv);
          } else if (diffDays <= 90) {
            buckets.days61_90.count++;
            buckets.days61_90.amount = round(buckets.days61_90.amount + balance);
            buckets.days61_90.invoices.push(inv);
          } else {
            buckets.days90Plus.count++;
            buckets.days90Plus.amount = round(buckets.days90Plus.amount + balance);
            buckets.days90Plus.invoices.push(inv);
          }
        });

        const totalReceivable = round(
          buckets.notDue.amount +
            buckets.days1_30.amount +
            buckets.days31_60.amount +
            buckets.days61_90.amount +
            buckets.days90Plus.amount
        );

        return res.json({
          success: true,
          data: {
            buckets,
            totalReceivable,
            totalCount: invoices.length,
          },
        });
      }
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

