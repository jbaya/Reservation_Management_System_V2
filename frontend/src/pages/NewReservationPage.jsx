import { useState, useEffect, useCallback } from 'react';
import ReservationField from '../components/ReservationField';
import MultiRoomReservationPage from './MultiRoomReservationPage';
import { format, addDays } from 'date-fns';

// Local Field helper
function Field({ label, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.8rem', color: '#444', fontWeight: 600, marginBottom: 4, display: 'block' }}>
        {label}{required && <span style={{ color: 'red' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const OTA_PLATFORMS = ['Booking.com', 'MakeMyTrip', 'Agoda', 'Expedia', 'Goibibo', 'Airbnb', 'Yatra', 'Other OTA'];
function buildFormFromBooking(editingBooking) {

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';

    const d = new Date(dateValue);

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  };

  return {
    // Guest info
    guestName: editingBooking.guestName || '',
    phone: editingBooking.phone || '',
    email: editingBooking.email || '',
    nationality: editingBooking.nationality || '',

    // Dates
    arrival: formatDateForInput(editingBooking.arrival),
    departure: formatDateForInput(editingBooking.departure),

    arrivalTime: editingBooking.arrivalTime || '12:00',
    departureTime: editingBooking.departureTime || '10:00',

    // Room
    rooms: editingBooking.rooms?.length
      ? editingBooking.rooms
      : [
          {
            roomCategory: editingBooking.roomCategory || '',
            roomName: editingBooking.roomName || '',
            occupancy: editingBooking.numGuests || 1,
            extraPersons: 0,
            rate: editingBooking.baseRate || 0,
          },
        ],

    roomName: editingBooking.roomName || '',
    roomCategory: editingBooking.roomCategory || '',

    // Pax
    numGuests: editingBooking.numGuests || 1,
    numChildren: editingBooking.numChildren || 0,
    childrenAges: editingBooking.childrenAges || [],

    // Meal & Status
    mealPlan: editingBooking.mealPlan || 'EP',
    status: editingBooking.status || 'confirmed',

    // Booking source
    source: editingBooking.source || 'direct',
    otaPlatform: editingBooking.otaPlatform || '',
    bookingId: editingBooking.bookingId || '',
    agentName: editingBooking.agentName || '',

    // Rates
    baseRate: editingBooking.baseRate || '',
    extraChildCharge: editingBooking.extraChildCharge || 0,
    extraBed: editingBooking.extraBed || 'None',
    extraBedCharge: editingBooking.extraBedCharge || 0,

    // Billing
    discount: editingBooking.discount || 0,
    advanceParticulars: editingBooking.advanceParticulars || 0,
    advancePaymentType: editingBooking.advancePaymentType || 'None',
    paidAmount: editingBooking.paidAmount || 0,
    paymentStatus: editingBooking.paymentStatus || 'due',
    paymentMode: editingBooking.paymentMode || '',
    totalAmount: editingBooking.totalAmount || '',

    // Additional
    comments: editingBooking.comments || [],
    tags: editingBooking.tags || [],
    dnc:
      editingBooking.dnc ||
      editingBooking.tags?.includes('DNC') ||
      false,
  };
}

function buildEmptyForm() {
  return {
    guestName: '', phone: '', email: '', nationality: '',
    arrival: '', departure: '', arrivalTime: '12:00', departureTime: '10:00',
    numGuests: 1, numChildren: 0, childrenAges: [],
    rooms: [{ roomCategory: '', roomName: '', occupancy: 1, extraPersons: 0, rate: 0 }],
    mealPlan: 'EP', status: 'confirmed',
    source: 'direct', otaPlatform: '', bookingId: '', agentName: '',
    baseRate: '', extraChildCharge: 0,
    extraBed: 'None', extraBedCharge: 0,
    discount: 0,
    advanceParticulars: 0, advancePaymentType: 'None',
    paidAmount: 0, paymentStatus: 'due',
    paymentMode: '',
    comments: [], tags: [],
    dnc: false,
  };
}

function NewReservationPage({
  requestDncOverride,
  editingBooking,
  rooms,
  categoryColors,
  bookings,
  onSave,
  travelAgents = [],
  thirdParties = [],
  seasons = [],
  travelAgentRates = [],
}) {
  const [form, setForm] = useState(
    editingBooking ? buildFormFromBooking(editingBooking) : buildEmptyForm()
  );
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);

  // FIX: Re-initialize form when editingBooking prop changes (e.g. switching between bookings)
useEffect(() => {
  if (editingBooking) {
    if (editingBooking._prefill) {
      // Calendar cell click se aaya — sirf date + room prefill karo
      setForm({
        ...buildEmptyForm(),
        arrival: editingBooking.arrival || '',
        departure: editingBooking.departure || '',
        rooms: [{
          roomCategory: editingBooking.roomCategory || '',
          roomName: editingBooking.roomName || '',
          occupancy: 1,
          extraPersons: 0,
          rate: 0,
        }],
      });
    } else {
      // Normal edit — poori booking load karo
      setForm(buildFormFromBooking(editingBooking));
    }
  } else {
    setForm(buildEmptyForm());
  }
}, [editingBooking?.id, editingBooking?._prefill]);

  const handleChange = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleDncToggle = () => {
    setForm(prev => {
      const newDnc = !prev.dnc;
      let updatedTags = [...(prev.tags || [])];
      if (newDnc) {
        if (!updatedTags.includes('DNC')) updatedTags.push('DNC');
      } else {
        updatedTags = updatedTags.filter(tag => tag !== 'DNC');
      }
      return { ...prev, dnc: newDnc, tags: updatedTags };
    });
  };

  const addOrUpdateComment = () => {
    if (!newComment.trim()) { alert('Please enter a comment'); return; }
    if (newComment.length > 500) { alert('Comment cannot exceed 500 characters'); return; }
    const timestamp = new Date().toISOString();
    if (editingCommentId) {
      setForm(p => ({
        ...p,
        comments: (p.comments || []).map(comment =>
          comment.id === editingCommentId
            ? { ...comment, text: newComment, editedAt: timestamp }
            : comment
        ),
      }));
      setEditingCommentId(null);
    } else {
      setForm(p => ({
        ...p,
        comments: [
          ...(p.comments || []),
          { id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: newComment, createdAt: timestamp },
        ],
      }));
    }
    setNewComment('');
  };

  const editComment = (comment) => {
    setNewComment(comment.text);
    setEditingCommentId(comment.id);
  };

  const deleteComment = (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    setForm(p => ({ ...p, comments: (p.comments || []).filter(c => c.id !== commentId) }));
  };

  const handleChildrenCount = (e) => {
    const count = Math.max(0, parseInt(e.target.value) || 0);
    const newAges = Array.from({ length: count }, (_, i) => form.childrenAges?.[i] ?? '');
    setForm(p => ({ ...p, numChildren: count, childrenAges: newAges }));
  };

  const handleChildAge = (index, value) => {
    const newAges = [...(form.childrenAges || [])];
    newAges[index] = value;
    setForm(p => ({ ...p, childrenAges: newAges }));
  };

  const childrenAbove6 = (form.childrenAges || []).filter(a => !isNaN(parseInt(a)) && parseInt(a) > 6).length;

  // FIX: getSeasonForDate and autoApplyTravelAgentRate use useCallback and do NOT alert
  // during normal form filling — they return null silently if no match, and only alert
  // when explicitly triggered by a user action (agent/date/category selection).
  const getSeasonForDate = useCallback((date) => {
    if (!date) return null;
    return seasons.find(season => {
      const selected = new Date(date);
      const from = new Date(season.fromDate);
      const to = new Date(season.toDate);
      return selected >= from && selected <= to;
    }) || null;
  }, [seasons]);

  // FIX: silent = true means no alerts, used during normal form filling.
  // silent = false means show alerts, used only when user explicitly triggers (e.g. selects agent).
  const autoApplyTravelAgentRate = useCallback((agentName, roomCategory, arrivalDate, silent = true) => {
    if (!agentName || !roomCategory || !arrivalDate) return;

    const matchedSeason = getSeasonForDate(arrivalDate);
    if (!matchedSeason) {
      if (!silent) alert('No season configured for selected date');
      return;
    }

    const matchedRate = travelAgentRates.find(rate =>
      rate.agentName === agentName &&
      rate.roomCategory === roomCategory &&
      rate.seasonId === matchedSeason.id
    );

    if (!matchedRate) {
      if (!silent) alert('No predefined rates found for selected travel agent');
      return;
    }

    setForm(p => ({
      ...p,
      baseRate: matchedRate.roomRate,
      extraChildCharge: matchedRate.extraPersonRate,
    }));
  }, [getSeasonForDate, travelAgentRates]);

  // FIX: availableRooms now checks date overlap so double-booking is prevented.
  // It also excludes the booking being edited from the overlap check.
  const availableRooms = (() => {
    const categoryFiltered = form.rooms[0]?.roomCategory
      ? rooms.filter(r => r.category === form.rooms[0].roomCategory)
      : rooms;

    if (!form.arrival || !form.departure) return categoryFiltered;

    const arrival = new Date(form.arrival);
    const departure = new Date(form.departure);

    return categoryFiltered.filter(room => {
      const isBooked = bookings.some(b => {
        // Exclude the booking being edited from the overlap check
        if (editingBooking && b.id === editingBooking.id) return false;
        if (b.roomName !== room.name) return false;
        const bArrival = new Date(b.arrival);
        const bDeparture = new Date(b.departure);
        // Overlap if: arrival < bDeparture AND departure > bArrival
        return arrival < bDeparture && departure > bArrival;
      });
      return !isBooked;
    });
  })();

  const nights = form.arrival && form.departure
    ? Math.max(0, Math.round((new Date(form.departure) - new Date(form.arrival)) / 86400000))
    : 0;

  const baseTotal = parseFloat(form.baseRate || 0) * nights;
  const extraChild = parseFloat(form.extraChildCharge || 0) * childrenAbove6 * nights;
  const extraBedAmt = form.extraBed !== 'None' ? parseFloat(form.extraBedCharge || 0) * nights : 0;
  const subTotal = baseTotal + extraChild + extraBedAmt;
  const autoGst = parseFloat(form.baseRate || 0) > 7499 ? 12 : 5;
  const gstAmt = subTotal * (autoGst / 100);
  const totalCharges = (subTotal + gstAmt).toFixed(2);
  const discount = parseFloat(form.discount || 0);
  const netAmount = (parseFloat(totalCharges) - discount).toFixed(2);
  const duePayment = (parseFloat(netAmount) - parseFloat(form.advanceParticulars || 0)).toFixed(2);

  const isPaymentModeMandatory = form.source === 'direct' || form.source === 'agent';

  const handleSubmit = (e) => {
  e.preventDefault();

  try {
    // ════════════════════════════════════════════
    // ✅ BLOCK 1 — Date Validations
    // ════════════════════════════════════════════
    if (!form.arrival || !form.departure) {
      alert('❌ Check-In and Check-Out dates are required.');
      return;
    }

    const arrivalDate   = new Date(form.arrival);
    const departureDate = new Date(form.departure);
    const today         = new Date();
    today.setHours(0, 0, 0, 0);

    if (departureDate <= arrivalDate) {
      alert('❌ Check-Out date must be after Check-In date.\nNegative or zero nights are not allowed.');
      return;
    }

    const nightCount = Math.round((departureDate - arrivalDate) / 86400000);
    if (nightCount < 1) {
      alert('❌ Minimum stay is 1 night.');
      return;
    }

    if (nightCount > 365) {
      alert('❌ Maximum stay cannot exceed 365 nights.\nPlease verify the dates.');
      return;
    }

    if (arrivalDate < today && !editingBooking) {
      if (!window.confirm(`⚠️ Check-In date (${form.arrival}) is in the past.\nDo you want to continue?`)) {
        return;
      }
    }

    // ════════════════════════════════════════════
    // ✅ BLOCK 2 — Guest Count Validations
    // ════════════════════════════════════════════
    const numGuests = parseInt(form.numGuests);
    if (!numGuests || numGuests < 1) {
      alert('❌ Number of guests must be at least 1.');
      return;
    }

    if (numGuests > 20) {
      alert('❌ Guest count cannot exceed 20.\nFor groups, please use Multi-Room Reservation.');
      return;
    }

    const numChildren = parseInt(form.numChildren) || 0;
    if (numChildren < 0) {
      alert('❌ Number of children cannot be negative.');
      return;
    }

    // ════════════════════════════════════════════
    // ✅ BLOCK 3 — Rate & Billing Validations
    // ════════════════════════════════════════════
    const baseRate = parseFloat(form.baseRate);
    if (form.source !== 'OTA') {
      if (isNaN(baseRate) || baseRate < 0) {
        alert('❌ Room rate cannot be negative.');
        return;
      }
      if (baseRate === 0) {
        if (!window.confirm('⚠️ Room rate is ₹0.\nIs this a complimentary stay? Do you want to continue?')) {
          return;
        }
      }
    }

    const extraBedCharge = parseFloat(form.extraBedCharge) || 0;
    if (extraBedCharge < 0) {
      alert('❌ Extra bed charge cannot be negative.');
      return;
    }

    const extraChildCharge = parseFloat(form.extraChildCharge) || 0;
    if (extraChildCharge < 0) {
      alert('❌ Extra child charge cannot be negative.');
      return;
    }

    const discount = parseFloat(form.discount) || 0;
    if (discount < 0) {
      alert('❌ Discount cannot be negative.');
      return;
    }

    const advance = parseFloat(form.advanceParticulars) || 0;
    if (advance < 0) {
      alert('❌ Advance payment cannot be negative.');
      return;
    }

    const totalNum = parseFloat(totalCharges) || 0;
    if (advance > totalNum && totalNum > 0) {
      alert(`❌ Advance payment (₹${advance}) cannot exceed total charges (₹${totalNum}).`);
      return;
    }

    // ════════════════════════════════════════════
    // ✅ BLOCK 4 — Required Fields
    // ════════════════════════════════════════════
    if (
      !form.guestName?.trim() ||
      !form.rooms?.[0]?.roomName ||
      !form.nationality
    ) {
      alert('❌ Please fill all required fields:\n• Guest Name\n• Room\n• Nationality');
      return;
    }

    if (form.guestName.trim().length < 2) {
      alert('❌ Guest name must be at least 2 characters.');
      return;
    }

    if (form.phone && !/^[0-9+\-\s()]{7,15}$/.test(form.phone.trim())) {
      alert('❌ Please enter a valid phone number (7–15 digits).');
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      alert('❌ Please enter a valid email address.');
      return;
    }

    // ════════════════════════════════════════════
    // ✅ BLOCK 5 — Source-specific Validations
    // ════════════════════════════════════════════
    if (form.source === 'OTA' && !form.bookingId?.trim()) {
      alert('❌ Booking ID is required for OTA reservations.');
      return;
    }

    if (
      form.bookingId &&
      bookings.some(b =>
        b.id !== editingBooking?.id &&
        b.bookingId?.toUpperCase() === form.bookingId.toUpperCase()
      )
    ) {
      alert('❌ Duplicate Booking ID not allowed.\nThis ID already exists in the system.');
      return;
    }

    if (form.source === 'agent' && !form.agentName) {
      alert('❌ Please select a Travel Agent for agent bookings.');
      return;
    }

    // ════════════════════════════════════════════
    // ✅ BLOCK 6 — Payment Validations
    // ════════════════════════════════════════════
    if (advance > 0 && form.advancePaymentType === 'None') {
      alert('❌ Please select Advance Payment Type when advance amount is entered.');
      return;
    }

    if (isPaymentModeMandatory && !form.paymentMode) {
      alert('❌ Payment mode is required for Direct and Travel Agent bookings.');
      return;
    }

    // ════════════════════════════════════════════
    // ✅ BLOCK 7 — DNC Check
    // ════════════════════════════════════════════
    const originalRoom = editingBooking?.roomName || editingBooking?.rooms?.[0]?.roomName || '';
    const selectedRoom = form.rooms?.[0]?.roomName || '';

    if (
      (editingBooking?.dnc || editingBooking?.tags?.includes('DNC') || form.dnc) &&
      originalRoom &&
      originalRoom !== selectedRoom
    ) {
      requestDncOverride?.(
        editingBooking,
        { name: selectedRoom },
        () => {
          onSave({
            ...form,
            roomName: selectedRoom,
            roomCategory: form.rooms[0].roomCategory,
            totalAmount: netAmount,
            balance: duePayment,
            paymentStatus:
              parseFloat(duePayment) <= 0 ? 'paid'
              : parseFloat(form.advanceParticulars || 0) > 0 ? 'partial'
              : 'due',
            id: editingBooking?.id,
            timestamp: new Date().toISOString(),
            comments: form.comments || [],
            dnc: form.dnc,
          });
        }
      );
      return;
    }

    // ════════════════════════════════════════════
    // ✅ BLOCK 8 — Final Save
    // ════════════════════════════════════════════
    onSave({
      ...form,
      roomName: form.rooms[0].roomName,
      roomCategory: form.rooms[0].roomCategory,
      totalAmount: netAmount,
      balance: duePayment,
      paymentStatus:
        parseFloat(duePayment) <= 0 ? 'paid'
        : parseFloat(form.advanceParticulars || 0) > 0 ? 'partial'
        : 'due',
      id: editingBooking?.id || `b${Date.now()}`,
      timestamp: new Date().toISOString(),
      comments: form.comments || [],
      dnc: form.dnc,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setForm(p => ({
        ...p,
        guestName: '', phone: '', email: '',
        arrival: '', departure: '',
        roomName: '', roomCategory: '',
        agentName: '', otaPlatform: '', bookingId: '',
      }));
    }, 2000);

  } catch (err) {
    console.error('❌ Submit error:', err);
    alert('An error occurred while saving the booking.');
  }
};

  const inp = {
    padding: '7px 10px', borderRadius: 5, border: '1px solid #ccc',
    fontSize: '0.82rem', width: '100%', boxSizing: 'border-box',
    outline: 'none', background: '#fff', color: '#1a1a2e',
  };

  const dateInp = {
  padding: '6px 9px',
  borderRadius: 5,
  border: '1px solid #ccc',
  fontSize: '0.8rem',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
  color: '#1a1a2e',
  cursor: 'pointer',
  // Force calendar icon always visible
  colorScheme: 'light',
};

  if (success) return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
      <h2 style={{ color: '#1e8449', margin: '0 0 8px' }}>Reservation Saved!</h2>
      <p style={{ color: '#666', fontSize: '0.88rem' }}>
        <strong>{form.guestName}</strong> — Room {form.rooms[0]?.roomName}<br />
        {form.arrival} → {form.departure} ({nights} nights)
      </p>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100, fontFamily: 'inherit' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>📋 New Reservation</h2>

      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', marginBottom: 24 }}>
        {['single', 'multi'].map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', border: 'none',
              background: activeTab === tab ? '#fff' : '#f7f8fa',
              fontWeight: 700, color: activeTab === tab ? '#1565c0' : '#666',
              fontSize: '0.85rem',
              borderBottom: activeTab === tab ? '2px solid #1565c0' : '2px solid transparent',
              marginBottom: -2, cursor: 'pointer', borderRadius: '6px 6px 0 0',
            }}
          >
            {tab === 'single' ? 'New Reservation' : 'Multi Room Reservation'}
          </button>
        ))}
      </div>

      {/* FIX: Pass all required props including seasons, travelAgentRates, and requestDncOverride */}
      {activeTab === 'multi' && (
        <MultiRoomReservationPage
          rooms={rooms}
          categoryColors={categoryColors}
          bookings={bookings}
          onSave={onSave}
          travelAgents={travelAgents}
          thirdParties={thirdParties}
          seasons={seasons}
          travelAgentRates={travelAgentRates}
          requestDncOverride={requestDncOverride}
        />
      )}

     {activeTab === 'single' && (
  <form onSubmit={handleSubmit}>
    {/* Row 1: Dates + Pax */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
      <ReservationField label="Check-In Date" required>
        <input
  type="date"
  value={form.arrival}
  onChange={(e) => {
    const selectedDate = e.target.value;
    setForm(p => {
      const updated = { ...p, arrival: selectedDate };
      if (p.departure && p.departure <= selectedDate) {
        const nextDay = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
        updated.departure = nextDay;
      }
      return updated;
    });
    if (form.source === 'agent') {
      autoApplyTravelAgentRate(form.agentName, form.rooms[0].roomCategory, selectedDate, false);
    }
  }}
  style={{ ...inp, ...dateInp }}
  required
/>
      </ReservationField>
      <ReservationField label="Check-Out Date" required>
       {/* Check-Out Date */}
<input
  type="date"
  value={form.departure}
  min={form.arrival ? format(addDays(new Date(form.arrival), 1), 'yyyy-MM-dd') : ''}
  onChange={(e) => {
    const depDate = e.target.value;
    if (form.arrival && depDate <= form.arrival) {
      alert('❌ Check-Out must be after Check-In.');
      return;
    }
    setForm(p => ({ ...p, departure: depDate }));
  }}
  style={{ ...inp, ...dateInp }}
  required
/>
      </ReservationField>
      <ReservationField label="No. Of Pax" required>
        <input type="number" min="1" value={form.numGuests} onChange={handleChange('numGuests')}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} />
      </ReservationField>
      <ReservationField label="No. Of Child" required>
        <input type="number" min="0" value={form.numChildren} onChange={handleChildrenCount}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} />
      </ReservationField>
    </div>

    {/* Children ages */}
    {parseInt(form.numChildren) > 0 && (
      <div style={{ background: '#fff9f0', border: '1px solid #ffe0b2', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e65100', marginBottom: 8 }}>👶 Children Ages (years)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {(form.childrenAges || []).map((age, idx) => {
            const ageNum = parseInt(age);
            const above6 = !isNaN(ageNum) && ageNum > 6;
            return (
              <div key={idx}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.7rem', color: '#444', fontWeight: 600 }}>Child {idx + 1}</label>
                <input
                  type="number" min="0" max="17" value={age}
                  onChange={e => handleChildAge(idx, e.target.value)} placeholder="Age"
                  style={{ ...inp, padding: '4px 7px', fontSize: '0.75rem', border: above6 ? '1.5px solid #e67e22' : '1.5px solid #ccc' }}
                />
                {age !== '' && (
                  <div style={{ fontSize: '0.62rem', color: above6 ? '#e67e22' : '#27ae60', marginTop: 2, fontWeight: 600 }}>
                    {above6 ? '💰 Extra charge' : '✅ Free'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {childrenAbove6 > 0 && (
          <div style={{ marginTop: 8, background: '#fef5e7', border: '1px solid #f8c471', borderRadius: 5, padding: '5px 9px', fontSize: '0.7rem', color: '#d35400' }}>
            ⚠️ {childrenAbove6} child{childrenAbove6 > 1 ? 'ren' : ''} above 6 yrs — add extra charge in billing section below
          </div>
        )}
      </div>
    )}

    {/* Row 2: Room */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
      <Field label="Room Category" required>
        <select
          value={form.rooms[0].roomCategory}
          onChange={e => {
            const selectedCategory = e.target.value;
            setForm(p => ({ ...p, rooms: [{ ...p.rooms[0], roomCategory: selectedCategory, roomName: '' }] }));
            if (form.source === 'agent') {
              autoApplyTravelAgentRate(form.agentName, selectedCategory, form.arrival, false);
            }
          }}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }}
        >
          <option value="">--Select Category--</option>
          {Object.keys(categoryColors).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Room No." required>
        <select
          value={form.rooms[0].roomName}
          onChange={e => setForm(p => ({ ...p, rooms: [{ ...p.rooms[0], roomName: e.target.value }] }))}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }}
          required
        >
          <option value="">--Select Room--</option>
          {availableRooms.map(r => (
            <option key={r.name} value={r.name}>{r.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Breakfast">
        <select value={form.mealPlan} onChange={handleChange('mealPlan')}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }}>
          {['EP', 'CP', 'MAP', 'AP'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>

      <Field label="Status">
        <select value={form.status} onChange={handleChange('status')}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }}>
          {['inquiry', 'tentative', 'confirmed', 'checked-in'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>
    </div>

    {/* Row 3: Guest */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
      <Field label="Guest Name" required>
        <input value={form.guestName} onChange={handleChange('guestName')} placeholder="Guest name"
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} required />
      </Field>
      <Field label="Email">
        <input type="email" value={form.email} onChange={handleChange('email')} placeholder="Enter email"
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={handleChange('phone')} placeholder="+91 XXXXX"
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} />
      </Field>
      <Field label="Nationality" required>
        <select value={form.nationality} onChange={handleChange('nationality')}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} required>
          <option value="">--Select--</option>
          <option value="Indian">Indian</option>
          <option value="Foreigner">Foreigner</option>
        </select>
      </Field>
    </div>

    {/* Row 4: Booking Source + Tags */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
      <Field label="Booking Reference" required>
        <select value={form.source} onChange={handleChange('source')}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }}>
          {['direct', 'OTA', 'agent', 'walkin', 'corporate'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      {form.source === 'OTA' && <>
        <Field label="OTA Platform">
          <select value={form.otaPlatform} onChange={handleChange('otaPlatform')}
            style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }}>
            <option value="">--Select OTA--</option>
            {thirdParties.length > 0
              ? thirdParties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
              : OTA_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)
            }
          </select>
        </Field>
        <Field label="Booking ID" required>
          <input
            value={form.bookingId}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z0-9]*$/.test(value)) setForm(p => ({ ...p, bookingId: value }));
            }}
            placeholder="Booking ID"
            style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }}
            required
          />
        </Field>
      </>}

      {form.source === 'agent' && (
        <Field label="Travel Agent" required>
          <select
            value={form.agentName}
            onChange={(e) => {
              const selectedAgent = e.target.value;
              setForm(p => ({ ...p, agentName: selectedAgent }));
              autoApplyTravelAgentRate(selectedAgent, form.rooms[0].roomCategory, form.arrival, false);
            }}
            style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem', border: '1.5px solid #1565c0' }}
          >
            <option value="">--Select Agent--</option>
            {travelAgents.map(a => (
              <option key={a.id} value={a.name}>{a.name}{a.company ? ` (${a.company})` : ''}</option>
            ))}
          </select>
          {travelAgents.length === 0 && (
            <div style={{ fontSize: '0.67rem', color: '#e67e22', marginTop: 3 }}>
              ⚠️ No agents added yet
            </div>
          )}
        </Field>
      )}

      <Field label="Tags">
        <div style={{ display: 'flex', gap: 5, paddingTop: 3}}>
          {['VIP', 'DND', 'Honeymoon', 'Anniversary', 'Birthday', 'Corporate'].map(tag => {
            const isActive = form.tags?.includes(tag);
            return (
              <button key={tag} type="button"
                onClick={() => setForm(p => ({
                  ...p,
                  tags: p.tags?.includes(tag)
                    ? p.tags.filter(t => t !== tag)
                    : [...(p.tags || []), tag],
                }))}
                onMouseEnter={e => {
                  e.currentTarget.style.background = isActive ? '#cce0ff' : '#e8eaed';
                  e.currentTarget.style.borderColor = isActive ? '#0d47a1' : '#aaa';
                  e.currentTarget.style.transform = 'scale(1.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isActive ? '#e3f0ff' : '#f8f9fa';
                  e.currentTarget.style.borderColor = isActive ? '#1565c0' : '#ddd';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                  border: isActive ? '2px solid #1565c0' : '2px solid #ddd',
                  background: isActive ? '#e3f0ff' : '#f8f9fa',
                  color: isActive ? '#1565c0' : '#666',
                  transition: 'all 0.15s ease',
                }}>
                {tag}
              </button>
            );
          })}
        </div>
      </Field>
    </div>

          {/* DNC Toggle */}
          <div style={{
            marginTop: 18, padding: '14px 18px', borderRadius: 10,
            border: `1px solid ${form.dnc ? '#e74c3c' : '#ddd'}`,
            background: form.dnc ? '#fff5f5' : '#fafafa',
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
          }}>
            <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 28 }}>
              <input type="checkbox" checked={form.dnc} onChange={handleDncToggle} style={{ display: 'none' }} />
              <span style={{ position: 'absolute', inset: 0, background: form.dnc ? '#e74c3c' : '#bbb', borderRadius: 20, cursor: 'pointer', transition: '0.2s' }} />
              <span style={{ position: 'absolute', top: 4, left: form.dnc ? 28 : 4, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
            </label>
            <div>
              <div style={{ fontWeight: 700, color: form.dnc ? '#c0392b' : '#444', fontSize: '0.9rem' }}>
                🚫 DNC — Do Not Change
                {form.dnc && (
                  <span style={{ marginLeft: 8, background: '#e74c3c', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem' }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#777', marginTop: 4 }}>
                This room is DNC locked. Admin approval required for room changes.
              </div>
            </div>
          </div>

          {/* Row 5: Times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <Field label="Check-In Time" required>
              <input type="time" value={form.arrivalTime} onChange={handleChange('arrivalTime')} style={inp} />
            </Field>
            <Field label="Check-Out Time" required>
              <input type="time" value={form.departureTime} onChange={handleChange('departureTime')} style={inp} />
            </Field>
            <Field label="Extra Bed" required>
              <select value={form.extraBed} onChange={handleChange('extraBed')} style={inp}>
                {['None', '1', '2'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Extra Bed Charge" required>
              <input
                type="number" value={form.extraBedCharge} onChange={handleChange('extraBedCharge')}
                style={{ ...inp, background: form.extraBed === 'None' ? '#f5f5f5' : '#fff' }}
                disabled={form.extraBed === 'None'}
              />
            </Field>
          </div>

         {/* Row 6: Billing */}
<div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 7, padding: '12px 16px', marginBottom: 14 }}>
  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💰 Billing Details</div>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
    <Field label="Room Charges / Night (₹)" required>
      <input type="number" value={form.baseRate} onChange={handleChange('baseRate')}
        style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} placeholder="0" />
    </Field>
    {childrenAbove6 > 0 && (
      <Field label={`Extra Child/Night (${childrenAbove6} >6yr)`}>
        <input type="number" value={form.extraChildCharge} onChange={handleChange('extraChildCharge')}
          style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem', border: '1.5px solid #e67e22' }} placeholder="0" />
      </Field>
    )}
    <Field label="GST %">
      <input value={`${autoGst}% (auto)`}
        style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem', background: '#f0f7ff', fontWeight: 700, color: '#1565c0' }} readOnly />
    </Field>
    <Field label="Total Charges (₹)">
      <input value={totalCharges}
        style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem', background: '#f0f7ff', fontWeight: 700, color: '#1565c0' }} readOnly />
    </Field>
    <Field label="Discount (₹)">
      <input type="number" value={form.discount} onChange={handleChange('discount')}
        style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} placeholder="0" />
    </Field>
    <Field label="Net Amount (₹)">
      <input value={netAmount}
        style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem', background: '#f0fff4', fontWeight: 700, color: '#1e8449' }} readOnly />
    </Field>
    <Field label="Advance Payment (₹)">
      <input type="number" value={form.advanceParticulars} onChange={handleChange('advanceParticulars')}
        style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }} placeholder="0" />
    </Field>
    <Field label="Advance Payment Type" required={parseFloat(form.advanceParticulars || 0) > 0}>
      <select value={form.advancePaymentType} onChange={handleChange('advancePaymentType')}
        style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem' }}>
        {['None', 'Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </Field>
  </div>

  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, alignItems: 'center' }}>
    <Field label="Balance Due (₹)">
      <input
        value={duePayment}
        style={{
          ...inp, padding: '5px 8px', fontWeight: 800, fontSize: '0.88rem',
          background: parseFloat(duePayment) > 0 ? '#fff5f5' : '#f0fff4',
          color: parseFloat(duePayment) > 0 ? '#e74c3c' : '#27ae60',
        }}
        readOnly
      />
    </Field>
    {nights > 0 && (
      <div style={{ background: '#e3f0ff', border: '1px solid #90caf9', borderRadius: 5, padding: '6px 12px', fontSize: '0.72rem', color: '#1565c0', fontWeight: 600, marginTop: 18 }}>
        📅 {nights} night{nights > 1 ? 's' : ''} &nbsp;|&nbsp; Base: ₹{baseTotal.toFixed(0)}
        {extraChild > 0 && <> &nbsp;|&nbsp; Children: ₹{extraChild.toFixed(0)}</>}
        {extraBedAmt > 0 && <> &nbsp;|&nbsp; Extra Bed: ₹{extraBedAmt.toFixed(0)}</>}
        &nbsp;|&nbsp; GST ({autoGst}%): ₹{gstAmt.toFixed(0)}
      </div>
    )}
  </div>
