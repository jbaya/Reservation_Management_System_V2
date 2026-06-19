import { Router } from 'express';
import * as controller from '../controllers/travelAgentRateController.js';
import { validateBody } from '../validation/validate.js';
import { rateSchema } from '../validation/rateValidation.js';

const router = Router();

router.get('/', controller.list);
router.post('/', validateBody(rateSchema), controller.create);
router.put('/:id', validateBody(rateSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
