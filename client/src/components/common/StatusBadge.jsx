import React from 'react';

export default function StatusBadge({ status, type = 'invoice' }) {
  const getBadgeStyle = () => {
    switch (status) {
      // Success: #287A57
      case 'Paid':
      case 'Accepted':
      case 'Completed':
      case 'Fully Settled':
        return 'bg-[#E9F5EF] text-[#287A57] border-[#BBE2CF]';

      // Warning: #B98232
      case 'Partially Paid':
      case 'Partially Received':
      case 'Pending':
      case 'On Hold':
        return 'bg-[#FDF6EB] text-[#B98232] border-[#F5DCB4]';

      // Muted / Deep Blue
      case 'Issued':
      case 'Approved':
      case 'In Progress':
        return 'bg-[#EEF4F8] text-[#233D5B] border-[#DCE7F0]';

      // Danger: #B84B4B
      case 'Overdue':
      case 'Cancelled':
      case 'Rejected':
        return 'bg-[#FDEFEF] text-[#B84B4B] border-[#F7C6C6]';

      // Draft / Neutral
      case 'Draft':
      case 'Enquiry':
        return 'bg-[#F4F7FA] text-[#697586] border-[#E2E7ED]';

      case 'Sent':
      case 'Viewed':
      case 'Quotation Sent':
        return 'bg-[#EEF4F8] text-[#52799D] border-[#DCE7F0]';

      case 'Converted':
        return 'bg-[#DCE7F0] text-[#14243A] border-[#B0C8DF]';

      default:
        return 'bg-[#F4F7FA] text-[#697586] border-[#E2E7ED]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{status}</span>
    </span>
  );
}
