import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  getDaysInMonth,
  format,
  startOfMonth,
  parseISO
} from 'date-fns';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const SPECIAL_DATES = {
  '03-14': { label: 'Holi', emoji: '🎨', color: '#e91e63' },
  '10-20': { label: 'Diwali', emoji: '🪔', color: '#ff9800' },
  '10-21': { label: 'Diwali', emoji: '🪔', color: '#ff9800' },
  '12-25': { label: 'Christmas', emoji: '🎄', color: '#27ae60' },
  '01-01': { label: 'New Year', emoji: '🎆', color: '#1565c0' },
  '08-15': { label: 'Independence', emoji: '🇮🇳', color: '#ff9800' },
  '10-02': { label: 'Gandhi Jayanti', emoji: '✌️', color: '#795548' }
};

function getSpecialDate(dateStr) {
  const md = dateStr.slice(5);
  return SPECIAL_DATES[dateStr] || SPECIAL_DATES[md] || null;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function getFloor(roomName) {
  const n = parseInt(roomName);
  if (isNaN(n) || n < 100) return 1;
  return Math.floor(n / 100);
}

function exportCSV(data, fileName = 'occupancy-report.csv') {
  const rows = data.map(row =>
    Object.values(row)
      .map(v => `"${String(v ?? '')}"`)
      .join(',')
  );

  const headers = Object.keys(data[0] || {})
    .map(h => `"${h}"`)
    .join(',');

  const csv = [headers, ...rows].join('\n');

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function buildDashboard(
  rooms,
  bookings,
  viewDate,
  floorFilter,
  categoryFilter
) {
  const daysInMonth = getDaysInMonth(viewDate);
  const monthStart = startOfMonth(viewDate);
  const monthEnd = addDays(monthStart, daysInMonth);

  let filteredRooms =
    floorFilter === 'all'
      ? rooms
      : rooms.filter(
          r =>
            String(
              r.floor ?? getFloor(r.name)
            ) === String(floorFilter)
        );

  if (categoryFilter !== 'all') {
    filteredRooms = filteredRooms.filter(
      r => r.category === categoryFilter
    );
  }

  const filteredBookings = bookings.filter(b =>
    filteredRooms.some(r => r.name === b.roomName)
  );

  const activeBookings = filteredBookings.filter(
    b =>
      ![
        'cancelled',
        'no-show',
        'blocked'
      ].includes(b.status)
  );

  const blockedBookings = filteredBookings.filter(
    b => b.status === 'blocked'
  );

  const daily = Array.from(
    { length: daysInMonth },
    (_, i) => {
      const day = addDays(monthStart, i);
      const nextDay = addDays(day, 1);
      const dateStr = format(day, 'yyyy-MM-dd');

      const occupied = filteredRooms.filter(room =>
        activeBookings.some(
          b =>
            b.roomName === room.name &&
            overlaps(
              parseISO(b.arrival),
              parseISO(b.departure),
              day,
              nextDay
            )
        )
      ).length;

      const special = getSpecialDate(dateStr);

      return {
        day: format(day, 'd'),
        date: dateStr,
        weekday: format(day, 'EEE'),
        occupied,
        rate: filteredRooms.length
          ? Math.round(
              (occupied / filteredRooms.length) * 100
            )
          : 0,
        special
      };
    }
  );

  const roomRows = filteredRooms.map(room => {
    let occupiedDays = 0;
    let blockedDays = 0;

    for (let i = 0; i < daysInMonth; i++) {
      const day = addDays(monthStart, i);
      const nextDay = addDays(day, 1);

      if (
        activeBookings.some(
          b =>
            b.roomName === room.name &&
            overlaps(
              parseISO(b.arrival),
              parseISO(b.departure),
              day,
              nextDay
            )
        )
      ) {
        occupiedDays++;
      }

      if (
        blockedBookings.some(
          b =>
            b.roomName === room.name &&
            overlaps(
              parseISO(b.arrival),
              parseISO(b.departure),
              day,
              nextDay
            )
        )
      ) {
        blockedDays++;
      }
    }

    return {
      roomName: room.name,
      category: room.category,
      floor: room.floor ?? getFloor(room.name),
      occupiedDays,
      blockedDays,
      occupancy: daysInMonth
        ? Math.round(
            (occupiedDays / daysInMonth) * 100
          )
        : 0,
      status: room.roomOperationalStatus
    };
  });

  const totalOccupiedDays = daily.reduce(
    (sum, d) => sum + d.occupied,
    0
  );

  const totalRoomDays =
    filteredRooms.length * daysInMonth;

  const blockedRoomDays = roomRows.reduce(
    (sum, r) => sum + r.blockedDays,
    0
  );

  const vacantRoomDays =
    totalRoomDays -
    totalOccupiedDays -
    blockedRoomDays;

  const effectiveInventory =
  totalRoomDays - blockedRoomDays;

const occupancyRate = effectiveInventory
  ? Math.round(
      (totalOccupiedDays / effectiveInventory) * 100
    )
  : 0;

  const occupiedRooms = roomRows.filter(
    r => r.occupiedDays > 0
  ).length;

  const blockedRooms = filteredRooms.filter(
    r =>
      r.roomOperationalStatus &&
      r.roomOperationalStatus !== 'ACTIVE'
  ).length;

  const availableRooms = Math.max(
    0,
    filteredRooms.length -
      occupiedRooms -
      blockedRooms
  );

  const totalReservations = new Set(
    activeBookings
      .filter(b =>
        overlaps(
          parseISO(b.arrival),
          parseISO(b.departure),
          monthStart,
          monthEnd
        )
      )
      .map(b => b.id)
  ).size;

  const categoryStats = {};

  filteredRooms.forEach(room => {
    if (!categoryStats[room.category]) {
      categoryStats[room.category] = {
        category: room.category,
        total: 0,
        occupied: 0,
        blocked: 0
      };
    }

    categoryStats[room.category].total++;

    const roomData = roomRows.find(
      r => r.roomName === room.name
    );

    if (roomData?.occupiedDays > 0) {
      categoryStats[room.category].occupied++;
    }

    if (
      room.roomOperationalStatus &&
      room.roomOperationalStatus !== 'ACTIVE'
    ) {
      categoryStats[room.category].blocked++;
    }
  });

  Object.values(categoryStats).forEach(cat => {
    cat.vacant =
      cat.total -
      cat.occupied -
      cat.blocked;

    cat.occupancy = cat.total
      ? Math.round(
          (cat.occupied / cat.total) * 100
        )
      : 0;
  });

  const yearlyStats = MONTH_NAMES.map((month, index) => {
    const targetDate = new Date(
      viewDate.getFullYear(),
      index,
      1
    );

    const targetStart = startOfMonth(targetDate);
    const days = getDaysInMonth(targetDate);
    const targetEnd = addDays(targetStart, days);

    let occupied = 0;

    filteredRooms.forEach(room => {
      for (let i = 0; i < days; i++) {
        const d = addDays(targetStart, i);
        const next = addDays(d, 1);

        const found = activeBookings.some(
          b =>
            b.roomName === room.name &&
            overlaps(
              parseISO(b.arrival),
              parseISO(b.departure),
              d,
              next
            )
        );

        if (found) occupied++;
      }
    });

    const total = filteredRooms.length * days;

    return {
      month,
      occupancy: total
        ? Math.round((occupied / total) * 100)
        : 0
    };
  });

  return {
    filteredRooms,
    daily,
    roomRows,
    totalRooms: filteredRooms.length,
    occupiedRooms,
    blockedRooms,
    availableRooms,
    occupancyRate,
    totalReservations,
    totalRoomDays,
    totalOccupiedDays,
    blockedRoomDays,
    vacantRoomDays,
    categoryStats: Object.values(categoryStats),
    yearlyStats
  };
}

function StatCard({
  label,
  value,
  color,
  sub
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8eaed',
        borderRadius: 14,
        padding: '14px 18px',
        minWidth: 120,
        flex: '1 1 120px'
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 6
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color: color || '#1a1a2e',
          lineHeight: 1
        }}
      >
        {value}
      </div>

      {sub && (
        <div
          style={{
            fontSize: '0.65rem',
            color: '#aaa',
            marginTop: 4
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function DailyBar({ item }) {
  const barH = Math.max(
    6,
    Math.round((item.rate / 100) * 120)
  );

  const color =
    item.rate > 80
      ? '#27ae60'
      : item.rate > 50
      ? '#f39c12'
      : item.rate > 0
      ? '#e74c3c'
      : '#e0e0e0';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        minWidth: 28,
        position: 'relative'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: 120
        }}
      >
        <div
          style={{
            width: 16,
            borderRadius: '4px 4px 0 0',
            background: color,
            height: barH
          }}
        />
      </div>

      <span
        style={{
          fontSize: '0.55rem',
          color: '#888'
        }}
      >
        {item.day}
      </span>

      <span
        style={{
          fontSize: '0.55rem',
          color,
          fontWeight: 700
        }}
      >
        {item.rate > 0 ? `${item.rate}%` : ''}
      </span>
    </div>
  );
}

function CategoryCard({ item }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8eaed',
        borderRadius: 14,
        padding: 16,
        minWidth: 220,
        flex: '1 1 220px'
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: '0.85rem',
          marginBottom: 12
        }}
      >
        {item.category}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: '0.75rem'
        }}
      >
        <div>Total: {item.total}</div>
        <div>Occupied: {item.occupied}</div>
        <div>Vacant: {item.vacant}</div>
        <div>Blocked: {item.blocked}</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            marginBottom: 6
          }}
        >
          Occupancy: {item.occupancy}%
        </div>

        <div
          style={{
            height: 8,
            background: '#f0f0f0',
            borderRadius: 4
          }}
        >
          <div
            style={{
              width: `${item.occupancy}%`,
              height: '100%',
              borderRadius: 4,
              background: '#1565c0'
            }}
          />
        </div>
      </div>
    </div>
  );
}

