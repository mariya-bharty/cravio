import React from 'react';
import { Link } from 'react-router-dom';

const PlateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const MailIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
const PhoneIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const PinIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--dark)', color: '#b5b8b5', paddingTop: '56px', paddingBottom: '28px', marginTop: '0' }}>
      <div className="container-cravio">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlateIcon />
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 700, color: 'white' }}>Cravio</span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#8a8e8a' }}>
              Good Food. Great Times.<br />
              Discover the best restaurants near you and reserve a table for a memorable dining experience.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.3px' }}>Quick Links</h4>
            {[['/', 'Home'], ['/restaurants', 'Restaurants'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([to, label]) => (
              <div key={to} style={{ marginBottom: '10px' }}>
                <Link to={to} style={{ color: '#8a8e8a', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'white'}
                  onMouseLeave={e => e.target.style.color = '#8a8e8a'}
                >{label}</Link>
              </div>
            ))}
          </div>

          {/* For Owners */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.3px' }}>For Owners</h4>
            {[['/register', 'Register Your Restaurant'], ['/login', 'Owner Login'], ['/owner/dashboard', 'Owner Dashboard']].map(([to, label]) => (
              <div key={to} style={{ marginBottom: '10px' }}>
                <Link to={to} style={{ color: '#8a8e8a', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'white'}
                  onMouseLeave={e => e.target.style.color = '#8a8e8a'}
                >{label}</Link>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.3px' }}>Get in Touch</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '10px', color: '#8a8e8a' }}><MailIcon />cravio.email@gmail.com</p>
            <p style={{ fontSize: '0.85rem', color: '#8a8e8a' }}><PinIcon />Ahmedabad, India</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #2f332f', paddingTop: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '0.8rem', color: '#5a5e5a' }}>© 2024 Cravio. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy Policy', 'Terms of Service'].map((item) => (
              <span key={item} style={{ fontSize: '0.8rem', color: '#5a5e5a', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#8a8e8a'}
                onMouseLeave={e => e.target.style.color = '#5a5e5a'}
              >{item}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
