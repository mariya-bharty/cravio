/**
 * Cravio — Centralised location store
 *
 * Persists { city, state, pincode, display } in localStorage so the user
 * never has to re-enter their location.
 *
 * Priority order (highest to lowest):
 *   1. Manually set by user (GPS / pincode / picker / checkout)
 *   2. Saved in user's profile (user.city / user.state from backend)
 *   3. Nothing — show "India" / national trending
 *
 * Usage:
 *   import { getLocation, setLocation, clearLocation, useLocationStore } from '../lib/locationStore';
 */

import { useState, useEffect } from 'react';

const KEY = 'cravio_location';

// ── Raw helpers (no React) ────────────────────────────────────────────────────

/** @returns {{ city: string, state: string, pincode: string, display: string } | null} */
export function getLocation() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save location to localStorage and notify all listeners.
 * @param {{ city?: string, state?: string, pincode?: string }} loc
 */
export function setLocation(loc) {
  const prev = getLocation() || {};
  const next = {
    city:    (loc.city    ?? prev.city    ?? '').trim(),
    state:   (loc.state   ?? prev.state   ?? '').trim(),
    pincode: (loc.pincode ?? prev.pincode ?? '').trim(),
  };
  next.display = [next.city, next.state].filter(Boolean).join(', ') || 'India';
  localStorage.setItem(KEY, JSON.stringify(next));
  // Dispatch a custom event so all hooks re-read
  window.dispatchEvent(new Event('cravio_location_change'));
  return next;
}

/** Remove saved location */
export function clearLocation() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('cravio_location_change'));
}

// ── React hook ────────────────────────────────────────────────────────────────

/**
 * React hook — returns current location and a setter.
 * Re-renders whenever location changes (even from another component).
 *
 * @returns {{
 *   location: { city: string, state: string, pincode: string, display: string } | null,
 *   setLocation: (loc: object) => void,
 *   clearLocation: () => void,
 *   hasLocation: boolean,
 * }}
 */
export function useLocationStore() {
  const [loc, setLoc] = useState(getLocation);

  useEffect(() => {
    const sync = () => setLoc(getLocation());
    window.addEventListener('cravio_location_change', sync);
    // Also sync when another tab updates localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) sync();
    });
    return () => {
      window.removeEventListener('cravio_location_change', sync);
    };
  }, []);

  return {
    location: loc,
    setLocation,
    clearLocation,
    hasLocation: !!(loc?.city || loc?.state),
  };
}

// ── Geolocation helper (shared) ───────────────────────────────────────────────

/**
 * Ask browser for GPS, reverse-geocode with Nominatim, save to store.
 * @param {(loc: object) => void} onSuccess  called with the saved location object
 * @param {(err: string) => void} onError
 * @param {(loading: boolean) => void} onLoading
 */
export function detectCurrentLocation(onSuccess, onError, onLoading) {
  if (!navigator.geolocation) {
    onError('Geolocation is not supported by your browser.');
    return;
  }
  onLoading(true);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await res.json();
        const addr = data.address || {};
        const loc = setLocation({
          city:    addr.city || addr.town || addr.county || addr.district || '',
          state:   addr.state || '',
          pincode: addr.postcode || '',
        });
        onSuccess(loc);
      } catch {
        onError('Could not determine your location. Please enter manually.');
      } finally {
        onLoading(false);
      }
    },
    () => {
      onError('Location access denied. Please enter your location manually.');
      onLoading(false);
    }
  );
}

// ── Pincode autofill helper (shared) ─────────────────────────────────────────

/**
 * Lookup India Post pincode API and return { city, state }.
 * Does NOT save to store — caller decides whether to save.
 * @param {string} pin  6-digit pincode
 * @returns {Promise<{ city: string, state: string, area: string } | null>}
 */
export async function lookupPincode(pin) {
  if (!/^\d{6}$/.test(pin)) return null;
  try {
    const res  = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (data[0]?.Status === 'Success') {
      const info = data[0].PostOffice[0];
      return {
        city:  info.District || '',
        state: info.State    || '',
        area:  info.Name     || '',
      };
    }
  } catch { /* ignore */ }
  return null;
}
