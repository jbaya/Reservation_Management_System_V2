import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import { validateBody } from '../validation/validate.js';
import { createUserSchema, updateUserSchema } from '../validation/userValidation.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.get('/', controller.list);
router.post('/', requireRole('admin'), validateBody(createUserSchema), controller.create);
router.put('/:id', requireRole('admin'), validateBody(updateUserSchema), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

export default router;
