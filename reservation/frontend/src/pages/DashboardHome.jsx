import { useState } from 'react';
import { format } from 'date-fns';

function DashboardHome({ bookings, rooms, categoryColors, tariffs = [] }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [todoText, setTodoText] = useState('');
  const [todos, setTodos] = useState([]);

  const checkInsToday = bookings.filter(b => b.arrival === todayStr && !['cancelled', 'no-show', 'blocked'].includes(b.status));
  const checkOutsToday = bookings.filter(b => b.departure === todayStr && !['cancelled', 'no-show', 'blocked'].includes(b.status));

  const cardStyle = { background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' };
  const cardHeader = (title, color = '#1a1a2e') => (
    <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontWeight: 700, fontSize: '0.95rem', color }}>{title}</span>
      <span style={{ fontSize: '1rem', color: '#bbb' }}>∧</span>
    </div>
  );
  const thStyle = { padding: '8px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #eee', background: '#f8f9fa', textAlign: 'left' };
  const tdStyle = { padding: '9px 14px', fontSize: '0.8rem', borderBottom: '1px solid #f5f5f5', color: '#1a1a2e' };

  return (
    <div style={{ padding: '16px 20px', overflowY: 'auto', height: '100%', background: '#f0f2f5' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginBottom: 14, fontSize: '0.78rem' }}>
        <span style={{ color: '#1565c0', fontWeight: 700 }}>*COMPANY NAME - <span style={{ color: '#27ae60' }}>HOTEL DEMO</span></span>
        <span style={{ color: '#1565c0', fontWeight: 700 }}>*GST NO - <span style={{ color: '#27ae60' }}>08AALCA0355Q1Z8</span></span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 16, marginBottom: 16 }}>
        {/* Today Check In */}
        <div style={cardStyle}>
          {cardHeader('Today Check In', '#1565c0')}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>NAME</th><th style={thStyle}>BOOKING ID</th><th style={thStyle}>#</th></tr></thead>
            <tbody>
              {checkInsToday.length === 0
                ? <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#ccc', padding: 24 }}>No check-ins today</td></tr>
                : checkInsToday.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{b.guestName}</span>{b.tags?.includes('VIP') && <span style={{ marginLeft: 6, fontSize: '0.62rem', background: '#f5eef8', color: '#6c3483', border: '1px solid #ce93d8', borderRadius: 8, padding: '1px 5px' }}>VIP</span>}</td>
                    <td style={{ ...tdStyle, color: '#1565c0', fontWeight: 600 }}>{b.bookingId || '—'}</td>
                    <td style={{ ...tdStyle, color: '#888' }}><span style={{ background: '#e3f0ff', color: '#1565c0', borderRadius: 12, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>Rm {b.roomName}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Today Check Out */}
        <div style={cardStyle}>
          {cardHeader('Today Check Out', '#e74c3c')}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>NAME</th><th style={thStyle}>BOOKING ID</th><th style={thStyle}>#</th></tr></thead>
            <tbody>
              {checkOutsToday.length === 0
                ? <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#ccc', padding: 24 }}>No check-outs today</td></tr>
                : checkOutsToday.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{b.guestName}</span></td>
                    <td style={{ ...tdStyle, color: '#1565c0', fontWeight: 600 }}>{b.bookingId || '—'}</td>
                    <td style={{ ...tdStyle, color: '#888' }}><span style={{ background: '#fdecea', color: '#e74c3c', borderRadius: 12, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>Rm {b.roomName}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            {cardHeader('Rate Of The Day', '#e67e22')}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={thStyle}>Category</th><th style={thStyle}>Meal Plan</th><th style={thStyle}>Rate</th></tr></thead>
              <tbody>
                {tariffs.length === 0
                  ? Object.keys(categoryColors).map((cat, i) => (
                    <tr key={cat} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{cat}</span></td>
                      <td style={{ ...tdStyle, color: '#888' }}>—</td>
                      <td style={{ ...tdStyle, color: '#888' }}>—</td>
                    </tr>
                  ))
                  : tariffs.filter(t => t.date === todayStr).map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{t.category}</span></td>
                      <td style={{ ...tdStyle, color: '#888' }}>{t.mealPlan}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#1e8449' }}>₹{t.charge}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <div style={cardStyle}>
            {cardHeader('To Do List', '#8e44ad')}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={todoText} onChange={e => setTodoText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && todoText.trim()) { setTodos(p => [...p, { id: Date.now(), text: todoText.trim(), done: false }]); setTodoText(''); } }}
                placeholder="write anything here.."
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              {todos.map(todo => (
                <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px' }}>
                  <input type="checkbox" checked={todo.done} onChange={() => setTodos(p => p.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} style={{ cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.8rem', color: todo.done ? '#aaa' : '#333', textDecoration: todo.done ? 'line-through' : 'none', flex: 1 }}>{todo.text}</span>
                  <button onClick={() => setTodos(p => p.filter(t => t.id !== todo.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: '0.75rem' }}
                    onMouseEnter={e => e.target.style.color = '#e74c3c'} onMouseLeave={e => e.target.style.color = '#ddd'}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600 }}>Date</span>
        <span style={{ fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 700 }}>{format(new Date(), 'dd MMMM yyyy, EEEE')}</span>
      </div>
    </div>
  );
}

export default DashboardHome;