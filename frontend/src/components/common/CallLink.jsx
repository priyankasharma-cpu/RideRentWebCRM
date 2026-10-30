import { siteConfig } from '../../config/siteConfig';
import { useShop } from '../../context/ShopContext.jsx';
import { Phone } from 'lucide-react';
import './CallLink.css';
export function CallLink({ className = 'rr-button', children }) {
  const { config } = useShop();
  return (
    <a
      className={className}
      href={'tel:' + (config?.phoneTel || siteConfig.phone.tel)}
      title={config?.phonePlaceholder ? 'Demo contact number — update in shop settings' : undefined}
    >
      <Phone size={16} />
      {children || 'Call Now'}
      {(!config || config.phonePlaceholder) && <small className="demo-label">Demo number</small>}
    </a>
  );
}
