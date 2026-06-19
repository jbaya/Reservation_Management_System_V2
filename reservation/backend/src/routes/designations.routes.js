import { Router } from 'express';
import * as controller from '../controllers/designationController.js';
import { validateBody } from '../validation/validate.js';
import { designationSchema } from '../validation/designationValidation.js';

const router = Router();

router.get('/', controller.list);
router.post('/', validateBody(designationSchema), controller.create);
router.delete('/:id', controller.remove);

export default router;
