import { Router } from 'express';
import { adjustmentController, deliverySteps, operationController } from '../controllers/operation.controller.js';
import validate from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import {
  adjustmentCreateSchema,
  adjustmentUpdateSchema,
  deliveryCreateSchema,
  deliveryUpdateSchema,
  operationListQuery,
  receiptCreateSchema,
  receiptUpdateSchema,
  transferCreateSchema,
  transferUpdateSchema,
} from '../validators/operation.validators.js';

const byId = validate({ params: idParams });

/** list / create / get / update / confirm / validate / cancel for one operation kind. */
function operationRouter(kind, { createSchema, updateSchema }) {
  const c = operationController(kind);
  return Router()
    .get('/', validate({ query: operationListQuery }), c.list)
    .post('/', validate({ body: createSchema }), c.create)
    .get('/:id', byId, c.get)
    .patch('/:id', validate({ params: idParams, body: updateSchema }), c.update)
    .post('/:id/confirm', byId, c.confirm)
    .post('/:id/validate', byId, c.validate)
    .post('/:id/cancel', byId, c.cancel);
}

export const receiptRoutes = operationRouter('receipt', {
  createSchema: receiptCreateSchema,
  updateSchema: receiptUpdateSchema,
});

export const deliveryRoutes = operationRouter('delivery', {
  createSchema: deliveryCreateSchema,
  updateSchema: deliveryUpdateSchema,
})
  .post('/:id/pick', byId, deliverySteps.pick)
  .post('/:id/pack', byId, deliverySteps.pack);

export const transferRoutes = operationRouter('transfer', {
  createSchema: transferCreateSchema,
  updateSchema: transferUpdateSchema,
});

export const adjustmentRoutes = Router()
  .get('/', validate({ query: operationListQuery }), adjustmentController.list)
  .post('/', validate({ body: adjustmentCreateSchema }), adjustmentController.create)
  .get('/:id', byId, adjustmentController.get)
  .patch('/:id', validate({ params: idParams, body: adjustmentUpdateSchema }), adjustmentController.update)
  .post('/:id/validate', byId, adjustmentController.validate)
  .post('/:id/cancel', byId, adjustmentController.cancel);
