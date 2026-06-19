import { BASE, get, post, put, del, authHeaders, handleUnauthorized } from './client.js';

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
  if (res.status === 401) { handleUnauthorized(); throw new Error('Session expired'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update room');
  return data;
};
