import { BASE, get, post, put, del } from './client.js';

export const getUsers    = ()         => get(`${BASE}/users`);
export const saveUser    = (user)     => post(`${BASE}/users`, user);
export const updateUser  = (id, user) => put(`${BASE}/users/${id}`, user);
export const deleteUser  = (id)       => del(`${BASE}/users/${id}`);
