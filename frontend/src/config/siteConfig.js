export const siteConfig = {
  name: 'RideRent',
  phone: {
    tel: '+919876543210',
    display: '+91 98765 43210',
    placeholder: true,
  },
  footer: {
    tagline: 'Your Journey, Your Freedom.',
    description:
      'Bikes, scooters and cars for the way you move. Flexible hourly rentals for everyday plans and weekend escapes.',
    callLabel: 'Call Now',
    contactPrompt: 'Let’s find your next ride.',
    demoLabel: 'Demo number',
    socialLabel: 'Connect with RideRent',
    copyright: 'All rights reserved.',
    disclosure: 'Demo fleet & illustrative photos',
  },
  categories: ['Bike', 'Scooter', 'Car'],
  pollingInterval: 15_000,
  quoteDebounceMs: 250,
};

// Shop settings are authoritative; the shared fallback stays visibly marked as a demo number.
export function getShopPhone(shop) {
  const configuredTel = shop?.phoneTel?.trim();
  if (!configuredTel) return { ...siteConfig.phone };
  return {
    tel: configuredTel,
    display: shop.phoneDisplay?.trim() || configuredTel,
    placeholder: Boolean(shop.phonePlaceholder),
  };
}
