import { api } from './apiClient';
export const vehicleService = {
  list: (query = '', signal) =>
    api(`/vehicles${query}`, {
      signal,
    }),
  get: (identifier, signal) =>
    api(`/vehicles/${encodeURIComponent(identifier)}`, {
      signal,
    }),
};
