import { getSessionAndUser } from '../modules/auth/session.service.js';
import { getCustomerAccessSession } from '../modules/bookings/customerAccess.service.js';
export const authenticate = (database) => async (req, _res, next) => {
  const result = await getSessionAndUser(database, req.cookies.rr_session);
  req.session = result.session;
  req.user = result.user;
  try {
    req.customerAccess = await getCustomerAccessSession(database, req.cookies.rr_customer_access);
  } catch (error) {
    next(error);
    return;
  }
  next();
};
export function requireStaff(req, res, next) {
  if (!req.user)
    return res.status(401).json({
      error: 'Please sign in to the admin panel.',
    });
  next();
}
