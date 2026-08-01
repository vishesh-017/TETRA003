export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}
