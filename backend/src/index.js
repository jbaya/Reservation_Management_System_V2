import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import categoriesRouter   from './routes/categories.js';
import roomsRouter        from './routes/rooms.js';
import bookingsRouter     from './routes/bookings.js';
import agentsRouter       from './routes/agents.js';
import thirdPartiesRouter from './routes/thirdParties.js';
import seasonsRouter      from './routes/seasons.js';
import ratesRouter        from './routes/rates.js';
import floorsRoutes       from './routes/floors.js';
import specialDatesRouter from './routes/special-dates.js';   // ← ADD THIS

dotenv.config();
const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : '*',
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/categories',    categoriesRouter);
app.use('/api/rooms',         roomsRouter);
app.use('/api/bookings',      bookingsRouter);
app.use('/api/agents',        agentsRouter);
app.use('/api/third-parties', thirdPartiesRouter);
app.use('/api/seasons',       seasonsRouter);
app.use('/api/rates',         ratesRouter);
app.use('/api/floors',        floorsRoutes);
app.use('/api/special-dates', specialDatesRouter);            // ← ADD THIS

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend chal raha hai! 🎉' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));