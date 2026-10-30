import { createContext, useContext, useEffect, useState } from 'react';
import '../components/common/Toast.css';
const NotificationContext = createContext(null);
export function NotificationProvider({ children }) {
  const [notice, notify] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => notify(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <NotificationContext.Provider
      value={{
        notify,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => notify('')} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
export const useNotifications = () => useContext(NotificationContext);
