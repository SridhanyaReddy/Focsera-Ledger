import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Common Components
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';

// Auth Pages
import Login from './pages/Auth/Login';
import InitialSetup from './pages/Auth/InitialSetup';
import ForgotPassword from './pages/Auth/ForgotPassword';

// App Modules
import Dashboard from './pages/Dashboard/Dashboard';
import ClientsPage from './pages/Clients/ClientsPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import ServicesPage from './pages/Services/ServicesPage';
import QuotationsPage from './pages/Quotations/QuotationsPage';
import InvoicesPage from './pages/Invoices/InvoicesPage';
import PaymentsPage from './pages/Payments/PaymentsPage';
import ExpensesPage from './pages/Expenses/ExpensesPage';
import ClientLedgerPage from './pages/Ledger/ClientLedgerPage';
import TransactionsPage from './pages/Transactions/TransactionsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import AuditsPage from './pages/Audits/AuditsPage';
import FollowUpsPage from './pages/Projects/FollowUpsPage';
import TodoPage from './pages/Todo/TodoPage';

function ProtectedLayout() {
  const { admin, loading, setupRequired } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center text-[#182333] text-xs font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-md border-2 border-[#52799D] border-t-transparent animate-spin" />
          <span className="font-mono text-[#697586] text-xs">Initializing Focsera Financial System...</span>
        </div>
      </div>
    );
  }

  if (setupRequired) {
    return <Navigate to="/login" replace />;
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#182333] flex font-sans">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-200 min-w-0 ${
          isSidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <Navbar />
        <main className="flex-1 p-6 sm:p-8 max-w-[1500px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/ledger" element={<ClientLedgerPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audits" element={<AuditsPage />} />
            <Route path="/followups" element={<FollowUpsPage />} />
            <Route path="/todos" element={<TodoPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<InitialSetup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
