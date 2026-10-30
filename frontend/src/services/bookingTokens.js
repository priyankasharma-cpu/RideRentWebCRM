export const saveBookingToken = (id, token) => sessionStorage.setItem('rr-booking-' + id, token);
export const bookingToken = (id) => sessionStorage.getItem('rr-booking-' + id) || '';
