import { TriangleAlert } from 'lucide-react';
import './RentalDeadlineAlert.css';
export function RentalDeadlineAlert({ bookings, onShow }) {
  const overdue = bookings.filter((booking) => booking.rentalState === 'overdue');
  if (!overdue.length) return null;
  return (
    <section className="rental-deadline-alert" role="status" aria-live="polite">
      <TriangleAlert size={22} aria-hidden="true" />
      <div>
        <strong>
          {overdue.length} {overdue.length === 1 ? 'vehicle has' : 'vehicles have'} passed the
          rental end time and not been returned.
        </strong>
        <p>
          Contact the customer. When the vehicle arrives, open Manage → Mark as Returned and save
          the return inspection.
        </p>
      </div>
      <button type="button" className="rr-button--outline" onClick={onShow}>
        Show overdue rentals
      </button>
    </section>
  );
}
