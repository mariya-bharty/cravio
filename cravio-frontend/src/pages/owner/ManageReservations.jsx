import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../../components/OwnerSidebar';
import api from '../../api/axios';

export default function ManageReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reservations/restaurant/')
      .then(res => setReservations(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/reservations/${id}/`, { status });
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: res.data.status } : r));
    } catch { alert('Failed to update reservation.'); }
  };

  const statusClass = (s) => `status-${s?.toLowerCase()}`;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <OwnerSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: '24px' }}>Reservations</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : reservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🪑</div>
            <p>No reservations yet.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead style={{ background: 'var(--cream)' }}>
                <tr>{['Customer', 'Date', 'Time', 'Guests', 'Requests', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {reservations.map((res, i) => (
                  <tr key={res.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--cream)' : 'white' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 500 }}>{res.customer_name || 'Guest'}</td>
                    <td style={{ padding: '12px 14px' }}>{new Date(res.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td style={{ padding: '12px 14px' }}>{res.time}</td>
                    <td style={{ padding: '12px 14px' }}>👥 {res.guests}</td>
                    <td style={{ padding: '12px 14px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{res.special_requests || '—'}</td>
                    <td style={{ padding: '12px 14px' }}><span className={statusClass(res.status)} style={{ textTransform: 'capitalize' }}>{res.status}</span></td>
                    <td style={{ padding: '12px 14px' }}>
                      {res.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => updateStatus(res.id, 'confirmed')} style={{ padding: '4px 10px', background: '#d4edda', border: 'none', borderRadius: '5px', color: '#155724', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}>✓ Confirm</button>
                          <button onClick={() => updateStatus(res.id, 'cancelled')} style={{ padding: '4px 10px', background: '#f8d7da', border: 'none', borderRadius: '5px', color: '#721c24', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}>✗ Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
