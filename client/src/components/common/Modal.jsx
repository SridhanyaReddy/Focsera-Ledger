import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div
        className="fixed inset-0 bg-[#14243A]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative bg-[#FFFFFF] rounded border border-[#E2E7ED] shadow-xl w-full ${maxWidth} z-10 overflow-hidden transform transition-all my-8 animate-in fade-in zoom-in-95 duration-150 select-text`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E7ED] bg-[#F8FAFC]">
          <h3 className="font-bold text-[#182333] text-base font-display">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#697586] hover:text-[#182333] hover:bg-[#EEF4F8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[calc(85vh-80px)] overflow-y-auto text-xs text-[#182333]">{children}</div>
      </div>
    </div>
  );
}
