import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RestaurantCard from '../components/RestaurantCard';
import api from '../api/axios';
import { POPULAR_CITIES } from '../components/Navbar';
import { useLocationStore } from '../lib/locationStore';

const CUISINES = ['All', 'North Indian', 'Italian', 'Chinese', 'Cafe', 'Biryani', 'Pizza', 'Desserts', 'South Indian', 'Continental', 'Mughlai'];

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Local input states (what the user types in the form)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [cityQuery, setCityQuery] = useState(searchParams.get('city') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Applied filter states (what actually queries the backend)
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('search') || '');
  const [appliedCity, setAppliedCity] = useState(searchParams.get('city') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '');

  // Sync inputs and applied states when URL query parameters change (e.g. Navbar click)
  useEffect(() => {
    const urlCity = searchParams.get('city') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlCuisine = searchParams.get('cuisine') || '';

    setCityQuery(urlCity);
    setAppliedCity(urlCity);

    setSearchQuery(urlSearch);
    setAppliedSearch(urlSearch);

    setCuisine(urlCuisine);
  }, [searchParams]);

  const { location: savedLoc } = useLocationStore();

  const fetchRestaurants = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('status', 'approved');
    if (appliedSearch) params.set('search', appliedSearch);
    if (cuisine) params.set('cuisine', cuisine);
    if (appliedCity) params.set('city', appliedCity);

    api.get(`/restaurants/?${params.toString()}`)
      .then(res => {
        const data = res.data;
        let list = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);

        // Sort: user's saved city first, then rest
        if (savedLoc?.city && !appliedCity) {
          const userCity = savedLoc.city.toLowerCase();
          list = [
            ...list.filter(r => r.city?.toLowerCase() === userCity),
            ...list.filter(r => r.city?.toLowerCase() !== userCity),
          ];
        }
        setRestaurants(list);
      })
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRestaurants(); }, [cuisine, appliedCity, appliedSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearch(searchQuery);
    setAppliedCity(cityQuery);
  };

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio">
        <h1 className="section-title" style={{ marginBottom: '8px' }}>Browse Restaurants</h1>
        <p className="section-subtitle" style={{ marginBottom: '28px' }}>Discover the best dining experiences near you</p>

        {/* Search + Filters */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2', minWidth: '200px' }} className="form-cravio">
              <label>Search</label>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Restaurant name or cuisine..." />
            </div>
            <div style={{ flex: '1', minWidth: '140px', position: 'relative' }} className="form-cravio">
              <label>City</label>
              <input
                value={cityQuery}
                onChange={e => { setCityQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter city..."
                style={{ width: '100%' }}
              />
              {showSuggestions && cityQuery.trim() && (() => {
                const query = cityQuery.toLowerCase().trim();
                const filtered = POPULAR_CITIES.filter(c =>
                  c.name.toLowerCase().includes(query)
                ).sort((a, b) => {
                  const aStarts = a.name.toLowerCase().startsWith(query);
                  const bStarts = b.name.toLowerCase().startsWith(query);
                  if (aStarts && !bStarts) return -1;
                  if (!aStarts && bStarts) return 1;
                  return a.name.localeCompare(b.name);
                }).slice(0, 8);

                if (filtered.length === 0) return null;

                return (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {filtered.map(c => (
                      <button
                        key={`${c.name}-${c.state}`}
                        type="button"
                        onClick={() => {
                          setCityQuery(c.name);
                          setShowSuggestions(false);
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          color: 'var(--dark)',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.state}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <button type="submit" className="btn-olive" style={{ padding: '10px 24px', height: '42px' }}>Search</button>
          </form>
        </div>

        {/* Cuisine Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {CUISINES.map(c => (
            <button
              key={c}
              onClick={() => setCuisine(c === 'All' ? '' : c)}
              style={{
                padding: '6px 16px', borderRadius: '20px',
                border: `1.5px solid ${(cuisine === c || (c === 'All' && !cuisine)) ? 'var(--olive)' : 'var(--border)'}`,
                background: (cuisine === c || (c === 'All' && !cuisine)) ? 'var(--olive)' : 'white',
                color: (cuisine === c || (c === 'All' && !cuisine)) ? 'white' : 'var(--dark)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍽️</div>
            <p>Loading restaurants...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📍</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--dark)' }}>
              {(appliedSearch || appliedCity) ? `No restaurants found for "${[appliedSearch, appliedCity].filter(Boolean).join(', ')}"` : 'No restaurants found'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 16px' }}>
              We couldn't find any matching restaurants in this location or category. Please check the spelling or try searching for major cities like Bengaluru, Mumbai, Delhi, Hyderabad, or Jaipur.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setCityQuery(''); setAppliedSearch(''); setAppliedCity(''); setCuisine(''); }}
              className="btn-olive"
              style={{ padding: '8px 20px', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {restaurants.length} restaurants found
              {savedLoc?.city && !appliedCity && (
                <span style={{ background: 'var(--olive-pale)', color: 'var(--olive)', fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
                  Nearby ({savedLoc.city}) shown first
                </span>
              )}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '22px' }}>
              {restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
