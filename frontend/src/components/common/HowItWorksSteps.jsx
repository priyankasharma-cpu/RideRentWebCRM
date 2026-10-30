import './HowItWorksSteps.css';
export function HowItWorksSteps() {
  return (
    <div className="how-grid">
      {[
        [
          '01',
          'Choose your ride',
          'Browse bikes, scooters and cars. Use category, price and transmission filters.',
        ],
        [
          '02',
          'Choose your hours',
          'Enter pickup and return times in India time. Availability is checked live.',
        ],
        [
          '03',
          'Confirm your booking',
          'Add your contact details and accept the rental agreement. Keep your unique reference.',
        ],
        [
          '04',
          'Pick up & ride',
          'Bring your license, ID and deposit. Pay at the shop and get ready to go.',
        ],
      ].map(([n, t, d]) => (
        <div className="rr-panel" key={n}>
          <em>{n}</em>
          <h3>{t}</h3>
          <p>{d}</p>
        </div>
      ))}
    </div>
  );
}
