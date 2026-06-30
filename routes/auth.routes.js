import express from 'express';
import Joi from 'joi';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { protectRouter } from '../middlewares/authn.middleware.js';

const router = express.Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional()
});

router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protectRouter, authController.getMe);

export default router;
