import { Navigate, useLocation } from 'react-router-dom';

// Older bookmarks now use the same checkout opened by vehicle-card Book Now buttons.
export default function Booking() {
  const { search } = useLocation();
  return <Navigate to={'/checkout' + search} replace />;
}
