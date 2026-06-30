import * as productService from '../services/product.service.js';
import { AuditLog } from '../models/audit.model.js';

export const create = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user._id);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'PRODUCT_CREATED',
      module: 'Products',
      details: { productId: product._id, sku: product.sku },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully.',
      data: { product }
    });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await productService.queryProducts(req.query);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body, req.user._id);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'PRODUCT_UPDATED',
      module: 'Products',
      details: { productId: product._id, sku: product.sku },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully.',
      data: { product }
    });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.deleteProduct(id);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'PRODUCT_DELETED',
      module: 'Products',
      details: { productId: product._id, sku: product.sku },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
