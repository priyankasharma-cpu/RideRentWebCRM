import '../components/EditorForm.css';
import '../components/BookingTable.css';
import '../components/AdminPanels.css';
import '../components/DataTable.css';
import '../components/Filters.css';
import '../../components/booking/BookingFacts.css';
import { useApp } from '../../hooks/useApp.js';
import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar.jsx';
import { AdminHeader } from '../components/AdminHeader.jsx';
import './AdminLayout.css';
export function AdminLayout() {
  const { user, logout } = useApp(),
    [open, setOpen] = useState(false),
    [compact, setCompact] = useState(false),
    location = useLocation();
  useEffect(() => {
    const resize = () => {
      if (innerWidth <= 1000) setCompact(false);
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className={'admin-app ' + (compact ? 'collapsed' : '')}>
      <AdminSidebar open={open} user={user} logout={logout} />
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-main">
        <AdminHeader
          setOpen={setOpen}
          open={open}
          setCompact={setCompact}
          compact={compact}
          location={location}
          user={user}
        />
        <main className="admin-content">
          <Outlet />
        </main>
        <div className="admin-footer">
          RideRent Operations <span>India Standard Time · INR · Sample fleet</span>
        </div>
      </div>
    </div>
  );
}
