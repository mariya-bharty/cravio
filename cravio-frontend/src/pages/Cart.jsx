import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/cart/')
      .then(res => setCart(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateQty = async (itemId, qty) => {
    if (qty < 1) return removeItem(itemId);
    try {
      const res = await api.patch(`/cart/${itemId}/`, { quantity: qty });
      setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: res.data.quantity } : i));
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (err) { console.error(err); }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}/`);
      setCart(prev => prev.filter(i => i.id !== itemId));
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (err) { console.error(err); }
  };

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.food_price || 0) * item.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🛒</div>
      <p>Loading cart...</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio">
        <h1 className="section-title" style={{ marginBottom: '28px' }}>🛒 Your Cart</h1>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛒</div>
            <h2 style={{ marginBottom: '10px', color: 'var(--dark)' }}>Your cart is empty</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Browse restaurants and add some delicious food!</p>
            <Link to="/restaurants" className="btn-olive">Browse Restaurants</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cart.map(item => (
                <div key={item.id} className="card-cravio" style={{ display: 'flex', gap: '16px', padding: '16px', alignItems: 'center' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', background: 'var(--cream-dark)', flexShrink: 0 }}>
                    {item.food_image ? (
                      <img src={`http://localhost:8000${item.food_image}`} alt={item.food_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🍛</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px' }}>{item.food_name}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.restaurant_name}</p>
                    <span style={{ fontWeight: 700, color: 'var(--olive)' }}>₹{parseFloat(item.food_price).toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>−</button>
                    <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--olive)', background: 'var(--olive)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>+</button>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: '6px' }}>₹{(parseFloat(item.food_price) * item.quantity).toFixed(0)}</div>
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px', position: 'sticky', top: '80px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '1.1rem' }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal ({cart.length} items)</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>GST (5%)</span>
                <span>₹{tax.toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--olive)' }}>₹{total.toFixed(0)}</span>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-olive" style={{ width: '100%', padding: '13px', fontSize: '0.98rem', borderRadius: '9px', marginTop: '20px' }}>
                Proceed to Checkout →
              </button>
              <Link to="/restaurants" style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                + Add more items
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
