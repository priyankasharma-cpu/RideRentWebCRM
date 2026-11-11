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
const inputValue = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    if (!Number.isFinite(Date.parse(value))) return value;
    const localPart = value.slice(0, 16);
    if (shopInput(toUTC(localPart)) !== localPart) return value;
    return shopInput(value);
  }
  return value;
};
export const periodFromParams = (params) => {
  if (!params.has('startsAt') && !params.has('endsAt')) return defaultPeriod();
  return { startsAt: inputValue(params.get('startsAt')), endsAt: inputValue(params.get('endsAt')) };
};

export function validateRentalPeriod(period, { future = true } = {}) {
  try {
    for (const value of [period?.startsAt, period?.endsAt]) {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || '') || shopInput(toUTC(value)) !== value)
        throw Error('Choose valid pickup and return dates.');
    }
    const window = { startsAt: toUTC(period.startsAt), endsAt: toUTC(period.endsAt) };
    if (window.endsAt <= window.startsAt) throw Error('Return time must be after pickup.');
    if (future && Date.parse(window.startsAt) < Date.now() - 60000)
      throw Error('Choose a pickup time in the future.');
    return { window, error: '' };
  } catch (error) {
    return { window: null, error: error.message || 'Choose valid pickup and return dates.' };
  }
}

export const periodSearch = (period) => (period ? '?' + new URLSearchParams(period) : '');
