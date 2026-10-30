import { api } from './apiClient';
export const bookingService = {
  quote: (values, signal) =>
    api('/quote', {
      method: 'POST',
      body: values,
      signal,
    }),
  create: (values) =>
    api('/bookings', {
      method: 'POST',
      body: values,
    }),
  lookup: (values) =>
    api('/bookings/lookup', {
      method: 'POST',
      body: values,
    }),
  get: (id, token, signal) =>
    api(`/bookings/${id}`, {
      token,
      signal,
    }),
};
