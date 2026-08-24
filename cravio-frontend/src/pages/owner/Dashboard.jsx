import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import OwnerSidebar from '../../components/OwnerSidebar';
import api from '../../api/axios';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry','Jammu & Kashmir','Ladakh',
];

const EMPTY_FORM = {
  name: '', cuisine: '', address: '', city: '', phone: '',
  email: '', opening_time: '09:00', closing_time: '22:00',
  pincode: '', state: '', description: '', google_maps_link: '',
};

export default function OwnerDashboard() {
  const [stats, setStats] = useState({ total_orders: 0, pending_orders: 0, total_revenue: 0, total_foods: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    const load = async () => {
      try {
        const rRes = await api.get('/restaurants/mine/');
        setRestaurant(rRes.data);
      } catch { setRestaurant(null); }
      try {
        const [oRes, sRes, aRes] = await Promise.all([
          api.get('/orders/restaurant/?limit=5'),
          api.get('/orders/stats/'),
          api.get('/restaurants/analytics/'),
        ]);
        setRecentOrders(Array.isArray(oRes.data) ? oRes.data : (oRes.data.results || []));
        setStats(sRes.data);
        setAnalytics(aRes.data);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  // Pre-fill form when editing
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        cuisine: restaurant.cuisine || '',
        address: restaurant.address || '',
        city: restaurant.city || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        opening_time: restaurant.opening_time?.slice(0,5) || '09:00',
        closing_time: restaurant.closing_time?.slice(0,5) || '22:00',
        pincode: restaurant.pincode || '',
        state: restaurant.state || '',
        description: restaurant.description || '',
        google_maps_link: restaurant.google_maps_link || '',
      });
      if (restaurant.image) {
        setImagePreview(restaurant.image.startsWith('http') ? restaurant.image : `http://localhost:8000${restaurant.image}`);
      }
    }
  }, [restaurant]);

  // Pincode autofill using India Post API
  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(f => ({ ...f, pincode: pin }));
    if (pin.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data[0]?.Status === 'Success') {
          const info = data[0].PostOffice[0];
          setFormData(f => ({
            ...f,
            pincode: pin,
            city: info.District || f.city,
            state: info.State || f.state,
            address: f.address || `${info.Name}, ${info.District}`,
          }));
        }
      } catch (_) {}
      finally { setPincodeLoading(false); }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRegisterOrUpdate = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setRegError('');
    setRegSuccess('');
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        // TimeField requires HH:MM:SS format
        if ((k === 'opening_time' || k === 'closing_time') && v && v.length === 5) {
          fd.append(k, v + ':00');
        } else {
          fd.append(k, v || '');
        }
      });
      if (imageFile) fd.append('image_file', imageFile);

      let res;
      if (restaurant) {
        // Update existing restaurant
        res = await api.put(`/restaurants/${restaurant.id}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setRestaurant(res.data);
        setRegSuccess('Restaurant details updated successfully!');
        setIsEditing(false);
      } else {
        // Register new restaurant
        res = await api.post('/restaurants/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setRestaurant(res.data);
        setRegSuccess('Restaurant submitted! Waiting for admin approval.');
      }
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') setRegError(Object.values(data).flat().join(' '));
      else setRegError('Failed to save. Please check all fields.');
    } finally { setRegistering(false); }
  };

  const statusClass = (s) => `status-${s?.toLowerCase()}`;
  const STAT_CARDS = [
    { icon: '📦', label: 'Total Orders', value: stats.total_orders, color: 'var(--olive)' },
    { icon: '⏳', label: 'Pending', value: stats.pending_orders, color: 'var(--terracotta)' },
    { icon: '💰', label: 'Revenue', value: `₹${parseFloat(stats.total_revenue || 0).toFixed(0)}`, color: '#2d6a4f' },
    { icon: '🍛', label: 'Menu Items', value: stats.total_foods, color: '#6b4226' },
  ];

  const renderRestaurantForm = (title) => (
    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
        Fill in the details below. If registering, your restaurant will go live after admin approval.
      </p>

      {regError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#c0392b', fontSize: '0.88rem' }}>{regError}</div>}
      {regSuccess && <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#155724', fontSize: '0.88rem' }}>{regSuccess}</div>}

      <form onSubmit={handleRegisterOrUpdate} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Image upload */}
        <div>
          <label>Restaurant Banner Image</label>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '6px' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 120, height: 80, borderRadius: 10,
                border: '2px dashed var(--border)',
                overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--cream)', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--olive)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '8px' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📷</div>
                    Click to upload
                  </div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-outline-olive" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: 8 }}>
                Choose Image
              </button>
              {imageFile && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>📎 {imageFile.name}</p>}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG, WEBP up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Name + Cuisine */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div><label>Restaurant Name *</label><input placeholder="e.g. Royal Punjab" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required /></div>
          <div><label>Cuisine *</label><input placeholder="e.g. North Indian, Chinese" value={formData.cuisine} onChange={e => setFormData(f => ({ ...f, cuisine: e.target.value }))} required /></div>
        </div>

        {/* Phone + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div><label>Phone Number *</label><input placeholder="9876543210" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} required /></div>
          <div><label>Email</label><input type="email" placeholder="contact@restaurant.com" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} /></div>
        </div>

        {/* Pincode — autofills city, state, address */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: '14px', alignItems: 'end' }}>
          <div>
            <label>Pincode *</label>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="e.g. 560001"
                value={formData.pincode}
                onChange={handlePincodeChange}
                maxLength={6}
                required
              />
              {pincodeLoading && (
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--olive)' }}>
                  fetching...
                </span>
              )}
            </div>
          </div>
          <div><label>City *</label><input placeholder="Auto-filled from pincode" value={formData.city} onChange={e => setFormData(f => ({ ...f, city: e.target.value }))} required /></div>
          <div>
            <label>State *</label>
            <select value={formData.state} onChange={e => setFormData(f => ({ ...f, state: e.target.value }))} required>
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Address */}
        <div>
          <label>Full Address *</label>
          <textarea rows={2} placeholder="Street, Area, Landmark..." value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} required style={{ resize: 'vertical' }} />
        </div>

        {/* Description */}
        <div>
          <label>Description</label>
          <textarea rows={2} placeholder="Brief description of your restaurant..." value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
        </div>

        {/* Google Maps Link */}
        <div>
          <label>Google Maps Sharing URL or Embed URL (Optional)</label>
          <input
            placeholder="e.g. https://maps.app.goo.gl/... or https://www.google.com/maps/embed?..."
            value={formData.google_maps_link}
            onChange={e => setFormData(f => ({ ...f, google_maps_link: e.target.value }))}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Provide a Google Maps link to display your custom map and directions on your restaurant profile.
          </p>
        </div>

        {/* Timings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div><label>Opening Time *</label><input type="time" value={formData.opening_time} onChange={e => setFormData(f => ({ ...f, opening_time: e.target.value }))} required /></div>
          <div><label>Closing Time *</label><input type="time" value={formData.closing_time} onChange={e => setFormData(f => ({ ...f, closing_time: e.target.value }))} required /></div>
        </div>

        <button type="submit" className="btn-olive" style={{ padding: '12px 28px', fontSize: '0.95rem', borderRadius: 8, alignSelf: 'flex-start', opacity: registering ? 0.7 : 1 }} disabled={registering}>
          {registering ? 'Saving...' : restaurant ? 'Save Changes ✓' : 'Submit for Approval →'}
        </button>
      </form>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <OwnerSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
            {restaurant && (
              <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
                {restaurant.name} ·{' '}
                <span style={{
                  color: restaurant.status === 'approved' ? '#2d6a4f' : restaurant.status === 'pending' ? '#856404' : '#721c24',
                  fontWeight: 600, textTransform: 'capitalize',
                }}>{restaurant.status}</span>
                {restaurant.status === 'pending' && (
                  <span style={{ marginLeft: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    — Awaiting admin approval
                  </span>
                )}
              </p>
            )}
          </div>
          {restaurant && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-outline-olive"
              style={{ padding: '8px 18px', fontSize: '0.88rem', borderRadius: 8 }}
            >
              {isEditing ? 'Cancel Edit' : '⚙️ Restaurant Settings'}
            </button>
          )}
        </div>

        {/* ── Settings Form View ── */}
        {restaurant && isEditing && renderRestaurantForm("Edit Restaurant Settings")}

        {/* ── Register form ── */}
        {!restaurant && !loading && renderRestaurantForm("Register Your Restaurant")}

        {/* ── Pending approval notice ── */}
        {restaurant && !isEditing && restaurant.status === 'pending' && (
          <div style={{ background: '#fff9e6', border: '1px solid #f0c040', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Awaiting Admin Approval</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                Your restaurant <strong>{restaurant.name}</strong> has been submitted and is under review. You'll be able to manage your menu and orders once approved.
              </p>
            </div>
          </div>
        )}

        {/* ── Rejected notice ── */}
        {restaurant && !isEditing && restaurant.status === 'rejected' && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>❌</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Restaurant Rejected</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                Your restaurant was not approved. Please contact support at hello@cravio.app for more information.
              </p>
            </div>
          </div>
        )}

        {/* ── Dashboard content (only for approved) ── */}
        {restaurant && !isEditing && restaurant.status === 'approved' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {STAT_CARDS.map(card => (
                <div key={card.label} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{card.icon}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: card.color }}>{loading ? '—' : card.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* ── Item Performance Analytics ── */}
            {analytics && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '14px', fontFamily: "'Cormorant Garamond', serif" }}>🔥 Item Performance Analytics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  
                  {/* Top Seller Online */}
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '2rem', background: '#F4EFE6', padding: '10px', borderRadius: '12px' }}>🛵</div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Online Seller</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', margin: '2px 0' }}>
                        {analytics.top_online_seller?.name || 'No sales yet'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {analytics.top_online_seller ? `${analytics.top_online_seller.total_sold} orders sold (₹${analytics.top_online_seller.total_revenue})` : 'Awaiting online orders'}
                      </div>
                    </div>
                  </div>

                  {/* Top Seller Dining */}
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '2rem', background: '#EAF0E9', padding: '10px', borderRadius: '12px' }}>🍽️</div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--olive)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Dining Specialty</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', margin: '2px 0' }}>
                        {analytics.top_dinein_seller?.name || 'No menu items'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {analytics.top_dinein_seller ? `Category: ${analytics.top_dinein_seller.category} (${analytics.top_dinein_seller.estimated_bookings} table orders)` : 'Awaiting table bookings'}
                      </div>
                    </div>
                  </div>

                  {/* Most Liked Item */}
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '2rem', background: '#FDF2F2', padding: '10px', borderRadius: '12px' }}>❤️</div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c0392b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Most Liked Dish</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', margin: '2px 0' }}>
                        {analytics.most_liked_item?.name || 'No items liked'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {analytics.most_liked_item ? `★ ${analytics.most_liked_item.rating} (${analytics.most_liked_item.likes_count} favorites & reviews)` : 'Awaiting dish reviews'}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '32px' }}>
              {[
                { to: '/owner/menu', icon: '🍛', label: 'Manage Menu' },
                { to: '/owner/orders', icon: '📦', label: 'View Orders' },
                { to: '/owner/reservations', icon: '🪑', label: 'Reservations' },
                { to: '/owner/expenses', icon: '💵', label: 'Financials & Expenses' },
              ].map(action => (
                <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
                  <div className="card-cravio" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{action.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark)' }}>{action.label}</div>
                  </div>
                </Link>
              ))}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Recent Orders</h2>
                <Link to="/owner/orders" style={{ color: 'var(--olive)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
              </div>
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {recentOrders.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders yet</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead style={{ background: 'var(--cream)' }}>
                      <tr>{['Order #', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, i) => (
                        <tr key={order.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--cream)' : 'white' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 600 }}>#{order.id}</td>
                          <td style={{ padding: '11px 14px' }}>{order.customer_name || 'Customer'}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--olive)' }}>₹{parseFloat(order.total_amount).toFixed(0)}</td>
                          <td style={{ padding: '11px 14px' }}><span className={statusClass(order.status)} style={{ textTransform: 'capitalize' }}>{order.status}</span></td>
                          <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
