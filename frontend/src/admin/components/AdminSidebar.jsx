import { Logo } from '../../components/common/Logo.jsx';
import { navigationGroups, canAccessAdminLink } from '../../config/adminNavigation.js';
import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Plus, ShieldCheck, ArrowUpRight, LogOut, ChevronDown, Wallet } from 'lucide-react';
import './AdminSidebar.css';
export function AdminSidebar({ open, user, logout }) {
  const { pathname } = useLocation();
  const financeActive = /^\/admin\/finance(?:\/|$)/.test(pathname);
  const [financePreference, setFinancePreference] = useState(null);
  const financeExpanded = financePreference ?? financeActive;
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
      <nav aria-label="Admin navigation">
        {navigationGroups.map((group) => {
          const visible = group.links.filter(([, path]) => canAccessAdminLink(path, user.role));
          if (!visible.length) return null;
          return (
            <section key={group.label} aria-label={group.label}>
              {group.expandable ? (
                <button
                  className="sidebar-caption sidebar-section-toggle"
                  aria-label={group.label}
                  title={group.label}
                  aria-controls="admin-finance-links"
                  aria-expanded={financeExpanded}
                  onClick={() => setFinancePreference(!financeExpanded)}
                >
                  <Wallet size={17} />
                  <span className="nav-label">{group.label}</span>
                  <ChevronDown size={14} className="sidebar-section-chevron" />
                </button>
              ) : (
                <div className="sidebar-caption">{group.label}</div>
              )}
              <div
                id={group.expandable ? 'admin-finance-links' : undefined}
                hidden={group.expandable && !financeExpanded}
              >
                {visible.map(([name, path, Icon]) => (
                  <NavLink
                    key={path}
                    to={'/admin' + (path ? '/' + path : '')}
                    aria-label={name}
                    title={name}
                    end
                  >
                    <Icon size={20} />
                    <span className="nav-label">{name}</span>
                    {path === 'create-booking' && <Plus size={13} />}
                  </NavLink>
                ))}
              </div>
            </section>
          );
        })}
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
