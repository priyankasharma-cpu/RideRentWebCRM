import {
  MessageSquare,
  Package,
  LayoutDashboard,
  CarFront,
  CalendarDays,
  Plus,
  KeyRound,
  ArrowRight,
  Users,
  Wallet,
  Wrench,
  BarChart3,
  ShieldCheck,
  ChartNoAxesCombined,
  Globe,
  Store,
  ReceiptText,
  Banknote,
  Scale,
  FileSpreadsheet,
  Settings as SettingsIcon,
} from 'lucide-react';
// Permissions are route-based so changing a label never changes access.
const adminOnly = ['vehicles', 'addons', 'maintenance', 'inquiries', 'staff'];
export const navigationGroups = [
  { label: 'Overview', links: [['Dashboard', '', LayoutDashboard]] },
  {
    label: 'Finance Management',
    expandable: true,
    links: [
      ['Finance Overview', 'finance', Wallet],
      ['Revenue Analytics', 'finance/revenue', ChartNoAxesCombined],
      ['Website Revenue', 'finance/website', Globe],
      ['Walk-in Revenue', 'finance/walk-in', Store],
      ['Transactions', 'finance/transactions', ReceiptText],
      ['Expenses', 'finance/expenses', Banknote],
      ['Profit & Loss', 'finance/profit-loss', Scale],
      ['Financial Reports', 'finance/reports', FileSpreadsheet],
    ],
  },
  {
    label: 'Fleet Management',
    links: [
      ['Physical Fleet & Pricing', 'vehicles', CarFront],
      ['Fleet Availability', 'availability', CalendarDays],
      ['Maintenance', 'maintenance', Wrench],
    ],
  },
  {
    label: 'Rental Management',
    links: [
      ['Bookings', 'bookings', CalendarDays],
      ['Create Booking', 'create-booking', Plus],
      ['Active Rentals', 'active-rentals', KeyRound],
      ['Returns', 'returns', ArrowRight],
      ['Customers', 'customers', Users],
      ['Payments', 'payments', Wallet],
    ],
  },
  { label: 'Pricing & Inventory', links: [['Helmets & Add-ons', 'addons', Package]] },
  {
    label: 'Business Management',
    links: [
      ['Inquiries', 'inquiries', MessageSquare],
      ['Reports & Analytics', 'analytics', BarChart3],
      ['Staff & Roles', 'staff', ShieldCheck],
      ['Settings', 'settings', SettingsIcon],
    ],
  },
];
export const links = navigationGroups.flatMap((group) => group.links);
export const canAccessAdminLink = (path, role) =>
  role === 'admin' || (!adminOnly.includes(path) && !/^finance(?:\/|$)/.test(path));
