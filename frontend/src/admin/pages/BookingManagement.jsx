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
export function BookingManagement({ mode }) {
  const { data, error, loading, reload } = useResource('/admin/bookings', 10000);
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('All'),
    [source, setSource] = useState('All'),
    [selected, setSelected] = useState(null);
  const rows = (data || []).filter(
    (b) =>
      (!mode ||
        (mode === 'active' && b.status === 'active') ||
        (mode === 'returns' && ['active', 'inspecting'].includes(b.status))) &&
      (status === 'All' || (status === 'Overdue' && b.overdue) || b.status === status) &&
      (source === 'All' || b.source === source) &&
      `${b.reference} ${b.customer.name} ${b.customer.phone} ${b.vehicle.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
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
          {['All', 'confirmed', 'active', 'Overdue', 'inspecting', 'completed', 'cancelled'].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
        <select
          aria-label="Filter booking source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {['All', 'Website', 'Phone', 'Walk-in'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span>{rows.length} bookings</span>
      </Filters>
      {loading ? (
        <Loading />
      ) : (
        <section className="rr-panel table-panel">
          <BookingTable bookings={rows} onSelect={setSelected} />
        </section>
      )}
      {selected && (
        <BookingManager initial={selected} onClose={() => setSelected(null)} onChanged={reload} />
      )}
    </>
  );
}
