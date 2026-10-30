export function assessAvailability(vehicle, reservations, maintenance, start, end) {
  if (vehicle.status !== 'Available') {
    return {
      available: false,
      reason:
        vehicle.status === 'Inactive' ? 'Vehicle is inactive' : 'Vehicle is under maintenance',
    };
  }
  if (maintenance.some((block) => block.starts_at <= new Date().toISOString())) {
    return { available: false, reason: 'Vehicle is under maintenance' };
  }
  if (reservations.some((booking) => ['active', 'inspecting'].includes(booking.status))) {
    return { available: false, reason: 'Vehicle is out on rent or awaiting return inspection' };
  }
  if (
    reservations.some(
      (booking) =>
        booking.status === 'confirmed' && booking.starts_at < end && booking.ends_at > start,
    )
  ) {
    return { available: false, reason: 'Vehicle is reserved during this period' };
  }
  if (maintenance.some((block) => block.starts_at < end && block.ends_at > start)) {
    return { available: false, reason: 'Vehicle has a maintenance block during this period' };
  }
  return { available: true, reason: 'Available for your selected period' };
}

export function physicalVehicleStatus(vehicle, reservations, maintenance, current) {
  if (vehicle.status !== 'Available') return vehicle.status;
  if (maintenance.some((block) => block.starts_at <= current)) return 'Maintenance';
  const active = reservations.find((booking) => ['active', 'inspecting'].includes(booking.status));
  if (active?.status === 'inspecting') return 'Inspection';
  if (active) return active.ends_at < current ? 'Overdue' : 'Rented';
  if (
    reservations.some(
      (booking) =>
        booking.status === 'confirmed' && booking.starts_at <= current && booking.ends_at > current,
    )
  )
    return 'Reserved';
  return 'Available';
}
