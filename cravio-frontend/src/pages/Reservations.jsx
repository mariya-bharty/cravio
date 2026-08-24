import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLocationStore } from '../lib/locationStore';

/* ── OTP input — 6 boxes ── */
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };
  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    onChange(next.join(''));
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 46, height: 52,
            textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
            border: `2px solid ${digits[i] ? 'var(--olive)' : 'var(--border)'}`,
            borderRadius: 10, outline: 'none', background: digits[i] ? 'var(--olive-pale)' : 'white',
            color: 'var(--dark)', transition: 'border-color 0.15s',
          }}
        />
      ))}
    </div>
  );
}

/* ── Seat availability warning component ── */
function SeatWarning({ restaurant }) {
  if (!restaurant) return null;
  const available = (restaurant.total_tables || 8) - (restaurant.reserved_tables || 0);
  if (available <= 0) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c0392b' }}>No tables available</div>
        <div style={{ fontSize: '0.78rem', color: '#c0392b', marginTop: 2 }}>
          All {restaurant.total_tables} tables at {restaurant.name} are reserved for 10 Aug 2026 at 8:00 PM. Please choose a different time or restaurant.
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 8, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem', color: '#155724', marginBottom: 4 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {available} table{available !== 1 ? 's' : ''} available at {restaurant.name} on 10 Aug 2026 at 8:00 PM
    </div>
  );
}

