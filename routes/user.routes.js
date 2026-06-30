import express from 'express';
import Joi from 'joi';
import * as userController from '../controllers/user.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { protectRouter } from '../middlewares/authn.middleware.js';
import { checkPermission } from '../middlewares/authz.middleware.js';
import { MODULES } from '../constants/modules.js';
import { ACTIONS } from '../constants/permissions.js';

const router = express.Router();

const updateSchema = Joi.object({
  name: Joi.string().min(2).optional().trim(),
  roleId: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('Pending', 'Active', 'Disabled').optional(),
  permissions: Joi.array().items(
    Joi.object({
      module: Joi.string().required(),
      actions: Joi.array().items(Joi.string()).required()
    })
  ).optional()
});

router.use(protectRouter);

router.get('/', checkPermission(MODULES.USERS, ACTIONS.READ), userController.list);
router.get('/roles', userController.listRoles); // Available to authenticated administrators/managers
router.get('/:id', checkPermission(MODULES.USERS, ACTIONS.READ), userController.get);
router.put('/:id', checkPermission(MODULES.USERS, ACTIONS.UPDATE), validateBody(updateSchema), userController.update);
router.delete('/:id', checkPermission(MODULES.USERS, ACTIONS.DELETE), userController.remove);

export default router;
