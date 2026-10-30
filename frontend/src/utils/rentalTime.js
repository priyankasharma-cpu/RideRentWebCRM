export const shopInput = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(' ', 'T');
};
export const toUTC = (value) => new Date(value + '+05:30').toISOString();
export const defaultPeriod = () => {
  const start = new Date(Math.ceil((Date.now() + 3600000) / 3600000) * 3600000);
  return {
    startsAt: shopInput(start),
    endsAt: shopInput(new Date(+start + 4 * 3600000)),
  };
};
export const periodFromParams = (params) => ({
  startsAt: params.get('startsAt') || defaultPeriod().startsAt,
  endsAt: params.get('endsAt') || defaultPeriod().endsAt,
});
