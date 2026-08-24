import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import FoodCard from '../components/FoodCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { refreshCart } from '../components/CartDrawer';

/* ── Helpers ── */
const imgSrc = (img, cuisine = '', id = 1) => {
  if (img) return img.startsWith('http') ? img : `http://localhost:8000${img}`;
  const cuisinePhotos = getDummyPhotos(cuisine);
  return cuisinePhotos[(id || 1) % cuisinePhotos.length];
};

/* Dummy restaurant photo sets keyed by cuisine keyword */
const CUISINE_PHOTOS = {
  'north indian': [
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=75',
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=75',
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=75',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=75',
  ],
  'south indian': [
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=75',
    'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=75',
    'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&q=75',
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=75',
  ],
  'biryani': [
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=75',
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=75',
    'https://images.unsplash.com/photo-1701765696059-1f36c9c8d21c?w=600&q=75',
    'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=75',
  ],
  'italian': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=75',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=75',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=75',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=75',
  ],
  'seafood': [
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=75',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=75',
    'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=75',
    'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600&q=75',
  ],
  'cafe': [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=75',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=75',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=75',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=75',
  ],
  'street food': [
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=75',
    'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&q=75',
    'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=600&q=75',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=75',
  ],
  'default': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=75',
    'https://images.unsplash.com/photo-1550966871-3ed3cbe818b5?w=600&q=75',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=75',
    'https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=600&q=75',
  ],
};

function getDummyPhotos(cuisine) {
  if (!cuisine) return CUISINE_PHOTOS.default;
  const c = cuisine.toLowerCase();
  for (const [key, photos] of Object.entries(CUISINE_PHOTOS)) {
    if (key !== 'default' && c.includes(key)) return photos;
  }
  return CUISINE_PHOTOS.default;
}

const StarRating = ({ value, onChange, size = 24 }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => onChange && onChange(n)}
        style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0, fontSize: size }}>
        <span style={{ color: n <= value ? '#f4a623' : '#ddd' }}>★</span>
      </button>
    ))}
  </div>
);

/* Geocode city+state → lat/lon via Nominatim */
async function geocode(query) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const d = await r.json();
    if (d.length) return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), display: d[0].display_name };
  } catch { /* ignore */ }
  return null;
}

