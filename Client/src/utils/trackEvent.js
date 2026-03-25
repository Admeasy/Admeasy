/**
 * Client-side product events (GA4 gtag + GTM dataLayer).
 * Safe no-op if scripts are blocked or window is unavailable.
 */
export function trackAdmeasyEvent(eventName, params = {}) {
  if (typeof window === "undefined" || !eventName) return;

  try {
    const payload = { event: eventName, ...params };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn("[trackAdmeasyEvent]", eventName, err);
    }
  }
}
