const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

// ── Auth token helper ─────────────────────────────────────────────────────────
const getToken = () => {
  try {
    const stored = localStorage.getItem('rms_loggedIn');
    return stored ? JSON.parse(stored).token : null;
  } catch {
    return null;
  }
};

const authHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const get  = (url) => fetch(url, { headers: authHeaders() }).then(r => r.json());
const del  = (url) => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(r => r.json());
const post = (url, body) => fetch(url, { method: 'POST',  headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json());
const put  = (url, body) => fetch(url, { method: 'PUT',   headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json());

// ── Auth (public — no token needed) ──────────────────────────────────────────
export const loginUser = (username, password, userType) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, userType }),
  }).then(r => r.json());

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories  = ()                              => get(`${BASE}/categories`);
export const saveCategory   = (category, num_rooms, color, floor = '1') => post(`${BASE}/categories`, { category, num_rooms, color, floor });
export const updateCategory = (id, category, num_rooms, color, floor = '1') => put(`${BASE}/categories/${id}`, { category, num_rooms, color, floor });
export const deleteCategory = (id)                           => del(`${BASE}/categories/${id}`);

// ── Rooms ─────────────────────────────────────────────────────────────────────
export const getRooms          = ()           => get(`${BASE}/rooms`);
export const getAllRoomNumbers  = ()           => get(`${BASE}/rooms/all-room-numbers`);
export const saveRoom          = (room)       => post(`${BASE}/rooms`, room);
export const deleteRoom        = (name)       => del(`${BASE}/rooms/${name}`);
export const updateRoomCategory = (oldCategory, newCategory, floor) =>
  put(`${BASE}/rooms/rename-category`, { oldCategory, newCategory, floor });
export const updateRoomFloor   = (roomNo, floor) =>
  put(`${BASE}/rooms/${roomNo}`, { roomNo, floor, _floorOnlyUpdate: true });

export const updateRoom = async (roomNo, room) => {
  const res = await fetch(`${BASE}/rooms/${roomNo}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(room),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update room');
  return data;
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const getBookings  = ()          => get(`${BASE}/bookings`);
export const saveBooking  = (booking)   => post(`${BASE}/bookings`, booking);
export const deleteBooking = (id)       => del(`${BASE}/bookings/${id}`);

export const updateBooking = async (id, data) => {
  const res = await fetch(`${BASE}/bookings/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

// ── Travel Agents ─────────────────────────────────────────────────────────────
export const getAgents    = ()        => get(`${BASE}/agents`);
export const saveAgent    = (agent)   => post(`${BASE}/agents`, agent);
export const updateAgent  = (id, agent) => put(`${BASE}/agents/${id}`, agent);
export const deleteAgent  = (id)      => del(`${BASE}/agents/${id}`);

// ── Third Parties ─────────────────────────────────────────────────────────────
export const getThirdParties    = ()      => get(`${BASE}/third-parties`);
export const saveThirdParty     = (tp)    => post(`${BASE}/third-parties`, tp);
export const updateThirdParty   = (id, tp) => put(`${BASE}/third-parties/${id}`, tp);
export const deleteThirdParty   = (id)    => del(`${BASE}/third-parties/${id}`);

// ── Seasons ───────────────────────────────────────────────────────────────────
export const getSeasons    = ()             => get(`${BASE}/seasons`);
export const saveSeason    = (season)       => post(`${BASE}/seasons`, season);
export const updateSeason  = (id, season)   => put(`${BASE}/seasons/${id}`, season);
export const deleteSeason  = (id)           => del(`${BASE}/seasons/${id}`);

// ── Travel Agent Rates ────────────────────────────────────────────────────────
export const getRates    = ()           => get(`${BASE}/rates`);
export const saveRate    = (rate)       => post(`${BASE}/rates`, rate);
export const updateRate  = (id, rate)   => put(`${BASE}/rates/${id}`, rate);
export const deleteRate  = (id)         => del(`${BASE}/rates/${id}`);

// ── Floors ────────────────────────────────────────────────────────────────────
export const getFloors   = ()       => get(`${BASE}/floors`);
export const saveFloor   = (floor)  => post(`${BASE}/floors`, floor);
export const deleteFloor = (id)     => del(`${BASE}/floors/${id}`);

// ── Special Dates ─────────────────────────────────────────────────────────────
export const getSpecialDates    = ()          => get(`${BASE}/special-dates`);
export const saveSpecialDate    = (data)      => post(`${BASE}/special-dates`, data);
export const updateSpecialDate  = (id, data)  => put(`${BASE}/special-dates/${id}`, data);
export const deleteSpecialDate  = (id)        => del(`${BASE}/special-dates/${id}`);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers    = ()         => get(`${BASE}/users`);
export const saveUser    = (user)     => post(`${BASE}/users`, user);
export const updateUser  = (id, user) => put(`${BASE}/users/${id}`, user);
export const deleteUser  = (id)       => del(`${BASE}/users/${id}`);

// ── Designations ──────────────────────────────────────────────────────────────
export const getDesignations    = ()      => get(`${BASE}/users/designations`);
export const saveDesignation    = (name)  => post(`${BASE}/users/designations`, { name });
export const deleteDesignation  = (id)    => del(`${BASE}/users/designations/${id}`);
