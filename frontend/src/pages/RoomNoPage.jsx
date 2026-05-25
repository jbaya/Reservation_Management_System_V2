import { useState } from 'react';

function RoomNoPage({ rooms, categoryColors, onAddRoom, onDeleteRoom }) {
  const [tab, setTab] = useState('list');
  const [newRoom, setNewRoom] = useState({ name: '', category: Object.keys(categoryColors)[0] || '', floor: '1' });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inp = { padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.85rem', color: '#444', fontWeight: 600 };

  const filteredRooms = rooms.filter(r => r.name.includes(search) || r.category.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!newRoom.name) { setError('Room number required'); return; }
    if (rooms.some(r => r.name === newRoom.name)) { setError('Room already exists'); return; }
    onAddRoom({ ...newRoom });
    setSuccess(`Room ${newRoom.name} added successfully!`);
    setNewRoom({ name: '', category: Object.keys(categoryColors)[0] || '', floor: '1' });
    setTimeout(() => { setSuccess(''); setTab('list'); }, 1500);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>🚪 Room Numbers</h2>
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', marginBottom: 24 }}>
        {[['list', 'List Of Rooms'], ['add', 'Add Room']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', background: tab === key ? '#fff' : '#f7f8fa', fontWeight: tab === key ? 700 : 500, color: tab === key ? '#1565c0' : '#666', fontSize: '0.85rem', borderBottom: tab === key ? '2px solid #1565c0' : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0' }}>{label}</button>
        ))}
      </div>

      {tab === 'list' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['Copy', 'CSV', 'Print'].map(b => (<button key={b} style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 5, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>{b}</button>))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#666' }}>Search:</span>
              <input style={{ ...inp, width: 180 }} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f0f2f5' }}>
                {['SR.NO', 'ROOM NO.', 'CATEGORY', 'FLOOR', 'COLOR', 'ACTION'].map(h => (<th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.78rem', letterSpacing: '0.05em' }}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room, idx) => {
                const c = categoryColors[room.category] || { bg: '#f5f5f5', border: '#999' };
                return (
                  <tr key={room.name} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 14px', color: '#888' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1a1a2e' }}>{room.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a2e' }}>{room.category}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#666' }}>
                      {room.floor === 'Basement' || room.floor === '-1' ? 'Basement'
                        : room.floor === 'Ground' || room.floor === '0' ? 'Ground Floor'
                        : room.floor ? `Floor ${room.floor}`
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ width: 18, height: 18, background: c.bg, border: `2px solid ${c.border}`, borderRadius: 3 }} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>EDIT</button>
                        <span style={{ color: '#ddd' }}>/</span>
                        <button onClick={() => onDeleteRoom(room.name)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>DELETE</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#888', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing {filteredRooms.length} of {rooms.length} rooms</span>
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
          <label style={lbl}>Room Number: *
            <input value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 107" required style={inp} autoFocus />
          </label>
          <label style={lbl}>Room Category: *
            <select value={newRoom.category} onChange={e => setNewRoom(p => ({ ...p, category: e.target.value }))} style={inp}>
              {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={lbl}>Floor:
            <select value={newRoom.floor} onChange={e => setNewRoom(p => ({ ...p, floor: e.target.value }))} style={inp}>
              <option value="Basement">Basement</option>
              <option value="0">Ground Floor</option>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" style={{ padding: '9px 24px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Submit</button>
            <button type="reset" onClick={() => setNewRoom({ name: '', category: Object.keys(categoryColors)[0] || '', floor: '1' })} style={{ padding: '9px 24px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>Reset</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default RoomNoPage;