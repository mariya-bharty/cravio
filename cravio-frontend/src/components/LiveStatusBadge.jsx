import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const LEVEL_CONFIG = {
  'Low':       { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  pulse: false },
  'Moderate':  { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  pulse: false },
  'Busy':      { color: '#f97316', bg: 'rgba(249,115,22,0.12)', pulse: true  },
  'Very Busy': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  pulse: true  },
};

export default function LiveStatusBadge({ restaurantId, showWait = false }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get(`/restaurants/${restaurantId}/live-status/`);
      setStatus(data);
    } catch {
      // silently fail — badge won't block render
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 120_000);
    return () => clearInterval(intervalRef.current);
  }, [restaurantId]);

  if (loading || !status) return null;

  const cfg = LEVEL_CONFIG[status.crowd_level] || LEVEL_CONFIG['Low'];

  return (
    <div
      id={`live-status-${restaurantId}`}
      title={`Updated live · ${status.recent_orders} recent orders`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
        borderRadius: '20px',
        padding: '3px 10px',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: cfg.color,
        letterSpacing: '0.3px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {cfg.pulse && (
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          border: `1px solid ${cfg.color}`,
          animation: 'liveStatusPulse 1.5s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      <span style={{
        width: '7px', height: '7px',
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
      }} />
      {status.crowd_level}
      {showWait && (
        <span style={{ opacity: 0.75 }}>· ~{status.estimated_wait}m wait</span>
      )}
    </div>
  );
}
