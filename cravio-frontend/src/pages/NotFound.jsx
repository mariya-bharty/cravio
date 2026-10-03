import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '7rem', fontWeight: 700, color: 'var(--olive)', lineHeight: 1, marginBottom: '16px' }}>404</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', marginBottom: '10px', color: 'var(--dark)' }}>Page not found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>Looks like this table doesn't exist. Let's get you back on the menu.</p>
        <Link to="/" className="btn-olive" style={{ padding: '11px 28px' }}>Back to Home</Link>
      </div>
    </div>
  );
}
