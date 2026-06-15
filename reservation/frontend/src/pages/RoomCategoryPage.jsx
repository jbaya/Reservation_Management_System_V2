import { useState } from 'react';
// Add at top of RoomCategoryPage.jsx
import { copyToClipboard, downloadCSV, printTable } from '../utils/tableExport';

// ── Change function signature — add floors prop ───────────────────────────
function RoomCategoryPage({ categoryColors, rooms, floors = [], onAddCategory, onDeleteCategory, onEditCategory }) {
  const [tab, setTab] = useState('list');
  const [catName, setCatName] = useState('');
  const [fromRoom, setFromRoom] = useState('');
  const [toRoom, setToRoom] = useState('');
  const [floor, setFloor] = useState('1');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editingCat, setEditingCat] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [editFromRoom, setEditFromRoom] = useState('');
  const [editToRoom, setEditToRoom] = useState('');
  const [editColor, setEditColor] = useState('#1565c0');
  const [editFloor, setEditFloor] = useState('1');

  const inp = {
    padding: '2px 10px',
    height: '38px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: '0.85rem',
    width: '70%',
    boxSizing: 'border-box',
    outline: 'none',
  };
  const lbl = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.85rem', color: '#444', fontWeight: 600 };

// ── Replace the hardcoded floorOptions with this ──────────────────────────
// Build options only from floors that exist in Floor Management
const floorOptions = floors
  .slice()
  .sort((a, b) => {
    if (a === 'Basement') return -1;
    if (b === 'Basement') return 1;
    if (a === 'Ground') return -1;
    if (b === 'Ground') return 1;
    return Number(a) - Number(b);
  })
  .map(f => ({
    value: String(f),
    label: f === 'Basement' ? 'Basement'
         : f === 'Ground'   ? 'Ground Floor'
         : `Floor ${f}`,
  }));
  // ── Add form submit ────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const name = catName.trim();
    if (!name) { setError('Category name required'); return; }
    if (categoryColors[name]) { setError('Category already exists'); return; }

    const from = fromRoom.trim() === '' ? null : parseInt(fromRoom, 10);
    const to   = toRoom.trim()   === '' ? null : parseInt(toRoom, 10);

    if (fromRoom.trim() === '' || toRoom.trim() === '') {
      setError('Enter both From Room Number and To Room Number');
      return;
    }
    if (isNaN(from) || isNaN(to)) {
      setError('Room numbers must be valid integers');
      return;
    }
    if (to < from) {
      setError('To Room Number must be greater than or equal to From Room Number');
      return;
    }
    const roomCount = to - from + 1;
    if (roomCount <= 0 || roomCount > 100) {
      setError('Room range must include between 1 and 100 rooms');
      return;
    }

    onAddCategory(name, roomCount, from, to, floor);
    setSuccess(`Category "${name}" added successfully!`);
    setCatName(''); setFromRoom(''); setToRoom(''); setFloor('1');
    setTimeout(() => { setSuccess(''); setTab('list'); }, 1500);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (cat) => {
    if (window.confirm(`Are you sure you want to delete "${cat}"?`)) {
      onDeleteCategory(cat);
    }
  };

  // ── Open edit mode ─────────────────────────────────────────────────────────
  const handleEdit = (cat) => {
    const currentColor = categoryColors[cat];
    const currentRooms = rooms.filter(r => r.category === cat);
    const roomNumbers  = currentRooms
      .map(r => parseInt(r.name, 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    // Derive floor: use first room's floor, or category's stored floor, or '1'
    const derivedFloor = currentRooms[0]?.floor
      || currentColor?.floor
      || '1';

    setEditingCat(cat);
    setEditCatName(cat);
    setEditFromRoom(roomNumbers.length > 0 ? String(roomNumbers[0]) : '');
    setEditToRoom(roomNumbers.length > 0 ? String(roomNumbers[roomNumbers.length - 1]) : '');
    setEditColor(currentColor?.border || '#1565c0');
    setEditFloor(derivedFloor);
    setEditMode(true);
  };

  // ── Edit form submit ───────────────────────────────────────────────────────
  const handleEditSubmit = () => {
    if (!editCatName.trim()) { alert('Category name required'); return; }

    const from = editFromRoom.trim() === '' ? null : parseInt(editFromRoom, 10);
    const to   = editToRoom.trim()   === '' ? null : parseInt(editToRoom, 10);

    if (editFromRoom.trim() === '' || editToRoom.trim() === '') {
      alert('Enter both From Room Number and To Room Number');
      return;
    }
    if (isNaN(from) || isNaN(to)) { alert('Room numbers must be valid integers'); return; }
    if (to < from) { alert('To Room Number must be ≥ From Room Number'); return; }

    const newCount = to - from + 1;
    if (newCount <= 0 || newCount > 100) {
      alert('Room range must include between 1 and 100 rooms');
      return;
    }

    // Pass floor as 5th argument
    onEditCategory(editingCat, editCatName.trim(), editColor, newCount, editFloor);

    setSuccess(`Category "${editCatName}" updated successfully!`);
    setEditMode(false);
    setTimeout(() => setSuccess(''), 1500);
  };

  const sortedCats = Object.keys(categoryColors);

  // ── Inline preview helper ──────────────────────────────────────────────────
  const RoomPreview = ({ fromVal, toVal }) => {
    const from = fromVal.trim() === '' ? null : parseInt(fromVal, 10);
    const to   = toVal.trim()   === '' ? null : parseInt(toVal, 10);
    if (!fromVal && !toVal) return null;
    if (fromVal.trim() === '' || toVal.trim() === '')
      return <span style={{ color: '#c0392b' }}>Enter both From and To Room Number.</span>;
    if (isNaN(from) || isNaN(to))
      return <span style={{ color: '#c0392b' }}>Room numbers must be valid integers.</span>;
    if (to < from)
      return <span style={{ color: '#c0392b' }}>To Room Number must be ≥ From Room Number.</span>;
    const count = to - from + 1;
    if (count <= 0 || count > 100)
      return <span style={{ color: '#c0392b' }}>Room range must include between 1 and 100 rooms.</span>;
    const list = count <= 12
      ? `(${Array.from({ length: count }, (_, i) => from + i).join(', ')})`
      : `(${from} … ${to})`;
    return <span style={{ color: '#1e8449' }}>✓ {count} room{count !== 1 ? 's' : ''} will be added {list}</span>;
  };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>🏷️ Room Category</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', marginBottom: 24 }}>
        {[['list', 'List Of Room Category'], ['add', 'Add Room Category']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setEditMode(false); }}
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

      {/* Success banner (shared) */}
      {success && (
        <div style={{ background: '#f0fff4', border: '1px solid #9be9a8', borderRadius: 7, padding: '8px 14px', color: '#1e8449', fontSize: '0.82rem', marginBottom: 16 }}>
          ✅ {success}
        </div>
      )}

      {/* ── LIST TAB ── */}
      {tab === 'list' && !editMode && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {/* Replace the existing Copy/CSV/Print buttons with this */}
{['Copy', 'CSV', 'Print'].map(b => (
  <button
    key={b}
    onClick={() => {
      const columns = ['SR.NO', 'CATEGORY', 'NO. OF ROOMS', 'FLOOR', 'COLOR'];
      const rows = sortedCats.map((cat, idx) => ({
        'SR.NO':        idx + 1,
        'CATEGORY':     cat.toUpperCase(),
        'NO. OF ROOMS': rooms.filter(r => r.category === cat).length,
        'FLOOR':        categoryColors[cat]?.floor
                          ? `Floor ${categoryColors[cat].floor}`
                          : rooms.find(r => r.category === cat)?.floor
                          ? `Floor ${rooms.find(r => r.category === cat).floor}`
                          : '—',
        'COLOR':        categoryColors[cat]?.border || '',
      }));

      if (b === 'Copy')  copyToClipboard(rows, columns);
      if (b === 'CSV')   downloadCSV(rows, columns, 'room-categories.csv');
      if (b === 'Print') printTable(rows, columns, 'Room Categories');
    }}
    style={{
      padding: '5px 14px', border: '1px solid #ddd', borderRadius: 5,
      background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem',
      fontWeight: 600, color: '#555'
    }}
  >
    {b}
  </button>
))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#666' }}>Search:</span>
              <input style={{ ...inp, width: 180 }} placeholder="" />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f0f2f5' }}>
                {['SR.NO', 'CATEGORY', 'NO. OF ROOMS', 'FLOOR', 'COLOR', 'ACTION'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.78rem', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCats.map((cat, idx) => {
                const c     = categoryColors[cat];
                const count = rooms.filter(r => r.category === cat).length;
                // Show floor: from categoryColors, or from first room in category
                const floorLabel = c?.floor
                  || rooms.find(r => r.category === cat)?.floor
                  || '—';
                return (
                  <tr key={cat} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 14px', color: '#888' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a1a2e' }}>{cat.toUpperCase()}</td>
                    <td style={{ padding: '10px 14px', color: '#1565c0', fontWeight: 700 }}>{count}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>
                      <span style={{ background: '#eef2ff', color: '#3730a3', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        {floorLabel === 'Ground' ? 'Ground' : floorLabel === 'Basement' ? 'Basement' : floorLabel === '—' ? '—' : `Floor ${floorLabel}`}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 20, height: 20, background: c.bg, border: `2px solid ${c.border}`, borderRadius: 4 }} />
                        <span style={{ fontSize: '0.72rem', color: '#888' }}>{c.border}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEdit(cat)} style={{ color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>EDIT</button>
                        <span style={{ color: '#ddd' }}>/</span>
                        <button onClick={() => handleDelete(cat)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>DELETE</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#1a1919', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing 1 to {sortedCats.length} of {sortedCats.length} entries</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '4px 12px', border: '1px solid #181818', borderRadius: 4, background: '#707070', cursor: 'pointer', fontSize: '0.78rem' }}>Previous</button>
              <button style={{ padding: '4px 12px', border: '1px solid #0e0d0d', borderRadius: 4, background: '#707070', cursor: 'pointer', fontSize: '0.78rem' }}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {editMode && (
        <div style={{ background: '#fff', border: '1px solid #ddd', padding: 24 }}>
          <h2 style={{ margin: '0 0 10px', color: '#5d789b', fontWeight: 500 }}>Edit Category</h2>

          <button
            onClick={() => setEditMode(false)}
            style={{ background: '#1abc9c', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 4, cursor: 'pointer', marginBottom: 20 }}
          >
            Back
          </button>

          <div style={{ borderTop: '1px solid #ddd', paddingTop: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Category name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <label style={{ width: 180, fontSize: '1.1rem', fontWeight: 700, color: '#5d789b' }}>Room Category: *</label>
              <input
                value={editCatName}
                onChange={e => setEditCatName(e.target.value)}
                style={{ width: 500, padding: '10px', border: '1px solid #ccc', fontSize: '1rem' }}
              />
            </div>

            {/* Floor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <label style={{ width: 180, fontSize: '1.1rem', fontWeight: 700, color: '#5d789b' }}>Floor:</label>
              <select
                value={editFloor}
                onChange={e => setEditFloor(e.target.value)}
                style={{ width: 200, padding: '10px', border: '1px solid #ccc', fontSize: '1rem' }}
              >
                {floorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* From Room */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <label style={{ width: 180, fontSize: '1.1rem', fontWeight: 700, color: '#5d789b' }}>From Room Number:</label>
              <input
                type="number"
                value={editFromRoom}
                onChange={e => setEditFromRoom(e.target.value)}
                style={{ width: 150, padding: '10px', border: '1px solid #ccc', fontSize: '1rem' }}
              />
            </div>

            {/* To Room */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <label style={{ width: 180, fontSize: '1.1rem', fontWeight: 700, color: '#5d789b' }}>To Room Number:</label>
              <input
                type="number"
                value={editToRoom}
                onChange={e => setEditToRoom(e.target.value)}
                style={{ width: 150, padding: '10px', border: '1px solid #ccc', fontSize: '1rem' }}
              />
            </div>

            {/* Room count preview */}
            <div style={{ fontSize: '0.9rem', minHeight: 22, marginLeft: 200, color: '#1e8449', marginBottom: 10 }}>
              <RoomPreview fromVal={editFromRoom} toVal={editToRoom} />
            </div>

            {/* Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <label style={{ width: 180, fontSize: '1.1rem', fontWeight: 700, color: '#5d789b' }}>Color:</label>
              <input
                type="color"
                value={editColor}
                onChange={e => setEditColor(e.target.value)}
                style={{ width: 80, height: 45, border: 'none', cursor: 'pointer' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={handleEditSubmit}
                style={{ background: '#1abc9c', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 4, cursor: 'pointer', marginRight: 10 }}
              >
                Submit
              </button>
              <button
                onClick={() => { setEditCatName(editingCat); setEditMode(false); }}
                style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 4, cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD TAB ── */}
      {tab === 'add' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '8px 14px', color: '#c0392b', fontSize: '0.82rem' }}>❌ {error}</div>
          )}

          <label style={lbl}>Room Category: *
            <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Enter Category Name" required style={inp} autoFocus />
          </label>

          {/* Floor field in Add form */}
          <label style={lbl}>Floor:
            <select value={floor} onChange={e => setFloor(e.target.value)} style={{ ...inp, height: 38 }}>
              {floorOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label style={lbl}>From Room Number:
            <input type="number" value={fromRoom} onChange={e => setFromRoom(e.target.value)} placeholder="e.g. 201" style={inp} />
          </label>

          <label style={lbl}>To Room Number:
            <input type="number" value={toRoom} onChange={e => setToRoom(e.target.value)} placeholder="e.g. 203" style={inp} />
          </label>

          <div style={{ fontSize: '0.85rem', minHeight: 22 }}>
            <RoomPreview fromVal={fromRoom} toVal={toRoom} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" style={{ padding: '9px 24px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Submit</button>
            <button type="reset" onClick={() => { setCatName(''); setFromRoom(''); setToRoom(''); setFloor('1'); setError(''); }} style={{ padding: '9px 24px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>Reset</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default RoomCategoryPage;