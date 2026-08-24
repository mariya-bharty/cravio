import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../../components/OwnerSidebar';
import api from '../../api/axios';

const STATUS_OPTIONS = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'];

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  // Modal State for Offline POS Order
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [customerName, setCustomerName] = useState('Table 1');
  const [notes, setNotes] = useState('Dine-In Walk-In POS Order');
  const [selectedItems, setSelectedItems] = useState([]);
  const [submittingPOS, setSubmittingPOS] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchOwnerRestaurant();
  }, []);

  const fetchOrders = () => {
    api.get('/orders/restaurant/')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchOwnerRestaurant = async () => {
    try {
      const rRes = await api.get('/restaurants/mine/');
      const rest = Array.isArray(rRes.data) ? rRes.data[0] : rRes.data;
      setRestaurant(rest);
      if (rest?.id) {
        const mRes = await api.get(`/foods/?restaurant=${rest.id}&limit=100`);
        const list = Array.isArray(mRes.data) ? mRes.data : (mRes.data.results || []);
        setMenuItems(list);
      }
    } catch (_) {}
  };

  const updateStatus = async (orderId, status) => {
    try {
      const res = await api.patch(`/orders/${orderId}/`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: res.data.status } : o));
    } catch { alert('Failed to update status.'); }
  };

  const handleAddItemToPOS = (foodItem) => {
    const existing = selectedItems.find(i => i.food === foodItem.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.food === foodItem.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { food: foodItem.id, food_name: foodItem.name, price: parseFloat(foodItem.price), quantity: 1 }]);
    }
  };

  const handleRemoveItemFromPOS = (foodId) => {
    setSelectedItems(selectedItems.filter(i => i.food !== foodId));
  };

  const handleCreateOfflineOrder = async (e) => {
    e.preventDefault();
    if (!restaurant?.id) {
      alert('Restaurant not found.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please add at least one menu item.');
      return;
    }

    const total_amount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    setSubmittingPOS(true);
    try {
      await api.post('/orders/offline/', {
        restaurant: restaurant.id,
        customer_name: customerName,
        notes,
        total_amount,
        items: selectedItems.map(i => ({ food: i.food, quantity: i.quantity, price: i.price }))
      });
      alert('Offline POS Order recorded successfully!');
      setShowOfflineModal(false);
      setSelectedItems([]);
      setCustomerName('Table 1');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record offline order.');
    } finally {
      setSubmittingPOS(false);
    }
  };

  const statusClass = (s) => `status-${s?.toLowerCase()}`;
  const filtered = filter ? orders.filter(o => o.status === filter) : orders;

  const calculatePOSTotal = () => selectedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <OwnerSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Manage Orders</h1>
          <button
            onClick={() => setShowOfflineModal(true)}
            style={{ backgroundColor: '#3B4F39', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ➕ Record Offline POS Order
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <button onClick={() => setFilter('')} style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${!filter ? 'var(--olive)' : 'var(--border)'}`, background: !filter ? 'var(--olive)' : 'white', color: !filter ? 'white' : 'var(--dark)', cursor: 'pointer', fontSize: '0.83rem' }}>
            All ({orders.length})
          </button>
          {STATUS_OPTIONS.map(s => {
            const count = orders.filter(o => o.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${filter === s ? 'var(--olive)' : 'var(--border)'}`, background: filter === s ? 'var(--olive)' : 'white', color: filter === s ? 'white' : 'var(--dark)', cursor: 'pointer', fontSize: '0.83rem', textTransform: 'capitalize' }}>
                {s} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
            <p>No orders {filter ? `with status "${filter}"` : 'yet'}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(order => (
              <div key={order.id} className="card-cravio" style={{ padding: '18px 22px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700 }}>Order #{order.id}</span>
                      <span style={{
                        backgroundColor: order.order_type === 'offline' ? '#EAF0E9' : '#F4EFE6',
                        color: order.order_type === 'offline' ? '#3B4F39' : '#C27047',
                        padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        {order.order_type === 'offline' ? '🛍️ POS Offline' : '🛵 Online Delivery'}
                      </span>
                      <span className={statusClass(order.status)} style={{ textTransform: 'capitalize' }}>{order.status}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>👤 {order.customer_name || 'Customer'} · {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--olive)' }}>₹{parseFloat(order.total_amount).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {order.items?.map(item => (
                    <span key={item.id} style={{ fontSize: '0.8rem', background: 'var(--cream)', padding: '2px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>{item.food_name} × {item.quantity}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {order.delivery_address}</span>
                  {!['delivered', 'cancelled'].includes(order.status) && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {order.status === 'pending' && (<><button onClick={() => updateStatus(order.id, 'accepted')} style={{ padding: '5px 12px', background: '#d4edda', border: 'none', borderRadius: '6px', color: '#155724', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>✓ Accept</button><button onClick={() => updateStatus(order.id, 'cancelled')} style={{ padding: '5px 12px', background: '#f8d7da', border: 'none', borderRadius: '6px', color: '#721c24', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>✗ Reject</button></>)}
                      {order.status === 'accepted' && <button onClick={() => updateStatus(order.id, 'preparing')} style={{ padding: '5px 12px', background: '#cce5ff', border: 'none', borderRadius: '6px', color: '#004085', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>🍳 Preparing</button>}
                      {order.status === 'preparing' && <button onClick={() => updateStatus(order.id, 'ready')} style={{ padding: '5px 12px', background: 'var(--olive-pale)', border: 'none', borderRadius: '6px', color: 'var(--olive)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>✅ Ready</button>}
                      {order.status === 'ready' && <button onClick={() => updateStatus(order.id, 'delivered')} style={{ padding: '5px 12px', background: '#d4edda', border: 'none', borderRadius: '6px', color: '#155724', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>🚚 Delivered</button>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Offline POS Order Modal ── */}
        {showOfflineModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ backgroundColor: 'white', borderRadius: 16, maxWidth: 650, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>Record Offline / POS Walk-In Order</h3>
                <button onClick={() => setShowOfflineModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#707572' }}>✕</button>
              </div>

              <form onSubmit={handleCreateOfflineOrder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Customer / Table Name</label>
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Table 4 or Walk-In Diner"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #EAE6DF', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Notes / Order Tag</label>
                    <input
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Counter Cash Payment"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #EAE6DF', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Select Dishes from Menu</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 150, overflowY: 'auto', padding: 8, border: '1px solid #EAE6DF', borderRadius: 8 }}>
                    {menuItems.map(item => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleAddItemToPOS(item)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #3B4F39', backgroundColor: '#EAF0E9', color: '#3B4F39', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        + {item.name} (₹{item.price})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Items */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Order Items Summary</label>
                  {selectedItems.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: '#707572', padding: 12, border: '1px dashed #EAE6DF', borderRadius: 8, textAlign: 'center' }}>Click dishes above to add to this POS order.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedItems.map(i => (
                        <div key={i.food} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F8F6', padding: '8px 12px', borderRadius: 6 }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{i.food_name} × {i.quantity}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3B4F39' }}>₹{i.price * i.quantity}</span>
                            <button type="button" onClick={() => handleRemoveItemFromPOS(i.food)} style={{ color: '#C27047', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #EAE6DF', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3B4F39' }}>Total: ₹{calculatePOSTotal()}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowOfflineModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #EAE6DF', backgroundColor: 'white', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={submittingPOS} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: '#3B4F39', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                      {submittingPOS ? 'Recording...' : 'Complete POS Order ✓'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

