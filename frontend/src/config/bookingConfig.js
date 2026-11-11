export const bookingConfig = {
  draftStorageKey: 'rr-booking-cart-v1',
  // A client UI safeguard, not a substitute for server inventory validation.
  maxVehiclesPerCart: 10,
  categories: ['All', 'Bike', 'Scooter', 'Car'],
  addOns: [
    {
      id: 'additional-helmets',
      name: 'Additional helmets',
      categories: ['Bike', 'Scooter'],
      enabled: false,
      unitPricePaise: null,
      maxQuantity: null,
      includedQuantity: null,
      description: 'Ask the shop about included helmets, extra quantities and rental charges.',
    },
  ],
};