/* Map using Google Maps Embed API v1 with API key for interactive maps */
const GMAP_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function MapEmbed({ lat, lon, name, address, google_maps_link }) {
  const fullSearchQuery = encodeURIComponent(`${name}, ${address}`);
  let src;

  if (google_maps_link && (google_maps_link.includes('google.com/maps/embed') || google_maps_link.includes('google.com/maps/embed/v1'))) {
    src = google_maps_link;
  } else if (lat && lon) {
    src = `https://maps.google.com/maps?q=${fullSearchQuery}&ll=${lat},${lon}&z=16&output=embed`;
  } else {
    src = `https://maps.google.com/maps?q=${fullSearchQuery}&z=16&output=embed`;
  }

  const mapsRedirectUrl = google_maps_link || `https://www.google.com/maps/search/?api=1&query=${fullSearchQuery}`;

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', height: 340, position: 'relative', background: '#e8e8e8' }}>
      <iframe
        title={`Map for ${name}`}
        src={src}
        width="100%"
        height="100%"
        style={{ border: 'none', display: 'block' }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={mapsRedirectUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 8, padding: '5px 12px',
          fontSize: '0.75rem', fontWeight: 600, color: 'var(--olive)',
          textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 4, zIndex: 10
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        Open in Google Maps →
      </a>
    </div>
  );
}

/* ── Combined Gallery + Reviews component ── */
function GalleryReviews({ photos, reviews, onUpload, user, restaurant, onReview, reviewForm, setReviewForm }) {
  const [expanded, setExpanded] = useState(null);
  const reviewsRef = useRef();
  const fileRef = useRef();

  const getReview = (i) => reviews.length ? reviews[i % reviews.length] : null;

  useEffect(() => {
    if (expanded === null) return;
    const h = (e) => {
      if (e.key === 'ArrowRight') setExpanded(v => (v + 1) % photos.length);
      if (e.key === 'ArrowLeft')  setExpanded(v => (v - 1 + photos.length) % photos.length);
      if (e.key === 'Escape')     setExpanded(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [expanded, photos.length]);

  const rev = expanded !== null ? getReview(expanded) : null;

  return (
    <div>
      {/* Header + upload */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontWeight:700, fontSize:'1.1rem', margin:0 }}>Photos & Reviews</h2>
          <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:3 }}>
            {photos.length} photos · Click any to see the full view with review
          </p>
        </div>
        {user && (
          <>
            <button onClick={() => fileRef.current?.click()}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'1.5px dashed var(--olive)', background:'var(--olive-pale)', color:'var(--olive)', cursor:'pointer', fontSize:'0.83rem', fontWeight:600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Add Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { if (e.target.files[0]) { onUpload(e.target.files[0]); e.target.value=''; }}} />
          </>
        )}
      </div>

      {/* 200×200 fixed grid */}
      {photos.length === 0 ? (
        <div style={{ textAlign:'center', padding:48, background:'white', borderRadius:14, border:'1px solid var(--border)', marginBottom:32 }}>
          <p style={{ color:'var(--text-muted)', margin:0 }}>No photos yet. Be the first!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:36 }}>
          {photos.map((p, i) => (
            <div key={i} onClick={() => setExpanded(i)}
              style={{ width:200, height:200, flexShrink:0, borderRadius:10, overflow:'hidden', cursor:'pointer', position:'relative', border:'2px solid var(--border)', transition:'transform 0.18s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04)'; e.currentTarget.style.borderColor='var(--olive)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.borderColor='var(--border)'; }}
            >
              <img src={p.url} alt={p.caption||`Photo ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              {i === 7 && photos.length > 8 && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.4rem', fontWeight:700 }}>+{photos.length-8}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen overlay — photo left, review right */}
      {expanded !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:2000, display:'flex' }} onClick={() => setExpanded(null)}>
          <div style={{ flex:'0 0 60%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', padding:24 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setExpanded(v => (v-1+photos.length)%photos.length)}
              style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:40, height:40, color:'white', cursor:'pointer', fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <img src={photos[expanded].url} alt="" style={{ maxWidth:'100%', maxHeight:'85vh', objectFit:'contain', borderRadius:8 }} />
            <button onClick={() => setExpanded(v => (v+1)%photos.length)}
              style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:40, height:40, color:'white', cursor:'pointer', fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
            <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.55)', fontSize:'0.8rem' }}>{expanded+1} / {photos.length}</div>
          </div>
          <div style={{ flex:'0 0 40%', background:'white', display:'flex', flexDirection:'column', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <span style={{ fontWeight:700, fontSize:'0.95rem' }}>{restaurant.name}</span>
              <button onClick={() => setExpanded(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.4rem', color:'var(--text-muted)', lineHeight:1 }}>×</button>
            </div>
            <div style={{ padding:'20px', flex:1 }}>
              {rev ? (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <span style={{ background:'#2d6a4f', color:'white', borderRadius:6, padding:'3px 10px', fontSize:'0.85rem', fontWeight:700 }}>★ {rev.rating}</span>
                    <span style={{ fontWeight:700, fontSize:'0.92rem' }}>{rev.rating>=5?'Excellent':rev.rating>=4?'Good':rev.rating>=3?'Average':'Below Average'}</span>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginLeft:'auto' }}>{new Date(rev.created_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</span>
                  </div>
                  {rev.comment && <p style={{ fontSize:'0.93rem', lineHeight:1.7, color:'var(--dark)', marginBottom:18 }}>{rev.comment}</p>}
                  <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:14, borderTop:'1px solid var(--border)' }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--olive)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>{(rev.user_name||'C')[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{rev.user_name||'Customer'}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Verified Diner
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color:'var(--text-muted)', paddingTop:40, textAlign:'center' }}>No review for this photo yet.</p>
              )}
            </div>
            <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', display:'flex', gap:7, overflowX:'auto', flexShrink:0 }}>
              {photos.map((p,i) => (
                <div key={i} onClick={() => setExpanded(i)}
                  style={{ width:50, height:50, flexShrink:0, borderRadius:6, overflow:'hidden', cursor:'pointer', border: expanded===i ? '2.5px solid var(--olive)' : '2px solid transparent' }}>
                  <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div ref={reviewsRef} style={{ scrollMarginTop:80 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingTop:8, borderTop:'2px solid var(--border)' }}>
          <h2 style={{ fontWeight:700, fontSize:'1.1rem', margin:0 }}>Customer Reviews</h2>
          {reviews.length > 0 && <span style={{ background:'var(--olive)', color:'white', borderRadius:20, padding:'2px 10px', fontSize:'0.78rem', fontWeight:700 }}>{reviews.length}</span>}
        </div>
        {reviews.length > 0 && (
          <div style={{ background:'white', borderRadius:14, border:'1px solid var(--border)', padding:'18px 22px', marginBottom:24, display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontSize:'2.8rem', fontWeight:800, color:'var(--dark)', lineHeight:1 }}>{restaurant.average_rating?.toFixed(1)}</div>
              <StarRating value={Math.round(restaurant.average_rating)} size={18} />
              <div style={{ fontSize:'0.76rem', color:'var(--text-muted)', marginTop:4 }}>{reviews.length} reviews</div>
            </div>
            <div style={{ flex:1, minWidth:180 }}>
              {[5,4,3,2,1].map(n => {
                const cnt = reviews.filter(r => r.rating===n).length;
                const pct = reviews.length ? (cnt/reviews.length)*100 : 0;
                return (
                  <div key={n} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', width:8, textAlign:'right' }}>{n}</span>
                    <span style={{ color:'#f4a623', fontSize:'0.8rem' }}>★</span>
                    <div style={{ flex:1, height:7, background:'var(--cream-dark)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:'#f4a623', borderRadius:4, transition:'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', width:18, textAlign:'right' }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {user?.role==='customer' ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid var(--border)', padding:'20px 22px', marginBottom:24 }}>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:14 }}>Write a Review</h3>
            <form onSubmit={onReview} className="form-cravio" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={{ display:'block', marginBottom:6 }}>Your Rating</label><StarRating value={reviewForm.rating} onChange={r => setReviewForm(f=>({...f,rating:r}))} size={26} /></div>
              <div><label>Your Review</label><textarea rows={3} placeholder="How was your experience?" value={reviewForm.comment} onChange={e => setReviewForm(f=>({...f,comment:e.target.value}))} style={{ resize:'vertical' }} /></div>
              <button type="submit" className="btn-olive" style={{ alignSelf:'flex-start', padding:'9px 22px', borderRadius:8 }}>Post Review</button>
            </form>
          </div>
        ) : !user ? (
          <div style={{ background:'var(--cream)', borderRadius:12, padding:'14px 18px', marginBottom:20, fontSize:'0.88rem' }}>
            <Link to="/login" style={{ color:'var(--olive)', fontWeight:600 }}>Sign in</Link> to write a review.
          </div>
        ) : null}
        {reviews.length === 0 ? (
          <p style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>No reviews yet. Be the first!</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {reviews.map(rev => (
              <div key={rev.id} style={{ background:'white', borderRadius:12, border:'1px solid var(--border)', padding:'16px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--olive)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.88rem', flexShrink:0 }}>{(rev.user_name||'C')[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{rev.user_name||'Customer'}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{new Date(rev.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                  </div>
                  <StarRating value={rev.rating} size={15} />
                </div>
                {rev.comment && <p style={{ fontSize:'0.87rem', color:'var(--dark-soft)', lineHeight:1.6, margin:0 }}>{rev.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



/* ── Main component ── */
export default function RestaurantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [activeTab, setActiveTab] = useState('menu');
  const [mapCoords, setMapCoords] = useState(null);
  const [mapLoading] = useState(false);
  // Photos: localStorage user-uploads merged with cuisine dummy photos
  const PHOTO_KEY = `cravio_photos_${id}`;
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/restaurants/${id}/`),
      api.get(`/foods/?restaurant=${id}`),
      api.get(`/reviews/?restaurant=${id}`),
    ]).then(([rRes, fRes, revRes]) => {
      setRestaurant(rRes.data);
      const foodList = Array.isArray(fRes.data) ? fRes.data : (fRes.data.results || []);
      setFoods(foodList);
      setCategories([...new Set(foodList.map(f => f.category_name).filter(Boolean))]);
      setReviews(Array.isArray(revRes.data) ? revRes.data : (revRes.data.results || []));
      // Seed photos: dummy cuisine pics + any user uploads
      const dummies = getDummyPhotos(rRes.data.cuisine).map((url, i) => ({ url, caption: `Photo ${i + 1}` }));
      const uploaded = (() => { try { return JSON.parse(localStorage.getItem(`cravio_photos_${id}`) || '[]'); } catch { return []; } })();
      setPhotos([...dummies, ...uploaded]);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  // (map uses Google Maps embed directly — no geocoding needed)

  const handleAddToCart = async (food) => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post('/cart/', { food: food.id, quantity: 1 });
      setCartMsg(`${food.name} added!`);
      window.dispatchEvent(new Event('cartUpdate'));
      setTimeout(() => setCartMsg(''), 2500);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to add.';
      setCartMsg(errorMsg);
      setTimeout(() => setCartMsg(''), 2500);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      const res = await api.post('/reviews/', { restaurant: id, ...reviewForm });
      setReviews(prev => [res.data, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) { alert(err.response?.data?.detail || 'Could not submit review.'); }
  };

  const handlePhotoUpload = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const newPhoto = { url: reader.result, caption: file.name.replace(/\.[^.]+$/, '') };
      // Save only user uploads to localStorage
      const stored = (() => { try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]'); } catch { return []; } })();
      stored.push(newPhoto);
      localStorage.setItem(PHOTO_KEY, JSON.stringify(stored));
      // Add to displayed photos (after dummies)
      setPhotos(prev => [...prev, newPhoto]);
    };
    reader.readAsDataURL(file);
  };

  const filteredFoods = activeCategory ? foods.filter(f => f.category_name === activeCategory) : foods;
  const heroImg = imgSrc(restaurant?.image, restaurant?.cuisine, restaurant?.id);
  const isOpen = () => {
    if (!restaurant) return false;
    const now = new Date();
    const [oh, om] = (restaurant.opening_time || '00:00').split(':').map(Number);
    const [ch, cm] = (restaurant.closing_time || '23:59').split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= oh * 60 + om && cur <= ch * 60 + cm;
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <p>Loading restaurant...</p>
    </div>
  );
  if (!restaurant) return <div style={{ textAlign: 'center', padding: '80px' }}><h2>Restaurant not found</h2></div>;

  const TABS = [
    { key: 'menu',       label: 'Menu' },
    { key: 'gallery',    label: `Photos & Reviews${reviews.length ? ` (${reviews.length})` : ''}` },
    { key: 'info',       label: 'Info & Map' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh' }}>

      {/* ── Hero card ── */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="container-cravio" style={{ padding: '28px 20px 0' }}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Restaurant image with rounded rectangle */}
            <div style={{ flexShrink: 0, width: 320, height: 210, borderRadius: 16, overflow: 'hidden', background: 'var(--cream-dark)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
              {heroImg
                ? <img src={heroImg} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: 'var(--text-muted)' }}>🍴</div>
              }
            </div>

            {/* Info panel */}
            <div style={{ flex: 1, minWidth: 240, paddingBottom: 28 }}>
              {/* Open / closed badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: isOpen() ? '#d4edda' : '#f8d7da', color: isOpen() ? '#155724' : '#721c24' }}>
                  {isOpen() ? 'Open now' : 'Closed'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {restaurant.opening_time?.slice(0,5)} – {restaurant.closing_time?.slice(0,5)}
                </span>
              </div>

              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--dark)', margin: '0 0 4px' }}>
                {restaurant.name}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                {restaurant.cuisine}
              </p>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ background: '#2d6a4f', color: 'white', borderRadius: 6, padding: '3px 10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ★ {restaurant.average_rating?.toFixed(1) || '—'}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{restaurant.total_reviews} ratings</span>
                <span style={{ color: 'var(--border)' }}>|</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{restaurant.cuisine}</span>
              </div>

              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {[restaurant.address, restaurant.city, restaurant.state].filter(Boolean).join(', ')}
                </span>
              </div>

              {/* Description */}
              {restaurant.description && (
                <p style={{ fontSize: '0.88rem', color: 'var(--dark-soft)', lineHeight: 1.6, maxWidth: 460 }}>
                  {restaurant.description}
                </p>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <Link to={`/order-now?restaurant=${id}`}
                  className="btn-olive"
                  style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.88rem', textDecoration: 'none' }}>
                  Order Now
                </Link>
                <Link to={`/reservations?restaurant=${id}`}
                  style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.88rem', border: '1.5px solid var(--olive)', color: 'var(--olive)', textDecoration: 'none', fontWeight: 600 }}>
                  Reserve Table
                </Link>
                <button onClick={() => {
                  if (restaurant.google_maps_link) {
                    window.open(restaurant.google_maps_link, '_blank');
                  } else {
                    const query = encodeURIComponent(`${restaurant.name}, ${restaurant.address}, ${restaurant.city}`);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  }
                }}
                  style={{ padding: '9px 16px', borderRadius: 8, fontSize: '0.88rem', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', color: 'var(--dark-soft)' }}>
                  Directions
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: '2px solid var(--border)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '10px 22px', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: activeTab === t.key ? 700 : 400,
                  color: activeTab === t.key ? 'var(--olive)' : 'var(--text-muted)',
                  borderBottom: activeTab === t.key ? '3px solid var(--olive)' : '3px solid transparent',
                  marginBottom: -2, fontSize: '0.92rem', whiteSpace: 'nowrap', transition: 'color 0.15s',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="container-cravio" style={{ padding: '28px 20px 60px' }}>
        {cartMsg && (
          <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 8, padding: '10px 16px', marginBottom: 20, color: '#155724', fontSize: '0.9rem' }}>
            {cartMsg}
          </div>
        )}

        {/* Menu */}
        {activeTab === 'menu' && (
          <div>
            {categories.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {['All', ...categories].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat === 'All' ? '' : cat)}
                    style={{ padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${(cat === 'All' ? !activeCategory : activeCategory === cat) ? 'var(--olive)' : 'var(--border)'}`, background: (cat === 'All' ? !activeCategory : activeCategory === cat) ? 'var(--olive)' : 'white', color: (cat === 'All' ? !activeCategory : activeCategory === cat) ? 'white' : 'var(--dark)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {filteredFoods.length === 0
              ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No items available.</p>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {filteredFoods.map(food => <FoodCard key={food.id} food={food} onAddToCart={handleAddToCart} />)}
                </div>
            }
          </div>
        )}

        {/* ── Combined Photos & Reviews Tab ── */}
        {activeTab === 'gallery' && (
          <GalleryReviews
            photos={photos}
            reviews={reviews}
            onUpload={handlePhotoUpload}
            user={user}
            restaurant={restaurant}
            onReview={handleReview}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
          />
        )}

        {/* Info & Map */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,420px) 1fr', gap: 24, alignItems: 'start' }}>

            {/* Details card */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '24px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>Restaurant Details</h3>
              {[
                { icon: '📍', label: 'Address', value: [restaurant.address, restaurant.city, restaurant.state, restaurant.pincode].filter(Boolean).join(', ') },
                { icon: '🍽️', label: 'Cuisine', value: restaurant.cuisine },
                { icon: '📞', label: 'Phone', value: restaurant.phone },
                { icon: '📧', label: 'Email', value: restaurant.email },
                { icon: '🕐', label: 'Hours', value: `${restaurant.opening_time?.slice(0,5)} – ${restaurant.closing_time?.slice(0,5)}` },
              ].filter(r => r.value).map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{row.label}</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.5 }}>{row.value}</div>
                  </div>
                </div>
              ))}
              {restaurant.description && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>About</div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--dark-soft)', lineHeight: 1.65, margin: 0 }}>{restaurant.description}</p>
                </div>
              )}
            </div>

            {/* Map */}
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14 }}>Location on Map</h3>
              <MapEmbed
                lat={restaurant.latitude}
                lon={restaurant.longitude}
                name={restaurant.name}
                address={[restaurant.address, restaurant.city, restaurant.state, 'India'].filter(Boolean).join(', ')}
                google_maps_link={restaurant.google_maps_link}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
