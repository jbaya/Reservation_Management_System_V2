import { useState } from 'react';

function RoomCategoryPage({ categoryColors, rooms, onAddCategory, onDeleteCategory }) {
  const [tab, setTab] = useState('list');
  const [catName, setCatName] = useState('');
  const [numRooms, setNumRooms] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inp = { padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.85rem', color: '#444', fontWeight: 600 };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const name = catName.trim();
    if (!name) { setError('Category name required'); return; }
    if (categoryColors[name]) { setError('Category already exists'); return; }
    let num = numRooms.trim() === '' ? null : parseInt(numRooms);
    if (numRooms && (isNaN(num) || num <= 0 || num > 100)) { setError('Enter valid number of rooms (1-100)'); return; }
    onAddCategory(name, num);
    setSuccess(`Category "${name}" added successfully!`);
    setCatName(''); setNumRooms('');
    setTimeout(() => { setSuccess(''); setTab('list'); }, 1500);
  };

  const sortedCats = Object.keys(categoryColors).sort(
    (a, b) => rooms.filter(r => r.category === a).length - rooms.filter(r => r.category === b).length
  );

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>🏷️ Room Category</h2>
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', marginBottom: 24 }}>
        {[['list', 'List Of Room Category'], ['add', 'Add Room Category']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', background: tab === key ? '#fff' : '#f7f8fa', fontWeight: tab === key ? 700 : 500, color: tab === key ? '#1565c0' : '#666', fontSize: '0.85rem', borderBottom: tab === key ? '2px solid #1565c0' : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0' }}>{label}</button>
        ))}
      </div>

      {tab === 'list' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['Copy', 'CSV', 'Print'].map(b => (<button key={b} style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 5, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>{b}</button>))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#666' }}>Search:</span>
              <input style={{ ...inp, width: 180 }} placeholder="" />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f0f2f5' }}>
                {['SR.NO', 'CATEGORY', 'NO. OF ROOMS', 'COLOR', 'ACTION'].map(h => (<th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.78rem', letterSpacing: '0.05em' }}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {sortedCats.map((cat, idx) => {
                const c = categoryColors[cat];
                const count = rooms.filter(r => r.category === cat).length;
                return (
                  <tr key={cat} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 14px', color: '#888' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a1a2e' }}>{cat.toUpperCase()}</td>
                    <td style={{ padding: '10px 14px', color: '#1565c0', fontWeight: 700 }}>{count}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 20, height: 20, background: c.bg, border: `2px solid ${c.border}`, borderRadius: 4 }} />
                        <span style={{ fontSize: '0.72rem', color: '#888' }}>{c.border}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>EDIT</button>
                        <span style={{ color: '#ddd' }}>/</span>
                        <button onClick={() => onDeleteCategory(cat)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>DELETE</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#888', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing 1 to {sortedCats.length} of {sortedCats.length} entries</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '4px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem' }}>Previous</button>
              <button style={{ padding: '4px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem' }}>Next</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'add' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '8px 14px', color: '#c0392b', fontSize: '0.82rem' }}>❌ {error}</div>}
          {success && <div style={{ background: '#f0fff4', border: '1px solid #9be9a8', borderRadius: 7, padding: '8px 14px', color: '#1e8449', fontSize: '0.82rem' }}>✅ {success}</div>}
          <label style={lbl}>Room Category: *
            <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Enter Category Name" required style={inp} autoFocus />
          </label>
          <label style={lbl}>
            Number Of Rooms:
            <input type="number" value={numRooms} onChange={e => setNumRooms(e.target.value)} placeholder="e.g. 10" min="1" max="100" style={inp} />
            <span style={{ color: '#aaa', fontWeight: 400, fontSize: '0.8em' }}>(optional, 1-100)</span>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" style={{ padding: '9px 24px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Submit</button>
            <button type="reset" onClick={() => { setCatName(''); setNumRooms(''); setError(''); }} style={{ padding: '9px 24px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>Reset</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default RoomCategoryPage;