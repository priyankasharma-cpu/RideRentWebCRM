import { api, loadSession } from './apiClient';
export const authService = {
  session: loadSession,
  login: (values) =>
    api('/login', {
      method: 'POST',
      body: values,
    }),
  logout: () =>
    api('/logout', {
      method: 'POST',
    }),
};
