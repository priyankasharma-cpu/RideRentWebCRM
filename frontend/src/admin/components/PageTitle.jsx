import './PageTitle.css';
export function PageTitle({ eyebrow = 'RIDERENT OPERATIONS', title, subtitle, children }) {
  return (
    <div className="admin-page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-title-actions">{children}</div>
    </div>
  );
}
