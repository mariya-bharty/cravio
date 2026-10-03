import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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

const DELIVERY_INSTRUCTIONS = [
  { id: 'avoid_call', label: 'No calls please', desc: 'Text me when you arrive' },
  { id: 'leave_door', label: 'Leave at door', desc: 'Contactless drop-off' },
  { id: 'dont_ring', label: 'Skip the bell', desc: 'Baby or pet sleeping' },
  { id: 'leave_guard', label: 'Hand to security', desc: 'Drop at the gate' },
];

const PAYMENT_METHODS = [
  { id: 'cod',  label: 'Cash on Delivery', desc: 'Pay when it arrives' },
  { id: 'upi',  label: 'UPI',               desc: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Card',              desc: 'Visa, Mastercard, RuPay' },
];

export default function OrderNow() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { location: savedLoc, setLocation: saveLocStore } = useLocationStore();

  const restaurantId = searchParams.get('restaurant');

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems]   = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Contact
  const [dinerName,  setDinerName]  = useState('');
  const [dinerPhone, setDinerPhone] = useState('');

  // Address
  const [pincode,       setPincode]       = useState('');
  const [city,          setCity]          = useState('');
  const [state,         setState]         = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [addressLabel,  setAddressLabel]  = useState('Home');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [geoLoading,    setGeoLoading]    = useState(false);

  // Delivery extras
  const [selectedInstructions, setSelectedInstructions] = useState([]);
  const [notes, setNotes] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiId,         setUpiId]         = useState('');
  const [cardDetails,   setCardDetails]   = useState({ number: '', name: '', expiry: '', cvv: '' });

  // Promo code
  const [promoCode,    setPromoCode]    = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError,   setPromoError]   = useState('');
  const [discount,     setDiscount]     = useState(0);

  // Order error (shown inline)
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    if (user) {
      setDinerName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '');
      setDinerPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (savedLoc?.city)    setCity(savedLoc.city);
    else if (user?.city)   setCity(user.city);
    if (savedLoc?.state)   setState(savedLoc.state);
    else if (user?.state)  setState(user.state);
    if (savedLoc?.pincode) setPincode(savedLoc.pincode);
  }, [savedLoc, user]);

  useEffect(() => {
    if (restaurant?.city) {
      setCity(restaurant.city);
    }
  }, [restaurant]);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    Promise.all([
      api.get(`/restaurants/${restaurantId}/`),
      api.get(`/foods/?restaurant=${restaurantId}`),
      api.get('/cart/'),
    ]).then(([rRes, fRes, cRes]) => {
      setRestaurant(rRes.data);
      const list = Array.isArray(fRes.data) ? fRes.data : (fRes.data.results || []);
      setMenuItems(list);
      const cartList = Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || []);
      const initialQtys = {};
      cartList.forEach((cItem) => {
        if (cItem.restaurant_id === Number(restaurantId)) initialQtys[cItem.food] = cItem.quantity;
      });
      setQuantities(initialQtys);
    }).catch(console.error).finally(() => setLoading(false));
  }, [restaurantId]);

  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(pin);
    if (pin.length === 6) {
      setPincodeLoading(true);
      const result = await lookupPincode(pin);
      setPincodeLoading(false);
      if (result) {
        if (!restaurant?.city) {
          setCity(result.city);
          setState(result.state);
          if (!streetAddress) setStreetAddress(`${result.area}, ${result.city}`);
          saveLocStore({ city: result.city, state: result.state, pincode: pin });
        } else {
          if (!streetAddress) setStreetAddress(`${result.area}, ${restaurant.city}`);
        }
      }
    }
  };

  const handleUseCurrentLocation = () => {
    detectCurrentLocation(
      (loc) => { setCity(loc.city); setState(loc.state); setPincode(loc.pincode || ''); },
      (err) => alert(err),
      setGeoLoading
    );
  };

  const handleInstructionToggle = (id) =>
    setSelectedInstructions((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const updateItemQty = (foodId, increment) => {
    setQuantities((prev) => {
      const next = (prev[foodId] || 0) + increment;
      if (next <= 0) { const copy = { ...prev }; delete copy[foodId]; return copy; }
      return { ...prev, [foodId]: next };
    });
  };

  // Promo code handler
  const [promoDesc, setPromoDesc] = useState('');

  const handleApplyPromo = async () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a promo code.');
      return;
    }
    if (!user) {
      setPromoError('Please sign in to use a promo code.');
      return;
    }
    try {
      const res = await api.post('/orders/validate-promo/', {
        code,
        subtotal
      });
      if (res.data?.valid) {
        setPromoApplied(true);
        setDiscount(res.data.discount_amount);
        setPromoDesc(res.data.description || 'Promo code applied!');
      }
    } catch (err) {
      setPromoError(err.response?.data?.detail || 'Invalid or inapplicable promo code.');
    }
  };

  // Calculations
  const selectedList = Object.entries(quantities).map(([idStr, qty]) => {
    const food = menuItems.find((f) => f.id === Number(idStr));
    return food ? { ...food, qty } : null;
  }).filter(Boolean);

  const subtotal      = selectedList.reduce((sum, item) => sum + parseFloat(item.price || 0) * item.qty, 0);
  const deliveryFee   = subtotal > 0 ? 40 : 0;
  const gst           = subtotal * 0.05;
  const discountAmt   = promoApplied ? Math.min(subtotal, discount) : 0;
  const total         = Math.max(0, subtotal + deliveryFee + gst - discountAmt);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setOrderError('');
    if (!user) { navigate('/login'); return; }
    if (selectedList.length === 0) { alert('Please add at least one item to your order.'); return; }
    if (!dinerName.trim() || !dinerPhone.trim()) { alert('Please fill in your contact details.'); return; }
    if (!streetAddress.trim() || !city.trim()) {
      alert('Please enter your street address and city.');
      return;
    }

    // Client-side city check before sending
    const restaurantCityLower = restaurant.city.trim().toLowerCase();
    const enteredCityLower = city.trim().toLowerCase();
    if (restaurantCityLower !== enteredCityLower) {
      const ALIASES = { bengaluru: 'bangalore', bangalore: 'bengaluru', mumbai: 'bombay', bombay: 'mumbai', chennai: 'madras', madras: 'chennai', kolkata: 'calcutta', calcutta: 'kolkata' };
      const isAlias = ALIASES[restaurantCityLower] === enteredCityLower || ALIASES[enteredCityLower] === restaurantCityLower;
      if (!isAlias) {
        setOrderError(`This restaurant only delivers within ${restaurant.city}. Please update your city.`);
        return;
      }
    }

    setSubmitting(true);

    const formattedInstructions = selectedInstructions
      .map((iId) => DELIVERY_INSTRUCTIONS.find((inst) => inst.id === iId)?.label)
      .filter(Boolean).join(', ');

    const fullAddress = [
      `${dinerName} · ${dinerPhone}`,
      `[${addressLabel}] ${streetAddress}`,
      `${city}, ${state} - ${pincode}`,
      formattedInstructions ? `Instructions: ${formattedInstructions}` : '',
    ].filter(Boolean).join('\n');

    const paymentLine = `Payment: ${paymentMethod.toUpperCase()}${
      paymentMethod === 'upi' ? ` · ${upiId}` : paymentMethod === 'card' ? ` · ${cardDetails.name}` : ''
    }`;

    const orderPayload = {
      restaurant: Number(restaurantId),
      delivery_address: `${fullAddress}\n${paymentLine}`,
      notes: notes,
      total_amount: total.toFixed(2),
      promo_code: promoApplied ? promoCode.trim().toUpperCase() : null,
      discount_amount: discountAmt.toFixed(2),
      items: selectedList.map((item) => ({
        food: item.id,
        quantity: item.qty,
        price: parseFloat(item.price),
      })),
    };

    try {
      await api.post('/orders/', orderPayload);
      window.dispatchEvent(new Event('cartUpdate'));
      navigate('/orders');
    } catch (err) {
      setOrderError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: '1rem' }}>Loading restaurant…</p>
    </div>
  );

  if (!restaurant) return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h2 style={{ color: 'var(--dark)', marginBottom: 16 }}>Restaurant not found</h2>
      <Link to="/restaurants" className="btn-olive">Browse Restaurants</Link>
    </div>
  );

  const card = {
    background: 'white',
    borderRadius: 12,
    border: '1px solid var(--border)',
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  };

  const sectionTitle = {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 16,
  };

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '90vh', padding: '36px 0 60px' }}>
      <div className="container-cravio">

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <Link
            to={`/restaurants/${restaurantId}`}
            style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to {restaurant.name}
          </Link>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: 'var(--dark)', margin: '0 0 6px' }}>
            Place your order
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            {restaurant.name} &middot; {restaurant.cuisine} &middot; {restaurant.city}
          </p>
        </div>

        {/* ── Two-column grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>

          {/* ─── Left: form ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Contact */}
            <div style={card}>
              <p style={sectionTitle}>Contact details</p>
              <div className="form-cravio" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label>Full name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={dinerName}
                    onChange={(e) => setDinerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={dinerPhone}
                    onChange={(e) => setDinerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <p style={{ ...sectionTitle, marginBottom: 0 }}>Delivery address</p>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                    borderRadius: 6, background: 'var(--olive-pale)', border: '1px solid var(--olive)',
                    color: 'var(--olive)', cursor: geoLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem', fontWeight: 600, opacity: geoLoading ? 0.7 : 1,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                  {geoLoading ? 'Detecting…' : 'Detect location'}
                </button>
              </div>

              {/* City restriction notice */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 7,
                marginBottom: 14, fontSize: '0.8rem', color: '#92400e',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Delivery is available in <strong style={{ color: '#78350f' }}>{restaurant.city}</strong> only. Your address must be in the same city.</span>
              </div>

              <div className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Pincode / City / State row */}
                <div style={{ display: 'grid', gridTemplateColumns: '130px 260px', gap: 12 }}>
                  <div>
                    <label>Pincode</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        placeholder="560001"
                        value={pincode}
                        onChange={handlePincodeChange}
                        maxLength={6}
                        required
                      />
                      {pincodeLoading && (
                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', color: 'var(--olive)' }}>
                          finding…
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label>City</label>
                    <input
                      placeholder="Auto-filled"
                      value={restaurant?.city || city}
                      readOnly={Boolean(restaurant?.city)}
                      style={{ background: restaurant?.city ? '#f8f8f8' : undefined }}
                      required
                    />
                  </div>
                </div>

                {/* Street address */}
                <div>
                  <label>Flat / Building / Street / Landmark</label>
                  <textarea
                    rows={2}
                    placeholder="House no., building name, street, area…"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Address label */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark-soft)', marginBottom: 8, display: 'block' }}>
                    Save as
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Home', 'Work', 'Other'].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setAddressLabel(lbl)}
                        style={{
                          padding: '5px 14px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                          border: `1px solid ${addressLabel === lbl ? 'var(--olive)' : 'var(--border)'}`,
                          background: addressLabel === lbl ? 'var(--olive-pale)' : 'white',
                          color: addressLabel === lbl ? 'var(--olive)' : 'var(--dark-soft)',
                        }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live address preview */}
                {(streetAddress || city) && (
                  <div style={{ background: 'var(--cream)', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: 'var(--dark-soft)', lineHeight: 1.5 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                      Delivering to
                    </span>
                    {[streetAddress, restaurant?.city || city, pincode].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery instructions */}
            <div style={card}>
              <p style={sectionTitle}>Delivery preferences</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {DELIVERY_INSTRUCTIONS.map((inst) => {
                  const isSelected = selectedInstructions.includes(inst.id);
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => handleInstructionToggle(inst.id)}
                      style={{
                        textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                        border: `1.5px solid ${isSelected ? 'var(--olive)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--olive-pale)' : 'white',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: isSelected ? 'var(--olive)' : 'var(--dark)', marginBottom: 3 }}>
                        {inst.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{inst.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment */}
            <div style={card}>
              <p style={sectionTitle}>Payment</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <div key={pm.id}>
                      <div
                        onClick={() => setPaymentMethod(pm.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                          borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                          border: `1.5px solid ${isSelected ? 'var(--olive)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--olive-pale)' : 'white',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${isSelected ? 'var(--olive)' : '#ccc'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--olive)' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dark)' }}>{pm.label}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{pm.desc}</div>
                        </div>
                      </div>

                      {isSelected && pm.id === 'upi' && (
                        <div className="form-cravio" style={{ padding: '12px 16px', background: 'var(--cream)', borderRadius: '0 0 8px 8px', border: '1.5px solid var(--olive)', borderTop: 'none', marginTop: -2 }}>
                          <label style={{ fontSize: '0.76rem', fontWeight: 600 }}>UPI ID</label>
                          <input placeholder="name@okicici" value={upiId} onChange={(e) => setUpiId(e.target.value)} required />
                        </div>
                      )}

                      {isSelected && pm.id === 'card' && (
                        <div className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 16px', background: 'var(--cream)', borderRadius: '0 0 8px 8px', border: '1.5px solid var(--olive)', borderTop: 'none', marginTop: -2 }}>
                          <div>
                            <label style={{ fontSize: '0.76rem', fontWeight: 600 }}>Card number</label>
                            <input placeholder="1234 5678 9012 3456" value={cardDetails.number} onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.76rem', fontWeight: 600 }}>Name on card</label>
                            <input placeholder="As printed on card" value={cardDetails.name} onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })} required />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <label style={{ fontSize: '0.76rem', fontWeight: 600 }}>Expiry</label>
                              <input placeholder="MM / YY" value={cardDetails.expiry} onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })} required />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.76rem', fontWeight: 600 }}>CVV</label>
                              <input type="password" placeholder="•••" maxLength={4} value={cardDetails.cvv} onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })} required />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery notes */}
            <div style={card}>
              <p style={sectionTitle}>Notes for the restaurant</p>
              <div className="form-cravio">
                <textarea
                  rows={2}
                  placeholder="Allergies, spice level, special requests…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

          </div>

          {/* ─── Right: menu + bill ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 88 }}>

            {/* Menu picker */}
            <div style={{ ...card, padding: 20, maxHeight: 340, overflowY: 'auto' }}>
              <p style={sectionTitle}>Menu</p>
              {menuItems.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No items available.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {menuItems.map((food, idx) => {
                    const qty = quantities[food.id] || 0;
                    return (
                      <div
                        key={food.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '11px 0',
                          borderBottom: idx < menuItems.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: food.is_veg ? '#2d6a4f' : '#c0392b',
                              border: `1.5px solid ${food.is_veg ? '#2d6a4f' : '#c0392b'}`,
                            }} />
                            <span style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--dark)' }}>{food.name}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--olive)', fontWeight: 600 }}>₹{parseFloat(food.price).toFixed(0)}</span>
                        </div>

                        {qty > 0 ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: 'var(--olive)', color: 'white',
                            padding: '4px 10px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700,
                          }}>
                            <button onClick={() => updateItemQty(food.id, -1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>−</button>
                            <span style={{ minWidth: 14, textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => updateItemQty(food.id, 1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>+</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateItemQty(food.id, 1)}
                            style={{
                              border: '1.5px solid var(--olive)', background: 'white', color: 'var(--olive)',
                              padding: '4px 14px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700,
                              cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bill summary + promo + place order */}
            <div style={card}>
              <p style={sectionTitle}>Bill</p>

              {selectedList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '16px 0', textAlign: 'center' }}>
                  No items selected yet
                </p>
              ) : (
                <>
                  {/* Item breakdown */}
                  <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                    {selectedList.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                        <span style={{ color: 'var(--dark-soft)' }}>
                          {item.name} <span style={{ color: 'var(--text-muted)' }}>× {item.qty}</span>
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--dark)' }}>₹{(parseFloat(item.price) * item.qty).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Promo code */}
                  <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                    {!promoApplied ? (
                      <>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={promoCode}
                            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                            placeholder="Promo code"
                            style={{
                              flex: 1, padding: '8px 12px', borderRadius: 7,
                              border: `1.5px solid ${promoError ? '#e74c3c' : 'var(--border)'}`,
                              fontSize: '0.82rem', outline: 'none',
                              fontFamily: 'inherit', letterSpacing: '0.5px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            style={{
                              padding: '8px 14px', borderRadius: 7, border: 'none',
                              background: 'var(--olive)', color: 'white',
                              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && (
                          <p style={{ fontSize: '0.75rem', color: '#c0392b', margin: '6px 0 0' }}>{promoError}</p>
                        )}
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                          First order? Use <strong style={{ color: 'var(--dark)' }}>WELCOME20</strong> for 20% off.
                        </p>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0faf4', border: '1px solid #a8d5b5', borderRadius: 7, padding: '8px 12px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#2d6a4f', fontWeight: 600 }}>
                          ✓ {promoCode.toUpperCase()} applied ({promoDesc})
                        </span>
                        <button
                          type="button"
                          onClick={() => { setPromoApplied(false); setDiscount(0); setPromoCode(''); setPromoDesc(''); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d6a4f', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      <span>Delivery</span><span>₹{deliveryFee.toFixed(0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      <span>GST & charges (5%)</span><span>₹{gst.toFixed(0)}</span>
                    </div>
                    {promoApplied && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#2d6a4f', fontWeight: 600 }}>
                        <span>Discount</span><span>−₹{discountAmt.toFixed(0)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: 'var(--dark)', paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--olive)' }}>₹{total.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Inline order error */}
                  {orderError && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: '10px 12px', background: '#fef2f2',
                      border: '1px solid #fca5a5', borderRadius: 8, marginTop: 4,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: 0, lineHeight: 1.4 }}>{orderError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting || selectedList.length === 0}
                    className="btn-olive"
                    style={{
                      width: '100%', padding: '13px', borderRadius: 9, fontSize: '0.95rem', fontWeight: 700,
                      marginTop: 18,
                      opacity: submitting || selectedList.length === 0 ? 0.7 : 1,
                      cursor: submitting || selectedList.length === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Placing order…' : `Place order · ₹${total.toFixed(0)}`}
                  </button>

                  <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Secure checkout
                  </p>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
