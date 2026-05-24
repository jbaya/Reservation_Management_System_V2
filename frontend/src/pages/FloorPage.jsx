import React, { useState } from 'react';

function FloorPage({
  floors,
  rooms,
  floorFilter,
  setFloorFilter,
  setFloors,
  categoryColors,
}) {
  const [newFloor, setNewFloor] = useState({ number: 1 });

  const ROOM_STATUS_LABELS = {
    ACTIVE: 'Active',
    UNDER_RENOVATION: 'Under Renovation',
    OUT_OF_ORDER: 'Out of Order',
  };

  function getFloor(roomName) {
    const n = parseInt(roomName);
    if (isNaN(n) || n < 100) return 1;
    return Math.floor(n / 100);
  }

  function getRoomFloor(room) {
    if (room.floor !== undefined && room.floor !== null && room.floor !== '') {
      if (room.floor === 'Basement') return -1;
      if (room.floor === 'Ground')   return 0;
      const parsed = parseInt(room.floor);
      if (!isNaN(parsed)) return parsed;
    }
    return getFloor(room.name);
  }

  const getFloorLabel = (f) => {
    if (f === -1) return 'Basement';
    if (f === 0) return 'Ground Floor';
    return `Floor ${f}`;
  };

  const handleAddFloor = (e) => {
    e.preventDefault();
    const num = parseInt(newFloor.number);
    if (isNaN(num) || num < -1 || num > 50) {
      alert('Invalid floor number');
      return;
    }
    if (floors.includes(num)) {
      alert('Floor already exists');
      return;
    }
    setFloors(prev => [...prev, num].sort((a, b) => a - b));
    setNewFloor({ number: 1 });
  };

  const handleDeleteFloor = (floorNum) => {
    const roomsOnFloor = rooms.filter(
      r => String(getRoomFloor(r)) === String(floorNum)
    );
    if (roomsOnFloor.length > 0) {
      alert('Cannot delete floor with assigned rooms');
      return;
    }
    if (!window.confirm(`Delete ${getFloorLabel(floorNum)}?`)) return;
    setFloors(prev => prev.filter(f => f !== floorNum));
    if (floorFilter === String(floorNum)) {
      setFloorFilter('all');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        boxShadow: '0 4px 18px rgba(0,0,0,0.06)', border: '1px solid #e8eaed',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937' }}>🏢 Floor Management</h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#777' }}>Add, manage and filter hotel floors</p>
          </div>
          <button onClick={() => setFloorFilter('all')}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1565c0', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            Show All Floors
          </button>
        </div>

        <form onSubmit={handleAddFloor}
          style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#555', marginBottom: 6, fontWeight: 600 }}>
              Select Floor
            </label>
            <select
              value={newFloor.number}
              onChange={(e) => setNewFloor({ number: parseInt(e.target.value) })}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', minWidth: 220 }}
            >
              <option value={-1} disabled={floors.includes(-1)}>
                {floors.includes(-1) ? 'Basement (exists)' : 'Basement'}
              </option>
              <option value={0} disabled={floors.includes(0)}>
                {floors.includes(0) ? 'Ground Floor (exists)' : 'Ground Floor'}
              </option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n} disabled={floors.includes(n)}>
                  {floors.includes(n) ? `Floor ${n} (exists)` : `Floor ${n}`}
                </option>
              ))}
            </select>
          </div>
          <button type="submit"
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#16a085', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            + Add Floor
          </button>
        </form>

        <div style={{ display: 'grid', gap: 14 }}>
          {floors.map((f) => {
            const roomsOnFloor = rooms.filter(
              r => String(getRoomFloor(r)) === String(f)
            );
            const isExpanded = floorFilter === String(f);

            return (
              <div key={f} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                <div
                  onClick={() => setFloorFilter(isExpanded ? 'all' : String(f))}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', background: isExpanded ? '#e8f4ff' : '#f8fafc' }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: isExpanded ? '#1565c0' : '#1f2937', fontSize: '0.9rem' }}>
                      🏢 {getFloorLabel(f)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>
                      {roomsOnFloor.length} room(s) • click to filter calendar
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: '#1565c0', fontWeight: 700 }}>{isExpanded ? '▲' : '▼'}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteFloor(f); }}
                      disabled={roomsOnFloor.length > 0}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        cursor: roomsOnFloor.length > 0 ? 'not-allowed' : 'pointer',
                        background: roomsOnFloor.length > 0 ? '#f0f0f0' : '#ffebee',
                        color: roomsOnFloor.length > 0 ? '#999' : '#c62828',
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: 14, background: '#fff' }}>
                    {roomsOnFloor.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.82rem', padding: '20px 0' }}>
                        No rooms assigned to this floor yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {roomsOnFloor.map((room) => {
                          const catColor = categoryColors[room.category] || { bg: '#f5f5f5', border: '#999' };
                          const statusColor =
                            room.roomOperationalStatus === 'ACTIVE' ? '#1e8449'
                            : room.roomOperationalStatus === 'UNDER_RENOVATION' ? '#e67e22'
                            : '#888';
                          return (
                            <div key={room.name} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '12px 14px', borderRadius: 10,
                              background: catColor.bg, borderLeft: `4px solid ${catColor.border}`,
                            }}>
                              <div>
                                <div style={{ fontWeight: 700, color: '#1f2937' }}>Room {room.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 4 }}>{room.category}</div>
                              </div>
                              <div style={{
                                fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px',
                                borderRadius: 999, background: `${statusColor}18`, color: statusColor,
                              }}>
                                {ROOM_STATUS_LABELS[room.roomOperationalStatus] || 'Active'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FloorPage;