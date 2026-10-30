import { useSavedVehicles } from '../hooks/useSavedVehicles';
import { useVehicles } from '../hooks/useVehicles';
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { defaultPeriod, shopInput } from '../utils/rentalTime';
const HomeContext = createContext(null);
export function HomePageProvider({ children }) {
  const navigate = useNavigate();
  const { data: fleet, error: fleetError, loading } = useVehicles();
  const initial = defaultPeriod(),
    today = shopInput(Date.now()).slice(0, 10);
  const [category, setCategory] = useState('Bike'),
    [filter, setFilter] = useState('All'),
    [date, setDate] = useState(initial.startsAt.slice(0, 10)),
    [returnDate, setReturnDate] = useState(initial.endsAt.slice(0, 10)),
    [pickup, setPickup] = useState(initial.startsAt.slice(11)),
    [dropoff, setDropoff] = useState(initial.endsAt.slice(11)),
    [error, setError] = useState(''),
    [offset, setOffset] = useState(0);
  const saved = useSavedVehicles().saved;
  const visible = [...(fleet || [])]
    .sort((a, b) => b.rentalCount - a.rentalCount)
    .filter(
      (v) => filter === 'All' || (filter === 'Saved' && saved.includes(v.id)) || v.type === filter,
    );
  const ordered = [
    ...visible.slice(offset % Math.max(visible.length, 1)),
    ...visible.slice(0, offset % Math.max(visible.length, 1)),
  ].slice(0, 5);
  const search = (e) => {
    e.preventDefault();
    if (
      new Date(date + 'T' + pickup + '+05:30') >= new Date(returnDate + 'T' + dropoff + '+05:30')
    ) {
      setError('Return time must be after pickup.');
      return;
    }
    navigate(
      '/vehicles?' +
        new URLSearchParams({
          category,
          startsAt: date + 'T' + pickup,
          endsAt: returnDate + 'T' + dropoff,
        }),
    );
  };
  return (
    <HomeContext.Provider
      value={{
        navigate,
        fleet,
        fleetError,
        loading,
        today,
        category,
        setCategory,
        filter,
        setFilter,
        date,
        setDate,
        returnDate,
        setReturnDate,
        pickup,
        setPickup,
        dropoff,
        setDropoff,
        error,
        offset,
        setOffset,
        saved,
        visible,
        ordered,
        search,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}
export const useHomePage = () => useContext(HomeContext);
