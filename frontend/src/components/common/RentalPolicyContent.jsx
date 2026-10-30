import './PolicyContent.css';
import { useApp } from '../../hooks/useApp.js';
import './RentalPolicyContent.css';
export function RentalPolicyContent() {
  const { config } = useApp();
  return (
    <div className="policy-copy rr-panel">
      <h3>Eligibility & verification</h3>
      <p>
        18+ and a valid driving license appropriate to the rented vehicle. License verification is
        recorded by staff before pickup. A government ID must be shown at the shop.
      </p>
      <h3>Pricing & deposit</h3>
      <p>
        Duration rounds up to the next {config?.roundingMinutes}-minute block. Tax rate:{' '}
        {(config?.taxBps || 0) / 100}%. Security deposits are shown separately in your quote.
        Pay-at-shop only.
      </p>
      <h3>Fuel & distance</h3>
      <p>{config?.fuelPolicy}</p>
      <p>{config?.distancePolicy}</p>
      <h3>Changes & cancellation</h3>
      <p>
        Online changes are allowed until {config?.cancellationHours} hours before scheduled pickup,
        subject to availability. Contact the shop after this cutoff. Paid cancelled bookings are
        reviewed and refunded by staff.
      </p>
      <h3>Late return & damage</h3>
      <p>
        A {config?.lateGraceMinutes}-minute grace period applies. After it, each started additional
        hour is charged at your historical hourly rate. Inspection records capture condition, fuel
        and odometer. Any additional charges are itemized by staff.
      </p>
      <h3>Deposit refund</h3>
      <p>
        After return inspection and settlement, staff close the rental and record your deposit
        refund. No automatic online transfer occurs.
      </p>
    </div>
  );
}
