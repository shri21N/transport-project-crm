import React from 'react';

export const Badge = ({ status, text }) => {
  const normalized = (status || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  let badgeClass = 'badge-pending';

  switch (normalized) {
    case 'available':
    case 'delivered':
    case 'paid':
    case 'active':
    case 'sent':
      badgeClass = 'badge-delivered';
      break;
    case 'assigned':
    case 'ontrip':
      badgeClass = 'badge-assigned';
      break;
    case 'intransit':
      badgeClass = 'badge-intransit';
      break;
    case 'cancelled':
    case 'unpaid':
    case 'maintenance':
    case 'offduty':
    case 'failed':
      badgeClass = 'badge-cancelled';
      break;
    default:
      badgeClass = 'badge-pending';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        display: 'inline-block',
      }} />
      {text || status}
    </span>
  );
};

export default Badge;
