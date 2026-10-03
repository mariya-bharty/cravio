import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { register, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { confirm_password, ...data } = form;
      const user = await register(data);
      if (user.role === 'owner') navigate('/owner/dashboard');
      else navigate('/');
    } catch (err) {      const data = err.response?.data;
      if (!data) {
        setError('Registration failed. Please check your connection.');
        return;
      }
      // Map common backend field errors to readable messages
      if (data.email) {
        setError(Array.isArray(data.email) ? data.email[0] : data.email);
      } else if (data.non_field_errors) {
        setError(data.non_field_errors[0]);
      } else if (data.password) {
        setError(Array.isArray(data.password) ? data.password[0] : data.password);
      } else if (typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(' | ');
        setError(msgs);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      setError('');
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());

        const res = await api.post('/users/auth/google/', {
          credential: tokenResponse.access_token,
          email: userInfo.email,
          first_name: userInfo.given_name,
          last_name: userInfo.family_name,
        });
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        updateUser(res.data.user);
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.detail || 'Google sign-up failed. Please try again.');
      } finally {
        setGLoading(false);
      }
    },
    onError: () => setError('Google sign-up was cancelled or failed.'),
  });

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '6px' }}>Join Cravio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Create your account and start exploring</p>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '36px', boxShadow: '0 4px 20px rgba(74,92,63,0.08)' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', color: '#c0392b', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          {/* Role Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
            {[{ value: 'customer', label: '🙋 I\'m a Customer', desc: 'Browse & order food' },
              { value: 'owner', label: '🏪 I\'m an Owner', desc: 'Manage my restaurant' }].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, role: opt.value })}
                style={{
                  padding: '14px', border: `2px solid ${form.role === opt.value ? 'var(--olive)' : 'var(--border)'}`,
                  borderRadius: '10px', background: form.role === opt.value ? 'var(--olive-pale)' : 'white',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: form.role === opt.value ? 'var(--olive)' : 'var(--dark)' }}>{opt.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>First Name</label>
                <input placeholder="John" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div>
                <label>Last Name</label>
                <input placeholder="Doe" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
              </div>
            </div>
            <div>
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label>Phone Number</label>
              <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label>Confirm Password</label>
              <input type="password" placeholder="Repeat your password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} required />
            </div>
            <button type="submit" className="btn-olive" style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '9px', marginTop: '4px', opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>or sign up with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={gLoading}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: '9px', marginTop: 12,
              border: '1.5px solid var(--border)', background: 'white',
              cursor: gLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: '0.92rem', fontWeight: 600, color: 'var(--dark)',
              opacity: gLoading ? 0.7 : 1,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285f4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(66,133,244,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
          >
            {gLoading ? (
              <span>Signing up with Google...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
