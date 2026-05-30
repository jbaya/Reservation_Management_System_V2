import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import categoriesRouter  from './routes/categories.js';
import roomsRouter       from './routes/rooms.js';
import bookingsRouter    from './routes/bookings.js';
import agentsRouter      from './routes/agents.js';
import thirdPartiesRouter from './routes/thirdParties.js';
import seasonsRouter     from './routes/seasons.js';
import ratesRouter       from './routes/rates.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/categories',    categoriesRouter);
app.use('/api/rooms',         roomsRouter);
app.use('/api/bookings',      bookingsRouter);
app.use('/api/agents',        agentsRouter);
app.use('/api/third-parties', thirdPartiesRouter);
app.use('/api/seasons',       seasonsRouter);
app.use('/api/rates',         ratesRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend chal raha hai! 🎉' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));