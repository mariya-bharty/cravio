import React, { useState, useEffect, useRef } from 'react';

const STEPS = [
  { key: 'pending',   label: 'Order Placed',  icon: '📋', desc: 'Your order has been received' },
  { key: 'accepted',  label: 'Confirmed',      icon: '✅', desc: 'Restaurant accepted your order' },
  { key: 'preparing', label: 'Preparing',      icon: '👨‍🍳', desc: 'Your food is being prepared' },
  { key: 'ready',     label: 'Ready',          icon: '📦', desc: 'Order is packed and ready!' },
  { key: 'delivered', label: 'Delivered',      icon: '🎉', desc: 'Enjoy your meal!' },
];

export default function OrderTracker({ orderId, initialStatus = 'pending', token }) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [stepIndex, setStepIndex] = useState(
    STEPS.findIndex(s => s.key === initialStatus) ?? 0
  );
  const [connected, setConnected] = useState(false);
  const [done, setDone] = useState(['delivered', 'cancelled'].includes(initialStatus));
  const [restaurant, setRestaurant] = useState('');

  useEffect(() => {
    if (!orderId || done) return;

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const url = `${API_BASE}/orders/${orderId}/track/`;

    let aborted = false;
    const controller = new AbortController();

    const startStream = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (!response.ok) return;
        setConnected(true);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!aborted) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const chunk of lines) {
            const dataLine = chunk.replace(/^data:\s*/, '').trim();
            if (!dataLine) continue;
            try {
              const payload = JSON.parse(dataLine);
              if (payload.error) { setConnected(false); break; }
              if (payload.done) { setDone(true); setConnected(false); break; }

              setCurrentStatus(payload.status);
              setStepIndex(payload.step_index ?? 0);
              if (payload.restaurant) setRestaurant(payload.restaurant);
            } catch {}
          }
        }
      } catch (err) {
        if (!aborted) setConnected(false);
      }
    };

    startStream();

    return () => {
      aborted = true;
      controller.abort();
      setConnected(false);
    };
  }, [orderId, token, done]);

  const activeStep = STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div id={`order-tracker-${orderId}`} style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.orderNum}>Order #{orderId}</span>
        {restaurant && <span style={styles.restaurantName}>from {restaurant}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            ...styles.liveDot,
            background: connected ? '#22c55e' : (done ? '#6366f1' : '#9ca3af'),
          }} />
          <span style={styles.liveLabel}>
            {connected ? 'Live' : done ? 'Completed' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div style={styles.progressTrack}>
        <div style={{
          ...styles.progressFill,
          width: `${(activeStep / (STEPS.length - 1)) * 100}%`,
        }} />
      </div>

      <div style={styles.stepsRow}>
        {STEPS.map((step, i) => {
          const isActive  = i === activeStep;
          const isCompleted = i < activeStep;
          const isFuture  = i > activeStep;
          return (
            <div key={step.key} style={styles.stepCol}>
              <div style={{
                ...styles.stepIcon,
                background: isCompleted ? '#6366f1' : isActive ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                border: isActive ? '2px solid #a78bfa' : '2px solid transparent',
                opacity: isFuture ? 0.4 : 1,
              }}>
                {isCompleted ? '✓' : step.icon}
              </div>
              <span style={{
                ...styles.stepLabel,
                color: isActive ? '#a78bfa' : isCompleted ? '#fff' : 'rgba(255,255,255,0.4)',
                fontWeight: isActive ? 700 : 500,
              }}>{step.label}</span>
            </div>
          );
        })}
      </div>

      <div style={styles.currentDesc}>
        {currentStatus === 'cancelled'
          ? '❌ This order was cancelled.'
          : `${STEPS[activeStep]?.icon || ''} ${STEPS[activeStep]?.desc || ''}`}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    background: 'linear-gradient(135deg, #1e1b4b 0%, #1a1a2e 100%)',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(99,102,241,0.2)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap',
    gap: '10px', marginBottom: '20px',
  },
  orderNum: { color: '#fff', fontWeight: 800, fontSize: '1rem' },
  restaurantName: { color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', flex: 1 },
  liveDot: {
    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
  },
  liveLabel: { color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 600 },
  progressTrack: {
    height: '4px', background: 'rgba(255,255,255,0.08)',
    borderRadius: '4px', marginBottom: '24px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
    borderRadius: '4px',
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  stepsRow: {
    display: 'flex', justifyContent: 'space-between',
    gap: '4px', marginBottom: '20px',
  },
  stepCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 },
  stepIcon: {
    width: '44px', height: '44px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.2rem', color: '#fff', cursor: 'default',
  },
  stepLabel: { fontSize: '0.7rem', textAlign: 'center', letterSpacing: '0.2px' },
  currentDesc: {
    textAlign: 'center', color: 'rgba(255,255,255,0.65)',
    fontSize: '0.88rem', padding: '12px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
  },
};
