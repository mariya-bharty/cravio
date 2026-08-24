import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const MOCK_DATA = {
  'Olive Bistro':   { discount: '20% OFF', rating: 4.8, reviews: 212, time: '30-40 min', price: '₹400 for two', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80' },
  'The Spice Room': { discount: '15% OFF', rating: 4.4, reviews: 180, time: '25-35 min', price: '₹350 for two', image: 'https://images.unsplash.com/photo-1585938338392-50a59970d2ee?w=600&q=80' },
  'Café Willow':    { discount: '10% OFF', rating: 4.5, reviews: 310, time: '20-30 min', price: '₹300 for two', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80' },
  'Biryani House':  { discount: '20% OFF', rating: 4.3, reviews: 190, time: '30-40 min', price: '₹260 for two', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80' },
  'Arsalan Kolkata':{ discount: '20% OFF', rating: 4.7, reviews: 450, time: '25-35 min', price: '₹450 for two', image: 'http://localhost:8000/media/restaurants/arsalan_kolkata.png' },
};

// Persist wishlist in localStorage so it survives page refresh
const getWishlist = () => {
  try { return JSON.parse(localStorage.getItem('cravio_wishlist') || '[]'); }
  catch { return []; }
};
const saveWishlist = (list) => localStorage.setItem('cravio_wishlist', JSON.stringify(list));

// Dynamic price for two per restaurant
function getCostForTwo(restaurant) {
  if (restaurant?.cost_for_two) return `₹${restaurant.cost_for_two} for two`;
  if (restaurant?.price_for_two) return `₹${restaurant.price_for_two} for two`;
  
  const cuisine = (restaurant?.cuisine || '').toLowerCase();
  const id = restaurant?.id || 1;
  const hash = (id * 149 + (restaurant?.name || '').length * 23) % 9;
  
  let base = 350;
  if (cuisine.includes('italian') || cuisine.includes('continental') || cuisine.includes('fine')) {
    base = 750 + hash * 80;
  } else if (cuisine.includes('north indian') || cuisine.includes('biryani') || cuisine.includes('barbeque')) {
    base = 450 + hash * 60;
  } else if (cuisine.includes('chinese') || cuisine.includes('asian') || cuisine.includes('thai')) {
    base = 400 + hash * 50;
  } else if (cuisine.includes('cafe') || cuisine.includes('pizza') || cuisine.includes('burger')) {
    base = 320 + hash * 40;
  } else if (cuisine.includes('dessert') || cuisine.includes('ice cream') || cuisine.includes('bakery')) {
    base = 220 + hash * 30;
  } else {
    base = 350 + hash * 50;
  }
  return `₹${base} for two`;
}

function getDeliveryTime(restaurant) {
  if (restaurant?.delivery_time) return restaurant.delivery_time;
  const id = restaurant?.id || 1;
  const minTime = 20 + ((id * 11) % 25);
  return `${minTime}-${minTime + 10} min`;
}

const RESTAURANT_FALLBACKS = [
  'https://images.unsplash.com/photo-1585938338392-50a59970d2ee?w=600&q=80',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80',
  'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80',
  'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=80',
  'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=80',
];

export default function RestaurantCard({ restaurant }) {
  const { id, name, cuisine, image, average_rating, total_reviews, city, state, address } = restaurant;
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [wishlisted, setWishlisted] = useState(() => getWishlist().includes(id));
  const [pulse, setPulse] = useState(false);

  const mock          = MOCK_DATA[name] || {};
  const fallbackImg   = RESTAURANT_FALLBACKS[(id || 1) % RESTAURANT_FALLBACKS.length];
  const displayImage  = image ? (image.startsWith('http') ? image : `http://localhost:8000${image}`) : (mock.image || fallbackImg);
  const displayRating = mock.rating  || average_rating || 4.0;
  const displayReviews= mock.reviews || total_reviews  || 0;
  const displayDiscount = mock.discount || (average_rating >= 4.5 ? '20% OFF' : null);
  const displayTime   = mock.time  || getDeliveryTime(restaurant);
  const displayPrice  = mock.price || getCostForTwo(restaurant);

  const handleWishlist = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const returnTo = location.pathname + location.search;
      navigate(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }

    const current = getWishlist();
    let updated;
    if (current.includes(id)) {
      updated = current.filter(x => x !== id);
    } else {
      updated = [...current, id];
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
    }
    saveWishlist(updated);
    setWishlisted(updated.includes(id));
  }, [user, id, navigate, location]);

  return (
    <Link to={`/restaurants/${id}`} style={{ textDecoration: 'none' }}>
      <div className="card-cravio" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Image */}
        <div style={{ position: 'relative', height: '170px', overflow: 'hidden', background: 'var(--cream-dark)' }}>
          <img
            src={displayImage}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />

          {/* Discount badge */}
          {displayDiscount && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: '#EAF0E9', color: 'var(--olive)',
              padding: '3px 9px', borderRadius: 6,
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2px',
            }}>
              {displayDiscount}
            </div>
          )}

          {/* Wishlist heart button */}
          <button
            onClick={handleWishlist}
            title={user ? (wishlisted ? 'Remove from wishlist' : 'Add to wishlist') : 'Login to wishlist'}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: wishlisted ? 'rgba(193,123,78,0.12)' : 'rgba(255,255,255,0.92)',
              border: wishlisted ? '1.5px solid var(--terracotta)' : '1px solid rgba(0,0,0,0.08)',
              borderRadius: '50%',
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 0.15s, background 0.2s',
              transform: pulse ? 'scale(1.35)' : 'scale(1)',
              zIndex: 5,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
            onMouseLeave={e => e.currentTarget.style.transform = pulse ? 'scale(1.35)' : 'scale(1)'}
          >
            <svg
              width="15" height="15"
              viewBox="0 0 24 24"
              fill={wishlisted ? 'var(--terracotta)' : 'none'}
              stroke={wishlisted ? 'var(--terracotta)' : 'var(--dark)'}
              strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>


        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--dark)', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>{name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cuisine}</p>
            {(city || state || address) && (() => {
              const locationText = (city && city.length > 3)
                ? [city, state].filter(Boolean).join(', ')
                : address || [city, state].filter(Boolean).join(', ');
              return (
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 7, display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--olive)', marginTop: 2 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {locationText}
                  </span>
                </p>
              );
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ color: '#F4A623', fontSize: '0.9rem' }}>★</span>
              <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{displayRating.toFixed(1)}</span>
              <span>({displayReviews})</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.77rem', color: 'var(--text-muted)' }}>
            <span>{displayTime}</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>{displayPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