</div>

{/* Row 7: Payment Mode */}
<div style={{ background: '#fff8f1', border: '1px solid #ffe4cc', borderRadius: 7, padding: '12px 16px', marginBottom: 14 }}>
  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d35400', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💳 Payment Mode</div>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, alignItems: 'end' }}>
    <Field label="Payment Mode" required={isPaymentModeMandatory}>
      <select
        value={form.paymentMode}
        onChange={handleChange('paymentMode')}
        style={{ ...inp, padding: '5px 8px', fontSize: '0.78rem', border: isPaymentModeMandatory && !form.paymentMode ? '1.5px solid #e74c3c' : '1px solid #ccc' }}
      >
        <option value="">--Select--</option>
        {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(mode => (
          <option key={mode} value={mode}>{mode}</option>
        ))}
      </select>
    </Field>
    {isPaymentModeMandatory && (
      <div style={{ background: '#fef5e7', border: '1px solid #f8c471', borderRadius: 5, padding: '6px 10px', fontSize: '0.7rem', color: '#d35400', fontWeight: 600, marginBottom: 2 }}>
        ⚠️ Mandatory for {form.source === 'direct' ? 'Direct' : form.source === 'agent' ? 'Travel Agent' : 'this'} bookings
      </div>
    )}
  </div>
