import React, { useState } from 'react';
import api from '../api/axios';

const S = ({ children }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
const MailSvg = () => <S><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></S>;
const PinSvg = () => <S><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></S>;
const ClockSvg = () => <S><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></S>;
const CheckSvg = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/contact/', form);
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '60px 0' }}>
      <div className="container-cravio">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', fontWeight: 700, marginBottom: '12px' }}>Get in Touch</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Have questions or feedback? We'd love to hear from you.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '40px', alignItems: 'start' }}>
          {/* Info */}
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '20px', fontSize: '1.1rem' }}>Contact Information</h3>
            {[
              { icon: <MailSvg />, label: 'Email', value: 'cravio.email@gmail.com' },
              { icon: <PinSvg />, label: 'Address', value: 'Ahmedabad, Gujarat, India' },
              { icon: <ClockSvg />, label: 'Support Hours', value: '24/7' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--olive-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '32px' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><CheckSvg /></div>
                <h3 style={{ marginBottom: '10px' }}>Message Sent!</h3>
                <p style={{ color: 'var(--text-muted)' }}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="btn-olive" style={{ marginTop: '20px', padding: '9px 22px' }}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label>Your Name</label>
                    <input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label>Subject</label>
                  <input placeholder="How can we help you?" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                </div>
                <div>
                  <label>Message</label>
                  <textarea rows={5} placeholder="Tell us more..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} />
                </div>
                {error && <p style={{ color: '#C27047', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
                <button type="submit" className="btn-olive" style={{ padding: '12px', borderRadius: '9px', fontSize: '0.98rem' }} disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

