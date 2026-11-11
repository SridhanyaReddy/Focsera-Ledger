import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="py-14 px-6 text-center max-w-sm mx-auto flex flex-col items-center animate-in fade-in duration-150 font-sans">
      <div className="w-12 h-12 rounded bg-[#EEF4F8] border border-[#DCE7F0] flex items-center justify-center text-[#52799D] mb-3.5">
        {Icon ? <Icon className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-semibold text-[#182333] font-sans">{title}</h3>
      <p className="text-xs text-[#697586] mt-1 leading-relaxed max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#52799D] hover:bg-[#233D5B] text-white text-xs font-medium rounded transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
