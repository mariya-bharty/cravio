import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useLocationStore, detectCurrentLocation } from '../lib/locationStore';

const CUISINES = [
  { label: 'North Indian', color: '#D5865C', emoji: '🍛' },
  { label: 'Italian', color: '#A6B98F', emoji: '🍕' },
  { label: 'Chinese', color: '#E6C687', emoji: '🥢' },
  { label: 'Cafe', color: '#C27047', emoji: '☕' },
  { label: 'Biryani', color: '#60705E', emoji: '🍚' },
  { label: 'Pizza', color: '#EED9C4', emoji: '🍕' },
  { label: 'Desserts', color: '#8A9A86', emoji: '🍰' },
  { label: 'Surprise Me!', color: '#3B4F39', emoji: '🎲' },
];

const NUM_SEGMENTS = CUISINES.length;
const SLICE_ANGLE = 360 / NUM_SEGMENTS;

export default function SpinWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [locDetecting, setLocDetecting] = useState(false);
  const currentRotRef = useRef(0);
  const navigate = useNavigate();
  const { location: savedLoc, hasLocation } = useLocationStore();

  const fetchRestaurant = async (cuisine) => {
    const city = savedLoc?.city || '';
    const state = savedLoc?.state || '';
    const { data } = await api.get('/restaurants/random/', {
      params: { cuisine, city, state },
    });
    return data;
  };

  const spin = async () => {
    if (spinning || loading) return;
    setResult(null);
    setShowResult(false);
    setError('');

    // If no location saved, try to auto-detect first
    if (!hasLocation) {
      setLocDetecting(true);
      detectCurrentLocation(
        () => { setLocDetecting(false); doSpin(); },
        () => { setLocDetecting(false); doSpin(); }, // spin anyway even if detection fails
        () => { },
      );
      return;
    }

    doSpin();
  };

  const doSpin = () => {
    const extraSpins = 6 + Math.floor(Math.random() * 4);
    const winningIndex = Math.floor(Math.random() * NUM_SEGMENTS);
    const landed = CUISINES[winningIndex];

    const segmentCenterAngle = winningIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    const targetModuloAngle = (360 - segmentCenterAngle) % 360;

    const currentModulo = ((currentRotRef.current % 360) + 360) % 360;
    let distance = targetModuloAngle - currentModulo;
    if (distance <= 0) distance += 360;

    const finalRotation = currentRotRef.current + extraSpins * 360 + distance;

    setSpinning(true);
    setRotation(finalRotation);
    currentRotRef.current = finalRotation;

    setTimeout(async () => {
      setSpinning(false);
      const cuisine = landed.label === 'Surprise Me!' ? '' : landed.label;

      setLoading(true);
      try {
        const data = await fetchRestaurant(cuisine);
        setResult({ restaurant: data, cuisine: landed });
        setShowResult(true);
      } catch (err) {
        const msg = err.response?.data?.detail || `No restaurants found in ${savedLoc?.city || 'your area'}. Try setting or changing your location!`;
        setError(msg);
      } finally {
        setLoading(false);
      }
    }, 4200);
  };

  const locationLabel = savedLoc?.display || null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.badge}>DECISION HELPER</span>
        <h2 style={styles.title}>Crave Roulette</h2>
        <p style={styles.sub}>Can't decide where to eat? Spin the wheel to get a restaurant recommendation in your area.</p>
        {locationLabel && (
          <div style={styles.locationPill}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Finding places in {locationLabel}
          </div>
        )}
      </div>

      <div style={styles.wheelArea}>
        <div style={styles.wheelContainer}>
          <div style={styles.pointer}>▼</div>

          <div style={{
            ...styles.wheelSvgWrap,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4.2s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
          }}>
            <svg viewBox="0 0 200 200" width="280" height="280">
              {CUISINES.map((cuisine, i) => {
                const startAngle = i * SLICE_ANGLE - 90;
                const endAngle = startAngle + SLICE_ANGLE;
                const s = (a) => Math.sin((a * Math.PI) / 180);
                const c = (a) => Math.cos((a * Math.PI) / 180);
                const r = 98;
                const cx = 100, cy = 100;
                const x1 = cx + r * c(startAngle);
                const y1 = cy + r * s(startAngle);
                const x2 = cx + r * c(endAngle);
                const y2 = cy + r * s(endAngle);
                const mx = cx + (r * 0.65) * c(startAngle + SLICE_ANGLE / 2);
                const my = cy + (r * 0.65) * s(startAngle + SLICE_ANGLE / 2);
                return (
                  <g key={i}>
                    <path
                      d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
                      fill={cuisine.color}
                      stroke="#F4EFE6"
                      strokeWidth="1.5"
                    />
                    <text
                      x={mx} y={my}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {cuisine.emoji}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="18" fill="#3B4F39" stroke="#F4EFE6" strokeWidth="2.5" />
              <text x="100" y="105" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">C</text>
            </svg>
          </div>
        </div>

        <button
          id="spin-wheel-btn"
          onClick={spin}
          disabled={spinning || loading || locDetecting}
          style={{
            ...styles.spinBtn,
            opacity: (spinning || loading || locDetecting) ? 0.75 : 1,
          }}
        >
          {locDetecting ? 'Detecting location...' : spinning ? 'Spinning wheel...' : loading ? 'Finding restaurant...' : 'Spin the Wheel'}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {showResult && result && (
        <div style={styles.resultOverlay} onClick={() => setShowResult(false)}>
          <div style={styles.resultCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.resultBadge, background: result.cuisine.color, color: result.cuisine.color === '#EED9C4' ? '#3A3D3B' : '#FFFFFF' }}>
              {result.cuisine.emoji} Result: {result.cuisine.label}
            </div>
            <button style={styles.closeBtn} onClick={() => setShowResult(false)}>✕</button>
            {result.restaurant.image && (
              <img
                src={result.restaurant.image}
                alt={result.restaurant.name}
                style={styles.resultImg}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={styles.resultBody}>
              <h3 style={styles.resultName}>{result.restaurant.name}</h3>
              <p style={styles.resultCity}>📍 {result.restaurant.city}{result.restaurant.state ? `, ${result.restaurant.state}` : ''}</p>
              <div style={styles.resultMeta}>
                <span style={styles.metaChip}>⭐ {result.restaurant.average_rating?.toFixed(1) || '4.2'}</span>
                <span style={styles.metaChip}>🍴 {result.restaurant.cuisine}</span>
              </div>
              {result.restaurant.description && (
                <p style={styles.resultDesc}>{result.restaurant.description.slice(0, 110)}...</p>
              )}
              <div style={styles.resultActions}>
                <button
                  style={styles.viewBtn}
                  onClick={() => navigate(`/restaurants/${result.restaurant.id}`)}
                >
                  View Menu
                </button>
                <button style={styles.reSpinBtn} onClick={() => { setShowResult(false); setTimeout(() => doSpin(), 100); }}>
                  Spin Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EAE6DF',
    borderRadius: '16px',
    padding: '36px 30px',
    margin: '30px 0',
    textAlign: 'center',
    position: 'relative',
    boxShadow: '0 4px 20px rgba(59, 79, 57, 0.04)',
  },
  header: { marginBottom: '28px' },
  badge: {
    backgroundColor: '#F8EDE7',
    color: '#C27047',
    padding: '4px 14px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '1.2px',
    display: 'inline-block',
    marginBottom: '12px',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2.1rem',
    fontWeight: 700,
    color: '#3B4F39',
    margin: '0 0 8px',
  },
  sub: { color: '#707572', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 },
  locationPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    padding: '4px 14px',
    borderRadius: 20,
    backgroundColor: '#EAF0E9',
    color: '#3B4F39',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  wheelArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
  wheelContainer: { position: 'relative', display: 'inline-block', padding: '10px' },
  pointer: {
    position: 'absolute',
    top: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '24px',
    color: '#C27047',
    zIndex: 10,
  },
  wheelSvgWrap: {
    display: 'block',
    borderRadius: '50%',
    boxShadow: '0 8px 30px rgba(59, 79, 57, 0.08), 0 0 0 6px #F4EFE6',
  },
  spinBtn: {
    backgroundColor: '#3B4F39',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 36px',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 2px 8px rgba(59, 79, 57, 0.15)',
  },
  error: { color: '#C27047', fontSize: '0.85rem', marginTop: '8px' },
  resultOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(28, 30, 29, 0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
  },
  resultCard: {
    background: '#FFFFFF',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '400px',
    border: '1px solid #EAE6DF',
    boxShadow: '0 10px 40px rgba(59, 79, 57, 0.12)',
    overflow: 'hidden',
    position: 'relative',
    textAlign: 'left',
  },
  resultBadge: {
    fontWeight: 700, padding: '10px 18px',
    fontSize: '0.8rem', letterSpacing: '0.5px',
  },
  closeBtn: {
    position: 'absolute', top: '8px', right: '12px',
    background: 'rgba(255,255,255,0.4)', border: 'none',
    color: '#3B4F39', width: '26px', height: '26px',
    borderRadius: '50%', cursor: 'pointer', fontSize: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  resultImg: { width: '100%', height: '170px', objectFit: 'cover' },
  resultBody: { padding: '20px' },
  resultName: { fontFamily: "'Playfair Display', serif", color: '#1C1E1D', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px' },
  resultCity: { color: '#707572', fontSize: '0.85rem', marginBottom: '14px' },
  resultMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' },
  metaChip: {
    background: '#F4EFE6', color: '#3A3D3B',
    padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
  },
  resultDesc: { color: '#707572', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '18px' },
  resultActions: { display: 'flex', gap: '10px' },
  viewBtn: {
    flex: 1, backgroundColor: '#3B4F39',
    color: '#FFFFFF', border: 'none', borderRadius: '8px',
    padding: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
    textAlign: 'center',
  },
  reSpinBtn: {
    backgroundColor: 'transparent', color: '#3B4F39', border: '1px solid #3B4F39',
    borderRadius: '8px', padding: '12px 18px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
  },
};
