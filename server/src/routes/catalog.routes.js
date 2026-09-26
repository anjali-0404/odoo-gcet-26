import { Router } from 'express';
import * as categories from '../controllers/category.controller.js';
import * as products from '../controllers/product.controller.js';
import validate from '../middleware/validate.js';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  productCreateSchema,
  productListQuery,
  productUpdateSchema,
  stockListQuery,
} from '../validators/catalog.validators.js';
import { idParams } from '../validators/common.js';

export const categoryRoutes = Router()
  .get('/', categories.list)
  .post('/', validate({ body: categoryCreateSchema }), categories.create)
  .patch('/:id', validate({ params: idParams, body: categoryUpdateSchema }), categories.update)
  .delete('/:id', validate({ params: idParams }), categories.remove);

export const productRoutes = Router()
  .get('/', validate({ query: productListQuery }), products.list)
  .post('/', validate({ body: productCreateSchema }), products.create)
  .get('/:id', validate({ params: idParams }), products.get)
  .patch('/:id', validate({ params: idParams, body: productUpdateSchema }), products.update)
  .delete('/:id', validate({ params: idParams }), products.archive);

export const stockRoutes = Router().get('/', validate({ query: stockListQuery }), products.listStock);
