import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* Broadcast channel so any component can trigger a cart refresh */
export const refreshCart = () => window.dispatchEvent(new Event('cravio_cart_update'));

export default function CartDrawer() {
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on checkout/cart pages
  const hidden = ['/cart', '/checkout'].some(p => location.pathname.startsWith(p));

  const fetchCart = useCallback(() => {
    if (!user || user.role !== 'customer') return;
    api.get('/cart/')
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setCart(items);
        // Don't auto-open — user opens via the floating button
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  useEffect(() => {
    window.addEventListener('cravio_cart_update', fetchCart);
    window.addEventListener('cartUpdate', fetchCart); // also listen to existing event
    return () => {
      window.removeEventListener('cravio_cart_update', fetchCart);
      window.removeEventListener('cartUpdate', fetchCart);
    };
  }, [fetchCart]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (!user || user.role !== 'customer' || hidden) return null;

  const subtotal = cart.reduce((s, i) => s + parseFloat(i.food_price || 0) * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const updateQty = async (itemId, qty) => {
    if (qty < 1) {
      await api.delete(`/cart/${itemId}/`);
      setCart(prev => prev.filter(i => i.id !== itemId));
      return;
    }
    const res = await api.patch(`/cart/${itemId}/`, { quantity: qty });
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: res.data.quantity } : i));
  };

  return (
    <>
      {/* Floating cart button — always visible when cart has items */}
      {itemCount > 0 && !open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 1500,
            background: 'var(--olive)', color: 'white',
            border: 'none', borderRadius: 50,
            padding: '14px 22px',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,79,57,0.35)',
            fontSize: '0.9rem', fontWeight: 700,
            transition: 'transform 0.15s',
            animation: 'cartBounce 0.4s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {itemCount} item{itemCount > 1 ? 's' : ''} · ₹{subtotal.toFixed(0)}
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1400, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 340, maxWidth: '90vw',
        background: 'white',
        zIndex: 1500,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--dark)' }}>
              Your Cart {itemCount > 0 && <span style={{ background: 'var(--olive)', color: 'white', borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', marginLeft: 4 }}>{itemCount}</span>}
            </span>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🛒</div>
              <p style={{ fontSize: '0.9rem' }}>Your cart is empty</p>
            </div>
          ) : (
            <>
              {/* Restaurant name */}
              {cart[0]?.restaurant_name && (
                <div style={{ padding: '6px 20px 10px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  From {cart[0].restaurant_name}
                </div>
              )}
              {cart.map(item => (
                <div key={item.id} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
                  {/* Food image */}
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--cream-dark)', flexShrink: 0 }}>
                    {item.food_image
                      ? <img src={item.food_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🍽️</div>
                    }
                  </div>

                  {/* Name + price */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.food_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--olive)', fontWeight: 600, marginTop: 1 }}>₹{(parseFloat(item.food_price) * item.quantity).toFixed(0)}</div>
                  </div>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark)', lineHeight: 1 }}>
                      −
                    </button>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--olive)', background: 'var(--olive)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal ({itemCount} items)</span>
              <span style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '1rem' }}>₹{subtotal.toFixed(0)}</span>
            </div>
            <button
              onClick={() => { setOpen(false); navigate('/checkout'); }}
              className="btn-olive"
              style={{ width: '100%', padding: '13px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Proceed to Checkout
            </button>
            <button
              onClick={() => { setOpen(false); navigate('/cart'); }}
              style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, fontSize: '0.85rem', background: 'white', border: '1.5px solid var(--border)', cursor: 'pointer', color: 'var(--dark-soft)', fontWeight: 500 }}
            >
              View Full Cart
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cartBounce {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
