import './PolicyContent.css';
import { useApp } from '../../hooks/useApp.js';
export function PrivacyContent() {
  const { config } = useApp();
  return (
    <div className="policy-copy rr-panel">
      <h3>What we store</h3>
      <p>
        Name, mobile number, optional email, booking dates, vehicle, charges, payment records and
        staff verification status. Staff actions are audit logged.
      </p>
      <h3>Access & storage</h3>
      <p>
        Administrator sessions use HTTP-only cookies. Booking access uses your reference and phone
        number. The local database is stored on the agency machine. Do not enter real identity
        documents in this demo.
      </p>
      <h3>Contact & retention</h3>
      <p>
        Contact {config?.email} for correction or deletion requests. The operating agency must
        define its retention period and review this draft policy before production launch.
      </p>
    </div>
  );
}
