export const sampleBookings = [
  { id: 'b1', guestName: 'Amit Mistry', roomName: '104', status: 'confirmed', arrival: '2026-05-03', departure: '2026-05-07', mealPlan: 'MAP', paymentStatus: 'paid', numGuests: 2, phone: '9876543210', source: 'direct', totalAmount: 12000, paidAmount: 12000, balance: 0, tags: ['VIP'], comments: [] },
  { id: 'b2', guestName: 'Sanjay Mehta', roomName: '102', status: 'tentative', arrival: '2026-05-04', departure: '2026-05-08', mealPlan: 'EP', paymentStatus: 'due', numGuests: 1, phone: '9123456780', source: 'OTA', totalAmount: 8000, paidAmount: 0, balance: 8000, comments: [] },
  { id: 'b3', guestName: 'Priya Shah', roomName: '101', status: 'checked-in', arrival: '2026-05-01', departure: '2026-05-05', mealPlan: 'CP', paymentStatus: 'partial', numGuests: 2, source: 'agent', totalAmount: 10000, paidAmount: 5000, balance: 5000, tags: ['DND'], comments: [] },
];

export const initialRooms = [
  { name: '101', category: 'Heritage', floor: '1' },
  { name: '102', category: 'Heritage', floor: '1' },
  { name: '103', category: 'Heritage', floor: '1' },
  { name: '104', category: 'Heritage', floor: '1' },
  { name: '111', category: 'Royal Heritage', floor: '1' },
  { name: '112', category: 'Royal Heritage', floor: '1' },
  { name: '113', category: 'Royal Heritage', floor: '1' },
  { name: '121', category: 'Suite', floor: '2' },
  { name: '122', category: 'Suite', floor: '2' },
  { name: '123', category: 'Suite', floor: '2' },
];

export const initialThirdParties = [
  { id: 'tp1', name: 'Goibibo', company: 'GOIBIBO', mobile: '', email: '', gst: '' },
  { id: 'tp2', name: 'Make My Trip', company: 'MAKE MY TRIP', mobile: '', email: '', gst: '' },
  { id: 'tp3', name: 'Booking.com', company: 'BOOKING.COM', mobile: '', email: '', gst: '' },
  { id: 'tp4', name: 'Expedia', company: 'EXPEDIA', mobile: '', email: '', gst: '' },
  { id: 'tp5', name: 'Agoda', company: 'AGODA', mobile: '', email: '', gst: '' },
  { id: 'tp6', name: 'Airbnb', company: 'AIRBNB', mobile: '', email: '', gst: '' },
];