import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../api/axios';

const STAR = '★';

function TrendingBadge({ score }) {
  const color = score >= 70 ? '#155724' : score >= 40 ? '#856404' : '#555';
  const bg = score >= 70 ? '#d4edda' : score >= 40 ? '#fff3cd' : '#f0f0f0';
  return (
    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, background: bg, color, fontWeight: 600 }}>
      {score.toFixed(0)} pts
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total_restaurants: 0, pending_restaurants: 0, approved_restaurants: 0, total_users: 0, total_orders: 0, orders_last_7_days: 0, total_revenue: 0, revenue_last_30_days: 0, top_states: [] });
  const [recentRestaurants, setRecentRestaurants] = useState([]);
  const [trending, setTrending] = useState([]);
  const [stateMap, setStateMap] = useState({});
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats/'),
      api.get('/restaurants/?limit=5'),
    ]).then(([sRes, rRes]) => {
      setStats(sRes.data);
      setRecentRestaurants(Array.isArray(rRes.data) ? rRes.data : (rRes.data.results || []));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/restaurants/trending/?limit=10'),
      api.get('/restaurants/trending/by-state/?limit=3'),
    ]).then(([tRes, sRes]) => {
      setTrending(tRes.data.results || []);
      setStateMap(sRes.data || {});
      const states = Object.keys(sRes.data || {});
      if (states.length) setSelectedState(states[0]);
    }).catch(console.error)
      .finally(() => setTrendLoading(false));
  }, []);

  const STAT_CARDS = [
    { icon: '🏪', label: 'Total Restaurants', value: stats.total_restaurants, color: 'var(--olive)' },
    { icon: '⏳', label: 'Pending Approval', value: stats.pending_restaurants, color: 'var(--terracotta)' },
    { icon: '👥', label: 'Users', value: stats.total_users, color: '#2d6a4f' },
    { icon: '📦', label: 'Total Orders', value: stats.total_orders, color: '#6b4226' },
    { icon: '📈', label: 'Orders (7 days)', value: stats.orders_last_7_days, color: '#1a535c' },
    { icon: '💰', label: 'Revenue (30 days)', value: `₹${parseFloat(stats.revenue_last_30_days || 0).toFixed(0)}`, color: '#155724' },
  ];

  const stateList = Object.keys(stateMap).sort();
  const stateRestaurants = selectedState ? (stateMap[selectedState] || []) : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Platform Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Super Admin Dashboard</p>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          {STAT_CARDS.map(card => (
            <div key={card.label} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{loading ? '—' : card.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {[
            { to: '/admin/restaurants', icon: '🏪', label: 'Restaurants', badge: stats.pending_restaurants },
            { to: '/admin/users', icon: '👥', label: 'Users' },
          ].map(action => (
            <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
              <div className="card-cravio" style={{ padding: '22px', textAlign: 'center', position: 'relative', background: 'white' }}>
                {action.badge > 0 && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--terracotta)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{action.badge}</span>
                )}
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{action.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark)' }}>{action.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Top Active States (from stats) ── */}
        {!loading && stats.top_states && stats.top_states.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '14px' }}>Top Active States (by orders)</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {stats.top_states.map((s, i) => (
                <div key={s.state} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '14px 20px', minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: i === 0 ? 'var(--terracotta)' : 'var(--olive)' }}>#{i + 1}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.state}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.top_restaurant}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--olive)', marginTop: 4, fontWeight: 600 }}>{s.recent_orders} orders / 30d</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Trending Restaurants — National ── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Trending Restaurants — National</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Scored by order volume (50%), rating (30%), review count (20%)</p>
            </div>
            <Link to="/admin/restaurants" style={{ color: 'var(--olive)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
          </div>

          {trendLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading trending data...</div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead style={{ background: 'var(--cream)' }}>
                  <tr>
                    {['Rank', 'Restaurant', 'City', 'State', 'Cuisine', 'Rating', 'Orders (30d)', 'Score'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trending.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--cream)' : 'white' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: i < 3 ? 'var(--terracotta)' : 'var(--text-muted)', fontSize: i < 3 ? '1rem' : '0.88rem' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{r.city}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{r.state}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.cuisine}</td>
                      <td style={{ padding: '11px 14px', color: '#856404', fontWeight: 600 }}>{STAR} {r.average_rating}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--olive)' }}>{r.recent_orders}</td>
                      <td style={{ padding: '11px 14px' }}><TrendingBadge score={r.trending_score} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Trending by State ── */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '14px' }}>Trending by State</h2>

          {/* State selector tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {stateList.map(state => (
              <button
                key={state}
                onClick={() => setSelectedState(state)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
                  border: `1.5px solid ${selectedState === state ? 'var(--olive)' : 'var(--border)'}`,
                  background: selectedState === state ? 'var(--olive)' : 'white',
                  color: selectedState === state ? 'white' : 'var(--dark)',
                  fontWeight: selectedState === state ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {state}
              </button>
            ))}
          </div>

          {trendLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {stateRestaurants.map((r, i) => (
                <div key={r.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: i === 0 ? 'var(--terracotta)' : 'var(--dark)' }}>
                      {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}{r.name}
                    </span>
                    <TrendingBadge score={r.trending_score} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{r.cuisine}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>📍 {r.city}</div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem' }}>
                    <span style={{ color: '#856404', fontWeight: 600 }}>{STAR} {r.average_rating}</span>
                    <span style={{ color: 'var(--olive)', fontWeight: 600 }}>{r.recent_orders} orders/30d</span>
                  </div>
                </div>
              ))}
              {stateRestaurants.length === 0 && (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
                  No data for {selectedState} yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Recent Restaurants ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Recently Registered</h2>
            <Link to="/admin/restaurants" style={{ color: 'var(--olive)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {recentRestaurants.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No restaurants yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead style={{ background: 'var(--cream)' }}>
                  <tr>{['Name', 'Owner', 'City', 'State', 'Cuisine', 'Status'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {recentRestaurants.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--cream)' : 'white' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 500 }}>{r.name}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{r.owner_name || '—'}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{r.city}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{r.state || '—'}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{r.cuisine}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: '0.78rem', textTransform: 'capitalize', padding: '2px 10px', borderRadius: '20px', background: r.status === 'approved' ? '#d4edda' : r.status === 'pending' ? '#fff3cd' : '#f8d7da', color: r.status === 'approved' ? '#155724' : r.status === 'pending' ? '#856404' : '#721c24' }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
