import { Router } from 'express';
import * as controller from '../controllers/floorController.js';
import { validateBody } from '../validation/validate.js';
import { floorSchema } from '../validation/floorValidation.js';

const router = Router();

router.get('/', controller.list);
router.post('/', validateBody(floorSchema), controller.create);
router.put('/:id', validateBody(floorSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
