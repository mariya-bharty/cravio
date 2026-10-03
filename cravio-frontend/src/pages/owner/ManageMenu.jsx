import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../../components/OwnerSidebar';
import api from '../../api/axios';

const EMPTY_FORM = { name: '', description: '', price: '', category: '', is_veg: false, is_available: true };

export default function ManageMenu() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Upload/Extraction states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [menuFile, setMenuFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [rawText, setRawText] = useState('');
  const [reparsing, setReparsing] = useState(false);

  const handleUploadFileChange = (e) => {
    setMenuFile(e.target.files[0]);
  };

  const handleExtractMenu = async (e) => {
    e.preventDefault();
    if (!menuFile) return;
    setExtracting(true);
    setMsg({ text: '', type: '' });
    
    const formData = new FormData();
    formData.append('menu_file', menuFile);

    try {
      const res = await api.post('/foods/extract-menu/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScannedItems(res.data.items || []);
      setRawText(res.data.raw_text || '');
      setReviewMode(true);
    } catch (err) {
      showMsg(err.response?.data?.detail || 'Failed to read menu file. Ensure it is a valid .txt file.', 'error');
    } finally {
      setExtracting(false);
    }
  };

  const handleReparseMenu = async () => {
    if (!rawText || !rawText.trim()) return;
    setReparsing(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await api.post('/foods/extract-menu/', { raw_text: rawText });
      setScannedItems(res.data.items || []);
      showMsg('✨ Re-parsed successfully!');
    } catch (err) {
      showMsg(err.response?.data?.detail || 'Failed to re-parse text.', 'error');
    } finally {
      setReparsing(false);
    }
  };

  const handleSaveBulkItems = async () => {
    setSavingBulk(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await api.post('/foods/bulk-create/', { items: scannedItems });
      showMsg(`🎉 Successfully saved ${res.data.count} items to your menu!`);
      // Refresh the food list
      const fRes = await api.get('/foods/mine/');
      setFoods(Array.isArray(fRes.data) ? fRes.data : (fRes.data.results || []));
      setShowUploadModal(false);
      setScannedItems([]);
      setRawText('');
      setReviewMode(false);
      setMenuFile(null);
    } catch (err) {
      showMsg(err.response?.data?.detail || 'Failed to save items.', 'error');
    } finally {
      setSavingBulk(false);
    }
  };

  useEffect(() => {
    Promise.all([api.get('/foods/mine/'), api.get('/categories/')])
      .then(([fRes, cRes]) => {
        setFoods(Array.isArray(fRes.data) ? fRes.data : (fRes.data.results || []));
        setCategories(Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || []));
      }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (food) => { setForm({ name: food.name, description: food.description, price: food.price, category: food.category || '', is_veg: food.is_veg, is_available: food.is_available }); setEditId(food.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        const res = await api.patch(`/foods/${editId}/`, form);
        setFoods(prev => prev.map(f => f.id === editId ? res.data : f));
        showMsg('Food item updated!');
      } else {
        const res = await api.post('/foods/', form);
        setFoods(prev => [res.data, ...prev]);
        showMsg('Food item added!');
      }
      setShowModal(false);
    } catch { showMsg('Error saving food item.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food item?')) return;
    try {
      await api.delete(`/foods/${id}/`);
      setFoods(prev => prev.filter(f => f.id !== id));
      showMsg('Food item deleted.');
    } catch { showMsg('Failed to delete.', 'error'); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <OwnerSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Manage Menu</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowUploadModal(true)} className="btn-outline-olive" style={{ padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>📤 Upload Menu</button>
            <button onClick={openAdd} className="btn-olive" style={{ padding: '9px 20px', borderRadius: '8px' }}>+ Add Item</button>
          </div>
        </div>

        {msg.text && (
          <div style={{ background: msg.type === 'error' ? '#fef2f2' : '#d4edda', border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#c3e6cb'}`, borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: msg.type === 'error' ? '#c0392b' : '#155724', fontSize: '0.88rem' }}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading menu...</div>
        ) : foods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍽️</div>
            <p>No food items yet. Add your first item!</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead style={{ background: 'var(--cream)' }}>
                <tr>{['Name', 'Category', 'Price', 'Type', 'Available', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {foods.map((food, i) => (
                  <tr key={food.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--cream)' : 'white' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 500 }}>{food.name}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{food.category_name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--olive)' }}>₹{parseFloat(food.price).toFixed(0)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.78rem', color: food.is_veg ? '#2e7d32' : '#c62828', fontWeight: 500 }}>{food.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.78rem', color: food.is_available ? '#155724' : '#721c24', background: food.is_available ? '#d4edda' : '#f8d7da', padding: '2px 10px', borderRadius: '20px' }}>
                        {food.is_available ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => openEdit(food)} style={{ background: 'var(--olive-pale)', border: 'none', color: 'var(--olive)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', marginRight: '6px', fontSize: '0.8rem', fontWeight: 500 }}>Edit</button>
                      <button onClick={() => handleDelete(food.id)} style={{ background: '#fef2f2', border: 'none', color: '#c0392b', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{editId ? 'Edit Food Item' : 'Add New Food Item'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label>Food Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Butter Chicken" required /></div>
              <div><label>Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description..." style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label>Price (₹) *</label><input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" required /></div>
                <div>
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={form.is_veg} onChange={e => setForm({ ...form, is_veg: e.target.checked })} /> 🟢 Vegetarian
                </label>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} /> ✅ Available
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" className="btn-olive" style={{ flex: 1, padding: '11px', borderRadius: '8px', opacity: submitting ? 0.7 : 1 }} disabled={submitting}>{submitting ? 'Saving...' : editId ? 'Update Item' : 'Add Item'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline-olive" style={{ flex: 1, padding: '11px', borderRadius: '8px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload/Extraction Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: reviewMode ? '960px' : '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', transition: 'max-width 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                {reviewMode ? '🔍 Review & Edit Scanned Items' : '📤 Upload & Scan Menu'}
              </h3>
              <button onClick={() => { setShowUploadModal(false); setMenuFile(null); setReviewMode(false); setScannedItems([]); setRawText(''); }} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
            </div>

            {reviewMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                  We scanned the following items from your upload. You can edit the raw text on the left and click <strong>Re-parse Text</strong>, or edit the structured fields on the right.
                </p>

                {/* Two-Column Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
                  
                  {/* Left Column: Raw Text */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark)' }}>Raw Scanned Text</label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Format: Item - Price</span>
                    </div>
                    <textarea 
                      value={rawText} 
                      onChange={e => setRawText(e.target.value)} 
                      placeholder="e.g. Butter Chicken - 350"
                      style={{ 
                        width: '100%', 
                        height: '380px', 
                        padding: '12px', 
                        borderRadius: '10px', 
                        border: '1px solid var(--border)', 
                        fontSize: '0.85rem', 
                        fontFamily: 'monospace', 
                        lineHeight: '1.5',
                        resize: 'none',
                        background: '#faf9f6',
                        outline: 'none',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                      }} 
                    />
                    <button 
                      type="button" 
                      onClick={handleReparseMenu} 
                      className="btn-outline-olive" 
                      style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: reparsing ? 'not-allowed' : 'pointer'
                      }}
                      disabled={reparsing}
                    >
                      {reparsing ? '🔄 Re-parsing text...' : '🔄 Re-parse Text'}
                    </button>
                  </div>

                  {/* Right Column: Parsed Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark)' }}>
                      Detected Items ({scannedItems.length})
                    </label>
                    <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }}>
                      {scannedItems.map((item, idx) => (
                        <div key={idx} style={{ background: 'var(--cream)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border)', position: 'relative' }}>
                          <button 
                            type="button" 
                            onClick={() => setScannedItems(prev => prev.filter((_, i) => i !== idx))} 
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#dc2626', fontSize: '1.1rem', cursor: 'pointer' }}
                            title="Remove item"
                          >
                            🗑️
                          </button>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark)' }}>Item Name</label>
                              <input 
                                type="text" 
                                value={item.name} 
                                onChange={e => {
                                  const newItems = [...scannedItems];
                                  newItems[idx].name = e.target.value;
                                  setScannedItems(newItems);
                                }} 
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }} 
                                required
                              />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark)' }}>Price (₹)</label>
                              <input 
                                type="number" 
                                value={item.price} 
                                onChange={e => {
                                  const newItems = [...scannedItems];
                                  newItems[idx].price = e.target.value;
                                  setScannedItems(newItems);
                                }} 
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }} 
                                required
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dark)' }}>Description</label>
                            <textarea 
                              value={item.description} 
                              onChange={e => {
                                const newItems = [...scannedItems];
                                newItems[idx].description = e.target.value;
                                setScannedItems(newItems);
                              }} 
                              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', resize: 'vertical', minHeight: '50px' }} 
                            />
                          </div>
                          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '0.82rem' }}>
                            <input 
                              type="checkbox" 
                              checked={item.is_veg} 
                              onChange={e => {
                                const newItems = [...scannedItems];
                                newItems[idx].is_veg = e.target.checked;
                                setScannedItems(newItems);
                              }} 
                            /> 🟢 Vegetarian
                          </label>
                        </div>
                      ))}
                      {scannedItems.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', margin: '40px 0' }}>No items in list. Add one or parse scanned text.</p>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setScannedItems(prev => [...prev, { name: '', description: '', price: '150', is_veg: true }])} 
                      className="btn-outline-olive" 
                      style={{ padding: '10px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
                    >
                      ➕ Add New Item
                    </button>
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    onClick={handleSaveBulkItems} 
                    className="btn-olive" 
                    style={{ flex: 2, padding: '12px', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, opacity: savingBulk ? 0.7 : 1 }} 
                    disabled={savingBulk || scannedItems.length === 0}
                  >
                    {savingBulk ? '💾 Saving Menu...' : '✅ Save to Menu'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setReviewMode(false); setScannedItems([]); setRawText(''); }} 
                    className="btn-outline-olive" 
                    style={{ flex: 1, padding: '12px', borderRadius: '8px' }}
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExtractMenu} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                  Upload a plain text menu file and we'll automatically extract, parse, and let you review and edit items before adding them.
                </p>
                <ul style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0, paddingLeft: '18px', lineHeight: '1.6' }}>
                  <li><strong>Text file (.txt)</strong> — one item per line: <code>Name - Description - Price</code></li>
                  <li>Example: <code>Butter Chicken - Rich tomato gravy - 350</code></li>
                </ul>


                <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', background: 'var(--cream)', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>{menuFile ? '✅' : '📄'}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: menuFile ? '#2d6a4f' : 'var(--olive)' }}>{menuFile ? menuFile.name : 'Choose a .txt file'}</span>
                  <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>Supports TXT only</span>
                  <input type="file" onChange={handleUploadFileChange} accept=".txt" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} required />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="btn-olive" style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, opacity: extracting ? 0.7 : 1 }} disabled={extracting || !menuFile}>
                    {extracting ? '🔍 Scanning Menu...' : '🚀 Scan Menu'}
                  </button>
                  <button type="button" onClick={() => { setShowUploadModal(false); setMenuFile(null); }} className="btn-outline-olive" style={{ padding: '12px 20px', borderRadius: '8px' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
