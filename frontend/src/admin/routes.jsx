import { lazy } from 'react';
import { useApp } from '../hooks/useApp.js';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { Loading } from '../components/common/Loader.jsx';
const ActiveRentals = lazy(() => import('./pages/ActiveRentals'));
const Returns = lazy(() => import('./pages/Returns'));
const Dashboard = lazy(() =>
  import('./pages/Dashboard.jsx').then((module) => ({
    default: module.Dashboard,
  })),
);
const VehicleManagement = lazy(() =>
  import('./pages/VehicleManagement.jsx').then((module) => ({
    default: module.VehicleManagement,
  })),
);
const Availability = lazy(() =>
  import('./pages/FleetAvailability.jsx').then((module) => ({
    default: module.Availability,
  })),
);
const BookingManagement = lazy(() =>
  import('./pages/BookingManagement.jsx').then((module) => ({
    default: module.BookingManagement,
  })),
);
const CreateBooking = lazy(() =>
  import('./pages/CreateBooking.jsx').then((module) => ({
    default: module.CreateBooking,
  })),
);
const Customers = lazy(() =>
  import('./pages/Customers.jsx').then((module) => ({
    default: module.Customers,
  })),
);
const Payments = lazy(() =>
  import('./pages/Payments.jsx').then((module) => ({
    default: module.Payments,
  })),
);
const Maintenance = lazy(() =>
  import('./pages/Maintenance.jsx').then((module) => ({
    default: module.Maintenance,
  })),
);
const Analytics = lazy(() =>
  import('./pages/Analytics.jsx').then((module) => ({
    default: module.Analytics,
  })),
);
const Staff = lazy(() =>
  import('./pages/Staff.jsx').then((module) => ({
    default: module.Staff,
  })),
);
const Settings = lazy(() =>
  import('./pages/Settings.jsx').then((module) => ({
    default: module.Settings,
  })),
);
const AdminLogin = lazy(() =>
  import('./pages/Login.jsx').then((module) => ({
    default: module.AdminLogin,
  })),
);
export default function AdminRoutes() {
  const { user } = useApp();
  return (
    <Routes>
      <Route element={<ProtectedAdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route
            path="vehicles"
            element={user?.role === 'admin' ? <VehicleManagement /> : <Navigate to="/admin" />}
          />
          <Route path="availability" element={<Availability />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="active-rentals" element={<ActiveRentals />} />
          <Route path="returns" element={<Returns />} />
          <Route path="create-booking" element={<CreateBooking />} />
          <Route path="customers" element={<Customers />} />
          <Route path="payments" element={<Payments />} />
          <Route
            path="maintenance"
            element={user?.role === 'admin' ? <Maintenance /> : <Navigate to="/admin" />}
          />
          <Route path="analytics" element={<Analytics />} />
          <Route
            path="staff"
            element={user?.role === 'admin' ? <Staff /> : <Navigate to="/admin" />}
          />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
function ProtectedAdminRoute() {
  const { user, ready } = useApp();
  if (!ready) return <Loading />;
  return user ? <Outlet /> : <AdminLogin />;
}
