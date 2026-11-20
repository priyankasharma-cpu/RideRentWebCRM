import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { api } from '../services/apiClient.js';
import { validateRentalPeriod } from '../utils/rentalTime.js';
import {
  verifiedCheckoutSelections,
  checkoutAddOnSelections,
} from '../utils/checkoutSelections.js';
import { useFreshQuote } from './useFreshQuote.js';

const requestQuote = (body, signal) => api('/checkout/quote', { method: 'POST', body, signal });
export function useCheckout(period, selections, addOnQuantities) {
  const { window, error: periodError } = validateRentalPeriod(period);
  const catalog = useQuery({
    queryKey: ['checkout-catalog', window?.startsAt, window?.endsAt],
    enabled: Boolean(window),
    queryFn: ({ signal }) => api('/checkout/catalog?' + new URLSearchParams(window), { signal }),
    staleTime: 0,
    refetchInterval: 30000,
    retry: false,
  });
  // A background availability refresh should not temporarily clear a valid selection.
  const verified = Boolean(window && catalog.isSuccess);
  const previousCatalog = useRef();
  useEffect(() => {
    if (catalog.data) previousCatalog.current = catalog.data;
  }, [catalog.data]);
  const presentationCatalog = catalog.data || previousCatalog.current;
  const rows = verifiedCheckoutSelections(selections, catalog.data?.models, verified);
  const displayRows = verified
    ? rows
    : selections.map((selection) => ({
        vehicleId: selection.vehicleId,
        quantity:
          selection.quantity === null
            ? verifiedCheckoutSelections(
                [selection],
                presentationCatalog?.models,
                Boolean(presentationCatalog),
              )[0].quantity
            : selection.quantity,
      }));
  const addOnRows = checkoutAddOnSelections(
    presentationCatalog?.addOns,
    addOnQuantities,
    verified ? rows : displayRows,
    presentationCatalog?.models,
    verified,
  );
  const addOns = addOnRows
    .filter((row) => row.paidQuantity > 0)
    .map((row) => ({ addOnId: row.option.id, quantity: row.paidQuantity }));
  const validSelection = verified && rows.length > 0 && rows.every((row) => row.quantity > 0);
  const items = rows.filter((row) => row.quantity > 0);
  const result = useFreshQuote(
    'checkout-quote',
    { ...window, items, addOns },
    validSelection,
    requestQuote,
  );
  return {
    catalog: presentationCatalog,
    verified,
    rows,
    displayRows,
    addOnRows,
    addOns,
    items,
    loading: Boolean(window && catalog.isFetching),
    quote: result.quote,
    error: periodError || catalog.error?.message || result.error,
    quoteLoading: result.loading,
    canRetry: Boolean(window),
    refresh: () => {
      if (window) return catalog.refetch();
    },
  };
}
