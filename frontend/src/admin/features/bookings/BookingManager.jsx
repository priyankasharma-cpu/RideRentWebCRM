import { useBookingManager } from './useBookingManager';
import { RentalCompletionForm } from '../rentals/RentalCompletionForm.jsx';
import { RentalInspectionForm } from '../rentals/RentalInspectionForm.jsx';
import { BookingLedger } from '../payments/BookingLedger.jsx';
import { BookingActions } from './BookingActions.jsx';
import { BookingCharges } from './BookingCharges.jsx';
import { BookingHeader } from './BookingHeader.jsx';
import { Modal } from '../../../components/common/Modal.jsx';
import { formatTime, money } from '../../../utils/formatters.js';
import { ErrorBox } from '../../../components/common/ErrorBox.jsx';
import { PaymentForm } from '../payments/PaymentForm.jsx';
import { RescheduleForm } from './RescheduleForm.jsx';
import './BookingManager.css';
export function BookingManager({ initial, onClose, onChanged }) {
  const {
    booking,
    setBooking,
    action,
    setAction,
    error,
    busy,
    execute,
    user,
    update,
    statusAction,
    submitInspection,
  } = useBookingManager(initial, onChanged);
  return (
    <Modal title={booking.reference} onClose={onClose}>
      <BookingHeader booking={booking} />
      <div className="booking-facts">
        <div>
          <small>Scheduled pickup</small>
          <strong>{formatTime(booking.starts_at)}</strong>
        </div>
        <div>
          <small>Scheduled return</small>
          <strong>{formatTime(booking.ends_at)}</strong>
        </div>
        <div>
          <small>Actual pickup</small>
          <strong>{formatTime(booking.rental?.pickup_at)}</strong>
        </div>
        <div>
          <small>Actual return</small>
          <strong>{formatTime(booking.rental?.return_at)}</strong>
        </div>
      </div>
      <BookingCharges booking={booking} />
      {booking.rental?.late_charge > 0 && (
        <p className="warning-note">
          {booking.rental.late_minutes} minutes late · {money(booking.rental.late_charge)} late fee
          included.
        </p>
      )}
      <ErrorBox>{error}</ErrorBox>
      <BookingActions
        booking={booking}
        busy={busy}
        setAction={setAction}
        statusAction={statusAction}
        execute={execute}
        setBooking={setBooking}
      />
      {['pickup', 'return'].includes(action) && (
        <RentalInspectionForm
          submitInspection={submitInspection}
          action={action}
          booking={booking}
          busy={busy}
        />
      )}
      {action === 'payments' && (
        <PaymentForm
          booking={booking}
          busy={busy}
          onSubmit={(values) => update('/payments', values)}
        />
      )}{' '}
      {action === 'reschedule' && (
        <RescheduleForm
          busy={busy}
          booking={booking}
          onSubmit={(values) => statusAction('/reschedule', values)}
        />
      )}{' '}
      {action === 'complete' && <RentalCompletionForm update={update} busy={busy} />}
      <BookingLedger
        booking={booking}
        user={user}
        busy={busy}
        execute={execute}
        setBooking={setBooking}
      />
    </Modal>
  );
}
