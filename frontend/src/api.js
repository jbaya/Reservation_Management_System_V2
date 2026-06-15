const BASE = 'http://localhost:3001/api';

export const getCategories = () =>
  fetch(`${BASE}/categories`).then(r => r.json());

export const saveCategory = (category, num_rooms, color, floor = '1') =>
  fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, num_rooms, color, floor })
  }).then(r => r.json());

  export const updateCategory = (id, category, num_rooms, color, floor = '1') =>
  fetch(`${BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, num_rooms, color, floor })
  }).then(r => r.json());



export const deleteCategory = (id) =>
  fetch(`${BASE}/categories/${id}`, { method: 'DELETE' }).then(r => r.json());

export const getRooms = () =>
  fetch(`${BASE}/rooms`).then(r => r.json());

export const getBookings = () =>
  fetch(`${BASE}/bookings`).then(r => r.json());

export const getAllRoomNumbers = () =>
  fetch(`${BASE}/rooms/all-room-numbers`)
    .then(r => r.json());

export const saveRoom = (room) =>
  fetch(`${BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room)
  }).then(r => r.json());

export const deleteRoom = (name) =>
  fetch(`${BASE}/rooms/${name}`, { method: 'DELETE' }).then(r => r.json());

export const updateRoom = async (roomNo, room) => {

  const res = await fetch(
    `${BASE}/rooms/${roomNo}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(room)
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error || 'Failed to update room'
    );
  }

  return data;
};

// ← NEW - rooms category rename karne ke liye
// Replace existing updateRoomCategory
export const updateRoomCategory = (oldCategory, newCategory, floor) =>
  fetch(`${BASE}/rooms/rename-category`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldCategory, newCategory, floor })
  }).then(r => r.json());

  // Travel Agents
export const getAgents = () =>
  fetch(`${BASE}/agents`).then(r => r.json());

export const updateAgent = (id, agent) =>
  fetch(`${BASE}/agents/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(agent)
  }).then(r => r.json());

export const saveAgent = (agent) =>
  fetch(`${BASE}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent)
  }).then(r => r.json());

export const deleteAgent = (id) =>
  fetch(`${BASE}/agents/${id}`, {
    method: 'DELETE'
  }).then(r => r.json());

// Third Parties
export const getThirdParties = () =>
  fetch(`${BASE}/third-parties`).then(r => r.json());

export const updateThirdParty = (id, tp) =>
  fetch(`${BASE}/third-parties/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tp)
  }).then(r => r.json());

export const saveThirdParty = (tp) =>
  fetch(`${BASE}/third-parties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tp)
  }).then(r => r.json());

export const deleteThirdParty = (id) =>
  fetch(`${BASE}/third-parties/${id}`, {
    method: 'DELETE'
  }).then(r => r.json());

  // Seasons
export const getSeasons = () =>
  fetch(`${BASE}/seasons`)
    .then(r => r.json());

export const saveSeason = (season) =>
  fetch(`${BASE}/seasons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(season)
  }).then(r => r.json());

export const updateSeason = (id, season) =>
  fetch(`${BASE}/seasons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(season)
  }).then(r => r.json());

export const deleteSeason = (id) =>
  fetch(`${BASE}/seasons/${id}`, {
    method: 'DELETE'
  }).then(r => r.json());

  // Travel Agent Rates

export const getRates = () =>
  fetch(`${BASE}/rates`).then(r => r.json());

export const saveRate = (rate) =>
  fetch(`${BASE}/rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rate)
  }).then(r => r.json());

export const updateRate = (id, rate) =>
  fetch(`${BASE}/rates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rate)
  }).then(r => r.json());

export const deleteRate = (id) =>
  fetch(`${BASE}/rates/${id}`, {
    method: 'DELETE'
  }).then(r => r.json());

  export async function getFloors() {
  const res = await fetch('http://localhost:3001/api/floors');
  return await res.json();
}

export async function saveFloor(floor) {
  const res = await fetch(
    'http://localhost:3001/api/floors',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(floor)
    }
  );

  return await res.json();
}

export async function deleteFloor(id) {
  await fetch(
    `http://localhost:3001/api/floors/${id}`,
    {
      method: 'DELETE'
    }
  );
}

export async function updateBooking(id, data) {

  const response = await fetch(
    `http://localhost:3001/api/bookings/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  );

  const text = await response.text();

  console.log('UPDATE RESPONSE =>', text);

  return text ? JSON.parse(text) : {};
}

export const saveBooking = (booking) =>
  fetch(`${BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(booking)
  }).then(r => r.json());

  // Add this new export to api.js
export const updateRoomFloor = (roomNo, floor) =>
  fetch(`${BASE}/rooms/${roomNo}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomNo,          // room_no stays the same
      category: null,  // will be merged server-side — see rooms.js fix below
      floor,
      _floorOnlyUpdate: true   // flag so backend knows
    })
  }).then(r => r.json());

  // ── Special Dates ─────────────────────────────────────────────────────────────
export const getSpecialDates = () =>
  fetch(`${BASE}/special-dates`).then(r => r.json());

export const saveSpecialDate = (data) =>
  fetch(`${BASE}/special-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

export const updateSpecialDate = (id, data) =>
  fetch(`${BASE}/special-dates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

export const deleteSpecialDate = (id) =>
  fetch(`${BASE}/special-dates/${id}`, {
    method: 'DELETE'
  }).then(r => r.json());

  // ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser = (username, password, userType) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, userType })
  }).then(r => r.json());

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = () =>
  fetch(`${BASE}/users`).then(r => r.json());

export const saveUser = (user) =>
  fetch(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).then(r => r.json());

export const updateUser = (id, user) =>
  fetch(`${BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).then(r => r.json());

export const deleteUser = (id) =>
  fetch(`${BASE}/users/${id}`, { method: 'DELETE' }).then(r => r.json());

// ── Designations ──────────────────────────────────────────────────────────────
export const getDesignations = () =>
  fetch(`${BASE}/users/designations`).then(r => r.json());

export const saveDesignation = (name) =>
  fetch(`${BASE}/users/designations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(r => r.json());

export const deleteDesignation = (id) =>
  fetch(`${BASE}/users/designations/${id}`, {
    method: 'DELETE'
  }).then(r => r.json());