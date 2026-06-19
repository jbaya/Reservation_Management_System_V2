import { Router } from 'express';
import * as controller from '../controllers/roomController.js';
import { validateBody } from '../validation/validate.js';
import { roomSchema, renameCategorySchema } from '../validation/roomValidation.js';

const router = Router();

// Specific routes must be registered before the generic /:id route.
router.get('/all-room-numbers', controller.allRoomNumbers);
router.put('/rename-category', validateBody(renameCategorySchema), controller.renameCategoryAssignment);

router.get('/', controller.list);
router.post('/', validateBody(roomSchema), controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
