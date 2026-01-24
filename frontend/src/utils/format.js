export const formatMoney = (amt, cur='USD') =>
  `${cur} ${Number(amt || 0).toLocaleString(undefined,{minimumFractionDigits:2})}`;

export const formatDate = d =>
  d ? new Date(d).toLocaleDateString() : '—';
