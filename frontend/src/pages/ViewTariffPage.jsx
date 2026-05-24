import { useState } from 'react';

function ViewTariffPage({ categoryColors }) {
  const [tab, setTab] = useState('add');
  const [tariffs, setTariffs] = useState([
    { id: 't1', category: 'Standard', type: 'AC', date: '2026-05-17', charge: 700, bedCharge: 70, mealPlan: 'EP' },
  ]);
  const [form, setForm] = useState({ category: '', type: 'AC', chargeMode: 'single', charge: '', bedCharge: '', mealPlan: 'EP', date: '' });
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState('');

  const inp = { padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { fontSize: '0.85rem', color: '#444', fontWeight: 600, marginBottom: 4, display: 'block' };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.category || !form.charge) return;
    const newTariff = { id: `t${Date.now()}`, category: form.category, type: form.type, date: form.date || new Date().toISOString().split('T')[0], charge: parseFloat(form.charge), bedCharge: parseFloat(form.bedCharge || 0), mealPlan: form.mealPlan };
    setTariffs(prev => [...prev, newTariff]);
    setSuccess('Tariff added successfully!');
    setForm({ category: '', type: 'AC', chargeMode: 'single', charge: '', bedCharge: '', mealPlan: 'EP', date: '' });
    setTimeout(() => { setSuccess(''); setTab('list'); }, 1500);
  };

  const filtered = tariffs.filter(t => (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo));

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>💰 View / Add Tariff</h2>
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', marginBottom: 24 }}>
        {[['add', 'Add Tariff Module'], ['list', 'Tariff Module List']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', background: tab === key ? '#fff' : '#f7f8fa', fontWeight: tab === key ? 700 : 500, color: tab === key ? '#1565c0' : '#666', fontSize: '0.85rem', borderBottom: tab === key ? '2px solid #1565c0' : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0' }}>{label}</button>
        ))}
      </div>

      {tab === 'add' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
          {success && <div style={{ background: '#f0fff4', border: '1px solid #9be9a8', borderRadius: 7, padding: '8px 14px', color: '#1e8449', fontSize: '0.82rem', marginBottom: 16 }}>✅ {success}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px 24px', alignItems: 'start' }}>
            <label style={lbl}>Room Category *</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required style={inp}>
              <option value="">--Select Room Category--</option>
              {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={lbl}>Room Type *</label>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 8 }}>
              {['AC', 'Non-AC'].map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: form.type === t ? 700 : 400 }}>
                  <input type="radio" name="roomType" value={t} checked={form.type === t} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />{t}
                </label>
              ))}
            </div>

            <label style={lbl}>Set Charge According to *</label>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 8 }}>
              {[['single', 'Single Day'], ['custom', 'Your Choice']].map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: form.chargeMode === val ? 700 : 400 }}>
                  <input type="radio" name="chargeMode" value={val} checked={form.chargeMode === val} onChange={e => setForm(p => ({ ...p, chargeMode: e.target.value }))} />{label}
                </label>
              ))}
            </div>

            <label style={lbl}>Room Charge *</label>
            <div>
              <input type="number" value={form.charge} onChange={e => setForm(p => ({ ...p, charge: e.target.value }))} placeholder="Enter Standard Charge.." required style={inp} />
              {form.charge && <div style={{ marginTop: 5, fontSize: '0.75rem', color: '#1565c0', fontWeight: 600 }}>GST: {parseFloat(form.charge) > 7499 ? '12%' : '5%'} (auto-calculated)</div>}
            </div>

            <label style={lbl}>Bed Charge *</label>
            <input type="number" value={form.bedCharge} onChange={e => setForm(p => ({ ...p, bedCharge: e.target.value }))} placeholder="Enter Bed Charge.." style={inp} />

            <label style={lbl}>Meal Plan *</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 8, flexWrap: 'wrap' }}>
              {['EP', 'CP', 'MAP', 'AP'].map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: '0.85rem', fontWeight: form.mealPlan === m ? 700 : 400 }}>
                  <input type="radio" name="mealPlan" value={m} checked={form.mealPlan === m} onChange={e => setForm(p => ({ ...p, mealPlan: e.target.value }))} />{m}
                </label>
              ))}
            </div>

            <label style={lbl}>Date *</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="submit" style={{ padding: '9px 24px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Submit</button>
            <button type="reset" onClick={() => setForm({ category: '', type: 'AC', chargeMode: 'single', charge: '', bedCharge: '', mealPlan: 'EP', date: '' })} style={{ padding: '9px 24px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>Reset</button>
          </div>
        </form>
      )}

      {tab === 'list' && (
        <div>
          <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 10 }}>Please Enter Date Range To Search Tariff Module older than 30 Days</div>
            <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 14, fontSize: '0.92rem' }}>Tariff Module REPORT</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div><label style={{ ...lbl, marginBottom: 6 }}>From:</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, width: 180 }} /></div>
              <div><label style={{ ...lbl, marginBottom: 6 }}>To:</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inp, width: 180 }} /></div>
              <button style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>View Report</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['Copy', 'CSV', 'Print'].map(b => (<button key={b} style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 5, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>{b}</button>))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#666' }}>Search:</span>
              <input style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid #ddd', fontSize: '0.78rem', width: 180, outline: 'none' }} />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#1565c0' }}>
                {['SR.NO', 'CATEGORY', 'TYPE', 'DATE', 'CHARGE', 'BED CHARGE', 'MEAL PLAN', 'GST'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#fff', fontSize: '0.75rem', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>No tariffs found for selected date range</td></tr>
                : filtered.map((t, idx) => (
                  <tr key={t.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 14px', color: '#888' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{t.category.toUpperCase()}</td>
                    <td style={{ padding: '10px 14px' }}>{t.type}</td>
                    <td style={{ padding: '10px 14px' }}>{t.date}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1e8449' }}>₹{t.charge}</td>
                    <td style={{ padding: '10px 14px' }}>₹{t.bedCharge}</td>
                    <td style={{ padding: '10px 14px' }}>{t.mealPlan}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1565c0' }}>{t.charge > 7499 ? '12%' : '5%'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ViewTariffPage;