import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { setLocation as saveLocStore } from '../lib/locationStore';

const INDIAN_STATES = [
  '', 'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry','Jammu & Kashmir','Ladakh',
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
    email:      user?.email      || '',
    city:       user?.city       || '',
    state:      user?.state      || '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.patch('/users/profile/', form);
      updateUser(res.data);
      // Keep location store in sync with profile
      if (form.city || form.state) {
        saveLocStore({ city: form.city || '', state: form.state || '' });
      }
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg('Failed to update profile.');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const roleLabel = { customer: 'Customer', owner: 'Restaurant Owner', admin: 'Super Admin' };

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio" style={{ maxWidth: '560px' }}>
        <h1 className="section-title" style={{ marginBottom: '28px' }}>My Profile</h1>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '32px', boxShadow: '0 4px 20px rgba(74,92,63,0.06)' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', fontWeight: 700 }}>
              {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '4px' }}>{user?.first_name} {user?.last_name}</h2>
              <span style={{ fontSize: '0.85rem', background: 'var(--olive-pale)', color: 'var(--olive)', padding: '3px 12px', borderRadius: '20px', fontWeight: 500 }}>
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>
          </div>

          {msg && (
            <div style={{ background: msg.includes('success') ? '#d4edda' : '#fef2f2', border: `1px solid ${msg.includes('success') ? '#c3e6cb' : '#fca5a5'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', color: msg.includes('success') ? '#155724' : '#c0392b', fontSize: '0.88rem' }}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>First Name</label>
                <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label>Last Name</label>
                <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label>Phone Number</label>
              <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            {/* Location — drives personalised trending */}
            <div style={{ background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--border)', padding: '14px 16px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--olive)', letterSpacing: '0.5px', marginBottom: 10, textTransform: 'uppercase' }}>
                Your Location
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                Set your city and state to get personalised trending restaurant suggestions on the home page.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>City</label>
                  <input placeholder="e.g. Mumbai" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label>State</label>
                  <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label>Role</label>
              <input value={roleLabel[user?.role] || user?.role} disabled style={{ background: 'var(--cream)', cursor: 'not-allowed' }} />
            </div>
            <button type="submit" className="btn-olive" style={{ padding: '12px', borderRadius: '9px', opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
