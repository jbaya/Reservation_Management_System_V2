import { useCallback } from 'react';
import {
  getAllRoomNumbers, saveCategory, saveRoom, getCategories,
  updateCategory, updateRoomCategory, deleteRoom, deleteCategory, getRooms,
} from '../api.js';
import { AUTO_COLORS } from '../constants/colors.js';
import { sortRoomList } from '../utils/roomUtils.js';

/**
 * Category CRUD — add/edit/delete — including provisioning or repointing
 * the rooms that belong to a category. Exact port of the three handlers
 * from the original App.jsx (handleAddCategory/handleEditCategory/
 * handleDeleteCategory), unchanged in behaviour.
 */
export function useCategoryActions({ categoryColors, setCategoryColors, rooms, setRooms, bookings }) {
  const handleAddCategory = useCallback(async (name, roomCount, fromRoom = null, toRoom = null, floor = '1') => {
    const color = AUTO_COLORS[Object.keys(categoryColors).length % AUTO_COLORS.length];
    let newRooms = [];

    try {
      if (roomCount && !isNaN(roomCount) && roomCount > 0) {
        const allRoomNumbers = await getAllRoomNumbers();
        const existingNumbers = new Set(
          (Array.isArray(allRoomNumbers) ? allRoomNumbers : []).map(n => String(n))
        );

        if (fromRoom !== null && toRoom !== null) {
          for (let num = fromRoom; num <= toRoom; num++) {
            const rn = String(num);
            if (existingNumbers.has(rn)) {
              alert(`Room number ${rn} already exists. Choose a different range.`);
              return;
            }
            newRooms.push({ name: rn, category: name, floor });
          }
        } else {
          const parsedNumbers = [...existingNumbers]
            .map(n => parseInt(n, 10))
            .filter(n => !isNaN(n));
          let startNum = parsedNumbers.length > 0 ? Math.max(...parsedNumbers) + 1 : 101;

          for (let i = 0; i < roomCount; i++) {
            let rn = String(startNum + i);
            while (rooms.some(r => r.name === rn) || newRooms.some(r => r.name === rn)) {
              startNum++;
              rn = String(startNum + i);
            }
            newRooms.push({ name: rn, category: name, floor });
          }
        }
      }

      await saveCategory(name, roomCount || 0, color.border, floor);

      for (const room of newRooms) {
        await saveRoom(room);
      }

      setCategoryColors(prev => ({
        ...prev,
        [name]: { ...color, floor },
      }));
      if (newRooms.length > 0) {
        setRooms(sortRoomList([...rooms, ...newRooms]));
      }
    } catch (err) {
      console.error('❌ Save failed:', err);
      alert('Failed to save! Check console.');
    }
  }, [categoryColors, rooms, setCategoryColors, setRooms]);

  const handleEditCategory = useCallback(async (oldName, newName, newColor, newRoomCount, newFloor) => {
    if (oldName !== newName && categoryColors[newName] !== undefined) {
      alert('Category already exists');
      return;
    }

    const targetCount = parseInt(newRoomCount);
    if (isNaN(targetCount) || targetCount < 0) {
      alert('Invalid room count');
      return;
    }

    try {
      // 1. Update category in DB (name, count, color, floor)
      const allCats = await getCategories();
      const catRow = allCats.find(r => r.category === oldName);
      if (catRow) {
        await updateCategory(catRow.id, newName, targetCount, newColor, newFloor);
      }

      // 2. Rename category on rooms AND update their floor in one call
      if (oldName !== newName || newFloor) {
        await updateRoomCategory(oldName, newName, newFloor);
      }

      // 3. Current rooms for THIS category
      const currentRooms = rooms.filter(r => r.category === oldName || r.category === newName);
      const currentCount = currentRooms.length;

      // 4. ADD rooms if needed
      if (targetCount > currentCount) {
        const catRoomNumbers = currentRooms
          .map(r => parseInt(r.name, 10))
          .filter(n => !isNaN(n))
          .sort((a, b) => a - b);

        let nextNum = catRoomNumbers.length > 0 ? Math.max(...catRoomNumbers) + 1 : 101;
        const allRoomNames = new Set(rooms.map(r => r.name));

        for (let i = 0; i < targetCount - currentCount; i++) {
          while (allRoomNames.has(String(nextNum))) nextNum++;
          await saveRoom({
            name: String(nextNum),
            category: newName,
            floor: newFloor || '1',
          });
          allRoomNames.add(String(nextNum));
          nextNum++;
        }
      }

      // 5. DELETE rooms if needed
      if (targetCount < currentCount) {
        const roomsToRemove = currentRooms.slice(targetCount).map(r => r.name);
        const hasActive = roomsToRemove.some(rn =>
          bookings.some(b => b.roomName === rn && !['cancelled', 'no-show'].includes(b.status))
        );
        if (hasActive) {
          alert('Cannot reduce — some rooms have active bookings!');
          return;
        }
        for (const rn of roomsToRemove) {
          await deleteRoom(rn);
        }
      }

      // 6. Frontend categoryColors state
      const r = parseInt(newColor.slice(1, 3), 16);
      const g = parseInt(newColor.slice(3, 5), 16);
      const b = parseInt(newColor.slice(5, 7), 16);

      setCategoryColors(prev => {
        const updated = { ...prev };
        updated[newName] = {
          bg: `rgba(${r}, ${g}, ${b}, 0.18)`,
          border: newColor,
          num_rooms: targetCount,
          floor: newFloor,
        };
        if (oldName !== newName) delete updated[oldName];
        return updated;
      });

      // 7. Reload fresh rooms from DB — floor_no will now be correct
      const freshRooms = await getRooms();
      setRooms(sortRoomList(freshRooms));

      alert(`"${newName}" updated successfully`);
    } catch (err) {
      console.error('❌ Edit failed:', err);
      alert('Failed to update! Check console.');
    }
  }, [categoryColors, bookings, rooms, setCategoryColors, setRooms]);

  const handleDeleteCategory = useCallback(async (name) => {
    try {
      // active booking check
      const hasActiveBookings = bookings.some(
        b => rooms.some(r => r.category === name && r.name === b.roomName) &&
             !['cancelled', 'no-show'].includes(b.status)
      );

      if (hasActiveBookings) {
        alert('Cannot delete category with active bookings');
        return;
      }

      const allCats = await getCategories();
      const catRow = allCats.find(c => c.category === name);

      if (!catRow) {
        alert('Category not found');
        return;
      }

      const categoryRooms = rooms.filter(r => r.category === name);
      for (const room of categoryRooms) {
        await deleteRoom(room.name);
      }

      await deleteCategory(catRow.id);

      const freshRooms = await getRooms();
      const freshCategories = await getCategories();

      const colors = {};
      freshCategories.forEach(row => {
        const hex = row.color || '#1565c0';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        colors[row.category] = { bg: `rgba(${r}, ${g}, ${b}, 0.18)`, border: hex, num_rooms: row.num_rooms };
      });

      setCategoryColors(colors);
      setRooms(sortRoomList(freshRooms));

      alert(`"${name}" deleted successfully`);
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Failed to delete category');
    }
  }, [bookings, rooms, setCategoryColors, setRooms]);

  return { handleAddCategory, handleEditCategory, handleDeleteCategory };
}
