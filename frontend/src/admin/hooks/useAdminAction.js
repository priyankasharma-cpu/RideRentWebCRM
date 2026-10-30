import { useNotifications } from '../../context/NotificationContext.jsx';
import { useState } from 'react';
export function useAdminAction(reload) {
  const { notify } = useNotifications();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const execute = async (fn, message = 'Changes saved.') => {
    setBusy(true);
    setError('');
    try {
      const result = await fn();
      await reload?.();
      notify(message);
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  return {
    error,
    setError,
    busy,
    execute,
  };
}
