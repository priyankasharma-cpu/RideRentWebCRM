import { api } from './apiClient.js';
export const contactService = { submit: (body) => api('/contact', { method: 'POST', body }) };
