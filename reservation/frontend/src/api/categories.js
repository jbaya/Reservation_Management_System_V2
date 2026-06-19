import { BASE, get, post, put, del } from './client.js';

export const getCategories  = ()                              => get(`${BASE}/categories`);
export const saveCategory   = (category, num_rooms, color, floor = '1') => post(`${BASE}/categories`, { category, num_rooms, color, floor });
export const updateCategory = (id, category, num_rooms, color, floor = '1') => put(`${BASE}/categories/${id}`, { category, num_rooms, color, floor });
export const deleteCategory = (id)                           => del(`${BASE}/categories/${id}`);
