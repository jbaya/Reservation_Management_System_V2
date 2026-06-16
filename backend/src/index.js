import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';

import categoriesRouter   from './routes/categories.js';
import roomsRouter        from './routes/rooms.js';
import bookingsRouter     from './routes/bookings.js';
import agentsRouter       from './routes/agents.js';
import thirdPartiesRouter from './routes/thirdParties.js';
import seasonsRouter      from './routes/seasons.js';
import ratesRouter        from './routes/rates.js';
import floorsRoutes       from './routes/floors.js';
import specialDatesRouter from './routes/special-dates.js';
import authRouter         from './routes/auth.js';
import usersRouter        from './routes/users.js';

dotenv.config();

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());

app.use('/api/categories',    categoriesRouter);
app.use('/api/rooms',         roomsRouter);
app.use('/api/bookings',      bookingsRouter);
app.use('/api/agents',        agentsRouter);
app.use('/api/third-parties', thirdPartiesRouter);
app.use('/api/seasons',       seasonsRouter);
app.use('/api/rates',         ratesRouter);
app.use('/api/floors',        floorsRoutes);
app.use('/api/special-dates', specialDatesRouter);
app.use('/api/auth',          authRouter);
app.use('/api/users',         usersRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT);