import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  CreditCard,
  User,
  Receipt,
  X,
  Calendar,
  Command,
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/formatters';

export default function Navbar() {
  const { company } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await api.get(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          if (res.data.success) {
            setSearchResults(res.data.data);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
        setShowDropdown(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectResult = (path) => {
    navigate(path);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const hasResults =
    searchResults &&
    (searchResults.clients?.length > 0 ||
      searchResults.projects?.length > 0 ||
      searchResults.invoices?.length > 0 ||
      searchResults.quotations?.length > 0 ||
      searchResults.receipts?.length > 0 ||
      searchResults.transactions?.length > 0);

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E2E7ED] sticky top-0 z-20 px-6 sm:px-8 flex items-center justify-between select-none font-sans">
      {/* Global Search Bar */}
      <div className="relative w-full max-w-md" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#697586] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
            placeholder="Search clients, invoices, quotations, ledger..."
            className="w-full pl-9 pr-14 py-2 bg-[#F4F7FA] hover:bg-[#EEF4F8] focus:bg-[#FFFFFF] text-xs text-[#182333] placeholder:text-[#697586] rounded border border-[#E2E7ED] focus:border-[#52799D] focus:ring-1 focus:ring-[#52799D] outline-none transition-all font-sans"
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowDropdown(false);
                }}
                className="pointer-events-auto text-[#697586] hover:text-[#182333] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-[#697586] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E7ED]">
                <Command className="w-2.5 h-2.5" /> K
              </span>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-11 left-0 right-0 bg-[#FFFFFF] rounded-md shadow-lg border border-[#E2E7ED] overflow-hidden max-h-[460px] overflow-y-auto z-50 animate-in fade-in duration-100 font-sans">
            {isSearching && (
              <div className="p-4 text-center text-xs text-[#697586] font-mono">Querying database...</div>
            )}

            {!isSearching && !hasResults && (
              <div className="p-5 text-center text-xs text-[#697586] font-sans">
                No matching records found for "{searchQuery}".
              </div>
            )}

            {!isSearching && hasResults && (
              <div className="divide-y divide-[#E2E7ED]">
                {searchResults.invoices?.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold tracking-wider text-[#697586] uppercase font-sans px-3 py-1">
                      Invoices
                    </div>
                    {searchResults.invoices.map((inv) => (
                      <button
                        key={inv._id}
                        onClick={() => handleSelectResult(`/invoices?view=${inv._id}`)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-[#F4F7FA] flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#52799D]" />
                          <span className="font-mono font-medium text-[#182333]">{inv.invoiceNumber}</span>
                          <span className="text-[#697586] truncate max-w-[140px]">{inv.client?.name}</span>
                        </div>
                        <span className="font-mono font-bold text-[#182333] tabular-nums">{formatINR(inv.grandTotal)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.clients?.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold tracking-wider text-[#697586] uppercase font-sans px-3 py-1">
                      Clients
                    </div>
                    {searchResults.clients.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => handleSelectResult(`/clients/${c._id}`)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-[#F4F7FA] flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#287A57]" />
                          <span className="font-medium text-[#182333]">{c.name}</span>
                          {c.companyName && <span className="text-[#697586] text-[11px]">({c.companyName})</span>}
                        </div>
                        <span className="text-[11px] font-mono text-[#697586]">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => navigate('/quotations?create=true')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F4F7FA] text-[#182333] text-xs font-medium rounded border border-[#E2E7ED] transition-colors"
          >
            <Plus className="w-3 h-3 text-[#697586]" />
            <span>Quotation</span>
          </button>
          <button
            onClick={() => navigate('/invoices?create=true')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#52799D] hover:bg-[#233D5B] text-white text-xs font-medium rounded transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>Invoice</span>
          </button>
          <button
            onClick={() => navigate('/payments?record=true')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F4F7FA] text-[#287A57] border border-[#BBE2CF] text-xs font-medium rounded transition-colors"
          >
            <CreditCard className="w-3 h-3" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Financial Year Metric */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F7FA] rounded text-[11px] font-mono font-medium text-[#697586] border border-[#E2E7ED]">
          <Calendar className="w-3 h-3 text-[#697586]" />
          <span>FY {company?.financialYear || '2026-27'}</span>
        </div>

        {/* Corporate Status */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#FFFFFF] border border-[#E2E7ED] rounded text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#287A57]" />
          <span className="font-semibold text-[#182333] font-sans">{company?.brandName || 'Focsera'}</span>
          <span className="text-[#E2E7ED]">|</span>
          <span className="text-[#697586] font-mono">{company?.state || 'Telangana'}</span>
        </div>
      </div>
    </header>
  );
}
