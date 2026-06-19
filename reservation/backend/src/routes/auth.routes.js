import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateBody } from '../validation/validate.js';
import { loginSchema } from '../validation/authValidation.js';

const router = Router();

router.post('/login', validateBody(loginSchema), authController.login);

export default router;
