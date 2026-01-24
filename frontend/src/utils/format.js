export const formatMoney = (amount, currency = 'USD') =>
  `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString() : '—';
