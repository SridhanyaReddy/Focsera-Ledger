import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Receipt,
  BookOpen,
  ArrowLeftRight,
  BarChart3,
  ShieldCheck,
  CalendarClock,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_GROUPS = [
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Financial Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'OPERATIONS & WORKFLOW',
    items: [
      { name: 'Clients', path: '/clients', icon: Users },
      { name: 'Projects', path: '/projects', icon: Briefcase },
      { name: 'Follow-ups & Meetings', path: '/followups', icon: CalendarClock },
      { name: 'To-Do List', path: '/todos', icon: CheckSquare },
      { name: 'Services', path: '/services', icon: Layers },
      { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'FINANCIAL CORE',
    items: [
      { name: 'Invoices', path: '/invoices', icon: FileText },
      { name: 'Payments & Receipts', path: '/payments', icon: CreditCard },
      { name: 'Expenses', path: '/expenses', icon: Receipt },
      { name: 'Client Ledger', path: '/ledger', icon: BookOpen },
      { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'COMPLIANCE & SYSTEM',
    items: [
      { name: 'System Audits', path: '/audits', icon: ShieldCheck },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { admin, company, logout } = useAuth();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#14243A] text-white border-r border-[#233D5B] z-30 transition-all duration-200 flex flex-col select-none font-sans ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#233D5B] bg-[#101E31]">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-[#233D5B] border border-[#345275] flex items-center justify-center font-display font-bold text-white text-sm">
              F
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-white tracking-tight text-sm leading-tight truncate">
                  FOCSERA
                </span>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#233D5B] text-[#DCE7F0] font-semibold">
                  ERP
                </span>
              </div>
              <span className="text-[10px] text-[#DCE7F0]/70 font-mono tracking-wider uppercase truncate">
                FINANCIAL LEDGER
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded bg-[#233D5B] border border-[#345275] flex items-center justify-center font-display font-bold text-white text-sm">
            F
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded text-[#DCE7F0]/70 hover:text-white hover:bg-[#233D5B] transition-colors ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-[#233D5B]">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold text-[#DCE7F0]/60 tracking-wider font-sans uppercase">
                {group.title}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#52799D] text-white font-semibold shadow-sm'
                      : 'text-[#DCE7F0]/80 hover:text-white hover:bg-[#233D5B]/60'
                  } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-[#233D5B] bg-[#101E31]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded bg-[#14243A] border border-[#233D5B]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded bg-[#233D5B] flex items-center justify-center text-[10px] font-mono font-bold text-[#DCE7F0] shrink-0">
                AD
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-white truncate">
                  {admin?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-[#DCE7F0]/70 truncate font-mono">
                  {admin?.email || 'admin@focsera.in'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded text-[#DCE7F0]/70 hover:text-rose-300 hover:bg-[#233D5B] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 text-[#DCE7F0]/70 hover:text-white hover:bg-[#233D5B] rounded"
              title="Expand"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-1.5 text-[#DCE7F0]/70 hover:text-rose-300 hover:bg-[#233D5B] rounded"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
