import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tenantMiddleware from './middleware/tenantMiddleware.js';
import reservationsRouter from './routes/reservations.js';
import hotelsRouter from './routes/hotels.js';
import roomsRouter from './routes/rooms.js';
import guestsRouter from './routes/guests.js';
import paymentsRouter from './routes/payments.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(tenantMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', tenant: req.tenantId || null });
});

app.use('/api/hotels', hotelsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/payments', paymentsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`RMS backend listening on http://localhost:${port}`);
});
