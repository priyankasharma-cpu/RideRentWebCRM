import { useState } from 'react';
import { formatTime, money } from '../../utils/formatters.js';
import { BookingStatusSummary } from '../../components/booking/BookingStatusSummary.jsx';
import { rentalDuration, paymentLabels } from '../../utils/bookingStatus.js';
import { ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { groupBookingRows } from '../utils/bookingGroups.js';
import './BookingTable.css';

function ManageAction({ booking, onSelect }) {
  return onSelect ? (
    <button className="table-action" onClick={() => onSelect(booking)}>
      Manage <ArrowUpRight size={13} />
    </button>
  ) : (
    <Link className="table-action" to="/admin/bookings">
      View <ArrowUpRight size={13} />
    </Link>
  );
}

function BookingRow({ booking, onSelect }) {
  return (
    <tr>
      <td>
        <strong>{booking.customer.name}</strong>
        <small>{booking.reference}</small>
      </td>
      <td>
        <strong>{booking.vehicle.name}</strong>
        <small>{booking.vehicle.registration}</small>
      </td>
      <td>
        <span>{formatTime(booking.starts_at)}</span>
        <small>to {formatTime(booking.ends_at)}</small>
        <small>Duration: {rentalDuration(booking.starts_at, booking.ends_at)}</small>
      </td>
      <td>
        <span className="source-badge">{booking.source}</span>
      </td>
      <td>
        <BookingStatusSummary booking={booking} />
      </td>
      <td>
        <strong>{money(booking.outstanding)}</strong>
        <small>of {money(booking.total)}</small>
      </td>
      <td>
        <ManageAction booking={booking} onSelect={onSelect} />
      </td>
    </tr>
  );
}

function CheckoutMembers({ group, bookings, onSelect }) {
  const membersById = new Map(bookings.map((booking) => [booking.id, booking]));
  return (
    <div className="checkout-group__members">
      {group.members.map((member) => {
        const booking = membersById.get(member.id);
        if (!booking) return null;
        const addOns = member.addOns || [];
        return (
          <article className="checkout-member" key={booking.id}>
            <div className="checkout-member__heading">
              <div>
                <strong>{booking.vehicle.name}</strong>
                <small>
                  {booking.customer.name} · {booking.reference}
                </small>
                <small>
                  {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)} ·{' '}
                  {rentalDuration(booking.starts_at, booking.ends_at)}
                </small>
              </div>
              <div className="checkout-member__action">
                <BookingStatusSummary booking={booking} />
                <ManageAction booking={booking} onSelect={onSelect} />
              </div>
            </div>
            <dl className="checkout-member__financials">
              <div>
                <dt>Rental charge</dt>
                <dd>{money(member.rentalCharge)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{money(member.tax)}</dd>
              </div>
              <div>
                <dt>Security deposit booked</dt>
                <dd>{money(member.securityDeposit)}</dd>
              </div>
              {addOns.map((addon, index) => (
                <div key={`${booking.id}-${addon.name}-${index}`}>
                  <dt>
                    {addon.name} × {addon.quantity}
                    {addon.includedQuantity > 0 && ` · ${addon.includedQuantity} included`}
                  </dt>
                  <dd>{money(addon.base + addon.tax)}</dd>
                </div>
              ))}
              <div>
                <dt>Total payable</dt>
                <dd>{money(member.totalPayable)}</dd>
              </div>
              <div>
                <dt>Deposit paid</dt>
                <dd>{money(member.depositPaid)}</dd>
              </div>
              <div>
                <dt>Refundable deposit available</dt>
                <dd>{money(member.refundableDeposit)}</dd>
              </div>
              <div>
                <dt>Paid after refunds</dt>
                <dd>{money(member.amountPaid)}</dd>
              </div>
              {member.amountRefunded > 0 && (
                <div>
                  <dt>Refunded</dt>
                  <dd>{money(member.amountRefunded)}</dd>
                </div>
              )}
              <div>
                <dt>Outstanding</dt>
                <dd>{money(member.outstanding)}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function CheckoutRow({ group, bookings, onSelect, expanded, onToggle }) {
  const first = group.first;
  const vehicleNames = [...new Set(group.members.map((member) => member.name))];
  return (
    <>
      <tr className="checkout-summary-row">
        <td>
          <button
            className="checkout-group__toggle"
            type="button"
            aria-expanded={expanded}
            aria-controls={`checkout-members-${group.id}`}
            onClick={onToggle}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>
              <strong>
                {group.members.length} vehicles · {group.customer.name}
              </strong>
              <small>Checkout {group.id}</small>
            </span>
          </button>
        </td>
        <td>
          <strong>{vehicleNames.join(', ')}</strong>
          <small>{group.members.length} individual booking references</small>
        </td>
        <td>
          <span>{formatTime(first.starts_at)}</span>
          <small>to {formatTime(first.ends_at)}</small>
          <small>Duration: {rentalDuration(first.starts_at, first.ends_at)}</small>
        </td>
        <td>
          <span className="source-badge">{first.source}</span>
        </td>
        <td>
          <span className="checkout-group__payment-state">
            {paymentLabels[group.checkout.paymentState]}
          </span>
          <small>{group.members.map((member) => member.status).join(' · ')}</small>
        </td>
        <td>
          <strong>{money(group.checkout.totalPayable)}</strong>
          <small>Paid: {money(group.checkout.amountPaid)}</small>
          <small>Outstanding: {money(group.checkout.outstanding)}</small>
          <small>Deposits booked: {money(group.checkout.securityDeposit)}</small>
          <small>Refundable deposit: {money(group.checkout.refundableDeposit)}</small>
          {group.checkout.amountRefunded > 0 && (
            <small>Refunded: {money(group.checkout.amountRefunded)}</small>
          )}
        </td>
        <td>
          <button
            className="table-action"
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide vehicles' : 'View vehicles'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="checkout-details-row">
          <td colSpan={7}>
            <div id={`checkout-members-${group.id}`}>
              <CheckoutMembers group={group} bookings={bookings} onSelect={onSelect} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function BookingTable({ bookings, onSelect, grouped = false }) {
  const [expandedCheckout, setExpandedCheckout] = useState(null);
  const entries = grouped
    ? groupBookingRows(bookings)
    : bookings.map((booking) => ({ type: 'booking', booking }));
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Bookings table; scroll horizontally for more columns"
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th>Booking / customer</th>
            <th>Vehicle</th>
            <th>Schedule · IST</th>
            <th>Source</th>
            <th>Status / payment</th>
            <th>Financial summary</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) =>
            entry.type === 'checkout' ? (
              <CheckoutRow
                key={`checkout-${entry.id}`}
                group={entry}
                bookings={bookings}
                onSelect={onSelect}
                expanded={expandedCheckout === entry.id}
                onToggle={() =>
                  setExpandedCheckout((current) => (current === entry.id ? null : entry.id))
                }
              />
            ) : (
              <BookingRow key={entry.booking.id} booking={entry.booking} onSelect={onSelect} />
            ),
          )}
        </tbody>
      </table>
      {!entries.length && <div className="empty-state">No bookings match your filters.</div>}
    </div>
  );
}
