import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../api/axios';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users/')
      .then(res => setUsers(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.role === 'admin') {
      alert('Admin accounts cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${targetUser.email}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/users/${targetUser.id}/`);
      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const roleLabel = { customer: '🙋 Customer', owner: '🏪 Owner', admin: '⚙️ Admin' };

  const filtered = users.filter(u =>
    (!filter || u.role === filter) &&
    (!search || u.email?.toLowerCase().includes(search.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: '24px' }}>Manage Users</h1>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '22px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-cravio" style={{ flex: '1', minWidth: '200px' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." style={{ padding: '9px 14px' }} />
          </div>
          {[['', 'All'], ['customer', '🙋 Customers'], ['owner', '🏪 Owners'], ['admin', '⚙️ Admins']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: '8px 14px', borderRadius: '20px', border: `1.5px solid ${filter === val ? 'var(--olive)' : 'var(--border)'}`, background: filter === val ? 'var(--olive)' : 'white', color: filter === val ? 'white' : 'var(--dark)', cursor: 'pointer', fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👥</div>
            <p>No users found.</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>{filtered.length} users</p>
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead style={{ background: 'var(--cream)' }}>
                  <tr>{['Name', 'Email', 'Phone', 'Role', 'Joined', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => (
                    <tr key={user.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--cream)' : 'white' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--olive)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                            {user.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span style={{ fontWeight: 500 }}>{user.first_name} {user.last_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{user.email}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{user.phone || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.8rem', background: user.role === 'admin' ? 'var(--terracotta-pale)' : user.role === 'owner' ? 'var(--olive-pale)' : 'var(--cream-dark)', color: user.role === 'admin' ? 'var(--terracotta)' : user.role === 'owner' ? 'var(--olive)' : 'var(--dark)', padding: '2px 10px', borderRadius: '20px', fontWeight: 500 }}>
                          {roleLabel[user.role] || user.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {user.role === 'admin' ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Protected</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            style={{
                              padding: '5px 12px',
                              background: '#f8d7da',
                              border: '1px solid #f5c6cb',
                              borderRadius: '6px',
                              color: '#721c24',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
