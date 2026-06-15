import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
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
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

// ── CORS ─────────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : '*',
};
app.use(cors(corsOptions));
app.use(express.json());

// ── JWT Auth Middleware ───────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Public Routes (no auth required) ─────────────────────────
app.use('/api/auth', authRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend chal raha hai! 🎉' });
});

// ── Protected Routes (JWT required) ──────────────────────────
app.use('/api/categories',    requireAuth, categoriesRouter);
app.use('/api/rooms',         requireAuth, roomsRouter);
app.use('/api/bookings',      requireAuth, bookingsRouter);
app.use('/api/agents',        requireAuth, agentsRouter);
app.use('/api/third-parties', requireAuth, thirdPartiesRouter);
app.use('/api/seasons',       requireAuth, seasonsRouter);
app.use('/api/rates',         requireAuth, ratesRouter);
app.use('/api/floors',        requireAuth, floorsRoutes);
app.use('/api/special-dates', requireAuth, specialDatesRouter);
app.use('/api/users',         requireAuth, usersRouter);

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
