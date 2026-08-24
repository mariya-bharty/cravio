import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getLocation } from '../lib/locationStore';

const TOTAL_ROUNDS = 5;

export default function FlavorDuel() {
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(1);
  const [exclude, setExclude] = useState([]);
  const [champion, setChampion] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [pickedSide, setPickedSide] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const startDuel = useCallback(async () => {
    setLoading(true);
    setError('');
    setLeft(null);
    setRight(null);
    setExclude([]);
    setChampion(null);
    setRound(1);
    setPickedSide(null);

    try {
      const loc = getLocation();
      const { data } = await api.get('/restaurants/duel/', {
        params: { city: loc?.city || '', count: 2 },
      });
      if (Array.isArray(data) && data.length >= 2) {
        setLeft(data[0]);
        setRight(data[1]);
        setExclude([data[0].id, data[1].id]);
      } else {
        setError('Not enough restaurants found in your city for a duel.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Not enough restaurants found in your city for a duel.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { startDuel(); }, [startDuel]);

  const pickWinner = async (side) => {
    if (animating || !left || !right) return;
    setPickedSide(side);
    setAnimating(true);
  
    const winner = side === 0 ? left : right;

    if (round >= TOTAL_ROUNDS) {
      setTimeout(() => {
        setChampion(winner);
        setAnimating(false);
      }, 800);
      return;
    }

    try {
      const loc = getLocation();
      const nextExclude = [...exclude];
      const { data } = await api.get('/restaurants/duel/', {
        params: {
          city: loc?.city || '',
          count: 1,
          exclude: nextExclude.join(','),
        },
      });

      const newContender = Array.isArray(data) ? data[0] : data;

      if (!newContender) {
        throw new Error('No more contenders');
      }

      setTimeout(() => {
        if (side === 0) {
          setRight(newContender);
        } else {
          setLeft(newContender);
        }
        setExclude([...nextExclude, newContender.id]);
        setRound(round + 1);
        setPickedSide(null);
        setAnimating(false);
      }, 800);

    } catch {
      setAnimating(false);
      setPickedSide(null);
      setError('Something went wrong. Please click again.');
    }
  };

  const getRestaurantImage = (r) => {
    if (r.image) {
      return r.image.startsWith('http') ? r.image : `http://localhost:8000${r.image}`;
    }
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';
  };

  // Champion screen
  if (champion) {
    return (
      <div style={styles.page}>
        <div style={styles.championContainer}>
          <div style={styles.championBadge}>YOUR TOP PICK</div>
          <div style={styles.championCard}>
            <img
              src={getRestaurantImage(champion)}
              alt={champion.name}
              style={styles.championImg}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'; }}
            />
            <div style={styles.championBody}>
              <h1 style={styles.championName}>{champion.name}</h1>
              <p style={styles.championCity}>📍 {champion.address}, {champion.city}</p>
              <div style={styles.championMeta}>
                <span style={styles.championRating}>⭐ {champion.average_rating?.toFixed(1) || '4.0'}</span>
                <span style={styles.championCuisine}>{champion.cuisine}</span>
              </div>
              {champion.description && (
                <p style={styles.championDesc}>{champion.description}</p>
              )}
              <div style={styles.championActions}>
                <button
                  style={styles.orderBtn}
                  onClick={() => navigate(`/restaurants/${champion.id}`)}
                >
                  View Restaurant
                </button>
                <button style={styles.replayBtn} onClick={startDuel}>
                  Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroBadge}>RESTAURANT MATCHUP</div>
        <h1 style={styles.heroTitle}>Flavor Duel</h1>
        <p style={styles.heroSub}>
          Compare restaurants two at a time. Pick your favorite in each round to narrow down your top pick.
        </p>
      </div>

      {/* Progress */}
      <div style={styles.progressSection}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${((round - 1) / TOTAL_ROUNDS) * 100}%` }} />
        </div>
        <div style={styles.roundLabel}>
          Round {round} of {TOTAL_ROUNDS}
        </div>
      </div>

      {/* Duel Arena */}
      <div style={styles.arena}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p style={{ color: '#707572', marginTop: 12 }}>Loading options...</p>
          </div>
        ) : error ? (
          <div style={styles.errorState}>
            <p style={{ color: '#C27047', fontWeight: 650, marginBottom: 12 }}>{error}</p>
            <button style={styles.retryBtn} onClick={startDuel}>Try Again</button>
          </div>
        ) : left && right ? (
          <div style={styles.duelRow}>
            {/* Left Card */}
            <button
              style={{
                ...styles.duelCard,
                transform: pickedSide === 0 ? 'scale(1.04)' : pickedSide !== null ? 'scale(0.94) opacity(0.5)' : 'scale(1)',
                opacity: pickedSide !== null && pickedSide !== 0 ? 0.45 : 1,
                borderColor: pickedSide === 0 ? '#3B4F39' : '#EAE6DF',
                boxShadow: pickedSide === 0 ? '0 8px 32px rgba(59,79,57,0.18)' : '0 4px 16px rgba(59,79,57,0.05)',
              }}
              onClick={() => pickWinner(0)}
              disabled={animating}
            >
              <div style={styles.duelImgWrap}>
                <img
                  src={getRestaurantImage(left)}
                  alt={left.name}
                  style={styles.duelImg}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'; }}
                />
                <div style={styles.ratingBadge}>
                  ⭐ {left.average_rating?.toFixed(1) || '4.0'}
                </div>
              </div>
              <div style={styles.duelInfo}>
                <h3 style={styles.duelFoodName}>{left.name}</h3>
                <p style={styles.duelRestName}>{left.cuisine}</p>
                <div style={styles.duelBottom}>
                  <span style={styles.duelCity}>📍 {left.city}</span>
                </div>
              </div>
              {pickedSide === 0 && (
                <div style={styles.winnerStamp}>SELECTED</div>
              )}
            </button>

            {/* VS Circle */}
            <div style={styles.vsCircle}>
              <span style={styles.vsText}>VS</span>
            </div>

            {/* Right Card */}
            <button
              style={{
                ...styles.duelCard,
                transform: pickedSide === 1 ? 'scale(1.04)' : pickedSide !== null ? 'scale(0.94) opacity(0.5)' : 'scale(1)',
                opacity: pickedSide !== null && pickedSide !== 1 ? 0.45 : 1,
                borderColor: pickedSide === 1 ? '#3B4F39' : '#EAE6DF',
                boxShadow: pickedSide === 1 ? '0 8px 32px rgba(59,79,57,0.18)' : '0 4px 16px rgba(59,79,57,0.05)',
              }}
              onClick={() => pickWinner(1)}
              disabled={animating}
            >
              <div style={styles.duelImgWrap}>
                <img
                  src={getRestaurantImage(right)}
                  alt={right.name}
                  style={styles.duelImg}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'; }}
                />
                <div style={styles.ratingBadge}>
                  ⭐ {right.average_rating?.toFixed(1) || '4.0'}
                </div>
              </div>
              <div style={styles.duelInfo}>
                <h3 style={styles.duelFoodName}>{right.name}</h3>
                <p style={styles.duelRestName}>{right.cuisine}</p>
                <div style={styles.duelBottom}>
                  <span style={styles.duelCity}>📍 {right.city}</span>
                </div>
              </div>
              {pickedSide === 1 && (
                <div style={styles.winnerStamp}>SELECTED</div>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {/* Tip */}
      <p style={styles.tip}>
        Click on the restaurant you prefer. Your choice advances to face the next contender.
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#FDFBF7',
    fontFamily: "'Inter', sans-serif",
    paddingBottom: 60,
  },
  hero: {
    textAlign: 'center',
    padding: '50px 20px 30px',
    backgroundColor: '#F4EFE6',
    borderBottom: '1px solid #EAE6DF',
  },
  heroBadge: {
    display: 'inline-block',
    backgroundColor: '#F8EDE7',
    color: '#C27047',
    borderRadius: 4,
    padding: '4px 12px',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '1px',
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2.4rem',
    fontWeight: 700,
    color: '#3B4F39',
    margin: '0 0 8px',
  },
  heroSub: {
    color: '#707572',
    fontSize: '0.95rem',
    margin: 0,
    maxWidth: 550,
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.5,
  },
  progressSection: {
    maxWidth: 600,
    margin: '24px auto 0',
    padding: '0 20px',
  },
  progressBar: {
    height: 5,
    backgroundColor: '#EAE6DF',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C27047',
    borderRadius: 5,
    transition: 'width 0.5s ease',
  },
  roundLabel: {
    textAlign: 'center',
    fontSize: '0.82rem',
    color: '#707572',
    fontWeight: 600,
    marginTop: 8,
  },
  arena: {
    maxWidth: 800,
    margin: '32px auto',
    padding: '0 20px',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 60,
  },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid #EAE6DF',
    borderTop: '3px solid #3B4F39',
    animation: 'spin 0.8s linear infinite',
  },
  errorState: {
    textAlign: 'center',
    padding: 60,
    color: '#707572',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#3B4F39',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    padding: '10px 24px',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  duelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  duelCard: {
    flex: '1 1 280px',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    border: '2px solid #EAE6DF',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.35s ease',
    position: 'relative',
    textAlign: 'left',
    padding: 0,
    fontFamily: "'Inter', sans-serif",
  },
  duelImgWrap: {
    position: 'relative',
    height: 180,
    overflow: 'hidden',
    backgroundColor: '#F4EFE6',
  },
  duelImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#3A3D3B',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  duelInfo: {
    padding: '16px 18px 20px',
  },
  duelFoodName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '0 0 4px',
  },
  duelRestName: {
    fontSize: '0.8rem',
    color: '#707572',
    margin: '0 0 10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  duelBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duelCity: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#C27047',
  },
  winnerStamp: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(59,79,57,0.92)',
    color: '#FFFFFF',
    padding: '8px 24px',
    borderRadius: 8,
    fontSize: '0.85rem',
    fontWeight: 700,
    letterSpacing: '1.5px',
    zIndex: 10,
  },
  vsCircle: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    backgroundColor: '#C27047',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 16px rgba(194,112,71,0.25)',
  },
  vsText: {
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: '1px',
  },
  tip: {
    textAlign: 'center',
    fontSize: '0.82rem',
    color: '#A0A3A1',
    maxWidth: 400,
    margin: '12px auto 0',
    lineHeight: 1.5,
  },
  championContainer: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '50px 20px',
    textAlign: 'center',
  },
  championBadge: {
    display: 'inline-block',
    backgroundColor: '#F8EDE7',
    color: '#C27047',
    borderRadius: 6,
    padding: '5px 16px',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '1.5px',
    marginBottom: 24,
  },
  championCard: {
    backgroundColor: '#FFFFFF',
    border: '2px solid #EAE6DF',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(59,79,57,0.08)',
    textAlign: 'left',
  },
  championImg: {
    width: '100%',
    height: 220,
    objectFit: 'cover',
  },
  championBody: {
    padding: '24px 24px 28px',
  },
  championName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '0 0 6px',
  },
  championCity: {
    fontSize: '0.82rem',
    color: '#707572',
    margin: '0 0 14px',
  },
  championMeta: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  championRating: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#3B4F39',
  },
  championCuisine: {
    fontSize: '0.82rem',
    color: '#707572',
  },
  championDesc: {
    fontSize: '0.85rem',
    color: '#707572',
    lineHeight: 1.5,
    marginBottom: 20,
  },
  championActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  orderBtn: {
    flex: 1,
    backgroundColor: '#3B4F39',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    padding: '13px 20px',
    fontSize: '0.92rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.2s',
  },
  replayBtn: {
    backgroundColor: 'transparent',
    color: '#3B4F39',
    border: '1.5px solid #3B4F39',
    borderRadius: 8,
    padding: '13px 24px',
    fontSize: '0.92rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
};
