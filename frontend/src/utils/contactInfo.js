import { getShopPhone } from '../config/siteConfig.js';
export function contactInfo(config) {
  const phone = getShopPhone(config);
  const email = typeof config?.email === 'string' ? config.email.trim() : '';
  const address = typeof config?.address === 'string' ? config.address.trim() : '';
  return {
    phone,
    canCall: /^[+\d ()-]+$/.test(phone.tel) && phone.tel.replace(/\D/g, '').length >= 7,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '',
    address,
  };
}
