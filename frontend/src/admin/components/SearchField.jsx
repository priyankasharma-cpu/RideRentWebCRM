import { Search } from 'lucide-react';
import './Filters.css';

export function SearchField({ iconSize = 16, ...inputProps }) {
  return (
    <div className="admin-search-field">
      <Search size={iconSize} />
      <input {...inputProps} />
    </div>
  );
}