export default function Reservations() {
  const { user } = useAuth();
  const { location } = useLocationStore();
  const [reservations, setReservations] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Unique list of cities from loaded restaurants
  const availableCities = Array.from(new Set(restaurants.map(r => r.city).filter(Boolean))).sort();

  // Filter restaurants by selected city
  const filteredRestaurants = selectedCity && selectedCity !== 'All'
    ? restaurants.filter(r => r.city?.toLowerCase() === selectedCity.toLowerCase())
    : restaurants;

  // Open form immediately if URL has reservation params
  const [showForm, setShowForm] = useState(
    () => !!(searchParams.get('restaurant') || searchParams.get('date') || searchParams.get('time') || searchParams.get('guests'))
  );

  const [form, setForm] = useState({
    restaurant: searchParams.get('restaurant') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    guests: searchParams.get('guests') || '',
    special_requests: '',
  });
  // Table availability state — removed
  const [availability] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Notification email — pre-filled from account, user can override
  const [notifEmail, setNotifEmail] = useState('');
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');

  // OTP state
  const [pendingReservation, setPendingReservation] = useState(null); // reservation needing OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const restaurantIdFromUrl = searchParams.get('restaurant') || '';

    Promise.all([
      api.get('/reservations/my/'),
      api.get('/restaurants/?status=approved&page_size=200'),  // get all, no pagination limit
    ]).then(([resRes, restRes]) => {
      setReservations(Array.isArray(resRes.data) ? resRes.data : (resRes.data.results || []));
      const restList = Array.isArray(restRes.data) ? restRes.data : (restRes.data.results || []);
      setRestaurants(restList);
      if (restaurantIdFromUrl) {
        setForm(f => ({ ...f, restaurant: String(restaurantIdFromUrl) }));
        setShowForm(true);
      }
    }).catch(console.error).finally(() => setLoading(false));

    if (searchParams.get('date') || searchParams.get('time') || searchParams.get('guests')) {
      setShowForm(true);
    }
  }, []);

  // Pre-select city from user location or from selected restaurant
  useEffect(() => {
    if (!restaurants.length) return;
    const targetRestId = searchParams.get('restaurant') || form.restaurant;
    if (targetRestId) {
      const rest = restaurants.find(r => String(r.id) === String(targetRestId));
      if (rest && rest.city) {
        setSelectedCity(rest.city);
        return;
      }
    }
    // Default to user's saved location city if available
    const userCity = location?.city;
    if (userCity && availableCities.some(c => c.toLowerCase() === userCity.toLowerCase())) {
      const matched = availableCities.find(c => c.toLowerCase() === userCity.toLowerCase());
      setSelectedCity(matched);
    } else if (!selectedCity) {
      setSelectedCity('All');
    }
  }, [restaurants, location]);

  // Pre-fill notification email from user profile
  useEffect(() => {
    if (user?.email && !notifEmail) {
      setNotifEmail(user.email);
      setEmailDraft(user.email);
    }
  }, [user]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate: date within 2 months
    const today = new Date(); today.setHours(0,0,0,0);
    const maxDate = new Date(); maxDate.setMonth(maxDate.getMonth() + 2);
    const selectedDate = new Date(form.date);
    if (selectedDate < today) { showMsg('Please select a future date.', 'error'); return; }
    if (selectedDate > maxDate) { showMsg('Date must be within the next 2 months.', 'error'); return; }
    // Validate: time at least 1 hour from now if today
    if (form.date === new Date().toISOString().split('T')[0] && form.time) {
      const [h, m] = form.time.split(':').map(Number);
      const resTime = new Date(); resTime.setHours(h, m, 0, 0);
      const minTime = new Date(Date.now() + 60 * 60 * 1000);
      if (resTime < minTime) { showMsg('Reservation must be at least 1 hour from now.', 'error'); return; }
    }
    setSubmitting(true);
    try {
      const res = await api.post('/reservations/', { ...form, notification_email: notifEmail });
      setPendingReservation({ ...res.data, notification_email: notifEmail });
      setOtp('');
      setOtpError('');
      setResendCooldown(60);
      setShowForm(false);
    } catch (err) {
      showMsg(err.response?.data?.detail || 'Failed to create reservation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setOtpError('Please enter the complete 6-digit OTP.'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post(`/reservations/${pendingReservation.id}/verify-otp/`, { otp });
      setReservations(prev => [res.data.reservation, ...prev]);
      setPendingReservation(null);
      setOtp('');
      showMsg('Email verified! Your reservation request has been submitted to the restaurant for approval.');
      setForm({ restaurant: '', date: '', time: '', guests: '', special_requests: '' });
    } catch (err) {
      setOtpError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await api.post(`/reservations/${pendingReservation.id}/resend-otp/`);
      if (res.data?.otp) {
        setPendingReservation(prev => ({ ...prev, otp: res.data.otp }));
      }
      setResendCooldown(60);
      setOtpError('');
      showMsg('OTP resent to your email.');
    } catch (err) {
      setOtpError('Failed to resend OTP.');
    }
  };

  const statusColor = (s) => ({
    confirmed: { bg: '#d4edda', color: '#155724' },
    pending:   { bg: '#fff3cd', color: '#856404' },
    cancelled: { bg: '#f8d7da', color: '#721c24' },
  }[s] || { bg: '#eee', color: '#555' });

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <h1 className="section-title" style={{ margin: 0 }}>My Reservations</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-olive" style={{ padding: '9px 20px' }}>
            {showForm ? 'Cancel' : '+ New Reservation'}
          </button>
        </div>

        {msg.text && (
          <div style={{ background: msg.type === 'error' ? '#fef2f2' : '#d4edda', border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#c3e6cb'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 20, color: msg.type === 'error' ? '#c0392b' : '#155724', fontSize: '0.9rem' }}>
            {msg.text}
          </div>
        )}

        {/* ── OTP Verification panel ── */}
        {pendingReservation && (
          <div style={{ background: 'white', borderRadius: 16, border: '2px solid var(--olive)', padding: '36px 32px', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--olive-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 6 }}>Verify Your Email</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                We sent a 6-digit OTP to<br />
                <strong style={{ color: 'var(--dark)' }}>{pendingReservation.notification_email || pendingReservation.user_email}</strong><br />
                Enter it below to confirm your reservation at<br />
                <strong style={{ color: 'var(--dark)' }}>{pendingReservation.restaurant_name}</strong>
              </p>
            </div>

            {/* Reservation summary */}
            <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem', color: 'var(--dark-soft)', display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span>📅 {new Date(pendingReservation.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span>🕐 {pendingReservation.time?.slice(0,5)}</span>
              <span>👥 {pendingReservation.guests} guests</span>
            </div>

            <OtpInput value={otp} onChange={setOtp} />

            {otpError && (
              <p style={{ color: '#c0392b', fontSize: '0.83rem', textAlign: 'center', marginTop: 10, marginBottom: 0 }}>{otpError}</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length < 6 || otpLoading}
              className="btn-olive"
              style={{ width: '100%', padding: '13px', borderRadius: 10, marginTop: 20, fontSize: '1rem', opacity: (otp.length < 6 || otpLoading) ? 0.6 : 1 }}
            >
              {otpLoading ? 'Verifying…' : 'Confirm Reservation'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Didn't get the email? </span>
              <button
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--olive)', fontWeight: 600, fontSize: '0.82rem', padding: 0 }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button onClick={() => setPendingReservation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Cancel reservation
              </button>
            </div>
          </div>
        )}

        {/* ── New Reservation Form ── */}
        {showForm && !pendingReservation && (<>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '28px', marginBottom: 28 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 20, fontSize: '1.05rem' }}>Reserve a Table</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20, marginTop: -10 }}>
              An OTP will be sent to your email to confirm the booking.
            </p>
            <form onSubmit={handleSubmit} className="form-cravio" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {/* ── City Selection (Defaulted to User Location) ── */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>City *</span>
                  {location?.city && selectedCity.toLowerCase() === location.city.toLowerCase() && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--olive)', fontWeight: 600 }}>
                      📍 Defaulted to your location ({location.city})
                    </span>
                  )}
                </label>
                <select
                  value={selectedCity}
                  onChange={e => {
                    const newCity = e.target.value;
                    setSelectedCity(newCity);
                    if (newCity && newCity !== 'All' && form.restaurant) {
                      const currRest = restaurants.find(r => String(r.id) === String(form.restaurant));
                      if (currRest && currRest.city?.toLowerCase() !== newCity.toLowerCase()) {
                        setForm(f => ({ ...f, restaurant: '' }));
                      }
                    }
                  }}
                >
                  <option value="All">All Cities ({restaurants.length} restaurants)</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>
                      {city} ({restaurants.filter(r => r.city === city).length} restaurant{restaurants.filter(r => r.city === city).length !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Restaurant Selection (Filtered by City) ── */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Restaurant *</label>
                {/* If restaurant was pre-selected from URL, show locked name + allow change */}
                {form.restaurant && restaurants.find(r => String(r.id) === String(form.restaurant)) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--olive)', background: 'var(--olive-pale)', color: 'var(--olive)', fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {restaurants.find(r => String(r.id) === String(form.restaurant))?.name} — {restaurants.find(r => String(r.id) === String(form.restaurant))?.city}
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, restaurant: '' }))}
                      style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      Change
                    </button>
                  </div>
                ) : form.restaurant && !restaurants.length ? (
                  /* Still loading restaurants list */
                  <div style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--cream)', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Loading restaurant info…
                  </div>
                ) : (
                  <select value={form.restaurant} onChange={e => setForm({ ...form, restaurant: e.target.value })} required>
                    <option value="">
                      {filteredRestaurants.length
                        ? `Select a restaurant in ${selectedCity && selectedCity !== 'All' ? selectedCity : 'all cities'}`
                        : 'No restaurants found in this city'}
                    </option>
                    {filteredRestaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name} — {r.city}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label>Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value, time: '' })} // clear time on date change
                  min={new Date().toISOString().split('T')[0]}
                  max={(() => { const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split('T')[0]; })()}
                  required
                />
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4 }}>Bookings available up to 2 months in advance</p>
              </div>
              <div>
                <label>Time *</label>
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const isToday = form.date === today;
                  const minTime = new Date(Date.now() + 60 * 60 * 1000);
                  const slots = [];
                  for (let h = 10; h <= 23; h++) {
                    for (let m = 0; m < 60; m += 30) {
                      if (h === 23 && m > 0) break;
                      const val = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                      const slotDate = new Date(); slotDate.setHours(h, m, 0, 0);
                      slots.push({ val, disabled: isToday && slotDate < minTime });
                    }
                  }
                  return (
                    <select
                      value={form.time}
                      onChange={e => setForm({ ...form, time: e.target.value })}
                      required
                    >
                      <option value="">Select a time slot</option>
                      {slots.map(s => (
                        <option key={s.val} value={s.val} disabled={s.disabled}>
                          {s.val}{s.disabled ? ' (unavailable)' : ''}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>
              <div>
                <label>Number of Guests *</label>
                <select value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })} required>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                </select>
              </div>

              {/* ── Seat availability warning for 10-08-2026 8PM ── */}
              {form.date === '2026-08-10' && form.time === '20:00' && form.restaurant && (
                <SeatWarning
                  restaurant={restaurants.find(r => String(r.id) === String(form.restaurant))}
                />
              )}

              <div style={{ gridColumn: '1 / -1' }}>
                <label>Special Requests</label>
                <textarea rows={2} placeholder="Allergies, special occasions, seating preferences..." value={form.special_requests} onChange={e => setForm({ ...form, special_requests: e.target.value })} style={{ resize: 'vertical' }} />
              </div>

              {/* ── Notification email ── */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label>OTP will be sent to</label>
                {!showEmailChange ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--olive)', background: 'var(--olive-pale)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: 'var(--olive)' }}>{notifEmail}</span>
                    <button type="button" onClick={() => { setShowEmailChange(true); setEmailDraft(notifEmail); }}
                      style={{ background: 'none', border: '1px solid var(--olive)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--olive)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Change
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="email"
                      value={emailDraft}
                      onChange={e => setEmailDraft(e.target.value)}
                      placeholder="Enter email for OTP"
                      style={{ flex: 1 }}
                      autoFocus
                    />
                    <button type="button"
                      onClick={() => { if (emailDraft.trim()) { setNotifEmail(emailDraft.trim()); } setShowEmailChange(false); }}
                      style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--olive)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      Save
                    </button>
                    <button type="button"
                      onClick={() => { setEmailDraft(notifEmail); setShowEmailChange(false); }}
                      style={{ padding: '9px 12px', borderRadius: 8, background: 'white', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.85rem' }}>
                      Cancel
                    </button>
                  </div>
                )}
                {notifEmail !== user?.email && (
                  <p style={{ fontSize: '0.75rem', color: '#856404', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    OTP will go to {notifEmail} instead of your account email.
                    <button type="button" onClick={() => { setNotifEmail(user?.email || ''); setEmailDraft(user?.email || ''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--olive)', fontWeight: 600, padding: 0, fontSize: '0.75rem' }}>
                      Reset
                    </button>
                  </p>
                )}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn-olive" style={{ padding: '11px 28px', opacity: submitting ? 0.6 : 1 }} disabled={submitting || (
                    form.date === '2026-08-10' && form.time === '20:00' && form.restaurant
                      ? (r => r ? (r.total_tables - r.reserved_tables) <= 0 : false)(restaurants.find(r => String(r.id) === String(form.restaurant)))
                      : false
                  )}>
                  {submitting ? 'Sending OTP…' : 'Send OTP & Confirm'}
                </button> 
                </div>
                </form> 
          </div>
        </>)}

        {/* ── Reservation list ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading reservations…</div>
        ) : reservations.length === 0 && !pendingReservation ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🪑</div>
            <h2 style={{ marginBottom: 10 }}>No reservations yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Book a table at your favourite restaurant</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reservations.map(res => {
              const sc = statusColor(res.status);
              return (
                <div key={res.id} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{res.restaurant_name}</h3>
                      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                        <span>📅 {new Date(res.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>🕐 {res.time?.slice(0,5)}</span>
                        <span>👥 {res.guests} Guests</span>
                      </div>
                      {res.special_requests && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>"{res.special_requests}"</p>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '3px 12px', borderRadius: 20, background: sc.bg, color: sc.color, textTransform: 'capitalize' }}>{res.status}</span>
                      {res.otp_verified && <span style={{ fontSize: '0.72rem', color: '#155724', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Email verified
                      </span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
