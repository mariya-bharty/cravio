import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import RestaurantCard from '../components/RestaurantCard';

// localStorage key used by RestaurantCard
const WISHLIST_KEY = 'cravio_wishlist';
const getWishlistIds = () => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; } };

export default function Wishlist() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const ids = getWishlistIds();
    if (!ids.length) { setLoading(false); return; }
    // Fetch all approved restaurants and filter to wishlisted ones
    api.get('/restaurants/?status=approved')
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setRestaurants(all.filter(r => ids.includes(r.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading wishlist…</div>;

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 className="section-title" style={{ margin: 0 }}>My Wishlist</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
              Restaurants you've saved
            </p>
          </div>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--terracotta)" stroke="var(--terracotta)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>

        {restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <h2 style={{ marginBottom: 10, fontSize: '1.2rem' }}>No saved restaurants yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Tap the heart on any restaurant card to save it here.</p>
            <Link to="/restaurants" className="btn-olive" style={{ padding: '11px 28px', textDecoration: 'none', fontSize: '0.9rem' }}>
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
            {restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
