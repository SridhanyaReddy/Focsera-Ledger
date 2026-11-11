import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  // Institutional White + Midnight Blue accents
  const badgeStyles = {
    blue: 'text-[#52799D] bg-[#F4F7FA] border-[#DCE7F0]',
    emerald: 'text-[#287A57] bg-[#E9F5EF] border-[#BBE2CF]',
    amber: 'text-[#B98232] bg-[#FDF6EB] border-[#F5DCB4]',
    rose: 'text-[#B84B4B] bg-[#FDEFEF] border-[#F7C6C6]',
    purple: 'text-[#233D5B] bg-[#F4F7FA] border-[#DCE7F0]',
    teal: 'text-[#287A57] bg-[#E9F5EF] border-[#BBE2CF]',
    slate: 'text-[#697586] bg-[#F4F7FA] border-[#E2E7ED]',
  };

  return (
    <div className="bg-[#FFFFFF] p-5 rounded border border-[#E2E7ED] hover:border-[#DCE7F0] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-sans font-semibold tracking-wider text-[#697586] uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded flex items-center justify-center border ${badgeStyles[color] || badgeStyles.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-xl sm:text-2xl font-bold text-[#182333] tracking-tight font-display tabular-nums">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-[#697586] font-sans mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
