import React from 'react';

export default function FoodCard({ food, onAddToCart }) {
  const { name, description, price, image, is_veg, is_available } = food;

  return (
    <div className="card-cravio" style={{ display: 'flex', gap: '14px', padding: '14px', alignItems: 'center' }}>
      {/* Image */}
      <div style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'var(--cream-dark)' }}>
        {image ? (
          <img src={image.startsWith('http') ? image : `http://localhost:8000${image}`} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🍛</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            width: 14, height: 14,
            border: `2px solid ${is_veg ? '#2e7d32' : '#c62828'}`,
            borderRadius: '2px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: is_veg ? '#2e7d32' : '#c62828', display: 'block' }}></span>
          </span>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark)', margin: 0 }}>{name}</h4>
        </div>
        {description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--olive)', fontSize: '1rem' }}>₹{parseFloat(price).toFixed(0)}</span>
          {is_available ? (
            <button
              onClick={() => onAddToCart && onAddToCart(food)}
              className="btn-terracotta"
              style={{ padding: '5px 14px', fontSize: '0.82rem', borderRadius: '6px' }}
            >
              + Add
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#999' }}>Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}
