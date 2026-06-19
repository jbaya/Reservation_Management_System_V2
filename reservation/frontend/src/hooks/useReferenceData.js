import { useEffect, useState } from 'react';
import {
  getCategories, getRooms, getAgents, getThirdParties,
  getSeasons, getRates, getFloors, getSpecialDates,
} from '../api.js';
import { initialThirdParties } from '../constants/rooms.js';
import { sortRoomList } from '../utils/roomUtils.js';

/**
 * Loads every "reference" collection the app needs — categories/colors,
 * rooms, floors, travel agents, third parties, seasons, agent rates, and
 * special dates — once a user is logged in. Exposes both the data and the
 * raw setters so booking/category/room actions elsewhere can update state
 * after a save without re-fetching everything.
 */
export function useReferenceData(loggedUser) {
  const [travelAgents, setTravelAgents] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [travelAgentRates, setTravelAgentRates] = useState([]);
  const [thirdParties, setThirdParties] = useState(initialThirdParties);
  const [rooms, setRooms] = useState([]);
  const [categoryColors, setCategoryColors] = useState({});
  const [floors, setFloors] = useState([]);
  const [specialDates, setSpecialDates] = useState([]);

  // Re-sort rooms whenever the list length changes (e.g. add/delete).
  useEffect(() => {
    setRooms(prev => {
      const sorted = sortRoomList(prev);
      const same = sorted.every((r, i) => r.name === prev[i]?.name);
      return same ? prev : sorted;
    });
  }, [rooms.length]);

  // Load all data — only when user is logged in
  useEffect(() => {
    if (!loggedUser) return;

    getCategories().then(rows => {
      if (Array.isArray(rows) && rows.length > 0) {
        const colors = {};
        rows.forEach(row => {
          const hex = row.color || '#1565c0';
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          colors[row.category] = {
            bg: `rgba(${r}, ${g}, ${b}, 0.18)`,
            border: hex,
            num_rooms: row.num_rooms,
          };
        });
        setCategoryColors(colors);
      }
    }).catch(console.error);

    getRooms().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setRooms(sortRoomList(data));
      }
    }).catch(console.error);

    getAgents().then(data => {
      setTravelAgents(Array.isArray(data) ? data : []);
    }).catch(console.error);

    getThirdParties().then(data => {
      setThirdParties(Array.isArray(data) ? data : []);
    }).catch(console.error);

    getSeasons().then(data => {
      setSeasons(Array.isArray(data) ? data : []);
    }).catch(console.error);

    getRates().then(data => {
      setTravelAgentRates(Array.isArray(data) ? data : []);
    }).catch(console.error);

    getFloors().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setFloors(data.map(f => f.floorNo).sort((a, b) => a - b));
      }
    }).catch(console.error);

    getSpecialDates().then(data => {
      setSpecialDates(Array.isArray(data) ? data : []);
    }).catch(console.error);
  }, [loggedUser]);

  return {
    travelAgents, setTravelAgents,
    seasons, setSeasons,
    travelAgentRates, setTravelAgentRates,
    thirdParties, setThirdParties,
    rooms, setRooms,
    categoryColors, setCategoryColors,
    floors, setFloors,
    specialDates, setSpecialDates,
  };
}
