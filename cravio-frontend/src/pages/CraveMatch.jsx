import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getLocation } from '../lib/locationStore';

const QUESTIONS = [
  {
    question: "How do you feel about spice?",
    options: [
      { label: "Keep it mild", emoji: "🌿" },
      { label: "A little kick", emoji: "🌶️" },
      { label: "Bring the heat", emoji: "🔥" },
      { label: "Extra spicy", emoji: "💥" },
    ],
  },
  {
    question: "What type of food are you in the mood for?",
    options: [
      { label: "Crispy & fried", emoji: "🍟" },
      { label: "Smooth & creamy", emoji: "🍦" },
      { label: "Rich & saucy", emoji: "🍝" },
      { label: "Hearty & filling", emoji: "🥖" },
    ],
  },
  {
    question: "What's your dining style?",
    options: [
      { label: "Fine dining", emoji: "🥂" },
      { label: "Casual & relaxed", emoji: "😎" },
      { label: "Quick bite", emoji: "⚡" },
      { label: "Cozy & quiet", emoji: "🕯️" },
    ],
  },
  {
    question: "Flavor preference?",
    options: [
      { label: "Sweet", emoji: "🍰" },
      { label: "Savory & rich", emoji: "🥩" },
      { label: "Bold & roasted", emoji: "☕" },
      { label: "Tangy & sour", emoji: "🍋" },
    ],
  },
  {
    question: "Favorite drink to go along?",
    options: [
      { label: "Coffee", emoji: "☕" },
      { label: "Chai", emoji: "🍵" },
      { label: "Cold drink or soda", emoji: "🧃" },
      { label: "Specialty beverage", emoji: "🍷" },
    ],
  },
];

