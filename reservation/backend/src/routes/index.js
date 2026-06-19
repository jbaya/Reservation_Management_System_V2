import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

import authRoutes from './auth.routes.js';
import designationsRoutes from './designations.routes.js';
import usersRoutes from './users.routes.js';
import floorsRoutes from './floors.routes.js';
import categoriesRoutes from './categories.routes.js';
import roomsRoutes from './rooms.routes.js';
import seasonsRoutes from './seasons.routes.js';
import agentsRoutes from './agents.routes.js';
import thirdPartiesRoutes from './thirdParties.routes.js';
import ratesRoutes from './rates.routes.js';
import specialDatesRoutes from './specialDates.routes.js';
import bookingsRoutes from './bookings.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'OK' }));

// Public
router.use('/auth', authRoutes);

// Protected — every route below requires a valid JWT
router.use('/users/designations', requireAuth, designationsRoutes);
router.use('/users', requireAuth, usersRoutes);
router.use('/floors', requireAuth, floorsRoutes);
router.use('/categories', requireAuth, categoriesRoutes);
router.use('/rooms', requireAuth, roomsRoutes);
router.use('/seasons', requireAuth, seasonsRoutes);
router.use('/agents', requireAuth, agentsRoutes);
router.use('/third-parties', requireAuth, thirdPartiesRoutes);
router.use('/rates', requireAuth, ratesRoutes);
router.use('/special-dates', requireAuth, specialDatesRoutes);
router.use('/bookings', requireAuth, bookingsRoutes);

export default router;