</div>

{/* Row 8: Comments */}
<div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 7, padding: '12px 16px', marginBottom: 14 }}>
  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Comments / Special Notes</div>
  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
    <textarea
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      placeholder="Guest request, internal note, or booking remarks"
      maxLength={500}
      style={{ flex: 1, minHeight: 60, resize: 'vertical', padding: '6px 8px', borderRadius: 5, border: '1px solid #ccc', fontSize: '0.78rem', fontFamily: 'inherit' }}
    />
    <button
      type="button"
      onClick={addOrUpdateComment}
      style={{ padding: '7px 14px', border: 'none', borderRadius: 5, background: '#1565c0', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', alignSelf: 'flex-start' }}
    >
      {editingCommentId ? 'Update' : 'Add'}
    </button>
  </div>
  <div style={{ fontSize: '0.68rem', color: '#aaa', marginBottom: 8 }}>{newComment.length}/500</div>
  {(form.comments || []).length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 200, overflowY: 'auto' }}>
      {[...(form.comments || [])].slice().reverse().map(comment => (
        <div key={comment.id} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 5, padding: '7px 10px' }}>
          <div style={{ fontSize: '0.65rem', color: '#aaa', marginBottom: 4, fontWeight: 600 }}>
            {new Date(comment.editedAt || comment.createdAt).toLocaleString()}
            {comment.editedAt && ' (edited)'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#333', marginBottom: 6, whiteSpace: 'pre-wrap' }}>{comment.text}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => editComment(comment)}
              style={{ border: 'none', background: '#f1f8ff', color: '#1565c0', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600 }}>Edit</button>
            <button type="button" onClick={() => deleteComment(comment.id)}
              style={{ border: 'none', background: '#fff5f5', color: '#e74c3c', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

{/* Submit / Reset */}
<div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
  <button type="submit"
    style={{ padding: '8px 28px', border: 'none', borderRadius: 5, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
    Submit
  </button>
  <button type="reset"
    onClick={() => setForm(p => ({
      ...p,
      guestName: '', phone: '', email: '', arrival: '', departure: '',
      roomName: '', roomCategory: '', agentName: '', otaPlatform: '', bookingId: '', paymentMode: '',
    }))}
    style={{ padding: '8px 28px', border: '1px solid #ddd', borderRadius: 5, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#555' }}>
    Reset
  </button>
</div>
        </form>
      )}
    </div>
  );
}

export default NewReservationPage;