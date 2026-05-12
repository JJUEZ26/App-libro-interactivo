const STORAGE_KEY = 'eterno_cycle_count';
export function getEternoCycle() {
  return parseInt(sessionStorage.getItem(STORAGE_KEY) || '1', 10);
}
export function incrementEternoCycle() {
  const next = getEternoCycle() + 1;
  sessionStorage.setItem(STORAGE_KEY, String(next));
  return next;
}
export function resetEternoCycle() {
  sessionStorage.removeItem(STORAGE_KEY);
}
