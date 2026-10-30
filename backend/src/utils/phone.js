export const phone = (s) => s.replace(/[^0-9]/g, '').replace(/^91(?=\d{10}$)/, '');
