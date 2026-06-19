import { BASE, get, post, del } from './client.js';

export const getFloors   = ()       => get(`${BASE}/floors`);
export const saveFloor   = (floor)  => post(`${BASE}/floors`, floor);
export const deleteFloor = (id)     => del(`${BASE}/floors/${id}`);
