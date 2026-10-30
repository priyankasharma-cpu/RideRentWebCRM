import { useSyncExternalStore } from 'react';
const KEY = 'rr-saved';
const EVENT = 'riderent:saved-vehicles';
function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(EVENT, callback);
  };
}
export function useSavedVehicles() {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY) || '[]');
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    saved = [];
  }
  if (!Array.isArray(saved)) saved = [];
  const toggleSaved = (id) => {
    const next = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  };
  return {
    saved,
    toggleSaved,
  };
}