function YearlyBar({ item }) {
  const height = Math.max(
    8,
    Math.round((item.occupancy / 100) * 160)
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 48
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          fontWeight: 700
        }}
      >
        {item.occupancy}%
      </div>

      <div
        style={{
          height: 160,
          display: 'flex',
          alignItems: 'flex-end'
        }}
      >
        <div
          style={{
            width: 28,
            height,
            borderRadius: '6px 6px 0 0',
            background: '#1565c0'
          }}
        />
      </div>

      <div
        style={{
          fontSize: '0.65rem',
          marginTop: 6
        }}
      >
        {item.month.slice(0, 3)}
      </div>
    </div>
  );
}
// ── Main Component ────────────────────────────────────────────────────────────
function Dashboard2({ rooms, bookings, selectedDate, categoryColors, onClose }) {
  const [viewDate,    setViewDate]    = useState(selectedDate || new Date());
  const [floorFilter, setFloorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading,     setLoading]     = useState(false);
  const [data, setData] = useState(() =>
  buildDashboard(
    rooms,
    bookings,
    selectedDate || new Date(),
    'all',
    'all'
  )
);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }, []);

  const allFloors = useMemo(() =>
    [...new Set(rooms.map(r => r.floor ?? getFloor(r.name)))].sort((a,b) => a-b),
  [rooms]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
     setData(
  buildDashboard(
    rooms,
    bookings,
    viewDate,
    floorFilter,
    categoryFilter
  )
);
      setLoading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [
  rooms,
  bookings,
  viewDate,
  floorFilter,
  categoryFilter
]);


  const statusBadge = (status) => {
    const map = {
      ACTIVE:           { bg: '#e8f5e9', color: '#1e8449',  label: 'Active' },
      UNDER_RENOVATION: { bg: '#fff3e0', color: '#e67e22',  label: 'Renovation' },
      OUT_OF_ORDER:     { bg: '#fdecea', color: '#c0392b',  label: 'Out of Order' },
    };
    const m = map[status] || map.ACTIVE;
    return (
      <span style={{ background: m.bg, color: m.color, fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>
        {m.label}
      </span>
    );
  };

  return (
    <div style={{
      background: '#f7f8fa', borderBottom: '2px solid #e0e0e0',
      padding: '14px 18px', flexShrink: 0,
      maxHeight: '70vh', overflowY: 'auto',
    }}>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a2e' }}>📊 Occupancy Analytics Dashboard</div>
          <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 2 }}>
           Monthly occupancy summary, daily trends, category analytics & yearly comparison· {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Month selector */}
          <select
            value={viewDate.getMonth()}
            onChange={e => { const d = new Date(viewDate); d.setMonth(+e.target.value); setViewDate(d); }}
            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          {/* Year selector */}
          <select
            value={viewDate.getFullYear()}
            onChange={e => { const d = new Date(viewDate); d.setFullYear(+e.target.value); setViewDate(d); }}
            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
  value={categoryFilter}
  onChange={e => setCategoryFilter(e.target.value)}
  style={{
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 600
  }}
>
  <option value="all">All Categories</option>
  {[...new Set(rooms.map(r => r.category))].map(cat => (
    <option key={cat} value={cat}>
      {cat}
    </option>
  ))}
</select>
          <button onClick={onClose} style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
        </div>
      </div>

<div
  style={{
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#1a1a2e',
    marginBottom: 10
  }}
>
  Monthly Occupancy Summary — {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
</div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <StatCard label="Total Rooms"    value={data.totalRooms}        color="#1a1a2e" />
        <StatCard label="Occupied"       value={data.occupiedRooms}     color="#1e8449" sub="rooms with any booking this month" />
        <StatCard label="Available"      value={data.availableRooms}    color="#1565c0" />
        <StatCard label="Blocked"        value={data.blockedRooms}      color="#e67e22" sub="renovation / out of order" />
        <StatCard label="Occupancy Rate" value={`${data.occupancyRate}%`} color={data.occupancyRate > 80 ? '#1e8449' : data.occupancyRate > 50 ? '#e67e22' : '#e74c3c'} sub="of room-nights this month" />
        <StatCard label="Reservations"   value={data.totalReservations} color="#6c3483" sub="active this month" />
        <StatCard label="Room Nights" value={data.totalRoomDays} color="#34495e" />
<StatCard label="Occupied Nights" value={data.totalOccupiedDays} color="#27ae60" />
<StatCard label="Vacant Nights" value={data.vacantRoomDays} color="#7f8c8d" />
<StatCard label="Blocked Nights" value={data.blockedRoomDays} color="#e67e22" />
      </div>

      {/* ── Daily bar chart ── */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1a1a2e' }}>Daily Occupancy — {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
          <div style={{ display: 'flex', gap: 10, fontSize: '0.65rem' }}>
            {[['> 80%','#27ae60','Healthy'],['50–80%','#f39c12','Moderate'],['< 50%','#e74c3c','Low']].map(([pct,color,label]) => (
              <div key={pct} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ color: '#888' }}>{label} {pct}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.75rem' }}>🪔</span>
              <span style={{ color: '#888' }}>Special date</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, overflowX: 'auto', paddingBottom: 4, paddingTop: 16 }}>
          {data.daily.map(item => <DailyBar key={item.date} item={item} />)}
        </div>
      </div>

      <div
  style={{
    background: '#fff',
    border: '1px solid #e8eaed',
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 14
  }}
>
  <div
    style={{
      fontWeight: 700,
      fontSize: '0.82rem',
      color: '#1a1a2e',
      marginBottom: 12
    }}
  >
    Yearly Occupancy Trend
  </div>

  <div
    style={{
      display: 'flex',
      gap: 10,
      overflowX: 'auto'
    }}
  >
    {data.yearlyStats.map(item => (
      <YearlyBar key={item.month} item={item} />
    ))}
  </div>
</div>

      {/* Category Occupancy */}
<div
  style={{
    background: '#fff',
    border: '1px solid #e8eaed',
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 14
  }}
>
  <div
    style={{
      fontWeight: 700,
      fontSize: '0.82rem',
      color: '#1a1a2e',
      marginBottom: 12
    }}
  >
    Category-wise Occupancy
  </div>

  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12
    }}
  >
    {data.categoryStats.map(cat => (
      <CategoryCard key={cat.category} item={cat} />
    ))}
  </div>
