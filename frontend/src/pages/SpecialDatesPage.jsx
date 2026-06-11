import { useState } from 'react';
import { saveSpecialDate, updateSpecialDate, deleteSpecialDate, getSpecialDates } from '../api.js';

const TYPE_OPTIONS = [
  { value: 'festival',  label: '🎉 Festival',    color: '#e67e22' },
  { value: 'peak',      label: '📈 Peak Season', color: '#e74c3c' },
  { value: 'blackout',  label: '🚫 Blackout',    color: '#2c3e50' },
  { value: 'longweek',  label: '🏖️ Long Weekend',color: '#8e44ad' },
  { value: 'custom',    label: '📌 Custom',      color: '#1565c0' },
];

const TYPE_MAP = Object.fromEntries(TYPE_OPTIONS.map(t => [t.value, t]));

function SpecialDatesPage({ specialDates = [], onSpecialDatesChange }) {
  const [tab, setTab]       = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const emptyForm = { name: '', type: 'festival', from_date: '', to_date: '', color: '#e67e22' };
  const [form, setForm]     = useState(emptyForm);

  const inp = {
  padding: '7px 10px', borderRadius: 6, border: '1px solid #ccc',
  fontSize: '0.82rem', width: '100%', boxSizing: 'border-box',
  outline: 'none', background: '#fff', color: '#1a1a2e',
};
  const lbl = { fontSize: '0.82rem', fontWeight: 600, color: '#444', marginBottom: 4, display: 'block' };

  const reload = async () => {
    const fresh = await getSpecialDates();
    onSpecialDatesChange(fresh || []);
  };

  const handleTypeChange = (type) => {
    const preset = TYPE_MAP[type]?.color || '#1565c0';
    setForm(p => ({ ...p, type, color: preset }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.name.trim())    { setError('Name is required'); return; }
    if (!form.from_date)      { setError('From date is required'); return; }
    if (!form.to_date)        { setError('To date is required'); return; }
    if (form.to_date < form.from_date) { setError('To date must be after From date'); return; }

    try {
      if (editingId) {
        await updateSpecialDate(editingId, form);
        setSuccess('Updated successfully!');
      } else {
        await saveSpecialDate(form);
        setSuccess('Special date added!');
      }
      await reload();
      setForm(emptyForm);
      setEditingId(null);
      setTimeout(() => { setSuccess(''); setTab('list'); }, 1500);
    } catch (err) {
      setError('Failed to save. Try again.');
    }
  };

  const handleEdit = (sd) => {
    setForm({
      name:      sd.name,
      type:      sd.type,
      from_date: sd.from_date?.slice(0, 10) || '',
      to_date:   sd.to_date?.slice(0, 10)   || '',
      color:     sd.color,
    });
    setEditingId(sd.id);
    setTab('add');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteSpecialDate(id);
      await reload();
    } catch {
      alert('Delete failed');
    }
  };

  // Days in range helper
  const dayCount = (from, to) => {
    if (!from || !to) return 0;
    return Math.max(0, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);
  };

  const formatDisplay = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>🗓️ Special Date Tags</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', marginBottom: 24 }}>
        {[['list', 'Special Dates List'], ['add', editingId ? 'Edit Special Date' : 'Add Special Date']].map(([key, label]) => (
          <button key={key}
            onClick={() => { setTab(key); if (key === 'list') { setEditingId(null); setForm(emptyForm); setError(''); } }}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer',
              background: tab === key ? '#fff' : '#f7f8fa',
              fontWeight: tab === key ? 700 : 500,
              color: tab === key ? '#1565c0' : '#666',
              fontSize: '0.85rem',
              borderBottom: tab === key ? '2px solid #1565c0' : '2px solid transparent',
              marginBottom: -2, borderRadius: '6px 6px 0 0',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── LIST TAB ── */}
      {tab === 'list' && (
        <div>
          {specialDates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🗓️</div>
              <div style={{ fontWeight: 600 }}>No special dates configured yet</div>
              <div style={{ fontSize: '0.8rem', marginTop: 6 }}>Click "Add Special Date" to get started</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f0f2f5' }}>
                  {['SR.', 'NAME', 'TYPE', 'FROM', 'TO', 'DAYS', 'COLOR', 'ACTION'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.72rem', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specialDates.map((sd, idx) => (
                  <tr key={sd.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 12px', color: '#aaa' }}>{idx + 1}</td>

                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1a1a2e' }}>
                      {sd.name}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: (TYPE_MAP[sd.type]?.color || '#999') + '22',
                        color: TYPE_MAP[sd.type]?.color || '#999',
                        border: `1px solid ${TYPE_MAP[sd.type]?.color || '#999'}44`,
                        borderRadius: 6, padding: '2px 8px',
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>
                        {TYPE_MAP[sd.type]?.label || sd.type}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px', color: '#555' }}>{formatDisplay(sd.from_date)}</td>
                    <td style={{ padding: '10px 12px', color: '#555' }}>{formatDisplay(sd.to_date)}</td>

                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1565c0' }}>
                      {dayCount(sd.from_date?.slice(0,10), sd.to_date?.slice(0,10))} day{dayCount(sd.from_date?.slice(0,10), sd.to_date?.slice(0,10)) !== 1 ? 's' : ''}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 20, height: 20, background: sd.color, borderRadius: 4, border: '1px solid #ddd' }} />
                        <span style={{ fontSize: '0.68rem', color: '#888' }}>{sd.color}</span>
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEdit(sd)}
                          style={{ color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                          EDIT
                        </button>
                        <span style={{ color: '#ddd' }}>/</span>
                        <button onClick={() => handleDelete(sd.id, sd.name)}
                          style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#888' }}>
            {specialDates.length} special date{specialDates.length !== 1 ? 's' : ''} configured
          </div>
        </div>
      )}

      {/* ── ADD / EDIT TAB ── */}
      {tab === 'add' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error   && <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '8px 14px', color: '#c0392b', fontSize: '0.82rem' }}>❌ {error}</div>}
          {success && <div style={{ background: '#f0fff4', border: '1px solid #9be9a8', borderRadius: 7, padding: '8px 14px', color: '#1e8449', fontSize: '0.82rem' }}>✅ {success}</div>}

          {/* Name */}
          <div>
            <label style={lbl}>Name * <span style={{ fontWeight: 400, color: '#888' }}>(e.g. Diwali, Peak Season, Christmas)</span></label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Enter special date name" style={inp} autoFocus />
          </div>

          {/* Type */}
          <div>
            <label style={lbl}>Type *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TYPE_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => handleTypeChange(opt.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                    border: form.type === opt.value ? `2px solid ${opt.color}` : '2px solid #ddd',
                    background: form.type === opt.value ? opt.color + '18' : '#f8f9fa',
                    color: form.type === opt.value ? opt.color : '#666',
                    transition: 'all 0.12s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>From Date *</label>
              <input type="date" value={form.from_date}
                onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))}
                style={{ ...inp, colorScheme: 'light', cursor: 'pointer' }} />
            </div>
            <div>
              <label style={lbl}>To Date *</label>
              <input type="date" value={form.to_date}
                min={form.from_date || ''}
                onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))}
                style={{ ...inp, colorScheme: 'light', cursor: 'pointer' }} />
            </div>
          </div>

          {/* Days preview */}
          {form.from_date && form.to_date && form.to_date >= form.from_date && (
            <div style={{ background: '#e3f0ff', border: '1px solid #90caf9', borderRadius: 6, padding: '7px 12px', fontSize: '0.78rem', color: '#1565c0', fontWeight: 600 }}>
              📅 {dayCount(form.from_date, form.to_date)} day{dayCount(form.from_date, form.to_date) !== 1 ? 's' : ''} selected
              &nbsp;·&nbsp; {formatDisplay(form.from_date)} → {formatDisplay(form.to_date)}
            </div>
          )}

          {/* Color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <label style={lbl}>Tag Color</label>
              <input type="color" value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                style={{ width: 60, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
            </div>
            {/* Preview */}
            <div style={{ marginTop: 20 }}>
              <span style={{
                background: form.color, color: '#fff',
                padding: '3px 10px', borderRadius: 4,
                fontSize: '0.72rem', fontWeight: 800,
              }}>
                {form.name || 'Preview'}
              </span>
              <div style={{ fontSize: '0.65rem', color: '#888', marginTop: 4 }}>← Tag preview in calendar</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit"
              style={{ padding: '9px 28px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
              {editingId ? '💾 Update' : '➕ Add Special Date'}
            </button>
            <button type="button"
              onClick={() => { setForm(emptyForm); setEditingId(null); setError(''); }}
              style={{ padding: '9px 24px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>
              Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default SpecialDatesPage;