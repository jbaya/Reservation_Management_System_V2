import React, { useMemo } from 'react';
import { startOfMonth, getDaysInMonth, addDays, format } from 'date-fns';

function CategoryMonthlySummary({ rooms, bookings, selectedDate, categoryColors }) {
  const summaryData = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const daysInMonth = getDaysInMonth(selectedDate);

    // Build array of all days in the month
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i));

    const categoryMap = {};

    rooms.forEach(room => {
      if (!categoryMap[room.category]) {
        categoryMap[room.category] = {
          category: room.category,
          totalRooms: 0,
          occupiedNights: 0,
          totalNights: 0,
        };
      }
      categoryMap[room.category].totalRooms++;
      categoryMap[room.category].totalNights += daysInMonth;

      // Count how many days this room is occupied this month
      monthDays.forEach(day => {
        const d = new Date(format(day, 'yyyy-MM-dd'));
        const isOccupied = bookings.some(b => {
          if (b.roomName !== room.name) return false;
          if (['cancelled', 'no-show'].includes(b.status)) return false;
          return new Date(b.arrival) <= d && new Date(b.departure) > d;
        });
        if (isOccupied) {
          categoryMap[room.category].occupiedNights++;
        }
      });
    });

    return Object.values(categoryMap).map(item => ({
      ...item,
      vacantNights: item.totalNights - item.occupiedNights,
    }));
  }, [rooms, bookings, selectedDate]);

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #ddd', padding: '10px 14px', overflowX: 'auto' }}>
      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 10, color: '#1a1a2e' }}>
        Category-wise Monthly Room Availability
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <thead>
          <tr style={{ background: '#f7f8fa' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Category</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Total Rooms</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Occupied Nights</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Vacant Nights</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map(item => {
            const color = categoryColors?.[item.category]?.border || '#1565c0';
            return (
              <tr key={item.category} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8, fontWeight: 700, color }}>{item.category}</td>
                <td style={{ padding: 8, textAlign: 'center' }}>{item.totalRooms}</td>
                <td style={{ padding: 8, textAlign: 'center', color: '#1e8449', fontWeight: 700 }}>
                  {item.occupiedNights}
                </td>
                <td style={{ padding: 8, textAlign: 'center', color: '#c0392b', fontWeight: 700 }}>
                  {item.vacantNights}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CategoryMonthlySummary;