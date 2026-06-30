import express from 'express';
import Joi from 'joi';
import * as invitationController from '../controllers/invitation.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { protectRouter } from '../middlewares/authn.middleware.js';
import { checkPermission } from '../middlewares/authz.middleware.js';
import { MODULES } from '../constants/modules.js';
import { ACTIONS } from '../constants/permissions.js';

const router = express.Router();

const inviteSchema = Joi.object({
  name: Joi.string().required().min(2).trim(),
  email: Joi.string().email().required().trim().lowercase(),
  roleId: Joi.string().hex().length(24).required(),
  permissions: Joi.array().items(
    Joi.object({
      module: Joi.string().required(),
      actions: Joi.array().items(Joi.string()).required()
    })
  ).optional()
});

const acceptSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters, contain one uppercase letter, one lowercase letter, one number, and one special character.'
    })
});

// Secure Admin pipelines
router.post('/', protectRouter, checkPermission(MODULES.INVITATIONS, ACTIONS.CREATE), validateBody(inviteSchema), invitationController.create);
router.get('/pending', protectRouter, checkPermission(MODULES.USERS, ACTIONS.READ), invitationController.listAllPending);
router.post('/:id/resend', protectRouter, checkPermission(MODULES.INVITATIONS, ACTIONS.CREATE), invitationController.resend);
router.delete('/:id', protectRouter, checkPermission(MODULES.INVITATIONS, ACTIONS.DELETE), invitationController.cancel);

// Public verification pipelines
router.get('/validate', invitationController.validate);
router.post('/accept', validateBody(acceptSchema), invitationController.accept);

export default router;
