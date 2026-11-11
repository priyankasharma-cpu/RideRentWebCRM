import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { defaultVehicleFilters } from '../config/vehicleFilterConfig.js';
import { periodFromParams, validateRentalPeriod } from '../utils/rentalTime.js';

function rentalSearch(params) {
  if (!params.has('startsAt') && !params.has('endsAt'))
    return { query: '', period: undefined, error: '' };
  const period = periodFromParams(params);
  const { window, error } = validateRentalPeriod(period);
  if (error) {
    return {
      query: '',
      period: undefined,
      error,
    };
  }
  return { query: '?' + new URLSearchParams(window), period, error: '' };
}

export function useVehicleListing() {
  const [params, setParams] = useSearchParams();
  const startsAt = params.get('startsAt'),
    endsAt = params.get('endsAt');
  const urlCategory = params.get('category') || 'All';
  const [period, setPeriod] = useState(() => periodFromParams(params));
  const [filters, setFilters] = useState(() => ({
    ...defaultVehicleFilters,
    category: urlCategory,
    onlyAvailable: Boolean(startsAt && endsAt),
  }));
  const [sort, setSort] = useState('recommended');
  const [searchError, setSearchError] = useState('');
  const applied = rentalSearch(params);

  useEffect(() => {
    setPeriod(
      periodFromParams(
        new URLSearchParams({ ...(startsAt ? { startsAt } : {}), ...(endsAt ? { endsAt } : {}) }),
      ),
    );
    setFilters((current) => ({ ...current, onlyAvailable: Boolean(startsAt && endsAt) }));
    setSearchError('');
  }, [startsAt, endsAt]);
  useEffect(() => {
    setFilters((current) => ({ ...current, category: urlCategory }));
  }, [urlCategory]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    if (key === 'category') {
      const next = new URLSearchParams(params);
      if (value === 'All') next.delete('category');
      else next.set('category', value);
      setParams(next, { replace: true });
    }
  }
  function resetFilters() {
    setFilters({ ...defaultVehicleFilters });
    const next = new URLSearchParams(params);
    next.delete('category');
    setParams(next, { replace: true });
  }
  function search(event) {
    event.preventDefault();
    try {
      const { error } = validateRentalPeriod(period);
      if (error) throw Error(error);
      const next = new URLSearchParams(params);
      next.set('startsAt', period.startsAt);
      next.set('endsAt', period.endsAt);
      setSearchError('');
      setFilters((current) => ({ ...current, onlyAvailable: true }));
      setParams(next);
    } catch (error) {
      setSearchError(error.message);
    }
  }
  return {
    filters,
    updateFilter,
    resetFilters,
    sort,
    setSort,
    period,
    setPeriod,
    search,
    searchError: searchError || applied.error,
    apiQuery: applied.query,
    appliedPeriod: applied.period,
    periodChanged: Boolean(
      applied.period &&
      (period.startsAt !== applied.period.startsAt || period.endsAt !== applied.period.endsAt),
    ),
  };
}
