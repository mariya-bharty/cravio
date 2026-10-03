import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

/* ── Status config ── */
const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#856404', bg: '#fff3cd', border: '#f0c040', icon: '🕐' },
  accepted:  { label: 'Accepted',  color: '#0c5460', bg: '#d1ecf1', border: '#bee5eb', icon: '✅' },
  preparing: { label: 'Preparing', color: '#004085', bg: '#cce5ff', border: '#b8daff', icon: '👨‍🍳' },
  ready:     { label: 'Ready',     color: '#155724', bg: '#d4edda', border: '#c3e6cb', icon: '🎉' },
  delivered: { label: 'Delivered', color: '#155724', bg: '#d4edda', border: '#c3e6cb', icon: '🚚' },
  cancelled: { label: 'Cancelled', color: '#721c24', bg: '#f8d7da', border: '#f5c6cb', icon: '❌' },
};

const ACTIVE_STATUSES  = ['pending', 'accepted', 'preparing', 'ready'];
const PAST_STATUSES    = ['delivered', 'cancelled'];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: '#555', bg: '#eee', border: '#ccc', icon: '•' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: m.bg, color: m.color, border: `1px solid ${m.border}`, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {m.icon} {m.label}
    </span>
  );
}

function StatusTimeline({ status }) {
  if (status === 'cancelled') return null;
  const cur = STATUS_STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 14, marginBottom: 4 }}>
      {STATUS_STEPS.map((step, i) => {
        const done    = i <= cur;
        const current = i === cur;
        const m = STATUS_META[step];
        return (
          <React.Fragment key={step}>
            {/* Node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 1 }}>
              <div style={{
                width: current ? 32 : 26, height: current ? 32 : 26,
                borderRadius: '50%',
                background: done ? 'var(--olive)' : 'var(--cream-dark)',
                border: `2px solid ${done ? 'var(--olive)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: current ? '0.9rem' : '0.75rem',
                transition: 'all 0.2s',
                boxShadow: current ? '0 0 0 4px rgba(74,92,63,0.15)' : 'none',
              }}>
                {done ? (current ? m.icon : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>) : null}
              </div>
              <span style={{ fontSize: '0.68rem', color: done ? 'var(--olive)' : 'var(--text-muted)', fontWeight: done ? 600 : 400, whiteSpace: 'nowrap' }}>
                {m.label}
              </span>
            </div>
            {/* Connector */}
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < cur ? 'var(--olive)' : 'var(--border)', transition: 'background 0.3s', marginBottom: 18 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderCard({ order, active }) {
  const [expanded, setExpanded] = useState(active); // active orders default open

  return (
    <div style={{
      background: 'white', borderRadius: 14,
      border: `1.5px solid ${active ? 'var(--olive)' : 'var(--border)'}`,
      overflow: 'hidden',
      boxShadow: active ? '0 4px 20px rgba(74,92,63,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '18px 22px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {/* Restaurant initial */}
          <div style={{ width: 42, height: 42, borderRadius: 10, background: active ? 'var(--olive)' : 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: active ? 'white' : 'var(--text-muted)', flexShrink: 0 }}>
            {order.restaurant_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--dark)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.restaurant_name || 'Restaurant'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Order #{order.id} · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <StatusBadge status={order.status} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--olive)' }}>₹{parseFloat(order.total_amount).toFixed(0)}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Progress timeline for active orders */}
          {active && <StatusTimeline status={order.status} />}

          {/* Items */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {order.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: 'var(--olive)', color: 'white', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', flexShrink: 0 }}>{item.quantity}×</span>
                    {item.food_name}
                  </span>
                  <span style={{ fontWeight: 500, color: 'var(--dark)' }}>₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total + address row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 340 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: 'middle' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {order.delivery_address}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--olive)' }}>
              Total: ₹{parseFloat(order.total_amount).toFixed(0)}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Note: {order.notes}
            </div>
          )}

          {/* Reorder button for delivered */}
          {order.status === 'delivered' && (
            <Link to={`/restaurants/${order.restaurant}`} style={{ alignSelf: 'flex-start', padding: '8px 18px', borderRadius: 8, border: '1.5px solid var(--olive)', color: 'var(--olive)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
              Reorder
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderHistory() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('active'); // 'active' | 'history'

  useEffect(() => {
    api.get('/orders/my/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setOrders(data);
        // If no active orders, default to history tab
        const hasActive = data.some(o => ACTIVE_STATUSES.includes(o.status));
        if (!hasActive) setTab('history');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeOrders  = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const pastOrders    = orders.filter(o => PAST_STATUSES.includes(o.status));

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>📋</div>
      Loading your orders…
    </div>
  );

  if (orders.length === 0) return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio" style={{ maxWidth: 640 }}>
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>📦</div>
          <h2 style={{ marginBottom: 8 }}>No orders yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your order history will appear here once you place an order.</p>
          <Link to="/restaurants" className="btn-olive" style={{ padding: '11px 28px', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem' }}>
            Browse Restaurants
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio" style={{ maxWidth: 760 }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="section-title" style={{ margin: 0 }}>My Orders</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {activeOrders.length > 0 ? `${activeOrders.length} active order${activeOrders.length > 1 ? 's' : ''}` : 'No active orders'} · {pastOrders.length} past
            </p>
          </div>
          <Link to="/restaurants" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--olive)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            + New Order
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'active',  label: 'Current Orders', count: activeOrders.length },
            { key: 'history', label: 'Order History',  count: pastOrders.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 20, fontSize: '0.88rem', cursor: 'pointer',
                border: `1.5px solid ${tab === t.key ? 'var(--olive)' : 'var(--border)'}`,
                background: tab === t.key ? 'var(--olive)' : 'white',
                color: tab === t.key ? 'white' : 'var(--dark)',
                fontWeight: tab === t.key ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{ background: tab === t.key ? 'rgba(255,255,255,0.25)' : 'var(--cream-dark)', borderRadius: 10, padding: '0px 7px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Current orders tab */}
        {tab === 'active' && (
          activeOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🍽️</div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No active orders right now.</p>
              <Link to="/restaurants" className="btn-olive" style={{ padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: '0.88rem' }}>Order Now</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeOrders.map(o => <OrderCard key={o.id} order={o} active={true} />)}
            </div>
          )
        )}

        {/* History tab */}
        {tab === 'history' && (
          pastOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
              <p style={{ color: 'var(--text-muted)' }}>No past orders yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pastOrders.map(o => <OrderCard key={o.id} order={o} active={false} />)}
            </div>
          )
        )}

      </div>
    </div>
  );
}
