export function rentalDuration(startsAt, endsAt) {
  const minutes = Math.round((Date.parse(endsAt) - Date.parse(startsAt)) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Duration unavailable';
  const days = Math.floor(minutes / 1440),
    hours = Math.floor((minutes % 1440) / 60),
    remainder = minutes % 60;
  return [
    [days, 'day'],
    [hours, 'hour'],
    [remainder, 'minute'],
  ]
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value} ${unit}${value === 1 ? '' : 's'}`)
    .join(' ');
}
export const paymentLabels = {
  paid: 'Payment done',
  pending: 'Payment pending',
  partial: 'Part payment · Balance pending',
  refund_pending: 'Refund pending',
  not_required: 'No payment due',
};
