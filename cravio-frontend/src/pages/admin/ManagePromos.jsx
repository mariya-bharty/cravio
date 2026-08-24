import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../api/axios';

export default function ManagePromos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '0',
    max_discount_amount: '',
    first_order_only: false,
    one_time_per_user: true,
    is_active: true,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPromos = () => {
    setLoading(true);
    api.get('/orders/promos/')
      .then(res => setPromos(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '0',
      max_discount_amount: '',
      first_order_only: false,
      one_time_per_user: true,
      is_active: true,
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order_amount: promo.min_order_amount || '0',
      max_discount_amount: promo.max_discount_amount || '',
      first_order_only: promo.first_order_only,
      one_time_per_user: promo.one_time_per_user,
      is_active: promo.is_active,
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleToggleActive = async (promo) => {
    try {
      const res = await api.patch(`/orders/promos/${promo.id}/`, { is_active: !promo.is_active });
      setPromos(prev => prev.map(p => p.id === promo.id ? res.data : p));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await api.delete(`/orders/promos/${id}/`);
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete promo code.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) { setErrorMsg('Code is required.'); return; }
    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      setErrorMsg('Please enter a valid discount value.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const payload = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: parseFloat(formData.min_order_amount || 0),
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      first_order_only: formData.first_order_only,
      one_time_per_user: formData.one_time_per_user,
      is_active: formData.is_active,
    };

    try {
      if (editingPromo) {
        const res = await api.patch(`/orders/promos/${editingPromo.id}/`, payload);
        setPromos(prev => prev.map(p => p.id === editingPromo.id ? res.data : p));
      } else {
        const res = await api.post('/orders/promos/', payload);
        setPromos(prev => [res.data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.code?.[0] || 'Failed to save promo code.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = promos.filter(p => {
    const matchesFilter = filter === 'all' ? true : filter === 'active' ? p.is_active : !p.is_active;
    const matchesSearch = !search || p.code.toLowerCase().includes(search.toLowerCase()) ||
                          p.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, margin: '0 0 4px' }}>
              Manage Promo Codes
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Create, configure validation rules, and control platform discounts.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="btn-olive"
            style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>+</span> Create Promo Code
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '22px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-cravio" style={{ flex: '1', minWidth: '220px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search code or description..."
              style={{ padding: '9px 14px' }}
            />
          </div>
          {[
            ['all', 'All Promos'],
            ['active', 'Active Only'],
            ['inactive', 'Inactive Only'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '8px 14px', borderRadius: '20px',
                border: `1.5px solid ${filter === val ? 'var(--olive)' : 'var(--border)'}`,
                background: filter === val ? 'var(--olive)' : 'white',
                color: filter === val ? 'white' : 'var(--dark)',
                cursor: 'pointer', fontSize: '0.83rem', whiteSpace: 'nowrap', fontWeight: 500
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading promo codes...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏷️</div>
            <p>No promo codes found.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead style={{ background: 'var(--cream)' }}>
                <tr>
                  {['Code', 'Discount', 'Validation Rules', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((promo, i) => (
                  <tr key={promo.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--cream)' : 'white' }}>
                    {/* Code */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--olive)', letterSpacing: '0.5px' }}>
                        {promo.code}
                      </div>
                      {promo.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{promo.description}</div>
                      )}
                    </td>

                    {/* Discount */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--dark)' }}>
                        {promo.discount_type === 'percentage' ? `${parseFloat(promo.discount_value)}% OFF` : `₹${parseFloat(promo.discount_value)} OFF`}
                      </span>
                      {promo.discount_type === 'percentage' && promo.max_discount_amount && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Up to ₹{parseFloat(promo.max_discount_amount)}</div>
                      )}
                    </td>

                    {/* Rules */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem' }}>
                        {parseFloat(promo.min_order_amount) > 0 ? (
                          <span style={{ color: 'var(--dark-soft)' }}>• Min order: <strong>₹{parseFloat(promo.min_order_amount)}</strong></span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>• No min order</span>
                        )}
                        {promo.first_order_only && (
                          <span style={{ color: '#b91c1c', fontWeight: 600 }}>• First-time orders only</span>
                        )}
                        {promo.one_time_per_user && (
                          <span style={{ color: 'var(--text-muted)' }}>• 1 time use per user</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleToggleActive(promo)}
                        title="Click to toggle active status"
                        style={{
                          border: 'none', background: 'transparent', cursor: 'pointer', padding: 0
                        }}
                      >
                        <span style={{
                          fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', fontWeight: 600,
                          background: promo.is_active ? '#d4edda' : '#f8d7da',
                          color: promo.is_active ? '#155724' : '#721c24',
                          display: 'inline-block'
                        }}>
                          {promo.is_active ? '✓ Active' : '✕ Inactive'}
                        </span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleOpenEdit(promo)}
                          style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for Add / Edit */}
        {showModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: 'white', borderRadius: 14, width: '100%', maxWidth: 540,
              padding: 28, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Promo Code Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME20, FEAST100"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20% off on orders above ₹200"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Discount Type *
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      {formData.discount_type === 'percentage' ? 'Percentage Off (%) *' : 'Flat Discount (₹) *'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={formData.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                      value={formData.discount_value}
                      onChange={e => setFormData({ ...formData, discount_value: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Minimum Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0 for no minimum"
                      value={formData.min_order_amount}
                      onChange={e => setFormData({ ...formData, min_order_amount: e.target.value })}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>e.g. 200 for orders ₹200+</span>
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Maximum Discount Cap (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Optional cap"
                        value={formData.max_discount_amount}
                        onChange={e => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Leave blank for no limit</span>
                    </div>
                  )}
                </div>

                {/* Checkboxes / Rules */}
                <div style={{ background: 'var(--cream)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--dark-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Validation Rules
                  </span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.first_order_only}
                      onChange={e => setFormData({ ...formData, first_order_only: e.target.checked })}
                    />
                    <span>First-time order only (User must have 0 previous orders)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.one_time_per_user}
                      onChange={e => setFormData({ ...formData, one_time_per_user: e.target.checked })}
                    />
                    <span>Limit to 1-time usage per customer</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Is Active & Available for Customers</span>
                  </label>
                </div>

                {errorMsg && (
                  <p style={{ color: '#c0392b', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
                    {errorMsg}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-olive"
                    disabled={saving}
                    style={{ padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? 'Saving...' : editingPromo ? 'Update Promo Code' : 'Create Promo Code'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
