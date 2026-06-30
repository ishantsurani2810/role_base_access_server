import { Product } from '../models/product.model.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export const createProduct = async (productData, creatorId) => {
  const { name, sku, description, price, stock } = productData;

  // Verify SKU uniqueness manually for clear API feedback
  const existingProduct = await Product.findOne({ sku });
  if (existingProduct) {
    throw new ConflictError(`Product SKU '${sku}' already exists.`);
  }

  return await Product.create({
    name,
    sku,
    description,
    price,
    stock,
    createdBy: creatorId,
    updatedBy: creatorId
  });
};

export const queryProducts = async (queryParams) => {
  const { search, page = 1, limit = 10 } = queryParams;
  
  const filter = {};
  if (search) {
    // Basic regex search for names or sku
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  const count = await Product.countDocuments(filter);

  return {
    products,
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(count / limitNum)
    }
  };
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!product) {
    throw new NotFoundError('Product not found.');
  }

  return product;
};

export const updateProduct = async (id, updateBody, modifierId) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found.');
  }

  if (updateBody.sku && updateBody.sku !== product.sku) {
    const existingSku = await Product.findOne({ sku: updateBody.sku });
    if (existingSku) {
      throw new ConflictError(`Product SKU '${updateBody.sku}' is already in use.`);
    }
  }

  // Bind values
  const updatableFields = ['name', 'sku', 'description', 'price', 'stock'];
  updatableFields.forEach(field => {
    if (updateBody[field] !== undefined) {
      product[field] = updateBody[field];
    }
  });

  product.updatedBy = modifierId;
  await product.save();

  return product;
};

export const deleteProduct = async (id) => {
  const result = await Product.findByIdAndDelete(id);
  if (!result) {
    throw new NotFoundError('Product not found.');
  }
  return result;
};
