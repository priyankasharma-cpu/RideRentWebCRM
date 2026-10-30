import { useState } from 'react';
import { shopInput, toUTC } from '../../../utils/rentalTime.js';
import { PeriodFields } from '../../../components/booking/PeriodFields.jsx';
export function RescheduleForm({ booking, busy, onSubmit }) {
  const [period, setPeriod] = useState({
    startsAt: shopInput(booking.starts_at),
    endsAt: shopInput(booking.ends_at),
  });
  return (
    <form
      className="action-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          startsAt: toUTC(period.startsAt),
          endsAt: toUTC(period.endsAt),
        });
      }}
    >
      <h3>Change rental schedule</h3>
      <PeriodFields value={period} onChange={setPeriod} />
      <button className="rr-button" disabled={busy}>
        Save Schedule
      </button>
    </form>
  );
}