</div>



      {/* ── Room table ── */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1a1a2e' }}>Room-Level Occupancy</div>
          {/* Floor filter */}
          {allFloors.length > 1 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: '#888', fontWeight: 600 }}>Floor:</span>
              <button onClick={() => setFloorFilter('all')}
                style={{ padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, background: floorFilter === 'all' ? '#1a1a2e' : '#f5f5f5', color: floorFilter === 'all' ? '#fff' : '#555' }}>
                All
              </button>
              {allFloors.map(f => (
                <button key={f} onClick={() => setFloorFilter(String(f))}
                  style={{ padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, background: floorFilter === String(f) ? '#1565c0' : '#f5f5f5', color: floorFilter === String(f) ? '#fff' : '#555' }}>
                  F{f}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa', fontSize: '0.82rem' }}>Loading occupancy data…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e8eaed' }}>
                  {['Room','Floor','Category','Occupied Days','Blocked Days','Occupancy','Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#888', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.roomRows.map((row, i) => {
                  const barColor = row.occupancy > 80 ? '#27ae60' : row.occupancy > 50 ? '#f39c12' : '#e0e0e0';
                  const catColor = categoryColors?.[row.category]?.border || '#1565c0';
                  return (
                    <tr key={row.roomName} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1a1a2e' }}>
                        <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, background: catColor, marginRight: 8, verticalAlign: 'middle' }} />
                        {row.roomName}
                      </td>
                      <td style={{ padding: '9px 12px', color: '#666' }}>F{row.floor}</td>
                      <td style={{ padding: '9px 12px', color: '#666' }}>{row.category}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: row.occupiedDays > 0 ? '#1e8449' : '#aaa' }}>{row.occupiedDays}</td>
                      <td style={{ padding: '9px 12px', color: row.blockedDays > 0 ? '#e67e22' : '#aaa' }}>{row.blockedDays}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#1a1a2e', minWidth: 34 }}>{row.occupancy}%</span>
                          <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, minWidth: 60 }}>
                            <div style={{ width: `${row.occupancy}%`, height: '100%', borderRadius: 3, background: barColor, transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px' }}>{statusBadge(row.status)}</td>
                    </tr>
                  );
                })}
                {data.roomRows.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#aaa' }}>No rooms match the current filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard2;