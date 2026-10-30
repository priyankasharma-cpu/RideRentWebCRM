import { Link } from 'react-router-dom';
import './Logo.css';
export function Logo() {
  return (
    <Link className="brand" to="/" aria-label="RideRent home">
      <svg viewBox="0 0 78 46" fill="none" aria-hidden="true">
        <path
          d="M5 31C23 25 28 6 69 10C45-2 21 8 12 16C34 7 50 10 54 16C30 13 25 29 5 31Z"
          fill="#4abaff"
        />
        <path d="M0 42C21 38 33 23 55 24L48 39H63L72 16C43 7 22 35 0 42Z" fill="#087bff" />
      </svg>
      <span>
        <strong>
          RideRent<span className="brand-dot">.</span>
        </strong>
        <small>BIKES · SCOOTERS · CARS</small>
      </span>
    </Link>
  );
}
