import { BASE, get, post, put, del } from './client.js';

export const getSpecialDates    = ()          => get(`${BASE}/special-dates`);
export const saveSpecialDate    = (data)      => post(`${BASE}/special-dates`, data);
export const updateSpecialDate  = (id, data)  => put(`${BASE}/special-dates/${id}`, data);
export const deleteSpecialDate  = (id)        => del(`${BASE}/special-dates/${id}`);
