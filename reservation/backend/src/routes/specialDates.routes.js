import { Router } from 'express';
import * as controller from '../controllers/specialDateController.js';
import { validateBody } from '../validation/validate.js';
import { specialDateSchema } from '../validation/specialDateValidation.js';

const router = Router();

router.get('/', controller.list);
router.post('/', validateBody(specialDateSchema), controller.create);
router.put('/:id', validateBody(specialDateSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
