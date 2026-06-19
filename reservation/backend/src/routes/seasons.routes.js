import { Router } from 'express';
import * as controller from '../controllers/seasonController.js';
import { validateBody } from '../validation/validate.js';
import { seasonSchema } from '../validation/seasonValidation.js';

const router = Router();

router.get('/', controller.list);
router.post('/', validateBody(seasonSchema), controller.create);
router.put('/:id', validateBody(seasonSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
