const BASE = 'http://localhost:3001/api';

export const getCategories = () =>
  fetch(`${BASE}/categories`).then(r => r.json());

export const saveCategory = (category, num_rooms, color) =>
  fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, num_rooms, color })
  }).then(r => r.json());

export const updateCategory = (id, category, num_rooms, color) =>
  fetch(`${BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, num_rooms, color })
  }).then(r => r.json());

export const deleteCategory = (id) =>
  fetch(`${BASE}/categories/${id}`, { method: 'DELETE' }).then(r => r.json());

export const getRooms = () =>
  fetch(`${BASE}/rooms`).then(r => r.json());

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

// ← NEW - rooms category rename karne ke liye
export const updateRoomCategory = (oldCategory, newCategory) =>
  fetch(`${BASE}/rooms/rename-category`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldCategory, newCategory })
  }).then(r => r.json());

  // Travel Agents
export const getAgents = () =>
  fetch(`${BASE}/agents`).then(r => r.json());

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