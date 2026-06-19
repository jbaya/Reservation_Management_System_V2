import { Router } from 'express';
import * as controller from '../controllers/thirdPartyController.js';
import { validateBody } from '../validation/validate.js';
import { partnerSchema } from '../validation/partnerValidation.js';

const router = Router();

router.get('/', controller.list);
router.post('/', validateBody(partnerSchema), controller.create);
router.put('/:id', validateBody(partnerSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
