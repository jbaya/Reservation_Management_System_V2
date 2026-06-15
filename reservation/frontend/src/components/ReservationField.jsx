function ReservationField({ label, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        style={{
          fontSize: '0.8rem',
          color: '#444',
          fontWeight: 600,
          marginBottom: 4,
          display: 'block',
        }}
      >
        {label}
        {required && <span style={{ color: 'red' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default ReservationField;