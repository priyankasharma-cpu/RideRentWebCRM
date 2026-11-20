export function groupBookingRows(bookings) {
  const groups = new Map();
  const entries = [];
  for (const booking of bookings) {
    const checkout = booking.checkout;
    if (!checkout || checkout.bookings.length < 2) {
      entries.push({ type: 'booking', booking });
      continue;
    }
    let group = groups.get(checkout.id);
    if (!group) {
      group = {
        type: 'checkout',
        id: checkout.id,
        checkout,
        members: [],
        customer: booking.customer,
        first: booking,
      };
      groups.set(checkout.id, group);
      entries.push(group);
    }
    group.members.push(...checkout.bookings);
  }

  return entries.map((entry) =>
    entry.type === 'checkout'
      ? {
          ...entry,
          members: [...new Map(entry.members.map((member) => [member.id, member])).values()],
        }
      : entry,
  );
}
