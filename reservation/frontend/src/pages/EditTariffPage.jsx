import { useState } from 'react';

function EditTariffPage({ categoryColors }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ category: '', charge: '', bedCharge: '', mealPlan: '', dateFrom: today, dateTo: today });
  const [success, setSuccess] = useState('');

  const inp = { padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { fontSize: '0.85rem', color: '#1565c0', fontWeight: 700, marginBottom: 4, display: 'block' };

  const handleUpdate = (e) => {
    e.preventDefault();
    setSuccess('Tariff updated successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '1.2rem', color: '#1a1a2e', textAlign: 'center' }}>💰 Tariff Modal Changes</h2>
      {success && <div style={{ background: '#f0fff4', border: '1px solid #9be9a8', borderRadius: 7, padding: '8px 14px', color: '#1e8449', fontSize: '0.82rem', marginBottom: 16 }}>✅ {success}</div>}
      <form onSubmit={handleUpdate} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '20px 24px', alignItems: 'center' }}>
          <label style={lbl}>Room Category *</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required style={inp}>
            <option value="">--Select Room Category--</option>
            {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={lbl}>Room Charge:</label>
          <div>
            <input type="number" value={form.charge} onChange={e => setForm(p => ({ ...p, charge: e.target.value }))} placeholder="Enter Standard Charge.." style={inp} />
            {form.charge && <div style={{ marginTop: 4, fontSize: '0.72rem', color: '#1565c0', fontWeight: 600 }}>GST: {parseFloat(form.charge) > 7499 ? '12%' : '5%'} (auto)</div>}
          </div>

          <label style={lbl}>Extra Bed Charge:</label>
          <input type="number" value={form.bedCharge} onChange={e => setForm(p => ({ ...p, bedCharge: e.target.value }))} placeholder="Enter Bed Charge.." style={inp} />

          <label style={lbl}>MEAL PLAN:</label>
          <select value={form.mealPlan} onChange={e => setForm(p => ({ ...p, mealPlan: e.target.value }))} style={inp}>
            <option value="">--Select Meal Plan----</option>
            {['EP', 'CP', 'MAP', 'AP'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <label style={lbl}>From:</label>
          <input type="date" value={form.dateFrom} onChange={e => setForm(p => ({ ...p, dateFrom: e.target.value }))} style={inp} />

          <label style={lbl}>To:</label>
          <input type="date" value={form.dateTo} onChange={e => setForm(p => ({ ...p, dateTo: e.target.value }))} style={inp} />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
          <button type="submit" style={{ padding: '9px 32px', border: 'none', borderRadius: 6, background: '#1565c0', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Update</button>
          <button type="reset" onClick={() => setForm({ category: '', charge: '', bedCharge: '', mealPlan: '', dateFrom: today, dateTo: today })} style={{ padding: '9px 32px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: '#555' }}>Reset</button>
        </div>
      </form>
    </div>
  );
}

export default EditTariffPage;