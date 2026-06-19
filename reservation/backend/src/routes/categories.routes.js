import { Router } from 'express';
import * as controller from '../controllers/roomCategoryController.js';
import { validateBody } from '../validation/validate.js';
import { roomCategorySchema } from '../validation/roomCategoryValidation.js';

const router = Router();

router.get('/', controller.list);
router.post('/', validateBody(roomCategorySchema), controller.create);
router.put('/:id', validateBody(roomCategorySchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