export default function CraveMatch() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnswer = async (answerIndex) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setLoading(true);
      setError('');
      try {
        const loc = getLocation();
        const { data } = await api.post('/restaurants/cravematch/', {
          answers: newAnswers,
          city: loc?.city || '',
        });
        setResult(data);
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const restart = () => {
    setCurrentQ(0);
    setAnswers([]);
    setResult(null);
    setError('');
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingWrap}>
          <div style={styles.spinner} />
          <p style={{ color: '#707572', marginTop: 16 }}>Finding restaurant matches for you...</p>
        </div>
      </div>
    );
  }

  if (result) {
    const { personality, restaurants } = result;
    return (
      <div style={styles.page}>
        <div style={styles.resultContainer}>
          <div style={{ ...styles.personalityCard, borderColor: personality.color }}>
            <div style={{ ...styles.personalityBadge, backgroundColor: personality.color }}>
              YOUR TASTE PROFILE
            </div>
            <h1 style={styles.personalityTitle}>{personality.title}</h1>
            <p style={styles.personalityDesc}>{personality.description}</p>
            <div style={styles.cuisineTags}>
              {personality.cuisines.map(c => (
                <span key={c} style={{ ...styles.cuisineTag, borderColor: personality.color, color: personality.color }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {restaurants.length > 0 && (
            <div style={styles.matchedSection}>
              <h3 style={styles.matchedTitle}>Recommended Restaurants for You</h3>
              <div style={styles.matchedGrid}>
                {restaurants.map(r => (
                  <div
                    key={r.id}
                    style={styles.matchedCard}
                    onClick={() => navigate(`/restaurants/${r.id}`)}
                  >
                    {r.image && (
                      <img
                        src={r.image.startsWith('http') ? r.image : `http://localhost:8000${r.image}`}
                        alt={r.name}
                        style={styles.matchedImg}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div style={styles.matchedBody}>
                      <h4 style={styles.matchedName}>{r.name}</h4>
                      <p style={styles.matchedCuisine}>{r.cuisine}</p>
                      <p style={styles.matchedCity}>📍 {r.city}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={restart} style={styles.retakeBtn}>
            Take Quiz Again
          </button>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[currentQ];
  const progress = ((currentQ) / QUESTIONS.length) * 100;

  return (
    <div style={styles.page}>
      <div style={styles.quizContainer}>
        <div style={styles.hero}>
          <div style={styles.heroBadge}>TASTE FINDER</div>
          <h1 style={styles.heroTitle}>CraveMatch</h1>
          <p style={styles.heroSub}>Answer 5 simple questions to get restaurant recommendations based on your preferences.</p>
        </div>

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <p style={styles.progressLabel}>Question {currentQ + 1} of {QUESTIONS.length}</p>

        <div style={styles.questionCard}>
          <h2 style={styles.questionText}>{q.question}</h2>
          <div style={styles.optionsGrid}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                style={styles.optionBtn}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#3B4F39';
                  e.currentTarget.style.backgroundColor = '#EAF0E9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#EAE6DF';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <span style={styles.optionEmoji}>{opt.emoji}</span>
                <span style={styles.optionLabel}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#FDFBF7',
    fontFamily: "'Inter', sans-serif",
    padding: '0 0 60px',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
  },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid #EAE6DF',
    borderTop: '3px solid #3B4F39',
    animation: 'spin 0.8s linear infinite',
  },
  hero: {
    textAlign: 'center',
    padding: '50px 20px 30px',
    backgroundColor: '#F4EFE6',
    borderBottom: '1px solid #EAE6DF',
    marginBottom: 36,
  },
  heroBadge: {
    display: 'inline-block',
    backgroundColor: '#EAF0E9',
    color: '#3B4F39',
    borderRadius: 4,
    padding: '4px 12px',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '1px',
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2.4rem',
    fontWeight: 700,
    color: '#3B4F39',
    margin: '0 0 8px',
  },
  heroSub: {
    color: '#707572',
    fontSize: '0.95rem',
    margin: 0,
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  quizContainer: { maxWidth: 700, margin: '0 auto' },
  progressBar: {
    height: 4,
    backgroundColor: '#EAE6DF',
    borderRadius: 4,
    margin: '0 20px 8px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B4F39',
    borderRadius: 4,
    transition: 'width 0.4s ease',
  },
  progressLabel: {
    textAlign: 'center',
    fontSize: '0.78rem',
    color: '#707572',
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EAE6DF',
    borderRadius: 16,
    padding: '36px 28px',
    margin: '0 20px',
    boxShadow: '0 4px 20px rgba(59,79,57,0.04)',
  },
  questionText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1C1E1D',
    textAlign: 'center',
    marginBottom: 28,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  optionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '20px 16px',
    border: '1.5px solid #EAE6DF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif",
  },
  optionEmoji: { fontSize: '1.8rem' },
  optionLabel: { fontSize: '0.88rem', fontWeight: 600, color: '#3A3D3B' },
  error: { color: '#C27047', textAlign: 'center', marginTop: 16, fontSize: '0.88rem' },
  resultContainer: { maxWidth: 700, margin: '0 auto', padding: '40px 20px' },
  personalityCard: {
    backgroundColor: '#FFFFFF',
    border: '2px solid #EAE6DF',
    borderRadius: 16,
    padding: '32px 28px',
    textAlign: 'center',
    marginBottom: 32,
    boxShadow: '0 4px 20px rgba(59,79,57,0.06)',
  },
  personalityBadge: {
    display: 'inline-block',
    color: '#FFFFFF',
    borderRadius: 6,
    padding: '5px 14px',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '1.2px',
    marginBottom: 16,
  },
  personalityTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '0 0 12px',
  },
  personalityDesc: {
    color: '#707572',
    fontSize: '0.92rem',
    lineHeight: 1.6,
    marginBottom: 20,
    maxWidth: 500,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  cuisineTags: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  cuisineTag: {
    padding: '4px 14px',
    border: '1.5px solid',
    borderRadius: 20,
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  matchedSection: { marginBottom: 32 },
  matchedTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1C1E1D',
    marginBottom: 16,
    textAlign: 'center',
  },
  matchedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
  },
  matchedCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EAE6DF',
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    boxShadow: '0 2px 10px rgba(59,79,57,0.04)',
  },
  matchedImg: { width: '100%', height: 130, objectFit: 'cover' },
  matchedBody: { padding: '12px 14px' },
  matchedName: {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#1C1E1D',
    margin: '0 0 4px',
  },
  matchedCuisine: { fontSize: '0.78rem', color: '#707572', margin: '0 0 4px' },
  matchedCity: { fontSize: '0.75rem', color: '#707572', margin: 0 },
  retakeBtn: {
    display: 'block',
    margin: '0 auto',
    backgroundColor: 'transparent',
    color: '#3B4F39',
    border: '1.5px solid #3B4F39',
    borderRadius: 8,
    padding: '12px 32px',
    fontSize: '0.92rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s ease',
  },
};
