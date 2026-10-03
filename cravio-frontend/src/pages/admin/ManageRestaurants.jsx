import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../api/axios';

const STAR = '★';

// Tiny SVG Icons
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const CuisineIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // default to pending tab
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [confirm, setConfirm] = useState(null); // { id, name, action: 'approved'|'rejected', reason: '' }

  const fetchRestaurants = () => {
    setLoading(true);
    api.get('/restaurants/')
      .then(res => setRestaurants(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRestaurants(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const doUpdateStatus = async () => {
    if (!confirm) return;
    try {
      const payload = { status: confirm.action };
      if (confirm.reason) payload.rejection_reason = confirm.reason;
      const res = await api.patch(`/restaurants/${confirm.id}/approval/`, payload);
      const updated = res.data.restaurant;
      setRestaurants(prev => prev.map(r => r.id === confirm.id ? { ...r, status: updated.status } : r));
      showMsg(
        confirm.action === 'approved'
          ? `✓ "${confirm.name}" has been approved and is now live!`
          : `✗ "${confirm.name}" has been rejected.`,
        confirm.action === 'approved' ? 'success' : 'error'
      );
    } catch (err) {
      showMsg(err?.response?.data?.detail || 'Failed to update restaurant status.', 'error');
    } finally {
      setConfirm(null);
    }
  };

  const filtered = filter ? restaurants.filter(r => r.status === filter) : restaurants;

  const tabCounts = { all: restaurants.length, pending: 0, approved: 0, rejected: 0 };
  restaurants.forEach(r => { if (tabCounts[r.status] !== undefined) tabCounts[r.status]++; });

  const statusPill = (status) => {
    const map = {
      approved: { bg: '#d4edda', color: '#155724', label: '✓ Approved' },
      pending:  { bg: '#fff3cd', color: '#856404', label: '⏳ Pending' },
      rejected: { bg: '#f8d7da', color: '#721c24', label: '✗ Rejected' },
    };
    const s = map[status] || { bg: '#eee', color: '#333', label: status };
    return (
      <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600, textTransform: 'capitalize' }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F0' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '36px 44px', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.4rem', fontWeight: 600, color: 'var(--dark)', margin: 0, letterSpacing: '0.01em' }}>
            Manage Restaurants
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>
            Review, approve or reject platform restaurant registration requests.
          </p>
        </div>

        {/* Status messages */}
        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? '#d4edda' : '#fef2f2',
            border: `1px solid ${msg.type === 'success' ? '#c3e6cb' : '#fca5a5'}`,
            borderRadius: 8, padding: '12px 18px', marginBottom: 24,
            color: msg.type === 'success' ? '#155724' : '#c0392b', fontSize: '0.88rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            {msg.text}
          </div>
        )}

        {/* ── Interactive Queue Filter Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { val: 'pending', label: 'Pending Review', count: tabCounts.pending, bg: 'var(--terracotta-pale)', color: 'var(--terracotta)', desc: 'Awaiting registration checks' },
            { val: 'approved', label: 'Approved Partners', count: tabCounts.approved, bg: 'var(--olive-pale)', color: 'var(--olive)', desc: 'Currently live on app' },
            { val: 'rejected', label: 'Rejected Entries', count: tabCounts.rejected, bg: '#fef2f2', color: '#b91c1c', desc: 'Listing requests declined' },
            { val: '', label: 'All Registrations', count: tabCounts.all, bg: 'white', color: 'var(--dark)', desc: 'Total restaurant database' }
          ].map(card => {
            const active = filter === card.val;
            return (
              <div
                key={card.label}
                onClick={() => setFilter(card.val)}
                style={{
                  background: active ? 'white' : 'rgba(255,255,255,0.7)',
                  borderRadius: '16px',
                  border: `2px solid ${active ? card.color : 'var(--border)'}`,
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: active ? '0 8px 24px rgba(0,0,0,0.06)' : 'none',
                  transform: active ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
                }}
              >
                {/* Visual Accent */}
                {active && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: card.color }} />
                )}
                
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 2px' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 600, color: card.color, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{card.count}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>listings</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{card.desc}</div>
              </div>
            );
          })}
        </div>

        {/* ── Restaurant Listings Queue ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading requests queue...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏪</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: 'var(--dark)' }}>Queue is clear</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>No {filter || 'total'} restaurants found in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {filtered.map(r => (
              <div
                key={r.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  padding: '24px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)'; }}
              >
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  
                  {/* Photo Thumbnail */}
                  <div style={{ width: 110, height: 86, borderRadius: 12, overflow: 'hidden', background: 'var(--cream-dark)', flexShrink: 0, border: '1px solid var(--border)' }}>
                    {r.image
                      ? <img src={r.image.startsWith('http') ? r.image : `http://localhost:8000${r.image}`} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: '#FAF8F5' }}>🍴</div>
                    }
                  </div>

                  {/* Info and Details */}
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '1.4rem', color: 'var(--dark)', margin: 0 }}>
                        {r.name}
                      </h3>
                      {statusPill(r.status)}
                    </div>

                    {/* Metadata Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 16px', fontSize: '0.8rem', color: 'var(--dark-soft)', fontFamily: "'DM Sans', sans-serif" }}>
                      <div><CuisineIcon />{r.cuisine}</div>
                      <div><MapPinIcon />{r.city}{r.state ? `, ${r.state}` : ''}</div>
                      <div><UserIcon />Owner: {r.owner_name}</div>
                      <div><PhoneIcon />{r.phone || 'No phone'}</div>
                      <div style={{ gridColumn: 'span 1' }}><ClockIcon />Hours: {r.opening_time?.slice(0,5)} – {r.closing_time?.slice(0,5)}</div>
                    </div>

                    {r.address && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, marginBottom: 0, fontFamily: "'DM Sans', sans-serif" }}>
                        📌 Address: {r.address} {r.pincode ? `(PIN: ${r.pincode})` : ''}
                      </p>
                    )}
                    {r.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 10, marginBottom: 0, fontStyle: 'italic', background: '#F9F8F6', padding: '10px 14px', borderRadius: 8 }}>
                        "{r.description}"
                      </p>
                    )}
                  </div>

                  {/* Actions Stand */}
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexDirection: 'row', alignSelf: 'center', flexWrap: 'wrap' }}>
                    {r.status !== 'approved' && (
                      <button
                        onClick={() => setConfirm({ id: r.id, name: r.name, action: 'approved', reason: '' })}
                        style={{
                          padding: '9px 18px', background: '#d4edda', border: '1.5px solid #a8d5b5', borderRadius: 10,
                          color: '#155724', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                          transition: 'all 0.15s', outline: 'none'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#c3e6cb'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#d4edda'; }}
                      >
                        ✓ Approve Partner
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        onClick={() => setConfirm({ id: r.id, name: r.name, action: 'rejected', reason: '' })}
                        style={{
                          padding: '9px 18px', background: '#f8d7da', border: '1.5px solid #f5c6cb', borderRadius: 10,
                          color: '#721c24', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                          transition: 'all 0.15s', outline: 'none'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5c6cb'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f8d7da'; }}
                      >
                        ✗ Decline
                      </button>
                    )}
                    {r.status === 'approved' && (
                      <span style={{ fontSize: '0.75rem', color: '#155724', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ✨ Live on App
                      </span>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Confirmation Modal ── */}
      {confirm && (
        <>
          <div
            onClick={() => setConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(28,30,29,0.5)', zIndex: 1000, backdropFilter: 'blur(3px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: 20, padding: '36px 32px',
            width: 'calc(100% - 32px)', maxWidth: 440,
            zIndex: 1001, boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: 14 }}>
              {confirm.action === 'approved' ? '🟢' : '🔴'}
            </div>
            <h3 style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>
              {confirm.action === 'approved' ? 'Approve Restaurant?' : 'Decline Request?'}
            </h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
              {confirm.action === 'approved'
                ? <>Are you sure you want to approve <strong>"{confirm.name}"</strong>? It will go live immediately on the platform and begin accepting table bookings.</>
                : <>Are you sure you want to reject the registration of <strong>"{confirm.name}"</strong>? The owner will see this choice on their dashboard.</>
              }
            </p>

            {/* Rejection comment */}
            {confirm.action === 'rejected' && (
              <div className="form-cravio" style={{ marginBottom: 24 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-soft)' }}>Reason for rejection (optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Incomplete menu, invalid location, unclear photos..."
                  value={confirm.reason}
                  onChange={e => setConfirm(c => ({ ...c, reason: e.target.value }))}
                  style={{ resize: 'vertical', fontSize: '0.88rem', borderRadius: 8, padding: '10px 12px' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={doUpdateStatus}
                style={{
                  flex: 1, padding: '12px',
                  background: confirm.action === 'approved' ? 'var(--olive)' : '#c0392b',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                onMouseLeave={e => e.currentTarget.style.opacity = 1}
              >
                {confirm.action === 'approved' ? 'Yes, Approve' : 'Yes, Decline'}
              </button>
              <button
                onClick={() => setConfirm(null)}
                style={{
                  flex: 1, padding: '12px', background: 'white',
                  border: '1.5px solid var(--border)', borderRadius: 10,
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  color: 'var(--dark)', transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
