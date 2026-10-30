import {
  listVehicleRecordsVariant3,
  listRefundRecords,
  listRentalRecords,
} from './analytics.repository.js';
import { listBookingViews } from '../bookings/booking.read.service.js';
import { vehicleViews } from '../vehicles/vehicle.presenter.js';
import { settings } from '../settings/settings.service.js';
import { now } from '../../utils/dateTime.js';
export async function getDashboard(db, _request) {
  return await dashboard(db);
}
export async function dashboard(db) {
  const views = await listBookingViews(db);
  const bookings = views;
  const vehicles = await vehicleViews(db, await listVehicleRecordsVariant3(db));
  const s = await settings(db);
  const day = (d) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: s.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(d));
  const today = day(now());
  const receipts = await listRefundRecords(db);
  const net = (p) => p.amount - p.refunded;
  const daily = Array.from(
    {
      length: 30,
    },
    (_, i) => {
      const date = day(Date.now() - (29 - i) * 86400000);
      return {
        date,
        revenue:
          receipts.filter((p) => day(p.created_at) === date).reduce((a, p) => a + net(p), 0) / 100,
        bookings: bookings.filter((b) => day(b.created_at) === date).length,
      };
    },
  );
  const rentalRows = await listRentalRecords(db);
  const horizon = 30 * 86400000,
    currentMs = Date.now();
  const occupied = (v) =>
    rentalRows
      .filter((r) => r.vehicle_id === v.id)
      .reduce(
        (sum, r) =>
          sum +
          Math.max(
            0,
            Math.min(currentMs, new Date(r.return_at || now()).getTime()) -
              Math.max(currentMs - horizon, new Date(r.pickup_at).getTime()),
          ),
        0,
      );
  const chargeable = views.filter((b) => b.status !== 'cancelled');
  return {
    kpis: {
      averageBookingValue: chargeable.length
        ? Math.round(chargeable.reduce((a, b) => a + b.rentalTotal, 0) / chargeable.length)
        : 0,
      totalRentalReceipts: receipts.reduce((a, p) => a + net(p), 0),
      totalVehicles: vehicles.length,
      available: vehicles.filter((v) => v.physicalStatus === 'Available').length,
      reserved: vehicles.filter((v) => v.physicalStatus === 'Reserved').length,
      rented: vehicles.filter((v) => ['Rented', 'Overdue'].includes(v.physicalStatus)).length,
      maintenance: vehicles.filter((v) => v.physicalStatus === 'Maintenance').length,
      inspection: vehicles.filter((v) => v.physicalStatus === 'Inspection').length,
      overdue: views.filter((b) => b.overdue).length,
      todayBookings: bookings.filter((b) => day(b.created_at) === today).length,
      todayPickups: views.filter((b) => b.rental && day(b.rental.pickup_at) === today).length,
      todayReturns: views.filter((b) => b.rental?.return_at && day(b.rental.return_at) === today)
        .length,
      todayRevenue: receipts
        .filter((p) => day(p.created_at) === today)
        .reduce((a, p) => a + net(p), 0),
      monthlyRevenue: receipts
        .filter((p) => day(p.created_at).slice(0, 7) === today.slice(0, 7))
        .reduce((a, p) => a + net(p), 0),
      outstanding: views.reduce((a, b) => a + b.outstanding, 0),
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      totalBookings: bookings.length,
    },
    daily,
    categories: ['Bike', 'Scooter', 'Car'].map((category) => ({
      name: category,
      value: vehicles.filter((v) => v.category === category).length,
      revenue: views
        .filter((b) => b.vehicle.category === category)
        .reduce((a, b) => a + b.rentalPaid, 0),
    })),
    statuses: ['confirmed', 'active', 'inspecting', 'completed', 'cancelled'].map((status) => ({
      name: status,
      value: bookings.filter((b) => b.status === status).length,
    })),
    utilization: vehicles
      .map((v) => ({
        name: v.name,
        occupiedHours: Math.round((occupied(v) / 3600000) * 100) / 100,
        utilizationPercent: Math.round((occupied(v) / horizon) * 10000) / 100,
        bookings: bookings.filter((b) => b.vehicle_id === v.id && b.status !== 'cancelled').length,
        revenue:
          views.filter((b) => b.vehicle_id === v.id).reduce((a, b) => a + b.rentalPaid, 0) / 100,
      }))
      .sort((a, b) => b.bookings - a.bookings),
    recent: views.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6),
  };
}
