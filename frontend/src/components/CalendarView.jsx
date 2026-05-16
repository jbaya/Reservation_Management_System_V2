import { addDays, format, startOfMonth, getDaysInMonth, isSameDay, isBefore, isAfter } from 'date-fns';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';

function buildMonthDays(baseDate) {
  const start = startOfMonth(baseDate);
  const daysInMonth = getDaysInMonth(baseDate);
  return Array.from({ length: daysInMonth }, (_, i) => addDays(start, i));
}

export const paymentTagColors = {
  paid:    { bg: '#27ae60', text: '#fff' },
  partial: { bg: '#e67e22', text: '#fff' },
  due:     { bg: '#e74c3c', text: '#fff' },
};

export const statusColors = {
  confirmed:    { bg: '#1e8449', text: '#fff' },
  tentative:    { bg: '#d4ac0d', text: '#fff' },
  cancelled:    { bg: '#c0392b', text: '#fff' },
  'checked-in': { bg: '#1565c0', text: '#fff' },
  'checked-out':{ bg: '#546e7a', text: '#fff' },
  'no-show':    { bg: '#4a235a', text: '#fff' },
  payment_due:  { bg: '#ca6f1e', text: '#fff' },
  vip:          { bg: '#6c3483', text: '#fff' },
  dnd:          { bg: '#5d6d7e', text: '#fff' },
  inquiry:      { bg: '#2e86c1', text: '#fff' },
  blocked:      { bg: '#4a4a4a', text: '#fff' },
  maintenance:  { bg: '#784212', text: '#fff' },
};

const ROOM_COL_WIDTH = 80;
const CURRENT_USER = 'Staff'; // change to your auth user name

const isBlocked = (b) => b.status === 'blocked' || b.status === 'maintenance';

function formatUpdatedAt(ts) {
  if (!ts) return null;
  const d = new Date(ts), now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  const diffHr  = Math.floor((now - d) / 3600000);
  const diffDay = Math.floor((now - d) / 86400000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr  < 24) return `${diffHr}h ago`;
  if (diffDay <  7) return `${diffDay}d ago`;
  return format(d, 'd MMM yyyy, HH:mm');
}

function formatCommentTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2,'0');
  const mm = d.getMinutes().toString().padStart(2,'0');
  const day = d.getDate().toString().padStart(2,'0');
  const mon = d.toLocaleString('en', { month: 'short' });
  return `${hh}:${mm} ${day} ${mon}`;
}

