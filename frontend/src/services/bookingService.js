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
  requestAccessCode: (values) =>
    api('/bookings/access/request', {
      method: 'POST',
      body: values,
    }),
  verifyAccessCode: (values) =>
    api('/bookings/access/verify', {
      method: 'POST',
      body: values,
    }),
  get: (id, _legacyToken, signal) =>
    api(`/bookings/${id}`, {
      signal,
    }),
};
