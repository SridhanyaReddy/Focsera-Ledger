import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import divisionRoutes from './routes/divisionRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import ledgerRoutes from './routes/ledgerRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import todoRoutes from './routes/todoRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5050;

// Security & Parsing Middlewares
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Focsera Financial Management System',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/todos', todoRoutes);

// Serve static frontend build if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Focsera Backend API is running.');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
  });
});

// Start Server function for modular testing
export async function startServer() {
  await connectDB();
  
  // Auto-seed default admin and company if not present
  try {
    const { default: Admin } = await import('./models/Admin.js');
    const { default: CompanySettings } = await import('./models/CompanySettings.js');
    const { default: Division } = await import('./models/Division.js');
    const { PREDEFINED_DIVISIONS, DEFAULT_COMPANY_DETAILS } = await import('./config/constants.js');

    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const passwordHash = await Admin.hashPassword('focsera@15');
      await Admin.create({
        email: 'admin@focsera.in',
        passwordHash,
        name: 'Focsera Administrator',
        role: 'ADMIN',
      });
      console.log('✓ Seeded default Focsera Admin with updated password: admin@focsera.in / focsera@15');
    } else {
      // Ensure admin password matches focsera@15
      const admin = await Admin.findOne({ email: 'admin@focsera.in' });
      if (admin) {
        admin.passwordHash = await Admin.hashPassword('focsera@15');
        await admin.save();
        console.log('✓ Synchronized Focsera Admin password to: focsera@15');
      }
    }

    const settingsCount = await CompanySettings.countDocuments();
    if (settingsCount === 0) {
      await CompanySettings.create({
        isSingleton: true,
        ...DEFAULT_COMPANY_DETAILS,
        isConfigured: true,
      });
      console.log('✓ Seeded Focsera Company Profile');
    }

    const divCount = await Division.countDocuments();
    if (divCount === 0) {
      for (const d of PREDEFINED_DIVISIONS) {
        await Division.create({ ...d, isActive: true });
      }
      console.log('✓ Seeded all 9 Focsera Divisions');
    }

    // Seed comprehensive services and subcategories across all 9 divisions
    const { default: Service } = await import('./models/Service.js');
    const { FOCSERA_CATALOG } = await import('./config/catalog.js');
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      const allDivs = await Division.find({});
      const divMap = {};
      allDivs.forEach((d) => {
        divMap[d.code] = d._id;
      });

      const serviceDocs = [];
      for (const item of FOCSERA_CATALOG) {
        const divisionId = divMap[item.divisionCode];
        if (divisionId) {
          for (const s of item.services) {
            serviceDocs.push({
              name: s.name,
              division: divisionId,
              category: s.category,
              defaultRate: s.defaultRate,
              unitType: s.unitType,
              taxPercentage: 18,
              isActive: true,
            });
          }
        }
      }
      if (serviceDocs.length > 0) {
        await Service.insertMany(serviceDocs);
        console.log(`✓ Seeded ${serviceDocs.length} services across all 9 divisions`);
      }
    }
  } catch (seedErr) {
    console.error('Auto-seed error:', seedErr);
  }

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  FOCSERA FINANCIAL MANAGEMENT SYSTEM & LEDGER ENGINE  `);
      console.log(`  Single-Company Platform for Focsera Innovations      `);
      console.log(`  Server running on http://localhost:${PORT}          `);
      console.log(`=======================================================`);
      resolve(server);
    });
  });
}

// Auto-run if executed directly
if (process.argv[1] === __filename) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;

