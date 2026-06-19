import { Router } from 'express';
import * as controller from '../controllers/bookingController.js';
import { validateBody } from '../validation/validate.js';
import { bookingSchema, commentSchema } from '../validation/bookingValidation.js';

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', validateBody(bookingSchema), controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/comments', validateBody(commentSchema), controller.addComment);

export default router;
