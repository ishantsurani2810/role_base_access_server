import express from 'express';
import Joi from 'joi';
import * as productController from '../controllers/product.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { protectRouter } from '../middlewares/authn.middleware.js';
import { checkPermission } from '../middlewares/authz.middleware.js';
import { MODULES } from '../constants/modules.js';
import { ACTIONS } from '../constants/permissions.js';

const router = express.Router();

const createProductSchema = Joi.object({
  name: Joi.string().min(3).required().trim(),
  sku: Joi.string().required().trim().uppercase(),
  description: Joi.string().allow('').optional().trim(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required()
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(3).optional().trim(),
  sku: Joi.string().optional().trim().uppercase(),
  description: Joi.string().allow('').optional().trim(),
  price: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).optional()
});

router.use(protectRouter);

router.get('/', checkPermission(MODULES.PRODUCTS, ACTIONS.READ), productController.list);
router.get('/:id', checkPermission(MODULES.PRODUCTS, ACTIONS.READ), productController.get);
router.post('/', checkPermission(MODULES.PRODUCTS, ACTIONS.CREATE), validateBody(createProductSchema), productController.create);
router.put('/:id', checkPermission(MODULES.PRODUCTS, ACTIONS.UPDATE), validateBody(updateProductSchema), productController.update);
router.delete('/:id', checkPermission(MODULES.PRODUCTS, ACTIONS.DELETE), productController.remove);

export default router;
