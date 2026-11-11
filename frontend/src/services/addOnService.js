import { api } from './apiClient.js';
export const addOnService = {
  save: (value) =>
    api('/admin/addons' + (value.id ? '/' + value.id : ''), {
      method: value.id ? 'PUT' : 'POST',
      body: value,
    }),
  archive: (value) =>
    api('/admin/addons/' + value.id + '/archive', {
      method: 'POST',
      body: { version: value.version },
    }),
};