// ── Inline Comment Thread (used inside QuickEdit & NewBooking) ────────────────
function InlineCommentThread({ comments = [], onChange }) {
  const [draft, setDraft] = useState('');
  const taRef = useRef(null);

  const inp = {
    width: '100%', padding: '5px 8px', borderRadius: 5,
    border: '1px solid #ddd', fontSize: '0.74rem',
    boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
    resize: 'none', lineHeight: 1.5,
  };

  const addComment = () => {
    const text = draft.trim();
    if (!text) return;
    const newC = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      author: CURRENT_USER,
      text,
      createdAt: new Date().toISOString(),
      edited: false,
    };
    onChange([...comments, newC]);
    setDraft('');
    taRef.current?.focus();
  };

  const deleteComment = (id) => onChange(comments.filter(c => c.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Thread */}
      {comments.length > 0 && (
        <div style={{
          maxHeight: 160, overflowY: 'auto',
          border: '1px solid #e8eaed', borderRadius: 6,
          background: '#fafafa',
        }}>
          {comments.map((c, i) => (
            <div key={c.id} style={{
              padding: '6px 10px',
              borderBottom: i < comments.length - 1 ? '1px solid #f0f0f0' : 'none',
              display: 'flex', gap: 7, alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: '#1565c0', color: '#fff',
                fontSize: '0.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {c.author?.[0]?.toUpperCase() || 'S'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.7rem', color: '#1a1a2e' }}>{c.author}</span>
                  <span style={{ fontSize: '0.62rem', color: '#bbb' }}>{formatCommentTime(c.createdAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.73rem', color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {c.text}
                </p>
              </div>
              {/* Delete — only own */}
              {c.author === CURRENT_USER && (
                <button
                  onClick={() => deleteComment(c.id)}
                  title="Delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.75rem', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color='#e74c3c'}
                  onMouseLeave={e => e.currentTarget.style.color='#ccc'}
                >✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
        <textarea
          ref={taRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); }}}
          placeholder={comments.length ? 'Add another comment…' : 'Add a comment…'}
          rows={2}
          style={{ ...inp, flex: 1 }}
        />
        <button
          onClick={addComment}
          disabled={!draft.trim()}
          style={{
            padding: '5px 10px', border: 'none', borderRadius: 5,
            background: draft.trim() ? '#1565c0' : '#b0c4de',
            color: '#fff', fontSize: '0.7rem', fontWeight: 700,
            cursor: draft.trim() ? 'pointer' : 'default',
            flexShrink: 0, height: 52,
          }}
        >Post</button>
      </div>
      {comments.length > 0 && (
        <div style={{ fontSize: '0.6rem', color: '#bbb', textAlign: 'right' }}>
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, booking, onAction, onClose }) {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [onClose]);

  const items = isBlocked(booking)
    ? [{ label: '✏️ Edit Block', action: 'edit' },{ label: '✅ Unblock Room', action: 'unblock' },{ label: '🗑️ Remove Block', action: 'cancel' }]
    : [{ label: '✏️ Edit Booking', action: 'edit' },{ label: '📋 View Details', action: 'view' },{ label: '✅ Check In', action: 'checkin' },{ label: '🚪 Check Out', action: 'checkout' },{ label: '📝 Add Note', action: 'note' },{ label: '🔁 Change Room', action: 'changeroom' },{ label: '❌ Cancel Booking', action: 'cancel' }];

  return createPortal(
    <div style={{ position: 'fixed', top: y, left: x, zIndex: 999999, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 190, overflow: 'hidden', fontFamily: 'inherit', fontSize: '0.78rem' }}>
      <div style={{ padding: '6px 12px', background: '#f7f8fa', borderBottom: '1px solid #eee', fontWeight: 700, color: '#1a1a2e', fontSize: '0.75rem' }}>
        {isBlocked(booking) ? `🚫 ${booking.notes || 'Blocked Room'}` : booking.guestName}
      </div>
      {items.map(item => (
        <div key={item.action} onClick={() => { onAction(item.action, booking); onClose(); }}
          style={{ padding: '8px 14px', cursor: 'pointer', color: item.action === 'cancel' ? '#c0392b' : '#333', display: 'flex', alignItems: 'center', gap: 8 }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {item.label}
        </div>
      ))}
    </div>,
    document.body
  );
}

// ── Blocked Popup ─────────────────────────────────────────────────────────────
function BlockedHoverPopup({ booking, rect }) {
  if (!rect) return null;
  const popW = 210, popH = 100;
  const vw = window.innerWidth, vh = window.innerHeight;
  let top = rect.bottom + 8, left = rect.left + rect.width / 2 - popW / 2;
  if (top + popH > vh - 8) top = rect.top - popH - 8;
  left = Math.max(8, Math.min(left, vw - popW - 8));
  return createPortal(
    <div style={{ position: 'fixed', top, left, width: popW, zIndex: 999999, pointerEvents: 'none', background: '#2c2c2c', border: '1px solid #444', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontFamily: 'inherit', fontSize: '0.76rem', color: '#fff' }}>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #444' }}>
        <span style={{ fontSize: '1.1rem' }}>🚫</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Room Blocked</div>
          <div style={{ color: '#aaa', fontSize: '0.68rem' }}>{booking.arrival} → {booking.departure}</div>
        </div>
      </div>
      <div style={{ padding: '7px 12px' }}>
        <div style={{ color: '#ccc', fontSize: '0.72rem' }}><span style={{ color: '#888' }}>Reason: </span>{booking.notes || 'No reason specified'}</div>
        {booking.updatedAt && <div style={{ color: '#666', fontSize: '0.65rem', marginTop: 4 }}>Updated {formatUpdatedAt(booking.updatedAt)}</div>}
      </div>
    </div>,
    document.body
  );
}

// ── Booking Hover Popup ───────────────────────────────────────────────────────
function BookingHoverPopup({ booking, rect }) {
  if (!rect) return null;

  const comments = booking.comments || [];
  // dynamic height: base + comments
  const popW = 260;
  const baseH = 230;
  const commentsH = comments.length > 0 ? Math.min(comments.length * 52 + 48, 180) : 0;
  const popH = baseH + commentsH;

  const vw = window.innerWidth, vh = window.innerHeight;
  let top = rect.bottom + 8, left = rect.left + rect.width / 2 - popW / 2;
  if (top + popH > vh - 8) top = rect.top - popH - 8;
  left = Math.max(8, Math.min(left, vw - popW - 8));

  const sc = statusColors[booking.status] || statusColors.confirmed;
  const pc = booking.paymentStatus === 'paid' ? '#27ae60' : booking.paymentStatus === 'due' ? '#e74c3c' : booking.paymentStatus === 'partial' ? '#e67e22' : '#666';
  const nights = booking.arrival && booking.departure ? Math.round((new Date(booking.departure) - new Date(booking.arrival)) / 86400000) : '—';
  let timestampStr = '';
  if (booking.timestamp) {
    const ts = new Date(booking.timestamp);
    timestampStr = `${ts.getHours().toString().padStart(2,'0')}:${ts.getMinutes().toString().padStart(2,'0')} ${format(ts, 'd MMM')}`;
  }

  return createPortal(
    <div style={{ position: 'fixed', top, left, width: popW, zIndex: 999999, pointerEvents: 'none', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.13)', fontFamily: 'inherit', fontSize: '0.76rem' }}>
      <div style={{ background: sc.bg, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{booking.guestName}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.68rem', marginTop: 1 }}>Room {booking.roomName} · {nights} night{nights !== 1 ? 's' : ''}</div>
          {timestampStr && <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.7rem', marginTop: 2, opacity: 0.85 }}>🕐 {timestampStr}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          {booking.paymentStatus && <div style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase' }}>{booking.paymentStatus}</div>}
          {booking.tags?.includes('VIP') && <div style={{ background: '#6c3483', color: '#fff', fontSize: '0.58rem', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>VIP</div>}
          {booking.tags?.includes('DND') && <div style={{ background: '#5d6d7e', color: '#fff', fontSize: '0.58rem', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>DND</div>}
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
        {[['Check-in', booking.arrival],['Check-out', booking.departure]].map(([label, val], i) => (
          <div key={label} style={{ flex: 1, padding: '6px 10px', borderRight: i === 0 ? '1px solid #f0f0f0' : 'none' }}>
            <div style={{ color: '#aaa', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
            <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.8rem' }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '7px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px' }}>
        {[
  ['Guests',  booking.numGuests||1],
  ['Meal',    booking.mealPlan||'—'],
  ['Source',  booking.source||'—'],
  ...(booking.otaPlatform ? [['Platform', booking.otaPlatform]] : []),  // ← ADD
  ...(booking.bookingId   ? [['Booking ID', booking.bookingId]] : []),  // ← ADD
  ['Payment', booking.paymentStatus||'—'],
  ...(booking.totalAmount ? [['Total', `₹${booking.totalAmount}`]] : []),
  ...(booking.balance     ? [['Balance', `₹${booking.balance}`]]  : []),
].map(([label, val]) => (
          <div key={label}>
            <span style={{ color: '#bbb', fontSize: '0.62rem' }}>{label}: </span>
            <span style={{ fontWeight: 600, color: label==='Payment'||label==='Balance' ? pc : '#1a1a2e', fontSize: '0.76rem', textTransform: 'capitalize' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* ── Comments thread in hover popup ── */}
      {comments.length > 0 && (
        <div style={{ margin: '0 10px 8px', background: '#fffde7', border: '1px solid #ffe082', borderRadius: 6, overflow: 'hidden' }}>
          {comments.map((c, i) => (
            <div key={c.id} style={{ padding: '5px 8px', borderBottom: i < comments.length - 1 ? '1px solid #fff3c4' : 'none', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1565c0', color: '#fff', fontSize: '0.55rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {c.author?.[0]?.toUpperCase() || 'S'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 1 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#5d4037' }}>{c.author}</span>
                  <span style={{ fontSize: '0.58rem', color: '#bbb' }}>{formatCommentTime(c.createdAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#6d4c00', fontStyle: 'italic', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

// ── Quick Edit Popup ──────────────────────────────────────────────────────────
function QuickEditPopup({ booking, rect, onSave, onClose, onFullEdit }) {
  const [form, setForm] = useState({ ...booking, comments: booking.comments || [] });
  if (!rect) return null;

  const popW = 290;
  // Dynamic height based on comment count
  const commentRows = (form.comments || []).length;
  const popH = 320 + Math.min(commentRows * 52, 160);

  const vw = window.innerWidth, vh = window.innerHeight;
  let top = rect.bottom + 8, left = rect.left + rect.width / 2 - popW / 2;
  if (top + popH > vh - 8) top = rect.top - popH - 8;
  left = Math.max(8, Math.min(left, vw - popW - 8));

  const inp = { width: '100%', padding: '4px 7px', borderRadius: 5, border: '1px solid #ddd', fontSize: '0.75rem', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };

  return createPortal(
    <div style={{ position: 'fixed', top, left, width: popW, zIndex: 999999, background: '#fff', border: '1px solid #d0d0d0', borderRadius: 9, boxShadow: '0 8px 28px rgba(0,0,0,0.16)', fontFamily: 'inherit', fontSize: '0.75rem', overflow: 'hidden' }}>
      <div style={{ background: '#f7f8fa', padding: '7px 11px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.8rem' }}>{isBlocked(booking) ? '🚫 Edit Block' : 'Quick Edit'}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isBlocked(booking) && <span onClick={onFullEdit} style={{ cursor: 'pointer', color: '#1976d2', fontSize: '0.7rem', fontWeight: 600 }}>Full Edit →</span>}
          <span onClick={onClose} style={{ cursor: 'pointer', color: '#aaa', fontSize: '1.1rem', lineHeight: 1 }}>×</span>
        </div>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {isBlocked(booking) ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input type="date" value={form.arrival||''} onChange={e => setForm(p=>({...p,arrival:e.target.value}))} style={inp} />
              <input type="date" value={form.departure||''} onChange={e => setForm(p=>({...p,departure:e.target.value}))} style={inp} />
            </div>
            <textarea value={form.notes||''} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Reason..." rows={3} style={{...inp,resize:'none'}} />
          </>
        ) : (
          <>
            <input value={form.guestName||''} onChange={e => setForm(p=>({...p,guestName:e.target.value}))} placeholder="Guest name" style={inp} autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input type="date" value={form.arrival||''} onChange={e => setForm(p=>({...p,arrival:e.target.value}))} style={inp} />
              <input type="date" value={form.departure||''} onChange={e => setForm(p=>({...p,departure:e.target.value}))} style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <select value={form.status||'confirmed'} onChange={e => setForm(p=>({...p,status:e.target.value}))} style={inp}>
                {['inquiry','tentative','confirmed','checked-in','checked-out','cancelled','no-show'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={form.paymentStatus||'due'} onChange={e => setForm(p=>({...p,paymentStatus:e.target.value}))} style={inp}>
                {['paid','due','partial'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>

            {/* ── Comment Thread ── */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 2 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                💬 Comments
                {form.comments.length > 0 && (
                  <span style={{ background: '#1565c0', color: '#fff', borderRadius: 8, fontSize: '0.58rem', padding: '1px 5px', fontWeight: 700 }}>
                    {form.comments.length}
                  </span>
                )}
              </div>
              <InlineCommentThread
                comments={form.comments}
                onChange={(updated) => setForm(p => ({ ...p, comments: updated }))}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
          <button onClick={onClose} style={{ padding: '4px 12px', border: '1px solid #ddd', borderRadius: 5, background: '#191717', cursor: 'pointer', fontSize: '0.73rem' }}>Cancel</button>
          <button onClick={() => { onSave({...form, updatedAt: new Date().toISOString()}); onClose(); }} style={{ padding: '4px 14px', border: 'none', borderRadius: 5, background: '#1565c0', color: '#fff', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── New Booking Popup ─────────────────────────────────────────────────────────
function NewBookingPopup({ room, day, rect, onBook, onClose }) {
  const [form, setForm] = useState({
    guestName:'', phone:'',
    arrival:format(day,'yyyy-MM-dd'),
    departure:format(addDays(day,1),'yyyy-MM-dd'),
    mealPlan:'EP', status:'confirmed', paymentStatus:'paid',
    source:'direct', numGuests:1,
    comments: [],  // ← threaded comments instead of notes
  });

  if (!rect) return null;
  const popW = 270, popH = 400;
  const vw = window.innerWidth, vh = window.innerHeight;
  let top = rect.bottom + 4, left = rect.left;
  if (top + popH > vh - 8) top = rect.top - popH - 4;
  left = Math.max(8, Math.min(left, vw - popW - 8));
  const inp = { width:'100%', padding:'4px 7px', borderRadius:5, border:'1px solid #ddd', fontSize:'0.75rem', boxSizing:'border-box', fontFamily:'inherit', outline:'none' };
  const nights = Math.max(0, Math.round((new Date(form.departure)-new Date(form.arrival))/86400000));

  return createPortal(
    <div style={{ position:'fixed', top, left, width:popW, zIndex:999999, background:'#fff', border:'1px solid #d0d0d0', borderRadius:9, boxShadow:'0 8px 28px rgba(0,0,0,0.15)', fontFamily:'inherit', fontSize:'0.75rem', overflow:'hidden' }}>
      <div style={{ background:'#1565c0', padding:'7px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <span style={{ fontWeight:700, color:'#fff', fontSize:'0.82rem' }}>New Booking</span>
          <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.7rem', marginLeft:6 }}>Room {room}</span>
        </div>
        <span onClick={onClose} style={{ cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:'1.1rem', lineHeight:1 }}>×</span>
      </div>

      <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
        <input value={form.guestName} onChange={e=>setForm(p=>({...p,guestName:e.target.value}))} placeholder="Guest name *" style={inp} autoFocus />
        <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="Phone number" style={inp} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          <div><div style={{ fontSize:'0.6rem', color:'#888', marginBottom:2 }}>Check-in</div><input type="date" value={form.arrival} onChange={e=>setForm(p=>({...p,arrival:e.target.value}))} style={inp} /></div>
          <div><div style={{ fontSize:'0.6rem', color:'#888', marginBottom:2 }}>Check-out</div><input type="date" value={form.departure} onChange={e=>setForm(p=>({...p,departure:e.target.value}))} style={inp} /></div>
        </div>
        {nights > 0 && <div style={{ fontSize:'0.68rem', color:'#1565c0', fontWeight:600, textAlign:'center' }}>{nights} night{nights!==1?'s':''}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          <select value={form.mealPlan} onChange={e=>setForm(p=>({...p,mealPlan:e.target.value}))} style={inp}>{['EP','CP','MAP','AP'].map(m=><option key={m}>{m}</option>)}</select>
          <select value={form.numGuests} onChange={e=>setForm(p=>({...p,numGuests:+e.target.value}))} style={inp}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} Guest{n>1?'s':''}</option>)}</select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={inp}>{['inquiry','tentative','confirmed'].map(s=><option key={s} value={s}>{s}</option>)}</select>
          <select value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))} style={inp}>{['direct','OTA','agent','walkin'].map(s=><option key={s} value={s}>{s}</option>)}</select>
        </div>

        {/* ── Inline comment thread ── */}
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 7, marginTop: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#888', marginBottom: 5 }}>💬 Comments (optional)</div>
          <InlineCommentThread
            comments={form.comments}
            onChange={(updated) => setForm(p => ({ ...p, comments: updated }))}
          />
        </div>

        <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:2 }}>
          <button onClick={onClose} style={{ padding:'4px 12px', border:'1px solid #ddd', borderRadius:5, background:'#211f1f', cursor:'pointer', fontSize:'0.73rem' }}>Cancel</button>
          <button
            onClick={() => {
              if(form.guestName.trim()){
                onBook({...form, updatedAt:new Date().toISOString()});
                onClose();
              }
            }}
            style={{ padding:'4px 14px', border:'none', borderRadius:5, background:'#1565c0', color:'#fff', cursor:'pointer', fontSize:'0.73rem', fontWeight:600 }}
          >Book</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Booking Bar ───────────────────────────────────────────────────────────────
function BookingBar({ booking, cellWidth, cellHeight, left, width, onBookingClick, onBookingDoubleClick, onUpdateBooking, onContextMenu }) {
  const [hovering, setHovering] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const barRef = useRef(null), hoverTimer = useRef(null);
  const dep   = new Date(booking.departure);
  const color = statusColors[booking.status] || statusColors.confirmed;
  const payTag = !isBlocked(booking) ? paymentTagColors[booking.paymentStatus] : null;

  const startHover = () => { hoverTimer.current = setTimeout(() => { if(!editing){setAnchorRect(barRef.current?.getBoundingClientRect());setHovering(true);} }, 220); };
  const stopHover  = () => { clearTimeout(hoverTimer.current); setHovering(false); };

  const blockedStyle = isBlocked(booking) ? { background: `repeating-linear-gradient(45deg,#4a4a4a,#4a4a4a 6px,#3a3a3a 6px,#3a3a3a 12px)`, opacity: 0.85 } : {};

  return (
    <>
      <Rnd position={{ x:left, y:1 }} size={{ width:width-1, height:cellHeight-2 }} bounds="parent" dragAxis="none"
        enableResizing={{ left:false, right:true, top:false, bottom:false, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }}
        onResizeStop={(e,dir,ref,delta) => { if(dir==='right'){const d=Math.round(delta.width/cellWidth);if(d!==0)onUpdateBooking(booking.id,{departure:format(addDays(dep,d),'yyyy-MM-dd'),updatedAt:new Date().toISOString()});}}}
        style={{ zIndex: hovering||editing ? 5 : 2 }} disableDragging={true}>
        <div ref={barRef} style={{ position:'relative', width:'100%', height:'100%' }}
          onMouseEnter={startHover} onMouseLeave={stopHover}
          onClick={(e)=>{e.stopPropagation();clearTimeout(hoverTimer.current);setHovering(false);setEditing(true);setAnchorRect(barRef.current?.getBoundingClientRect());}}
          onDoubleClick={(e)=>{e.stopPropagation();if(!isBlocked(booking)){setEditing(false);onBookingDoubleClick?.(booking);}}}
          onContextMenu={(e)=>{e.preventDefault();e.stopPropagation();stopHover();onContextMenu?.(e,booking);}}>
          <div style={{ width:'100%', height:'100%', ...blockedStyle, ...(!isBlocked(booking)?{background:color.bg}:{}), color:color.text, borderRadius:2, display:'flex', alignItems:'center', fontWeight:isBlocked(booking)?500:600, fontSize:'0.68rem', overflow:'hidden', whiteSpace:'nowrap', cursor:'pointer', padding:'0 6px', boxShadow:hovering?'0 2px 10px rgba(0,0,0,0.25)':'0 1px 3px rgba(0,0,0,0.12)', transition:'box-shadow 0.12s', border:isBlocked(booking)?'1px solid #333':'none' }}>
            {isBlocked(booking) ? <span style={{ opacity:0.9, fontStyle:'italic' }}>🚫 {booking.notes||'Blocked'}</span> : <>{booking.tags?.includes('VIP')&&<span style={{marginRight:3}}>⭐</span>}{booking.tags?.includes('DND')&&<span style={{marginRight:3}}>🔕</span>}{booking.guestName}</>}
          </div>
          {payTag && <div style={{ position:'absolute', top:0, right:1, background:payTag.bg, color:payTag.text, fontSize:'0.5rem', fontWeight:700, padding:'1px 3px', borderRadius:'0 2px 2px 2px', textTransform:'uppercase', lineHeight:1.5 }}>{booking.paymentStatus}</div>}

        </div>
      </Rnd>
      {hovering && !editing && (isBlocked(booking) ? <BlockedHoverPopup booking={booking} rect={anchorRect} /> : <BookingHoverPopup booking={booking} rect={anchorRect} />)}
      {editing && <QuickEditPopup booking={booking} rect={anchorRect} onSave={(u)=>onUpdateBooking(booking.id,{...u,updatedAt:new Date().toISOString()})} onClose={()=>{setEditing(false);setHovering(false);}} onFullEdit={()=>{setEditing(false);onBookingDoubleClick?.(booking);}} />}
    </>
  );
}

// ── Main CalendarView ─────────────────────────────────────────────────────────
function CalendarView({ rooms, bookings=[], selectedDate, categoryColors={}, onCellClick, onBookingClick, onBookingDoubleClick, onUpdateBooking, onQuickBook, onContextAction }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [cellPopup,   setCellPopup]   = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const obs = new ResizeObserver(entries => { for(const e of entries) setContainerWidth(e.contentRect.width); });
    if(containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const days       = buildMonthDays(selectedDate || new Date());
  const cellWidth  = Math.max(26, Math.floor((containerWidth - ROOM_COL_WIDTH) / days.length));
  const cellHeight = 30;

  const getRoomBookings = (roomName) => bookings.filter(b => b.roomName === roomName);

  const hasBookingOnDay = (roomName, day) =>
    getRoomBookings(roomName).some(b => {
      const d = new Date(format(day,'yyyy-MM-dd'));
      return d >= new Date(b.arrival) && d < new Date(b.departure);
    });

  function isOverlap(newItem, ignoreId=null) {
    const arr1=new Date(newItem.arrival), dep1=new Date(newItem.departure);
    return bookings.some(b => {
      if(b.roomName!==newItem.roomName) return false;
      if(ignoreId && b.id===ignoreId) return false;
      const arr2=new Date(b.arrival), dep2=new Date(b.departure);
      return arr1<dep2 && arr2<dep1 && !['cancelled','no-show'].includes(b.status);
    });
  }
  function handleUpdateBooking(id, updates) {
    const cur = bookings.find(b=>b.id===id); if(!cur) return;
    if(isOverlap({...cur,...updates},id)){window.alert('Overlap!');return;}
    onUpdateBooking(id, updates);
  }
  function handleQuickBook(data) {
    if(isOverlap(data)){window.alert('Overlap!');return;}
    onQuickBook(data);
  }

  const getDayOccupancy = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const d = new Date(dateStr);
    const occupied = rooms.filter(r =>
      bookings.some(b =>
        b.roomName === r.name &&
        new Date(b.arrival) <= d && new Date(b.departure) > d &&
        !['cancelled','no-show','blocked'].includes(b.status)
      )
    ).length;
    return { occupied, rate: rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0 };
  };

  const getCatAvailableOnDay = (cat, day) => {
    const catRooms = rooms.filter(r => r.category === cat);
    const d = new Date(format(day, 'yyyy-MM-dd'));
    const occupied = catRooms.filter(r =>
      bookings.some(b =>
        b.roomName === r.name &&
        new Date(b.arrival) <= d && new Date(b.departure) > d &&
        !['cancelled','no-show','blocked'].includes(b.status)
      )
    ).length;
    return catRooms.length - occupied;
  };

  const catCount = {};
  rooms.forEach(r => { catCount[r.category] = (catCount[r.category] || 0) + 1; });

  const sortedCategories = Object.keys(categoryColors)
    .filter(cat => rooms.some(r => r.category === cat))
    .sort((a, b) => {
      const diff = (catCount[a] || 0) - (catCount[b] || 0);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });

  const groupedRows = [];
  sortedCategories.forEach(cat => {
    const catRooms = [...rooms.filter(r => r.category === cat)]
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    catRooms.forEach(r => groupedRows.push({ type: 'room', room: r }));
    groupedRows.push({ type: 'total', category: cat });
  });

  const hideScrollbar = { scrollbarWidth:'none', msOverflowStyle:'none' };

  return (
    <div ref={containerRef} style={{ flex:1, overflow:'hidden', border:'1px solid #c8cacf', borderRadius:6, background:'#fff', display:'flex', flexDirection:'column', height:'100%' }}>
      <style>{`.cal-scroll::-webkit-scrollbar{display:none}`}</style>
      <div className="cal-scroll" style={{ flex:1, overflowY:'auto', overflowX:'hidden', ...hideScrollbar }}>
        <div style={{ width:'100%', minWidth:days.length*cellWidth+ROOM_COL_WIDTH }}>

          {/* ── Header ── */}
          <div style={{ display:'flex', height:38, background:'#e8eaed', position:'sticky', top:0, zIndex:1000, borderBottom:'2px solid #b8bcc4' }}>
            <div style={{ width:ROOM_COL_WIDTH, minWidth:ROOM_COL_WIDTH, borderRight:'2px solid #b8bcc4', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.68rem', color:'#444', letterSpacing:'0.1em', textTransform:'uppercase', background:'#e0e2e6' }}>Room</div>
            {days.map(day => {
              const isToday=isSameDay(day,new Date()), isWeekend=day.getDay()===0||day.getDay()===6;
              return (
                <div key={day.toISOString()} style={{ width:cellWidth, minWidth:cellWidth, maxWidth:cellWidth, flexShrink:0, borderRight:'1px solid #c4c8ce', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:isToday?'#1565c0':isWeekend?'#fdecea':'#e8eaed', color:isToday?'#fff':isWeekend?'#c0392b':'#333', fontWeight:isToday?800:600 }}>
                  <span style={{ fontSize:'0.7rem', lineHeight:1.1 }}>{format(day,'d')}</span>
                  <span style={{ fontSize:'0.52rem', textTransform:'uppercase', opacity:0.75 }}>{format(day,'EEE')}</span>
                </div>
              );
            })}
          </div>

          {/* ── Grouped Room Rows ── */}
          {groupedRows.map((row) => {
            if (row.type === 'room') {
              const room = row.room;
              const roomColor = categoryColors[room.category] || { bg:'#f5f5f5', border:'#9e9e9e' };
              return (
                <div key={`room-${room.name}`} style={{ position:'relative', height:cellHeight, display:'flex', alignItems:'stretch', borderBottom:'1px solid rgba(0,0,0,0.06)', background:roomColor.bg }}>
                  <div style={{ width:ROOM_COL_WIDTH, minWidth:ROOM_COL_WIDTH, flexShrink:0, borderRight:'3px solid #b8bcc4', display:'flex', alignItems:'center', borderLeft:`4px solid ${roomColor.border}`, paddingLeft:8, background:roomColor.bg }}>
                    <span style={{ fontWeight:700, fontSize:'0.74rem', color:'#1a1a2e' }}>{room.name}</span>
                  </div>
                  <div style={{ display:'flex', flex:1, position:'relative', height:'100%' }}>
                    {days.map((day) => {
                      const isToday=isSameDay(day,new Date()), isWeekend=day.getDay()===0||day.getDay()===6;
                      const occupied=hasBookingOnDay(room.name,day);
                      return (
                        <div key={format(day,'yyyy-MM-dd')} style={{ width:cellWidth, minWidth:cellWidth, maxWidth:cellWidth, height:'100%', flexShrink:0, borderRight:'1px solid rgba(0,0,0,0.07)', cursor:occupied?'default':'pointer', zIndex:1, background:isToday?'rgba(21,101,192,0.10)':isWeekend?'rgba(0,0,0,0.04)':'transparent' }}
                          onClick={e => { if(!occupied) setCellPopup({ room:room.name, day, rect:e.currentTarget.getBoundingClientRect() }); }} />
                      );
                    })}
                    {getRoomBookings(room.name).map(booking => {
                      const s0=days[0], en=days[days.length-1];
                      const arr=new Date(booking.arrival), dep=new Date(booking.departure);
                      if(isAfter(arr,en)||isBefore(dep,s0)) return null;
                      const vArr=isBefore(arr,s0)?s0:arr, vDep=isAfter(dep,en)?addDays(en,1):dep;
                      const si=days.findIndex(d=>isSameDay(d,vArr));
                      let ei=days.findIndex(d=>isSameDay(d,vDep));
                      if(ei===-1) ei=days.length;
                      return (
                        <BookingBar key={booking.id} booking={booking} cellWidth={cellWidth} cellHeight={cellHeight} left={si*cellWidth} width={(ei-si)*cellWidth}
                          onBookingClick={onBookingClick} onBookingDoubleClick={onBookingDoubleClick}
                          onUpdateBooking={handleUpdateBooking}
                          onContextMenu={(e,b)=>setContextMenu({x:e.clientX,y:e.clientY,booking:b})} />
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (row.type === 'total') {
              const cat = row.category;
              const roomColor = categoryColors[cat] || { bg:'#f5f5f5', border:'#9e9e9e' };
              const catRoomCount = rooms.filter(r => r.category === cat).length;
              return (
                <div key={`total-${cat}`} style={{ position:'relative', height:22, display:'flex', alignItems:'stretch', borderBottom:'2px solid #b8bcc4', background: `${roomColor.bg}cc` }}>
                  <div style={{ width:ROOM_COL_WIDTH, minWidth:ROOM_COL_WIDTH, flexShrink:0, borderRight:'3px solid #b8bcc4', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:`4px solid ${roomColor.border}`, background:`${roomColor.bg}ee` }}>
                    <span style={{ fontSize:'0.6rem', fontWeight:800, color:roomColor.border, textTransform:'uppercase', letterSpacing:'0.05em' }}>Available</span>
                  </div>
                  <div style={{ display:'flex', flex:1, position:'relative', height:'100%' }}>
                    {days.map(day => {
                      const avail = getCatAvailableOnDay(cat, day);
                      const isToday = isSameDay(day, new Date());
                      const pct = catRoomCount > 0 ? avail / catRoomCount : 0;
                      const bg = pct > 0.5 ? '#eafaf1' : pct > 0 ? '#fef9e7' : '#fdecea';
                      const col = pct > 0.5 ? '#1e8449' : pct > 0 ? '#d4ac0d' : '#c0392b';
                      return (
                        <div key={format(day,'yyyy-MM-dd')} style={{ width:cellWidth, minWidth:cellWidth, maxWidth:cellWidth, height:'100%', flexShrink:0, borderRight:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'center', background:isToday?'rgba(21,101,192,0.10)':bg }}>
                          <span style={{ fontSize:'0.58rem', fontWeight:800, color:col }}>{avail}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* ── Daily Occupancy Footer ── */}
          <div style={{ position:'sticky', bottom:0, zIndex:100, display:'flex', height:36, background:'#1a1a2e', borderTop:'2px solid #b8bcc4' }}>
            <div style={{ width:ROOM_COL_WIDTH, minWidth:ROOM_COL_WIDTH, flexShrink:0, borderRight:'3px solid #444', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1 }}>
              <span style={{ fontSize:'0.55rem', fontWeight:800, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.08em' }}>Occupancy</span>
              <span style={{ fontSize:'0.55rem', color:'#666', letterSpacing:'0.04em' }}>Daily</span>
            </div>
            {days.map(day => {
              const { occupied, rate } = getDayOccupancy(day);
              const isToday = isSameDay(day, new Date());
              const rateColor = rate > 80 ? '#2ecc71' : rate > 50 ? '#f39c12' : rate > 0 ? '#e74c3c' : '#555';
              return (
                <div key={format(day,'yyyy-MM-dd')} style={{ width:cellWidth, minWidth:cellWidth, maxWidth:cellWidth, flexShrink:0, borderRight:'1px solid #333', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1, background:isToday?'rgba(21,101,192,0.3)':'transparent' }}>
                  <span style={{ fontSize:'0.6rem', fontWeight:800, color:'#fff', lineHeight:1 }}>{occupied}</span>
                  <span style={{ fontSize:'0.52rem', fontWeight:700, color:rateColor, lineHeight:1 }}>{rate}%</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {cellPopup && (
        <NewBookingPopup room={cellPopup.room} day={cellPopup.day} rect={cellPopup.rect}
          onBook={data => { handleQuickBook({...data, roomName:cellPopup.room, id:`b${Date.now()}`}); setCellPopup(null); }}
          onClose={() => setCellPopup(null)} />
      )}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} booking={contextMenu.booking}
          onAction={(action,booking) => onContextAction?.(action,booking)}
          onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
}

export default CalendarView;