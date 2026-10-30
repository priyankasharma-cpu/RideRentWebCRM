import { transaction } from '../../config/database.js';
import {
  listCustomerRecords,
  findCustomerById,
  updateCustomerByVerifiedAndId,
  updateBookingContactByVerifiedAndCustomerId,
} from './customer.repository.js';
import { listBookingViews } from '../bookings/booking.read.service.js';
import { fail } from '../../utils/ApiError.js';
import { audit } from '../audit/audit.service.js';
export async function listCustomers(db, _request) {
  const [customers, bookings] = await Promise.all([listCustomerRecords(db), listBookingViews(db)]);
  return customers.map((customer) => ({
    ...customer,
    bookings: bookings.filter((booking) => booking.customer_id === customer.id),
  }));
}
export async function verifyCustomer(db, request) {
  return transaction(db, async () => {
    const v = request.body;
    if (!(await findCustomerById(db, request.params.id))) fail(404, 'Customer not found.');
    await updateCustomerByVerifiedAndId(db, v.verified ? 1 : 0, request.params.id);
    await updateBookingContactByVerifiedAndCustomerId(db, v.verified ? 1 : 0, request.params.id);
    await audit(db, request.user.id, 'customer.verification_updated', request.params.id, v);
    return {
      ok: true,
    };
  });
}
