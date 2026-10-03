import React from 'react';
import { Link } from 'react-router-dom';

const I = ({ children, size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;

export default function About() {
  const values = [
    { icon: <I><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></I>, title: 'Passion for Food', desc: 'We celebrate culinary diversity and the people behind every dish.' },
    { icon: <I><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></I>, title: 'Trust & Reliability', desc: 'Every restaurant on Cravio is verified and quality-checked.' },
    { icon: <I><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></I>, title: 'Seamless Experience', desc: 'Fast, intuitive, and designed for real dining decisions.' },
    { icon: <I><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></I>, title: 'Owner Success', desc: 'We give restaurant owners the tools to grow their business.' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh' }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 20px 60px', background: 'linear-gradient(135deg, var(--cream) 0%, var(--terracotta-pale) 100%)' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '16px' }}>About Cravio</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
          Good Food. Great Times. We connect food lovers with the best restaurants, making every dining experience unforgettable.
        </p>
      </section>

      <div className="container-cravio" style={{ padding: '60px 20px' }}>
        {/* Mission */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', marginBottom: '60px' }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>Our Mission</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '16px' }}>
              Cravio was built to make dining out effortless. We believe that great food is better when paired with a great experience — from browsing menus to booking tables.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
              We empower restaurant owners with tools to manage their business, and give customers a seamless way to discover, order, and reserve at their favourite spots.
            </p>
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '40px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {[['500+', 'Restaurants'], ['50K+', 'Orders Served'], ['10K+', 'Happy Customers'], ['4.8★', 'Avg Rating']].map(([num, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--olive)' }}>{num}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values */}
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', marginBottom: '32px' }}>What We Stand For</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '60px' }}>
          {values.map(val => (
            <div key={val.title} style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: 'var(--olive)' }}>{val.icon}</div>
              <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>{val.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{val.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', background: 'var(--olive)', borderRadius: '20px', padding: '48px 40px', color: 'white' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', marginBottom: '12px' }}>Ready to explore?</h2>
          <p style={{ opacity: 0.85, marginBottom: '24px' }}>Join thousands of food lovers discovering great dining experiences every day.</p>
          <Link to="/restaurants" style={{ background: 'white', color: 'var(--olive)', padding: '12px 32px', borderRadius: '9px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
            Browse Restaurants
          </Link>
        </div>
      </div>
    </div>
  );
}
