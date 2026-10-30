import { Logo } from '../../components/common/Logo.jsx';
import { links } from '../../config/adminNavigation.js';
import { NavLink, Link } from 'react-router-dom';
import { Plus, ShieldCheck, ArrowUpRight, LogOut } from 'lucide-react';
import './AdminSidebar.css';
export function AdminSidebar({ open, user, logout }) {
  return (
    <aside className={'admin-sidebar ' + (open ? 'open' : '')}>
      <Logo />
      <div className="workspace-label">
        <span className="workspace-icon">R</span>
        <div>
          RideRent Studio<small>Rental management</small>
        </div>
        <span className="live-dot" />
      </div>
      <div className="sidebar-caption">WORKSPACE</div>
      <nav>
        {links
          .filter(
            ([name]) =>
              user.role === 'admin' || !['Vehicles', 'Maintenance', 'Staff & Roles'].includes(name),
          )
          .map(([name, path, Icon]) => (
            <NavLink
              key={name}
              to={'/admin' + (path ? '/' + path : '')}
              aria-label={name}
              title={name}
              end
            >
              <Icon size={17} />
              <span className="nav-label">{name}</span>
              {path === 'create-booking' && <Plus size={13} />}
            </NavLink>
          ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <ShieldCheck size={23} />
          <strong>Every ride. In one place.</strong>
          <p>Bookings, keys and everything in between.</p>
          <Link to="/" target="_blank">
            View customer website <ArrowUpRight size={13} />
          </Link>
        </div>
        <button onClick={logout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
