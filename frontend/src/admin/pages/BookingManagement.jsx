import { SearchField } from '../components/SearchField.jsx';
import { Filters } from '../components/Filters.jsx';
import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { PageTitle } from '../components/PageTitle.jsx';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import { BookingTable } from '../components/BookingTable.jsx';
import { BookingManager } from '../features/bookings/BookingManager.jsx';
import { RentalDeadlineAlert } from '../features/bookings/RentalDeadlineAlert.jsx';
export function BookingManagement({ mode }) {
  const { data, error, loading, reload } = useResource('/admin/bookings', 10000);
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('All'),
    [source, setSource] = useState('All'),
    [selected, setSelected] = useState(null);
  const matches = (data || []).filter(
    (b) =>
      (!mode ||
        (mode === 'active' && b.status === 'active') ||
        (mode === 'returns' && ['active', 'inspecting'].includes(b.status))) &&
      (status === 'All' ||
        (status === 'Overdue' && b.overdue) ||
        (status === 'Expired' && b.rentalState === 'expired') ||
        b.status === status) &&
      (source === 'All' || b.source === source) &&
      `${b.reference} ${b.customer.name} ${b.customer.phone} ${b.vehicle.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const matchingCheckoutIds = new Set(
    matches.map((booking) => booking.checkout?.id).filter(Boolean),
  );
  const rows = mode
    ? matches
    : (data || []).filter(
        (booking) =>
          (booking.checkout?.bookings.length > 1 && matchingCheckoutIds.has(booking.checkout.id)) ||
          (!booking.checkout?.bookings.length && matches.some((match) => match.id === booking.id)),
      );
  const visibleCheckoutCount = new Set(rows.map((booking) => booking.checkout?.id).filter(Boolean))
    .size;
  const visibleStandaloneCount = rows.filter(
    (booking) => !booking.checkout?.bookings.length,
  ).length;
  return (
    <>
      <PageTitle
        title={
          mode === 'active'
            ? 'Out on the road.'
            : mode === 'returns'
              ? 'A smooth return, every time.'
              : 'Every booking. Every journey.'
        }
        subtitle="Website, phone and walk-in reservations — together in one place."
      >
        <Link className="rr-button" to="/admin/create-booking">
          <Plus size={16} /> New Booking
        </Link>
      </PageTitle>
      <ErrorBox>{error}</ErrorBox>
      <RentalDeadlineAlert bookings={data || []} onShow={() => setStatus('Overdue')} />
      <Filters>
        <SearchField
          aria-label="Search bookings"
          placeholder="Search name, phone, reference, vehicle…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconSize={16}
        />
        <select
          aria-label="Filter booking status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {[
            'All',
            'confirmed',
            'active',
            'Overdue',
            'Expired',
            'inspecting',
            'completed',
            'cancelled',
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter booking source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {['All', 'Website', 'Phone', 'Walk-in', 'Other'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span>
          {mode
            ? `${rows.length} bookings`
            : `${visibleCheckoutCount} checkouts · ${visibleStandaloneCount} individual bookings`}
        </span>
      </Filters>
      {loading ? (
        <Loading />
      ) : (
        <section className="rr-panel table-panel">
          <BookingTable bookings={rows} onSelect={setSelected} grouped={!mode} />
        </section>
      )}
      {selected && (
        <BookingManager initial={selected} onClose={() => setSelected(null)} onChanged={reload} />
      )}
    </>
  );
}
