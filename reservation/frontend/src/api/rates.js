import { BASE, get, post, put, del } from './client.js';

export const getRates    = ()           => get(`${BASE}/rates`);
export const saveRate    = (rate)       => post(`${BASE}/rates`, rate);
export const updateRate  = (id, rate)   => put(`${BASE}/rates/${id}`, rate);
export const deleteRate  = (id)         => del(`${BASE}/rates/${id}`);
