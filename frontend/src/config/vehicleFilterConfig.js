export const vehicleFilterConfig = {
  categories: ['All', 'Bike', 'Scooter', 'Car'],
  transmissions: ['All', 'Manual', 'Automatic'],
  fuels: ['All', 'Petrol', 'Diesel', 'Electric', 'Hybrid'],
  price: { min: 50, max: 1000, step: 10 },
};
export const defaultVehicleFilters = {
  query: '',
  category: 'All',
  trans: 'All',
  fuel: 'All',
  max: vehicleFilterConfig.price.max,
  onlyAvailable: false,
};
export const vehicleSortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'low', label: 'Price: Low to High' },
  { value: 'high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];
