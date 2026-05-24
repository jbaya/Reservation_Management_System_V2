import { useState } from 'react';

function Field({ label, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        style={{
          fontSize: '0.8rem',
          color: '#444',
          fontWeight: 600,
          marginBottom: 4
        }}
      >
        {label}
        {required && <span style={{ color: 'red' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const OTA_PLATFORMS = [
  'Booking.com',
  'MakeMyTrip',
  'Agoda',
  'Expedia',
  'Goibibo',
  'Airbnb',
  'Yatra'
];

function MultiRoomReservationPage({
  rooms,
  categoryColors,
  bookings,
  onSave,
  travelAgents = [],
  thirdParties = []
}) {
  const inp = {
    padding: '7px 10px',
    borderRadius: 5,
    border: '1px solid #ccc',
    fontSize: '0.82rem',
    width: '100%',
    boxSizing: 'border-box',
    background: '#333030'
  };

  const [form, setForm] = useState({
    guestName: '',
    phone: '',
    email: '',
    arrival: '',
    departure: '',
    source: 'direct',
    otaPlatform: '',
    bookingId: '',
    agentName: '',
    tags: [],
    rooms: [
  {
    id: Date.now(),
    roomCategory: '',
    roomName: '',
    occupancy: 1,
    extraPersons: 0,
    rate: 0,
    
  }
]
  });

  const availableRoomsByCategory = (category, currentRoomId) => {
  const bookedRoomNames = bookings.flatMap((b) => {
    if (
      b.arrival &&
      b.departure &&
      form.arrival &&
      form.departure
    ) {
      const existingStart = new Date(b.arrival);
      const existingEnd = new Date(b.departure);
      const newStart = new Date(form.arrival);
      const newEnd = new Date(form.departure);

      const overlaps =
        newStart < existingEnd && newEnd > existingStart;

      if (!overlaps) return [];
    }

    if (b.isMultiRoom && b.rooms?.length) {
      return b.rooms.map(r => r.roomName);
    }

    return [b.roomName];
  });

  const selectedInCurrentForm = form.rooms
    .filter(r => r.id !== currentRoomId)
    .map(r => r.roomName);

  return rooms.filter(
    r =>
      r.category === category &&
      !bookedRoomNames.includes(r.name) &&
      !selectedInCurrentForm.includes(r.name)
  );
};

  const addRoom = () => {
    setForm(prev => ({
      ...prev,
      rooms: [
        ...prev.rooms,
       {
  id: Date.now() + Math.random(),
  roomCategory: '',
  roomName: '',
  occupancy: 1,
  extraPersons: 0,
  rate: 0,
  
}
      ]
    }));
  };

  const removeRoom = (id) => {
    if (form.rooms.length === 1) {
      alert('At least one room is required');
      return;
    }

    if (!window.confirm('Remove this room?')) return;

    setForm(prev => ({
      ...prev,
      rooms: prev.rooms.filter(r => r.id !== id)
    }));
  };

  const updateRoom = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      rooms: prev.rooms.map(room =>
        room.id === id
          ? {
              ...room,
              [field]: value,
              ...(field === 'roomCategory'
                ? { roomName: '' }
                : {})
            }
          : room
      )
    }));
  };

  const totalAmount = form.rooms.reduce(
    (sum, room) => sum + parseFloat(room.rate || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.guestName || !form.arrival || !form.departure) {
      alert('Please fill required guest details');
      return;
    }

    if (form.source === 'OTA' && !form.bookingId.trim()) {
      alert('Booking ID required for OTA');
      return;
    }

    const selectedRooms = form.rooms.map(r => r.roomName);

    if (selectedRooms.includes('')) {
      alert('Please select all room numbers');
      return;
    }

    if (new Set(selectedRooms).size !== selectedRooms.length) {
      alert('Same room cannot be assigned twice');
      return;
    }

    const duplicateBookingId =
      form.bookingId &&
      bookings.some(
        b =>
          b.bookingId?.toUpperCase() ===
          form.bookingId.toUpperCase()
      );

    if (duplicateBookingId) {
      alert('Duplicate Booking ID not allowed');
      return;
    }

    onSave({
      ...form,
      id: `b${Date.now()}`,
      isMultiRoom: true,
      totalAmount,
      status: 'confirmed',
      timestamp: new Date().toISOString()
    });

    alert('Multi room reservation saved');

    setForm({
      guestName: '',
      phone: '',
      email: '',
      arrival: '',
      departure: '',
      source: 'direct',
      otaPlatform: '',
      bookingId: '',
      agentName: '',
      tags: [],
      rooms: [
        {
          id: Date.now(),
          roomCategory: '',
          roomName: '',
          occupancy: 1,
          extraPersons: 0,
          rate: 0
        }
      ]
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>
        🏨 Multi Room Reservation
      </h2>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 16,
            marginBottom: 20
          }}
        >
          <Field label="Guest Name" required>
            <input
              value={form.guestName}
              onChange={(e) =>
                setForm(p => ({
                  ...p,
                  guestName: e.target.value
                }))
              }
              style={inp}
            />
          </Field>

          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) =>
                setForm(p => ({
                  ...p,
                  phone: e.target.value
                }))
              }
              style={inp}
            />
          </Field>

          <Field label="Check-In" required>
            <input
              type="date"
              value={form.arrival}
              onChange={(e) =>
                setForm(p => ({
                  ...p,
                  arrival: e.target.value
                }))
              }
              style={inp}
            />
          </Field>

          <Field label="Check-Out" required>
            <input
              type="date"
              value={form.departure}
              onChange={(e) =>
                setForm(p => ({
                  ...p,
                  departure: e.target.value
                }))
              }
              style={inp}
            />
          </Field>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 16,
            marginBottom: 24
          }}
        >
          <Field label="Booking Source">
            <select
              value={form.source}
              onChange={(e) =>
                setForm(p => ({
                  ...p,
                  source: e.target.value
                }))
              }
              style={inp}
            >
              <option value="direct">Direct</option>
              <option value="OTA">OTA</option>
              <option value="agent">Travel Agent</option>
              <option value="walkin">Walk-in</option>
            </select>
          </Field>

          {form.source === 'OTA' && (
            <>
              <Field label="OTA Platform">
                <select
                  value={form.otaPlatform}
                  onChange={(e) =>
                    setForm(p => ({
                      ...p,
                      otaPlatform: e.target.value
                    }))
                  }
                  style={inp}
                >
                  <option value="">Select OTA</option>
                  {(thirdParties.length
                    ? thirdParties.map(p => p.name)
                    : OTA_PLATFORMS
                  ).map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>

              <Field label="Booking ID / Reservation Reference" required>
                <input
                  value={form.bookingId}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (/^[A-Z0-9]*$/.test(value)) {
                      setForm(p => ({
                        ...p,
                        bookingId: value
                      }));
                    }
                  }}
                  placeholder="Enter Booking ID"
                  style={inp}
                />
              </Field>
            </>
          )}
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 20
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 20
            }}
          >
            <h3>Room Allocation</h3>

            <button
              type="button"
              onClick={addRoom}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                background: '#1565c0',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              + Add Room
            </button>
          </div>

          {form.rooms.map((room, idx) => (
            <div
              key={room.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}
              >
                <strong>Room {idx + 1}</strong>

                <button
                  type="button"
                  onClick={() => removeRoom(room.id)}
                  style={{
                    border: 'none',
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr 1fr 1fr 1fr',
                  gap: 14
                }}
              >
                <Field label="Room Type">
                  <select
                    value={room.roomCategory}
                    onChange={(e) =>
                      updateRoom(
                        room.id,
                        'roomCategory',
                        e.target.value
                      )
                    }
                    style={inp}
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categoryColors).map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Room Number">
                  <select
                    value={room.roomName}
                    onChange={(e) =>
                      updateRoom(
                        room.id,
                        'roomName',
                        e.target.value
                      )
                    }
                    style={inp}
                  >
                    <option value="">Select Room</option>
                    {availableRoomsByCategory(
  room.roomCategory,
  room.id
).map(r => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Occupancy">
                  <input
                    type="number"
                    min="1"
                    value={room.occupancy}
                    onChange={(e) =>
                      updateRoom(
                        room.id,
                        'occupancy',
                        e.target.value
                      )
                    }
                    style={inp}
                  />
                </Field>

                <Field label="Extra Persons">
                  <input
                    type="number"
                    min="0"
                    value={room.extraPersons}
                    onChange={(e) =>
                      updateRoom(
                        room.id,
                        'extraPersons',
                        e.target.value
                      )
                    }
                    style={inp}
                  />
                </Field>

                <Field label="Room Rate">
                  <input
                    type="number"
                    min="0"
                    value={room.rate}
                    onChange={(e) =>
                      updateRoom(
                        room.id,
                        'rate',
                        e.target.value
                      )
                    }
                    style={inp}
                  />
                </Field>

                
              </div>
            </div>
          ))}

          <div
            style={{
              textAlign: 'right',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            Total: ₹{totalAmount}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            type="submit"
            style={{
              padding: '10px 28px',
              border: 'none',
              borderRadius: 6,
              background: '#1e8449',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Save Multi Room Reservation
          </button>
        </div>
      </form>
    </div>
  );
}

export default MultiRoomReservationPage;