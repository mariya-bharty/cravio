import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useLocationStore, detectCurrentLocation, lookupPincode } from '../lib/locationStore';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry','Jammu & Kashmir','Ladakh',
];

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
  },
  {
    id: 'upi',
    label: 'UPI',
    desc: 'Pay via any UPI app',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    desc: 'All major banks supported',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ delivery_address: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);

  // Delivery location state
  const [pincode, setPincode]           = useState('');
  const [city, setCity]                 = useState('');
  const [state, setState]               = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [geoLoading, setGeoLoading]     = useState(false);

  // Coupon
  const [couponCode, setCouponCode]     = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError]   = useState('');
  const [discount, setDiscount]         = useState(0);

  // Order error (shown inline)
  const [orderError, setOrderError] = useState('');

  const { user } = useAuth();
  const { location: savedLoc, setLocation: saveLocStore } = useLocationStore();
  const navigate = useNavigate();

  // Pre-fill from location store (highest priority), then fall back to profile
  useEffect(() => {
    if (savedLoc?.city)    setCity(savedLoc.city);
    else if (user?.city)   setCity(user.city);
    if (savedLoc?.state)   setState(savedLoc.state);
    else if (user?.state)  setState(user.state);
    if (savedLoc?.pincode) setPincode(savedLoc.pincode);
  }, [savedLoc, user]);

  useEffect(() => {
    if (cart[0]?.restaurant_city) {
      setCity(cart[0].restaurant_city);
    }
  }, [cart]);

  useEffect(() => {
    api.get('/cart/')
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setCart(items);
      })
      .catch(console.error)
      .finally(() => setCartLoading(false));
  }, []);

  const [couponDesc, setCouponDesc]   = useState('');

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.food_price || 0) * item.quantity, 0);
  const tax = subtotal * 0.05;
  const discountAmount = couponApplied ? Math.min(subtotal, discount) : 0;
  const total = Math.max(0, subtotal + tax - discountAmount);

  const handleApplyCoupon = async () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a promo code.');
      return;
    }
    if (!user) {
      setCouponError('Please sign in to use a promo code.');
      return;
    }
    try {
      const res = await api.post('/orders/validate-promo/', {
        code,
        subtotal
      });
      if (res.data?.valid) {
        setCouponApplied(true);
        setDiscount(res.data.discount_amount);
        setCouponDesc(res.data.description || 'Promo code applied!');
      }
    } catch (err) {
      setCouponError(err.response?.data?.detail || 'Invalid or inapplicable promo code.');
    }
  };

  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(pin);
    if (pin.length === 6) {
      setPincodeLoading(true);
      const result = await lookupPincode(pin);
      setPincodeLoading(false);
      if (result) {
        if (!cart[0]?.restaurant_city) {
          setCity(result.city);
          setState(result.state);
          if (!streetAddress) setStreetAddress(`${result.area}, ${result.city}`);
          saveLocStore({ city: result.city, state: result.state, pincode: pin });
        } else {
          if (!streetAddress) setStreetAddress(`${result.area}, ${cart[0].restaurant_city}`);
        }
      }
    }
  };

  const handleUseCurrentLocation = () => {
    detectCurrentLocation(
      (loc) => {
        if (!cart[0]?.restaurant_city) {
          setCity(loc.city);
          setState(loc.state);
        } else {
          setCity(cart[0].restaurant_city);
        }
        setPincode(loc.pincode || '');
      },
      (err) => alert(err),
      setGeoLoading
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderError('');
    // Manual validation with clear messages
    if (!streetAddress.trim()) { alert('Please enter your street/flat address.'); return; }
    if (!city.trim()) { alert('Please enter your city.'); return; }

    // Client-side city check
    const restaurantCity = cart[0]?.restaurant_city || '';
    if (restaurantCity) {
      const rcLow = restaurantCity.trim().toLowerCase();
      const ciLow = city.trim().toLowerCase();
      const ALIASES = { bengaluru: 'bangalore', bangalore: 'bengaluru', mumbai: 'bombay', bombay: 'mumbai', chennai: 'madras', madras: 'chennai', kolkata: 'calcutta', calcutta: 'kolkata' };
      const isAlias = ALIASES[rcLow] === ciLow || ALIASES[ciLow] === rcLow;
      if (rcLow !== ciLow && !isAlias) {
        setOrderError(`This restaurant only delivers within ${restaurantCity}. Please update your delivery city.`);
        return;
      }
    }

    // Build full delivery address from structured fields
    const fullAddress = [streetAddress, city, pincode].filter(Boolean).join(', ');
    setLoading(true);
    try {
      await api.post('/orders/', {
        delivery_address: fullAddress,
        notes: form.notes,
        items: cart.map(item => ({ food: item.food, quantity: item.quantity, price: item.food_price })),
        total_amount: total.toFixed(2),
        promo_code: couponApplied ? couponCode.trim().toUpperCase() : null,
        discount_amount: discountAmount.toFixed(2),
        restaurant: cart[0]?.restaurant_id,
      });
      window.dispatchEvent(new Event('cartUpdate'));
      navigate('/orders');
    } catch (err) {
      setOrderError(err.response?.data?.detail || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading...</div>;

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio">
        <h1 className="section-title" style={{ marginBottom: '28px' }}>Checkout</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Delivery details */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: 10 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Delivery address</p>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 6,
                    background: 'var(--olive-pale)', border: '1px solid var(--olive)',
                    color: 'var(--olive)', cursor: geoLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem', fontWeight: 600, opacity: geoLoading ? 0.7 : 1,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                  {geoLoading ? 'Detecting…' : 'Detect location'}
                </button>
              </div>

              {/* City restriction notice */}
              {cart[0]?.restaurant_city && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                  background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 7,
                  marginBottom: 14, fontSize: '0.8rem', color: '#92400e',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>Delivery is available in <strong style={{ color: '#78350f' }}>{cart[0].restaurant_city}</strong> only.</span>
                </div>
              )}

              <div className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 260px', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label>Pincode</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        placeholder="560001"
                        value={pincode}
                        onChange={handlePincodeChange}
                        maxLength={6}
                        required={!city}
                      />
                      {pincodeLoading && (
                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', color: 'var(--olive)', whiteSpace: 'nowrap' }}>
                          finding…
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label>City</label>
                    <input
                      placeholder="Auto-filled"
                      value={cart[0]?.restaurant_city || city}
                      readOnly={Boolean(cart[0]?.restaurant_city)}
                      style={{ background: cart[0]?.restaurant_city ? '#f8f8f8' : undefined }}
                    />
                  </div>
                </div>

                <div>
                  <label>Flat / Street / Landmark</label>
                  <textarea
                    rows={2}
                    placeholder="House no., building name, street, area…"
                    value={streetAddress}
                    onChange={e => setStreetAddress(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {(streetAddress || city) && (
                  <div style={{ background: 'var(--cream)', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: 'var(--dark-soft)', lineHeight: 1.5 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Delivering to</span>
                    {[streetAddress, city, pincode].filter(Boolean).join(', ')}
                  </div>
                )}

                <div>
                  <label>Notes for restaurant <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea
                    rows={2}
                    placeholder="Allergies, spice preferences, special requests…"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Payment section */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '28px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Payment Method
              </h3>

              {/* Method selector tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {PAYMENT_METHODS.map(m => {
                  const selected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px',
                        border: `2px solid ${selected ? 'var(--olive)' : 'var(--border)'}`,
                        borderRadius: 10,
                        background: selected ? 'var(--olive-pale)' : 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ color: selected ? 'var(--olive)' : 'var(--text-muted)', flexShrink: 0 }}>{m.icon}</span>
                      <span>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: selected ? 'var(--olive)' : 'var(--dark)' }}>{m.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{m.desc}</div>
                      </span>
                      {/* selected dot */}
                      <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <span style={{
                          display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
                          border: `2px solid ${selected ? 'var(--olive)' : 'var(--border)'}`,
                          background: selected ? 'var(--olive)' : 'white',
                          boxShadow: selected ? 'inset 0 0 0 3px white' : 'none',
                        }} />
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* UPI input */}
              {paymentMethod === 'upi' && (
                <div className="form-cravio" style={{ background: 'var(--cream)', borderRadius: 10, padding: '16px' }}>
                  <label>UPI ID</label>
                  <input
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Enter your UPI ID (e.g. name@okicici, phone@paytm)
                  </p>
                </div>
              )}

              {/* Card input */}
              {paymentMethod === 'card' && (
                <div className="form-cravio" style={{ background: 'var(--cream)', borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label>Card Number</label>
                    <input
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={cardDetails.number}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setCardDetails(c => ({ ...c, number: v.replace(/(.{4})/g, '$1 ').trim() }));
                      }}
                    />
                  </div>
                  <div>
                    <label>Cardholder Name</label>
                    <input
                      placeholder="Name on card"
                      value={cardDetails.name}
                      onChange={e => setCardDetails(c => ({ ...c, name: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label>Expiry</label>
                      <input
                        placeholder="MM / YY"
                        maxLength={7}
                        value={cardDetails.expiry}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
                          setCardDetails(c => ({ ...c, expiry: v }));
                        }}
                      />
                    </div>
                    <div>
                      <label>CVV</label>
                      <input
                        placeholder="•••"
                        type="password"
                        maxLength={4}
                        value={cardDetails.cvv}
                        onChange={e => setCardDetails(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {['visa.svg', 'mc.svg', 'rupay.svg'].map((_, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', background: 'white', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {['VISA', 'MC', 'RuPay'][i]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Net banking */}
              {paymentMethod === 'netbanking' && (
                <div className="form-cravio" style={{ background: 'var(--cream)', borderRadius: 10, padding: '16px' }}>
                  <label>Select Bank</label>
                  <select defaultValue="">
                    <option value="" disabled>Choose your bank</option>
                    {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* COD note */}
              {paymentMethod === 'cod' && (
                <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Keep exact change ready. Our delivery partner will collect payment on arrival.
                  </p>
                </div>
              )}
            </div>

            {/* Place order button */}
            <button
              type="submit"
              className="btn-olive"
              style={{ padding: '15px', fontSize: '1rem', borderRadius: '10px', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              disabled={loading}
            >
              {loading ? (
                'Placing Order...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Place Order · ₹{total.toFixed(0)}{couponApplied ? ` (saved ₹${discountAmount.toFixed(0)})` : ''}
                </>
              )}
            </button>

            {/* Inline order error */}
            {orderError && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 14px', background: '#fef2f2',
                border: '1px solid #fca5a5', borderRadius: 8, marginTop: -8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: '0.82rem', color: '#dc2626', margin: 0, lineHeight: 1.4 }}>{orderError}</p>
              </div>
            )}

            {/* Security note */}
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: -8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Your payment info is secure and encrypted
            </p>
          </form>

          {/* ── Order summary ── */}
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '18px', fontSize: '1.05rem' }}>Order Summary</h3>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ background: 'var(--olive)', color: 'white', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px', flexShrink: 0 }}>{item.quantity}×</span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.food_name}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', flexShrink: 0 }}>₹{(parseFloat(item.food_price) * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Promo code</p>
                {!couponApplied ? (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        placeholder="WELCOME20"
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 7, fontFamily: 'inherit',
                          border: `1.5px solid ${couponError ? '#e74c3c' : 'var(--border)'}`,
                          fontSize: '0.82rem', outline: 'none', letterSpacing: '0.5px',
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button type="button" onClick={handleApplyCoupon}
                        style={{ padding: '8px 14px', borderRadius: 7, background: 'var(--olive)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        Apply
                      </button>
                    </div>
                    {couponError && <p style={{ fontSize: '0.74rem', color: '#c0392b', margin: '6px 0 0' }}>{couponError}</p>}
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>First order? Use <strong style={{ color: 'var(--dark)' }}>WELCOME20</strong> for 20% off.</p>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0faf4', border: '1px solid #a8d5b5', borderRadius: 7, padding: '8px 12px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#2d6a4f', fontWeight: 600 }}>✓ {couponCode} applied ({couponDesc})</span>
                    <button type="button" onClick={() => { setCouponApplied(false); setDiscount(0); setCouponCode(''); setCouponDesc(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d6a4f', fontSize: '0.78rem', fontWeight: 600 }}>Remove</button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Delivery fee</span><span style={{ color: '#2d6a4f', fontWeight: 600 }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>GST (5%)</span><span>₹{tax.toFixed(0)}</span>
                </div>
                {couponApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#155724', fontWeight: 600 }}>
                    <span>Discount (WELCOME20)</span><span>-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', paddingTop: '10px', borderTop: '1px solid var(--border)', marginTop: 2 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--olive)' }}>₹{total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Savings badge */}
            <div style={{ background: '#d4edda', border: '1px solid #a8d5b5', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#155724" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: '0.82rem', color: '#155724', fontWeight: 500 }}>Free delivery on this order!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
