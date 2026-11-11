// End events precede starts at equal times: adjacent reservations share stock safely.
export function peakCommitment(windows, start, end) {
  const from = Date.parse(start),
    until = Date.parse(end);
  let issued = 0;
  const events = [];
  for (const row of windows) {
    if (['active', 'inspecting'].includes(row.status)) {
      issued += row.quantity;
      continue;
    }
    const left = Math.max(from, Date.parse(row.starts_at));
    const right = Math.min(until, Date.parse(row.ends_at));
    if (left < right) events.push([left, row.quantity], [right, -row.quantity]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let current = issued,
    peak = issued;
  for (const [, delta] of events) {
    current += delta;
    peak = Math.max(peak, current);
  }
  return peak;
}

export function stockSummary(addon, windows, start, end) {
  const issued = windows
    .filter((row) => ['active', 'inspecting'].includes(row.status))
    .reduce((sum, row) => sum + row.quantity, 0);
  const committed = peakCommitment(windows, start, end);
  return {
    stock: addon.stock,
    unserviceable: addon.unserviceable,
    issued,
    reserved: committed - issued,
    available: Math.max(0, addon.stock - addon.unserviceable - committed),
  };
}
