import {
  BedDouble, Building2, Hotel, Star, ClipboardList, Settings,
  UserCog, Users, CalendarDays, PlusCircle, ShieldAlert,
} from 'lucide-react';

// Sidebar accordion structure: top-level groups with their child pages.
// Pulled out of App.jsx since it's static configuration, not component logic.
export const sidebarMenus = [
  {
    key: 'room',
    label: 'Room Management',
    icon: <BedDouble size={16} />,
    children: [
      { key: 'room-category',    label: 'Room Category',   icon: <Building2 size={14} /> },
      { key: 'room-floor',       label: 'Floor',           icon: <Hotel size={14} /> },
      { key: 'room-no',          label: 'Room No.',        icon: <BedDouble size={14} /> },
      { key: 'special-dates',    label: 'Special Dates',   icon: <Star size={14} /> },
      { key: 'room-tariff',      label: 'View Tariff',     icon: <ClipboardList size={14} /> },
      { key: 'room-edit-tariff', label: 'Edit Tariff',     icon: <Settings size={14} /> },
    ],
  },
  {
    key: 'user-management',
    label: 'User Management',
    icon: <UserCog size={16} />,
    children: [
      { key: 'users', label: 'Users', icon: <Users size={14} /> },
    ],
  },
  {
    key: 'reservation',
    label: 'Reservation',
    icon: <CalendarDays size={16} />,
    children: [
      { key: 'new-reservation',       label: 'New Reservation',        icon: <PlusCircle size={14} /> },
      { key: 'view-reservation',      label: 'View Reservation',       icon: <ClipboardList size={14} /> },
      { key: 'cancel-list',           label: 'Cancel List',            icon: <ShieldAlert size={14} /> },
      { key: 'travel-agent',          label: 'Travel Agent',           icon: <Users size={14} /> },
      { key: 'season-config',         label: 'Season Configuration',   icon: <Settings size={14} /> },
      { key: 'travel-agent-rate',     label: 'Agent Rate Config',      icon: <Settings size={14} /> },
    ],
  },
];
