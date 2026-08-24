import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ManageExpenses() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Expense Form State
  const [category, setCategory] = useState('Ingredients');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchOwnerRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRest || restaurants.length > 0) {
      fetchData();
    }
  }, [selectedRest]);

  const fetchOwnerRestaurants = async () => {
    try {
      const { data } = await api.get('/restaurants/mine/');
      const list = Array.isArray(data) ? data : (data.results || []);
      setRestaurants(list);
      if (list.length > 0) {
        setSelectedRest(list[0].id);
      }
    } catch {
      setError('Failed to load your restaurants.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const restParam = selectedRest ? `?restaurant=${selectedRest}` : '';
      const [expRes, pnlRes] = await Promise.all([
        api.get(`/restaurants/expenses/${restParam}`),
        api.get(`/restaurants/profit-loss-report/${restParam}`)
      ]);

      const expData = Array.isArray(expRes.data) ? expRes.data : (expRes.data.results || []);
      setExpenses(expData);
      setReport(pnlRes.data);
    } catch {
      setError('Failed to load expense and financial records.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }
    if (!selectedRest && restaurants.length > 0) {
      setError('Please select a restaurant.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/restaurants/expenses/', {
        restaurant: selectedRest || restaurants[0]?.id,
        category,
        amount: parseFloat(amount),
        date,
        description
      });

      setSuccess('Expense recorded successfully!');
      setAmount('');
      setDescription('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add expense record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.delete(`/restaurants/expenses/${id}/`);
      setSuccess('Expense deleted.');
      fetchData();
    } catch {
      setError('Failed to delete expense.');
    }
  };

  const handleDownloadPnL = async () => {
    try {
      const restParam = selectedRest ? `restaurant=${selectedRest}&` : '';
      const response = await api.get(`/restaurants/profit-loss-report/?${restParam}download=true`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cravio_Profit_Loss_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download Profit & Loss CSV report.');
    }
  };

  return (
    <div style={styles.page}>
      {/* ── Top Navigation / Back Button ── */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/owner/dashboard" style={styles.backBtn}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Financials & Expense Tracker</h1>
          <p style={styles.subtitle}>Track operational costs, view net profit margin, and export Profit & Loss reports.</p>
        </div>

        {restaurants.length > 1 && (
          <select
            value={selectedRest}
            onChange={(e) => setSelectedRest(e.target.value)}
            style={styles.restSelect}
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}
      {success && <div style={styles.successAlert}>{success}</div>}

      {/* ── Summary Financial Cards ── */}
      {report && (
        <div style={styles.cardGrid}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>💰</div>
            <div>
              <div style={styles.cardLabel}>Total Gross Revenue (Profit)</div>
              <div style={{ ...styles.cardValue, color: '#3B4F39' }}>₹{report.total_gross_revenue?.toLocaleString('en-IN')}</div>
              <div style={styles.cardSub}>Online: ₹{report.total_online_revenue} | Offline: ₹{report.total_offline_revenue} | Dine-In: ₹{report.total_dinein_revenue}</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>📉</div>
            <div>
              <div style={styles.cardLabel}>Total Expenses</div>
              <div style={{ ...styles.cardValue, color: '#C27047' }}>₹{report.total_expenses?.toLocaleString('en-IN')}</div>
              <div style={styles.cardSub}>{expenses.length} logged expense entries</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>{report.net_profit >= 0 ? '📈' : '⚠️'}</div>
            <div>
              <div style={styles.cardLabel}>Net Profit / Loss</div>
              <div style={{ ...styles.cardValue, color: report.net_profit >= 0 ? '#27ae60' : '#c0392b' }}>
                ₹{report.net_profit?.toLocaleString('en-IN')}
              </div>
              <div style={styles.cardSub}>Margin: <strong>{report.profit_margin}%</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Toolbar: Download Report ── */}
      <div style={styles.toolbar}>
        <h3 style={styles.sectionTitle}>Expense Records</h3>
        <button onClick={handleDownloadPnL} style={styles.downloadBtn}>
          📥 Export Profit & Loss Report (CSV)
        </button>
      </div>

      {/* ── Layout: Add Form + Expense Table ── */}
      <div style={styles.mainGrid}>
        {/* Expense Form */}
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Log New Expense</h3>
          <form onSubmit={handleAddExpense} style={styles.form}>
            <div>
              <label style={styles.label}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={styles.input}
              >
                <option value="Ingredients">Ingredients & Raw Materials</option>
                <option value="Staff Salary">Staff Salary & Wages</option>
                <option value="Rent">Rent & Real Estate</option>
                <option value="Utilities">Electricity, Gas & Water</option>
                <option value="Marketing">Marketing & Promotions</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Other">Other Operating Expenses</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 12500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Description / Notes</label>
              <textarea
                placeholder="e.g. Weekly vegetable & meat purchase invoice #402"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={styles.textarea}
              />
            </div>

            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Recording...' : '+ Record Expense'}
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loading}>Loading financial records...</div>
          ) : expenses.length === 0 ? (
            <div style={styles.emptyState}>No expenses recorded yet. Fill the form to log your first cost entry.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} style={styles.tr}>
                    <td style={styles.td}>{exp.date}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{exp.category}</span>
                    </td>
                    <td style={styles.td}>{exp.description || '—'}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#C27047' }}>
                      ₹{parseFloat(exp.amount).toLocaleString('en-IN')}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        style={styles.deleteBtn}
                        title="Delete expense"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '30px', maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
  backBtn: { textDecoration: 'none', color: '#3B4F39', fontWeight: 600, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#EAF0E9', padding: '6px 14px', borderRadius: 6 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: '1.8rem', fontWeight: 700, color: '#1C1E1D', margin: '0 0 6px', fontFamily: "'Playfair Display', serif" },
  subtitle: { color: '#707572', fontSize: '0.9rem', margin: 0 },
  restSelect: { padding: '8px 16px', borderRadius: 8, border: '1px solid #EAE6DF', fontSize: '0.9rem', outline: 'none' },
  errorAlert: { backgroundColor: '#FDF2F2', color: '#9B1C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.88rem' },
  successAlert: { backgroundColor: '#F0FDF4', color: '#166534', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.88rem' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 30 },
  card: { backgroundColor: '#FFFFFF', border: '1px solid #EAE6DF', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(59,79,57,0.04)' },
  cardIcon: { fontSize: '2.2rem', backgroundColor: '#F4EFE6', padding: '12px', borderRadius: 12 },
  cardLabel: { fontSize: '0.82rem', color: '#707572', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardValue: { fontSize: '1.6rem', fontWeight: 700, margin: '4px 0' },
  cardSub: { fontSize: '0.78rem', color: '#707572' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: '1.2rem', fontWeight: 700, color: '#1C1E1D', margin: 0, fontFamily: "'Playfair Display', serif" },
  downloadBtn: { backgroundColor: '#3B4F39', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  mainGrid: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 },
  formCard: { backgroundColor: '#FFFFFF', border: '1px solid #EAE6DF', borderRadius: 12, padding: '24px', height: 'fit-content' },
  formTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#1C1E1D', marginBottom: 16, margin: '0 0 16px' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#3A3D3B', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE6DF', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE6DF', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { width: '100%', backgroundColor: '#3B4F39', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginTop: 6 },
  tableCard: { backgroundColor: '#FFFFFF', border: '1px solid #EAE6DF', borderRadius: 12, overflow: 'hidden' },
  loading: { padding: 40, textAlign: 'center', color: '#707572' },
  emptyState: { padding: 40, textAlign: 'center', color: '#707572', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { backgroundColor: '#F9F8F6', borderBottom: '1px solid #EAE6DF' },
  th: { padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#707572', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #EAE6DF' },
  td: { padding: '14px 16px', fontSize: '0.88rem', color: '#1C1E1D' },
  badge: { backgroundColor: '#EAF0E9', color: '#3B4F39', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 },
  deleteBtn: { backgroundColor: 'transparent', color: '#C27047', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }
};
