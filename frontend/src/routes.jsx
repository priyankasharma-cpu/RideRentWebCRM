import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { Loading } from './components/common/Loader';
const Home = lazy(() =>
  import('./pages/Home').then((m) => ({
    default: m.default,
  })),
);
const Vehicles = lazy(() =>
  import('./pages/Vehicles').then((m) => ({
    default: m.Vehicles,
  })),
);
const VehicleDetails = lazy(() =>
  import('./pages/VehicleDetails').then((m) => ({
    default: m.VehicleDetails,
  })),
);
const Checkout = lazy(() =>
  import('./pages/Checkout').then((m) => ({
    default: m.Checkout,
  })),
);
const BookingConfirmation = lazy(() =>
  import('./pages/BookingConfirmation').then((m) => ({
    default: m.BookingConfirmation,
  })),
);
const MyBookings = lazy(() =>
  import('./pages/MyBookings').then((m) => ({
    default: m.MyBookings,
  })),
);
const NotFound = lazy(() =>
  import('./pages/NotFound').then((m) => ({
    default: m.NotFound,
  })),
);
const About = lazy(() =>
  import('./pages/About').then((m) => ({
    default: m.default,
  })),
);
const Contact = lazy(() =>
  import('./pages/Contact').then((m) => ({
    default: m.default,
  })),
);
const HowItWorks = lazy(() =>
  import('./pages/HowItWorks').then((m) => ({
    default: m.default,
  })),
);
const FAQ = lazy(() =>
  import('./pages/FAQ').then((m) => ({
    default: m.default,
  })),
);
const RentalPolicy = lazy(() =>
  import('./pages/RentalPolicy').then((m) => ({
    default: m.default,
  })),
);
const PrivacyPolicy = lazy(() =>
  import('./pages/PrivacyPolicy').then((m) => ({
    default: m.default,
  })),
);
const Terms = lazy(() =>
  import('./pages/Terms').then((m) => ({
    default: m.default,
  })),
);
const Login = lazy(() =>
  import('./pages/Login').then((m) => ({
    default: m.default,
  })),
);
const Profile = lazy(() =>
  import('./pages/Profile').then((m) => ({
    default: m.default,
  })),
);
const Admin = lazy(() => import('./admin/routes'));
export function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:slug" element={<VehicleDetails />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="booking/confirmation/:id" element={<BookingConfirmation />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="my-bookings/:id" element={<BookingConfirmation />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="rental-policy" element={<RentalPolicy />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="login" element={<Login />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/*" element={<Admin />} />
      </Routes>
    </Suspense>
  );
}
