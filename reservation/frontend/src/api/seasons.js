import { BASE, get, post, put, del } from './client.js';

export const getSeasons    = ()             => get(`${BASE}/seasons`);
export const saveSeason    = (season)       => post(`${BASE}/seasons`, season);
export const updateSeason  = (id, season)   => put(`${BASE}/seasons/${id}`, season);
export const deleteSeason  = (id)           => del(`${BASE}/seasons/${id}`);
