import { X, Menu, ChevronRight } from 'lucide-react';
import { links } from '../../config/adminNavigation.js';
import { ThemeToggle } from '../../components/common/ThemeToggle.jsx';
import './AdminHeader.css';
export function AdminHeader({ setOpen, open, setCompact, compact, location, user }) {
  return (
    <header className="admin-topbar">
      <button
        className="admin-menu-button"
        onClick={() => (innerWidth <= 1000 ? setOpen(!open) : setCompact(!compact))}
        aria-label="Toggle admin navigation"
      >
        {open ? <X /> : <Menu />}
      </button>
      <div className="admin-breadcrumb">
        Workspace <ChevronRight size={13} />{' '}
        <strong>
          {links.find(([, p]) => location.pathname === '/admin' + (p ? '/' + p : ''))?.[0] ||
            'Overview'}
        </strong>
      </div>
      <div className="admin-top-actions">
        <span className="demo-indicator">DEMO WORKSPACE</span>
        <ThemeToggle />
        <div className="staff-avatar">{user.name[0]}</div>
        <div className="staff-name">
          <strong>{user.name}</strong>
          <small>{user.role}</small>
        </div>
      </div>
    </header>
  );
}
