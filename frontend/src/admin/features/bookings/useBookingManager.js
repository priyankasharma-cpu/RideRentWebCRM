import { useState } from 'react';
import { useAdminAction } from '../../hooks/useAdminAction.js';
import { useApp } from '../../../hooks/useApp.js';
import { api } from '../../../services/apiClient.js';
export function useBookingManager(initial, onChanged) {
  const [booking, setBooking] = useState(initial),
    [action, setAction] = useState(''),
    { error, busy, execute } = useAdminAction(onChanged);
  const { user } = useApp();
  const update = async (path, body) => {
    const result = await execute(() =>
      api('/admin/bookings/' + booking.id + path, {
        method: 'POST',
        body,
      }),
    );
    if (result) {
      setBooking(result);
      setAction('');
    }
  };
  const statusAction = async (path, body) => {
    const result = await execute(() =>
      api('/bookings/' + booking.id + path, {
        method: 'POST',
        body,
      }),
    );
    if (result) {
      setBooking(result);
      setAction('');
    }
  };
  const submitInspection = (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    update('/' + action, {
      ...values,
      odometer: Number(values.odometer),
      ...(action === 'return'
        ? {
            additional: Math.round(Number(values.additional || 0) * 100),
          }
        : {}),
    });
  };
  return {
    booking,
    setBooking,
    action,
    setAction,
    error,
    busy,
    execute,
    user,
    update,
    statusAction,
    submitInspection,
  };
}
