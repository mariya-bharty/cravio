import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RestaurantCard from '../components/RestaurantCard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useLocationStore, detectCurrentLocation, lookupPincode, setLocation as saveLocation } from '../lib/locationStore';
import SpinWheel from '../components/SpinWheel';
import FeaturesCarousel from '../components/FeaturesCarousel';

/* ── SVG Icon Components ── */
const I = ({ children, size = 20, ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>;

const IconGrid = (p) => <I {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></I>;
const IconBowl = (p) => <I {...p}><path d="M3 12a9 9 0 0 0 18 0H3z"/><path d="M12 3v3"/></I>;
const IconPasta = (p) => <I {...p}><path d="M12 2v6"/><path d="M8 2v6"/><path d="M16 2v6"/><path d="M3 12a9 9 0 0 0 18 0H3z"/></I>;
const IconChopsticks = (p) => <I {...p}><line x1="10" y1="2" x2="6" y2="22"/><line x1="14" y1="2" x2="18" y2="22"/></I>;
const IconCoffee = (p) => <I {...p}><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></I>;
const IconRice = (p) => <I {...p}><ellipse cx="12" cy="8" rx="8" ry="5"/><path d="M4 8v4c0 2.8 3.6 5 8 5s8-2.2 8-5V8"/></I>;
const IconPizza = (p) => <I {...p}><path d="M12 2L2 19.5h20L12 2z"/><circle cx="12" cy="12" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></I>;
const IconCake = (p) => <I {...p}><path d="M2 18h20v4H2z"/><path d="M4 14h16v4H4z"/><path d="M6 10h12v4H6z"/><line x1="12" y1="6" x2="12" y2="10"/></I>;

const IconCalendar = (p) => <I {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>;
const IconClock = (p) => <I {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></I>;
const IconUsers = (p) => <I {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></I>;
const IconMapPin = (p) => <I {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></I>;
const IconSearch = (p) => <I {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></I>;
const IconShield = (p) => <I {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></I>;
const IconTag = (p) => <I {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></I>;
const IconHeadphones = (p) => <I {...p}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></I>;
const IconGift = (p) => <I {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></I>;

const CAT_ICONS = [IconGrid, IconBowl, IconPasta, IconChopsticks, IconCoffee, IconRice, IconPizza, IconCake];

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'North Indian', value: 'North Indian' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Cafe', value: 'Cafe' },
  { label: 'Biryani', value: 'Biryani' },
  { label: 'Pizza', value: 'Pizza' },
  { label: 'Desserts', value: 'Desserts' },
];



const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry','Jammu & Kashmir','Ladakh',
];

const POPULAR_SEARCHES = ['Italian', 'North Indian', 'Cafe', 'Biryani', 'Chinese', 'Desserts'];

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reservation, setReservation] = useState({ date: '', time: '', guests: '', location: '' });
  const [authPrompt, setAuthPrompt] = useState(false);
  // Trending state
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingLocation, setTrendingLocation] = useState(null);
  const [locationFiltered, setLocationFiltered] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  // Location picker form state (owner-style)
  const [locPincode, setLocPincode] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locState, setLocState] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showLocForm, setShowLocForm] = useState(false);
  const { user } = useAuth();
  const { location: savedLoc, setLocation: saveLocStore, clearLocation: clearLocStore, hasLocation } = useLocationStore();
  const navigate = useNavigate();

  // Seed form fields whenever store changes
  useEffect(() => {
    if (savedLoc) {
      if (savedLoc.city)    setLocCity(savedLoc.city);
      if (savedLoc.state)   setLocState(savedLoc.state);
      if (savedLoc.pincode) setLocPincode(savedLoc.pincode);
      setLocationInput(savedLoc.display || '');
    }
  }, [savedLoc]);

  // Redirect admin/owner to their respective dashboards
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/restaurants');
    } else if (user?.role === 'owner') {
      navigate('/owner/dashboard');
    }
  }, [user, navigate]);

  // Seed store from profile if nothing saved yet
  useEffect(() => {
    if (user?.city && !savedLoc?.city) {
      saveLocStore({ city: user.city, state: user.state || '' });
    }
  }, [user]);

  useEffect(() => {
    api.get('/restaurants/?status=approved&limit=8')
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) setRestaurants(data);
        else if (Array.isArray(data.results)) setRestaurants(data.results);
        else setRestaurants([]);
      })
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch trending — re-runs whenever savedLoc changes
  useEffect(() => {
    const city  = savedLoc?.city  || '';
    const state = savedLoc?.state || '';
    if (city || state) {
      setTrendingLocation({ city, state });
      setLocationInput(savedLoc?.display || [city, state].filter(Boolean).join(', '));
      setLocCity(city);
      setLocState(state);
    }
    const params = new URLSearchParams({ limit: 8 });
    if (city)  params.set('city',  city);
    if (state) params.set('state', state);

    setTrendingLoading(true);
    api.get(`/restaurants/trending/?${params.toString()}`)
      .then(res => {
        setTrending(res.data.results || []);
        setLocationFiltered(res.data.location_filtered || false);
      })
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false));
  }, [savedLoc]);

  const applyLocation = (city, state) => {
    // Save to persistent store — triggers trending refetch automatically
    saveLocStore({ city, state, pincode: locPincode });
    setShowLocForm(false);
  };

  const clearLocation = () => {
    clearLocStore();
    setLocCity(''); setLocState(''); setLocPincode('');
    setLocationInput(''); setTrendingLocation(null); setLocationFiltered(false);
    setShowLocForm(false);
  };

  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setLocPincode(pin);
    if (pin.length === 6) {
      setPincodeLoading(true);
      const result = await lookupPincode(pin);
      setPincodeLoading(false);
      if (result) { setLocCity(result.city); setLocState(result.state); }
    }
  };

  const handleUseCurrentLocation = () => {
    detectCurrentLocation(
      (loc) => {
        setLocCity(loc.city); setLocState(loc.state);
        setLocPincode(loc.pincode || ''); setShowLocForm(true);
      },
      (err) => alert(err),
      setGeoLoading
    );
  };

  const fetchTrendingForLocation = (cityOrState) => {
    if (!cityOrState.trim()) { clearLocation(); return; }
    saveLocStore({ city: cityOrState.trim() });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/restaurants?search=${searchQuery}&cuisine=${selectedCategory}`);
  };

  const handleCategoryClick = (value) => {
    setSelectedCategory(value);
    navigate(`/restaurants?cuisine=${value}`);
  };

  const handleFindTable = (e) => {
    e.preventDefault();
    if (!user) {
      setAuthPrompt(true);
      return;
    }
    navigate(`/reservations?date=${reservation.date}&time=${reservation.time}&guests=${reservation.guests}`);
  };

  const filteredRestaurants = restaurants.filter(r =>
    selectedCategory === '' || r.cuisine?.toLowerCase().includes(selectedCategory.toLowerCase())
  );

  const TableIllustration = () => (
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
      <path d="M6 14h12l1-4H5l1 4z" />
      <path d="M8 14v6M16 14v6" />
      <path d="M3 10V6a2 2 0 0 1 2-2h1v6" />
      <path d="M4 10v4" />
      <path d="M21 10V6a2 2 0 0 0-2-2h-1v6" />
      <path d="M20 10v4" />
    </svg>
  );

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="home-hero">
        {/* Full-width background image */}
        <div className="home-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80"
            alt="Restaurant interior"
          />
          {/* Gradient: cream solid on left → transparent on right */}
          <div className="home-hero-gradient" />
        </div>

        {/* Left column — content sits on top of gradient */}
        <div className="home-hero-left">
          <p style={{ color: 'var(--terracotta)', fontSize: '0.78rem', letterSpacing: '1.5px', fontWeight: 600, marginBottom: '12px' }}>
            DINE · RESERVE · ENJOY
          </p>
          <h1 className="home-hero-title">
            Find your next<br />
            <span style={{ color: 'var(--terracotta)' }}>favourite table.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '28px', lineHeight: 1.6 }}>
            Browse restaurants, check out menus, and book a table —<br />
            all without making a single phone call.
          </p>

          {/* Pill Search Bar */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-bar-wrapper">
              {/* Location Selector — connected to location store */}
              <div
                onClick={() => setShowLocForm(f => !f)}
                className="search-location-dropdown"
                title="Change location"
                style={{ userSelect: 'none' }}
              >
                <IconMapPin size={14} style={{ color: 'var(--olive)' }} />
                <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hasLocation ? (savedLoc.city || savedLoc.state) : 'Set location'}
                </span>
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▼</span>
              </div>
              
              {/* Search input field */}
              <div className="search-input-container">
                <span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'flex', alignItems: 'center' }}><IconSearch size={16} /></span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for restaurants"
                  className="search-input-field"
                />
              </div>
              
              {/* Search button */}
              <button type="submit" className="btn-olive search-btn">
                Search
              </button>
            </div>
          </form>

          {/* Popular Searches */}
          <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Popular Searches:</span>
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                onClick={() => handleCategoryClick(tag)}
                style={{
                  padding: '5px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '20px',
                  background: 'white',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  color: 'var(--dark-soft)',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.target.style.background = 'var(--olive-pale)'; e.target.style.color = 'var(--olive)'; e.target.style.borderColor = 'var(--olive)'; }}
                onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.color = 'var(--dark-soft)'; e.target.style.borderColor = 'var(--border)'; }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Offer badge — bottom right over the image */}
        <div className="offer-overlay">
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            backgroundColor: 'var(--terracotta-pale)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--terracotta)'
          }}><IconGift size={20} /></div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '0.95rem', lineHeight: 1.2 }}>Flat 20% OFF</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 6px' }}>on your first booking</div>
            <span style={{
              background: 'var(--cream-dark)',
              padding: '3px 12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--olive)',
              letterSpacing: '0.5px'
            }}>WELCOME20</span>
          </div>
        </div>
      </section>

      {/* ── Spin to Discover Section ── */}
      <section id="roulette" style={{ backgroundColor: 'var(--cream)', padding: '0 0 8px' }}>
        <div className="container-cravio">
          <SpinWheel />
        </div>
      </section>

      {/* ── Category Filter Section (Full Width) ── */}
      <section style={{ backgroundColor: 'var(--cream)', padding: '56px 0 28px' }}>
        <div className="container-cravio">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 className="section-title" style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Browse by Cuisine</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>Explore the finest culinary categories available on Cravio.</p>
          </div>
          
          <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center',
            marginBottom: '16px', padding: '24px',
            background: 'white', borderRadius: '16px',
            border: '1.5px solid var(--border)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.015)'
          }}>
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  padding: '16px 12px',
                  border: selectedCategory === cat.value ? '1.5px solid var(--olive)' : '1.5px solid var(--border)',
                  borderRadius: '12px',
                  background: selectedCategory === cat.value ? 'var(--olive-pale)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  minWidth: '92px',
                  boxShadow: selectedCategory === cat.value ? '0 4px 12px var(--shadow)' : 'none',
                }}
                onMouseEnter={e => {
                  if (selectedCategory !== cat.value) {
                    e.currentTarget.style.borderColor = 'var(--olive-light)';
                    e.currentTarget.style.background = 'var(--cream-dark)';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedCategory !== cat.value) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {React.createElement(CAT_ICONS[idx] || IconGrid, { size: 22, style: { color: selectedCategory === cat.value ? 'var(--olive)' : 'var(--dark-soft)' } })}
                <span style={{
                  fontSize: '0.76rem',
                  color: selectedCategory === cat.value ? 'var(--olive)' : 'var(--dark-soft)',
                  fontWeight: selectedCategory === cat.value ? 700 : 500
                }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Restaurants Section ── */}
      <section style={{ backgroundColor: 'white', padding: '48px 0 36px', borderTop: '1px solid var(--border)' }}>
        <div className="container-cravio">
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="section-title" style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
                {locationFiltered && trendingLocation
                  ? `Trending in ${trendingLocation.city || trendingLocation.state}`
                  : 'Trending Across India'}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {locationFiltered
                  ? 'Top-rated restaurants near your area, ranked by orders and reviews.'
                  : 'Nationwide top picks ranked by order volume, ratings, and reviews.'}
              </p>
            </div>

            {/* Location controls */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Current location pill / change button */}
              {locationInput && locationFiltered ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--olive-pale)', border: '1.5px solid var(--olive)', borderRadius: 20, padding: '6px 14px', fontSize: '0.82rem', color: 'var(--olive)', fontWeight: 600 }}>
                  <IconMapPin size={13} />
                  {locationInput}
                </div>
              ) : null}
              <button
                onClick={() => setShowLocForm(f => !f)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 36, padding: '0 14px', borderRadius: 20,
                  background: showLocForm ? 'var(--olive)' : 'white',
                  color: showLocForm ? 'white' : 'var(--olive)',
                  border: '1.5px solid var(--olive)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                <IconMapPin size={13} />
                {locationInput && locationFiltered ? 'Change Location' : 'Set Location'}
              </button>
              {locationFiltered && (
                <button
                  onClick={clearLocation}
                  style={{ height: 36, padding: '0 12px', borderRadius: 20, background: 'var(--cream)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.78rem' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ── Location picker form (owner-style) ── */}
          {showLocForm && (
            <div style={{ background: 'var(--cream)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--dark)', margin: 0 }}>
                  Your Location
                </p>
                {/* Use current location */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20,
                    background: 'white', border: '1.5px solid var(--olive)',
                    color: 'var(--olive)', cursor: geoLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem', fontWeight: 600, opacity: geoLoading ? 0.7 : 1,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                    <path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
                  </svg>
                  {geoLoading ? 'Detecting...' : 'Use Current Location'}
                </button>
              </div>

              <div className="form-cravio" style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 14, alignItems: 'end' }}>
                {/* Pincode */}
                <div>
                  <label>Pincode</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      placeholder="e.g. 560001"
                      value={locPincode}
                      onChange={handlePincodeChange}
                      maxLength={6}
                    />
                    {pincodeLoading && (
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--olive)' }}>
                        fetching…
                      </span>
                    )}
                  </div>
                </div>
                {/* City */}
                <div>
                  <label>City</label>
                  <input
                    placeholder="Auto-filled from pincode"
                    value={locCity}
                    onChange={e => setLocCity(e.target.value)}
                  />
                </div>
                {/* State */}
                <div>
                  <label>State</label>
                  <select value={locState} onChange={e => setLocState(e.target.value)}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => applyLocation(locCity, locState)}
                  disabled={!locCity && !locState}
                  className="btn-olive"
                  style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.88rem', opacity: (!locCity && !locState) ? 0.5 : 1 }}
                >
                  Apply Location
                </button>
                <button
                  type="button"
                  onClick={() => setShowLocForm(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, fontSize: '0.88rem', background: 'white', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--dark)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* No-match fallback tag */}
          {!locationFiltered && locationInput && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff3cd', border: '1px solid #f0c040', borderRadius: 20, padding: '4px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#856404' }}>
              No results for "{locationInput}" — showing national trending instead
            </div>
          )}

          {/* Trending cards */}
          {trendingLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading trending restaurants...</div>
          ) : trending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--cream)', borderRadius: 16, border: '1.5px solid var(--border)' }}>
              No trending restaurants found. Check back soon!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {trending.map((r, i) => (
                <div key={r.id} style={{ position: 'relative' }}>
                  {/* Rank badge */}
                  {i < 3 && (
                    <div style={{
                      position: 'absolute', top: -10, left: -10, zIndex: 10,
                      width: 32, height: 32, borderRadius: '50%',
                      background: i === 0 ? '#f0c040' : i === 1 ? '#c0c0c0' : '#cd7f32',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.85rem', color: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                      #{i + 1}
                    </div>
                  )}
                  <RestaurantCard restaurant={r} />
                  {/* Trending pill */}
                  <div style={{
                    display: 'flex', gap: 6, marginTop: 6,
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    paddingLeft: 4,
                  }}>
                    <span style={{ background: '#fff3cd', color: '#856404', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                      {r.recent_orders} orders / 30d
                    </span>
                    <span style={{ background: 'var(--olive-pale)', color: 'var(--olive)', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                      {r.average_rating} ★
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {r.state || r.city}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Popular Restaurants Section (Full Width) ── */}
      <section style={{ backgroundColor: 'var(--cream)', padding: '28px 0 56px' }}>
        <div className="container-cravio">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 className="section-title" style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Popular Restaurants</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>Handpicked dining destinations that offer an exceptional experience.</p>
            </div>
            <button 
              onClick={() => navigate('/restaurants')} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--olive)', 
                fontWeight: 700, 
                cursor: 'pointer', 
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.target.style.color = 'var(--olive-light)'}
              onMouseLeave={e => e.target.style.color = 'var(--olive)'}
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading restaurants...</div>
          ) : filteredRestaurants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: '16px', border: '1.5px solid var(--border)' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>
              <p>No restaurants found. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
              {filteredRestaurants.slice(0, 4).map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Table Reservation Section (Full Width, Split Block) ── */}
      <section style={{ backgroundColor: 'white', padding: '64px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container-cravio reservation-layout">
          
          {/* Left Column: Marketing Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--olive-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TableIllustration />
              </div>
              <span style={{ fontSize: '0.82rem', letterSpacing: '2.5px', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase' }}>Instant Booking</span>
            </div>
            
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.4rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '18px', lineHeight: 1.2 }}>
              Reserve your table for free
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
              Skip the long queues and wait times. Browse available tables at Bengaluru's best dining destinations and secure your reservation instantly with zero booking fees.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                {
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                  title: "Real-time Slot Availability",
                  desc: "See actual real-time tables open for booking and secure them instantly."
                },
                {
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M22 12H12V2"/></svg>,
                  title: "Book in 10 Seconds",
                  desc: "Fast, simple form interface with direct connection to host stands."
                },
                {
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
                  title: "Zero Booking Fees",
                  desc: "Enjoy completely free reservations with direct restaurant confirmation."
                }
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--olive)', background: 'var(--olive-pale)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    {item.icon}
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 650, fontSize: '0.96rem', color: 'var(--dark)', marginBottom: '3px' }}>{item.title}</h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Reservation Form Widget */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1.5px solid var(--border)',
            padding: '36px',
            boxShadow: '0 10px 30px rgba(59, 79, 57, 0.05)'
          }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.45rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '4px' }}>Reserve a Table</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Choose your details to find matching tables.</p>

            <form onSubmit={handleFindTable} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Date Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dark-soft)', display: 'flex', alignItems: 'center', gap: '6px' }}><IconCalendar size={14} /> Select Date</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={reservation.date}
                    onChange={e => setReservation({ ...reservation, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      paddingLeft: '14px',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      width: '100%',
                      height: '42px',
                      outline: 'none',
                      color: 'var(--dark)'
                    }}
                  />
                </div>
              </div>

              {/* Time Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dark-soft)', display: 'flex', alignItems: 'center', gap: '6px' }}><IconClock size={14} /> Select Time</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="time"
                    value={reservation.time}
                    onChange={e => setReservation({ ...reservation, time: e.target.value })}
                    style={{
                      paddingLeft: '14px',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      width: '100%',
                      height: '42px',
                      outline: 'none',
                      color: 'var(--dark)'
                    }}
                  />
                </div>
              </div>

              {/* Guests Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dark-soft)', display: 'flex', alignItems: 'center', gap: '6px' }}><IconUsers size={14} /> No. of Guests</label>
                <select
                  value={reservation.guests}
                  onChange={e => setReservation({ ...reservation, guests: e.target.value })}
                  style={{
                    paddingLeft: '14px',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    width: '100%',
                    height: '42px',
                    outline: 'none',
                    color: 'var(--dark)',
                    background: 'white'
                  }}
                >
                  <option value="">Select guests</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, '9+'].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              {/* Location Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dark-soft)', display: 'flex', alignItems: 'center', gap: '6px' }}><IconMapPin size={14} /> Location (Optional)</label>
                <input
                  placeholder="Enter city or area..."
                  value={reservation.location}
                  onChange={e => setReservation({ ...reservation, location: e.target.value })}
                  style={{
                    paddingLeft: '14px',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    width: '100%',
                    height: '42px',
                    outline: 'none',
                    color: 'var(--dark)'
                  }}
                />
              </div>

              {/* Action Submit Button */}
              <button type="submit" className="btn-olive" style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                Find a Table <span>→</span>
              </button>

              {/* Auth prompt shown when guest tries to book */}
              {authPrompt && (
                <div style={{ background: 'var(--terracotta-pale)', border: '1px solid var(--terracotta)', borderRadius: '8px', padding: '12px 14px', marginTop: '4px', fontSize: '0.85rem', color: 'var(--dark)' }}>
                  Please{' '}
                  <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 700, textDecoration: 'underline' }}>sign in</Link>
                  {' '}or{' '}
                  <Link to="/register" style={{ color: 'var(--terracotta)', fontWeight: 700, textDecoration: 'underline' }}>create an account</Link>
                  {' '}to reserve a table.
                </div>
              )}
            </form>
          </div>

        </div>
      </section>

      {/* ── What you can do on Cravio (Feature List) ── */}
      <FeaturesCarousel />
    </div>
  );
}
